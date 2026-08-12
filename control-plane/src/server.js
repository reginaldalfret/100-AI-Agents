import http from "node:http";
import { getAgent, getAgents, getSummary } from "./registry.js";
import { healthCheck, runAgent } from "./agent-router.js";

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 8200);

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
        reject(new Error("Request body exceeds 1 MiB."));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON request body."));
      }
    });
    request.on("error", reject);
  });
}

function cors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer(async (request, response) => {
  cors(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  try {
    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, {
        status: "ok",
        service: "100-to-1-control-plane",
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/agents") {
      sendJson(response, 200, {
        ...getSummary(),
        agents: getAgents()
      });
      return;
    }

    const agentMatch = pathname.match(/^\/api\/agents\/([^/]+)$/);
    if (request.method === "GET" && agentMatch) {
      const agent = getAgent(agentMatch[1]);
      if (!agent) {
        sendJson(response, 404, { error: "Agent not found." });
        return;
      }
      sendJson(response, 200, { agent });
      return;
    }

    const healthMatch = pathname.match(/^\/api\/agents\/([^/]+)\/health$/);
    if (request.method === "GET" && healthMatch) {
      const agent = getAgent(healthMatch[1]);
      if (!agent) {
        sendJson(response, 404, { error: "Agent not found." });
        return;
      }
      sendJson(response, 200, await healthCheck(agent));
      return;
    }

    const runMatch = pathname.match(/^\/api\/agents\/([^/]+)\/run$/);
    if (request.method === "POST" && runMatch) {
      const agent = getAgent(runMatch[1]);
      if (!agent) {
        sendJson(response, 404, { error: "Agent not found." });
        return;
      }

      const payload = await readJson(request);
      if (typeof payload.task !== "string" || payload.task.trim().length === 0) {
        sendJson(response, 400, { error: "task is required and must be a non-empty string." });
        return;
      }
      if (payload.task.length > 20000) {
        sendJson(response, 400, { error: "task exceeds the 20000 character limit." });
        return;
      }

      const normalized = {
        task: payload.task,
        context: payload.context ?? {},
        parameters: payload.parameters ?? {},
        output_format: payload.output_format ?? "structured"
      };

      sendJson(response, 200, await runAgent(agent, normalized));
      return;
    }

    if (request.method === "GET" && pathname === "/") {
      sendText(response, 200, "100-to-1 control plane is running.\n");
      return;
    }

    sendJson(response, 404, { error: "Route not found." });
  } catch (error) {
    console.error("Control plane error:", error);
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Internal server error."
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`100-to-1 control plane listening on http://${HOST}:${PORT}`);
});
