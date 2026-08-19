import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WorkflowEngine } from "../../workflow-engine/index.js";
import { StudentService, AcademicService, FinanceService, AuditService } from "../../services/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "../../..");
const REGISTRY = path.join(ROOT, "registry", "agents.json");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8300);

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
}

function json(res, status, data) {
  const text = JSON.stringify(data);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.setEncoding("utf8");

    req.on("data", chunk => {
      raw += chunk;

      if (raw.length > 1024 * 1024) {
        reject(new Error("Request body exceeds 1 MiB"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function requestAgent(agent, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = http.request(
      new URL("/api/agent", agent.api_url),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        },
        timeout: 120000
      },
      res => {
        let raw = "";

        res.setEncoding("utf8");

        res.on("data", chunk => {
          raw += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error(`Invalid response from ${agent.agent_id}`));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Agent request timeout"));
    });

    req.on("error", reject);

    req.write(body);
    req.end();
  });
}

async function checkAgent(agent) {
  return new Promise(resolve => {
    const req = http.get(
      agent.health_url,
      {
        timeout: 3000
      },
      res => {
        let raw = "";

        res.setEncoding("utf8");

        res.on("data", chunk => {
          raw += chunk;
        });

        res.on("end", () => {
          try {
            const data = JSON.parse(raw);

            resolve({
              ...agent,
              live_status: data.status || "offline",
              model_available: data.model_available ?? false
            });
          } catch {
            resolve({
              ...agent,
              live_status: "offline",
              model_available: false
            });
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
    });

    req.on("error", () => {
      resolve({
        ...agent,
        live_status: "offline",
        model_available: false
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  try {
    const registry = loadRegistry();
    const agents = registry.agents || [];

    if (req.method === "GET" && url.pathname === "/api/health") {
      json(res, 200, {
        status: "ok",
        service: "100-to-1-gateway",
        version: "1.0.0",
        total_agents: agents.length,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/agents") {
      json(res, 200, {
        total: agents.length,
        agents
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/agents/health") {
      const results = await Promise.all(
        agents.map(checkAgent)
      );

      const online = results.filter(
        a => a.live_status === "ok"
      ).length;

      json(res, 200, {
        total: results.length,
        online,
        offline: results.length - online,
        agents: results
      });

      return;
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/chat"
    ) {
      const payload = await readBody(req);

      const agentId =
        typeof payload.agent_id === "string"
          ? payload.agent_id
          : "";

      const task =
        typeof payload.task === "string"
          ? payload.task.trim()
          : "";

      if (!agentId) {
        json(res, 400, {
          status: "error",
          error: "agent_id is required"
        });
        return;
      }

      if (!task) {
        json(res, 400, {
          status: "error",
          error: "task is required"
        });
        return;
      }

      const agent = agents.find(
        a => a.agent_id === agentId
      );

      if (!agent) {
        json(res, 404, {
          status: "error",
          error: `Unknown agent: ${agentId}`
        });
        return;
      }

      const result = await requestAgent(agent, {
        task,
        context: payload.context || {},
        parameters: payload.parameters || {},
        output_format: payload.output_format || "text"
      });

      json(res, 200, {
        gateway: "100-to-1",
        agent: {
          agent_id: agent.agent_id,
          name: agent.name,
          category: agent.category
        },
        result
      });

      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/info"
    ) {
      json(res, 200, {
        project: "100-to-1",
        version: "1.0.0",
        total_agents: agents.length,
        gateway_port: PORT,
        ollama: "http://127.0.0.1:11434"
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/workflows"
    ) {
      const workflows = WorkflowEngine.getAvailableWorkflows();
      json(res, 200, {
        total: workflows.length,
        workflows
      });
      return;
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/workflows/start"
    ) {
      const payload = await readBody(req);
      const workflowId = payload.workflow_id || payload.workflowId;
      if (!workflowId) {
        json(res, 400, { status: "error", error: "workflow_id is required" });
        return;
      }

      const instance = await WorkflowEngine.startWorkflow(workflowId, payload);
      json(res, 200, { status: "success", instance });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/workflows/instances"
    ) {
      const instances = WorkflowEngine.getAllInstances();
      json(res, 200, {
        total: instances.length,
        instances
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname.startsWith("/api/workflows/instances/")
    ) {
      const id = url.pathname.replace(/^\/api\/workflows\/instances\//, "");
      const inst = WorkflowEngine.getInstance(id);
      if (!inst) {
        json(res, 404, { status: "error", error: `Instance not found: ${id}` });
        return;
      }
      json(res, 200, { status: "success", instance: inst });
      return;
    }

    if (
      req.method === "POST" &&
      url.pathname.startsWith("/api/workflows/instances/") &&
      url.pathname.endsWith("/decision")
    ) {
      const id = url.pathname.replace(/^\/api\/workflows\/instances\//, "").replace(/\/decision$/, "");
      const payload = await readBody(req);
      if (!payload.decision || !["approved", "rejected"].includes(payload.decision)) {
        json(res, 400, { status: "error", error: "decision must be 'approved' or 'rejected'" });
        return;
      }

      const updated = await WorkflowEngine.submitDecision(id, payload.decision, payload.notes || "");
      json(res, 200, { status: "success", instance: updated });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/workforce"
    ) {
      const mappingPath = path.join(ROOT, "registry", "sa-s03-agent-mapping.json");
      if (fs.existsSync(mappingPath)) {
        const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
        json(res, 200, mapping);
      } else {
        json(res, 200, { agents: loadRegistry().agents });
      }
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/institution/data"
    ) {
      json(res, 200, {
        students: StudentService.getAllStudents(),
        courses: AcademicService.getAllCourses(),
        scholarshipSchemes: FinanceService.getAllScholarshipSchemes(),
        auditLogs: AuditService.getAuditLogs().slice(0, 50)
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/institution/audit"
    ) {
      json(res, 200, {
        auditLogs: AuditService.getAuditLogs()
      });
      return;
    }

    if (
      req.method === "GET" &&
      (url.pathname === "/" ||
       url.pathname === "/index.html" ||
       url.pathname === "/ui-polish.css" ||
       url.pathname === "/ui-polish.js")
    ) {
      const filename = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const file = path.join(
        ROOT,
        "platform",
        "web",
        filename
      );

      if (!fs.existsSync(file)) {
        json(res, 404, {
          error: `${filename} not found`
        });
        return;
      }

      const content = fs.readFileSync(file);
      const contentType = filename.endsWith(".css")
        ? "text/css; charset=utf-8"
        : filename.endsWith(".js")
          ? "application/javascript; charset=utf-8"
          : "text/html; charset=utf-8";

      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-store"
      });

      res.end(content);
      return;
    }

    json(res, 404, {
      status: "error",
      error: "Route not found"
    });

  } catch (error) {
    json(res, 500, {
      status: "error",
      error:
        error instanceof Error
          ? error.message
          : "Internal server error"
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log("======================================");
  console.log("100-TO-1 CENTRAL GATEWAY");
  console.log("======================================");
  console.log(`Listening: http://${HOST}:${PORT}`);
  console.log(`Registry: ${REGISTRY}`);
  console.log("======================================");
});
