import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { getAgent } from "./registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "../../../..");

async function executeAgentInProcess(agentId, payload) {
  const agentsDir = path.join(ROOT, "agents");
  if (!fs.existsSync(agentsDir)) return null;

  const dirs = fs.readdirSync(agentsDir);
  const found = dirs.find(d => d.startsWith(agentId) || d.startsWith(agentId.replace("agent-", "agent-0")));
  if (!found) return null;

  const modPath = path.join(agentsDir, found, "backend", "src", "agent.js");
  if (!fs.existsSync(modPath)) return null;

  process.env.OLLAMA_MODEL = process.env.OLLAMA_MODEL || "nemotron-3-nano";
  const mod = await import(pathToFileURL(modPath).href);
  if (typeof mod.runAgent === "function") {
    return await mod.runAgent(payload);
  }
  return null;
}

function postJson(url, payload, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);

    const transport =
      target.protocol === "https:" ? https : http;

    const req = transport.request(
      target,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        timeout: timeoutMs
      },
      res => {
        let raw = "";

        res.setEncoding("utf8");

        res.on("data", chunk => {
          raw += chunk;
        });

        res.on("end", () => {
          let data;

          try {
            data = JSON.parse(raw);
          } catch {
            reject(
              new Error(
                `Agent returned invalid JSON: HTTP ${res.statusCode}`
              )
            );
            return;
          }

          if (
            (res.statusCode || 500) >= 200 &&
            (res.statusCode || 500) < 300
          ) {
            resolve(data);
            return;
          }

          reject(
            new Error(
              `Agent ${target.hostname}:${target.port} returned HTTP ${res.statusCode}`
            )
          );
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(
        new Error(`Agent request timed out after ${timeoutMs}ms`)
      );
    });

    req.on("error", reject);

    req.write(JSON.stringify(payload));
    req.end();
  });
}

function resolveAgentUrl(agent) {
  if (!agent) {
    throw new Error("Agent not found");
  }

  if (!agent.api_url) {
    throw new Error(
      `${agent.agent_id} has no api_url configured`
    );
  }

  return `${agent.api_url}/api/agent`;
}

export async function delegate(
  agentId,
  task,
  context = {}
) {
  const agent = getAgent(agentId);

  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  if (agentId === "agent-101") {
    throw new Error(
      "Agent 101 cannot delegate work to itself"
    );
  }

  if (
    typeof task !== "string" ||
    !task.trim()
  ) {
    throw new Error(
      `Delegation task is empty for ${agentId}`
    );
  }

  const url = resolveAgentUrl(agent);
  const started = Date.now();

  try {
    const result = await postJson(
      url,
      {
        task,
        context,
        parameters: {
          source: "agent-101-master"
        },
        output_format: "structured"
      }
    );

    return {
      agent_id: agent.agent_id,
      agent_name: agent.name,
      status: "completed",
      duration_ms: Date.now() - started,
      result
    };
  } catch (error) {
    try {
      const fallbackResult = await executeAgentInProcess(agentId, {
        task,
        context,
        parameters: { source: "agent-101-master" },
        output_format: "structured"
      });

      if (fallbackResult) {
        return {
          agent_id: agent.agent_id,
          agent_name: agent.name,
          status: "completed",
          duration_ms: Date.now() - started,
          result: fallbackResult
        };
      }
    } catch (fallbackError) {
      console.warn(`Fallback execution failed for ${agentId}:`, fallbackError.message);
    }

    return {
      agent_id: agent.agent_id,
      agent_name: agent.name,
      status: "failed",
      duration_ms: Date.now() - started,
      result: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown delegation error"
    };
  }
}

export async function delegateMany(
  subtasks,
  context = {}
) {
  if (!Array.isArray(subtasks)) {
    throw new Error("subtasks must be an array");
  }

  return Promise.all(
    subtasks.map(subtask =>
      delegate(
        subtask.agent_id,
        subtask.task,
        context
      )
    )
  );
}
