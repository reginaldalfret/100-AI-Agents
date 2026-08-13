import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { agentInfo, health, runAgent } from "./agent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND = path.resolve(
  __dirname,
  "../../frontend/index.html"
);

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || "8173");

function json(res, status, body) {
  const text = JSON.stringify(body);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store"
  });

  res.end(text);
}

function body(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.setEncoding("utf8");

    req.on("data", chunk => {
      raw += chunk;

      if (raw.length > 1024 * 1024) {
        reject(
          new Error("Request body exceeds 1 MiB")
        );
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(
          new Error("Invalid JSON request body")
        );
      }
    });

    req.on("error", reject);
  });
}

function cors(res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
}

function serveFrontend(res) {
  try {
    const html = fs.readFileSync(
      FRONTEND,
      "utf8"
    );

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": Buffer.byteLength(html),
      "Cache-Control": "no-cache"
    });

    res.end(html);
  } catch (error) {
    json(res, 500, {
      error: "Frontend unavailable",
      details:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
}

const server = http.createServer(
  async (req, res) => {
    cors(res);

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
      /*
       * FRONTEND
       */
      if (
        req.method === "GET" &&
        url.pathname === "/"
      ) {
        serveFrontend(res);
        return;
      }

      /*
       * HEALTH
       */
      if (
        req.method === "GET" &&
        url.pathname === "/api/health"
      ) {
        json(
          res,
          200,
          await health()
        );
        return;
      }

      /*
       * AGENT INFO
       */
      if (
        req.method === "GET" &&
        url.pathname === "/api/info"
      ) {
        json(
          res,
          200,
          agentInfo()
        );
        return;
      }

      /*
       * AGENT REQUEST
       */
      if (
        req.method === "POST" &&
        url.pathname === "/api/agent"
      ) {
        const request = await body(req);

        json(
          res,
          200,
          await runAgent(request)
        );

        return;
      }

      /*
       * NOT FOUND
       */
      json(res, 404, {
        error: "Route not found"
      });

    } catch (error) {
      json(res, 400, {
        agent_id:
          agentInfo().agent_id,

        agent_name:
          agentInfo().agent_name,

        status: "error",

        result: null,

        metadata: {},

        error:
          error instanceof Error
            ? error.message
            : "Unknown error"
      });
    }
  }
);

server.listen(
  PORT,
  HOST,
  () => {
    console.log(
      `${agentInfo().agent_id} - ${agentInfo().agent_name}`
    );

    console.log(
      `Model: ${agentInfo().model}`
    );

    console.log(
      `Backend: ${agentInfo().backend}`
    );

    console.log(
      `Frontend: http://${HOST}:${PORT}/`
    );

    console.log(
      `Listening: http://${HOST}:${PORT}`
    );
  }
);
