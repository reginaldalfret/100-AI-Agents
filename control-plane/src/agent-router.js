import http from "node:http";
import https from "node:https";

const REQUEST_TIMEOUT_MS = 15000;

function requestJson(url, options = {}, body = undefined) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const transport = target.protocol === "https:" ? https : http;

    const request = transport.request(target, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(options.headers ?? {})
      },
      timeout: REQUEST_TIMEOUT_MS
    }, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { raw += chunk; });
      response.on("end", () => {
        let data = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { data = { raw }; }
        resolve({ statusCode: response.statusCode ?? 0, data });
      });
    });

    request.on("timeout", () => {
      request.destroy(new Error(`Upstream request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });
    request.on("error", reject);

    if (body !== undefined) request.write(JSON.stringify(body));
    request.end();
  });
}

function normalizeHealth(agent, upstream) {
  const data = upstream.data ?? {};
  const legacyHealthy = data.status === "healthy" && data.qwen_available === true;
  const status = legacyHealthy || data.status === "ok" ? "ok" :
    data.status === "degraded" ? "degraded" : "offline";

  return {
    status,
    agent_id: agent.agent_id,
    agent_name: agent.name,
    version: data.version ?? "unknown",
    timestamp: data.timestamp ?? new Date().toISOString(),
    upstream_status: data.status ?? null,
    model: data.model ?? agent.model ?? null,
    backend: data.backend ?? agent.backend ?? null
  };
}

export async function healthCheck(agent) {
  if (!agent?.health_url) {
    return {
      status: "offline",
      agent_id: agent?.agent_id ?? "unknown",
      agent_name: agent?.name ?? null,
      version: "unknown",
      timestamp: new Date().toISOString(),
      reason: "health_url is not configured"
    };
  }

  try {
    const upstream = await requestJson(agent.health_url);
    if (upstream.statusCode !== 200) {
      return {
        status: "offline",
        agent_id: agent.agent_id,
        agent_name: agent.name,
        version: "unknown",
        timestamp: new Date().toISOString(),
        reason: `health endpoint returned HTTP ${upstream.statusCode}`
      };
    }
    return normalizeHealth(agent, upstream);
  } catch (error) {
    return {
      status: "offline",
      agent_id: agent.agent_id,
      agent_name: agent.name,
      version: "unknown",
      timestamp: new Date().toISOString(),
      reason: error.message
    };
  }
}

export async function runAgent(agent, request) {
  if (!agent) throw new Error("Agent not found");

  if (!agent.api_url) {
    return {
      agent_id: agent.agent_id,
      agent_name: agent.name,
      status: "error",
      result: null,
      metadata: { reason: "Agent is not deployed yet." },
      error: "Agent API is not configured."
    };
  }

  // Agent 001 is the existing Day 1 prototype. Its current API uses
  // /api/write with { prompt, tone }, so the control plane adapts to it
  // without changing the running service.
  if (agent.agent_id === "agent-001") {
    const tone = request.parameters?.tone ?? "professional";
    const upstream = await requestJson(`${agent.api_url}/api/write`, {
      method: "POST"
    }, {
      prompt: request.task,
      tone
    });

    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      return {
        agent_id: agent.agent_id,
        agent_name: agent.name,
        status: "error",
        result: null,
        metadata: { http_status: upstream.statusCode },
        error: `Agent returned HTTP ${upstream.statusCode}.`
      };
    }

    const data = upstream.data ?? {};
    return {
      agent_id: agent.agent_id,
      agent_name: agent.name,
      status: "success",
      result: data.result ?? data.output ?? data.response ?? data,
      metadata: {
        model: agent.model ?? null,
        backend: agent.backend ?? null,
        adapter: "agent-001-legacy-write-api"
      },
      error: null
    };
  }

  // Future agents should expose POST /api/run using the universal contract.
  const upstream = await requestJson(`${agent.api_url}/api/run`, {
    method: "POST"
  }, request);

  if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
    return {
      agent_id: agent.agent_id,
      agent_name: agent.name,
      status: "error",
      result: null,
      metadata: { http_status: upstream.statusCode },
      error: `Agent returned HTTP ${upstream.statusCode}.`
    };
  }

  return upstream.data;
}
