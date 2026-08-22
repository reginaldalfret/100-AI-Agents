import http from "node:http";
import https from "node:https";

const DEFAULT_OLLAMA_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

const DEFAULT_MODEL =
  process.env.OLLAMA_MODEL || "qwen3.5:9b";

function transportFor(url) {
  return url.protocol === "https:" ? https : http;
}

function postJson(url, payload, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const transport = transportFor(target);

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
            data = { raw };
          }

          const status = res.statusCode || 500;

          if (status >= 200 && status < 300) {
            resolve(data);
          } else {
            reject(
              new Error(`Model backend returned HTTP ${status}`)
            );
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Model request timed out"));
    });

    req.on("error", reject);

    req.write(JSON.stringify(payload));
    req.end();
  });
}

export async function generateWithOllama({
  system,
  task,
  temperature = 0.4,
  model = DEFAULT_MODEL
}) {
  return postJson(
    `${DEFAULT_OLLAMA_URL}/api/generate`,
    {
      model,
      system,
      prompt: task,
      temperature,
      stream: false
    }
  );
}

export async function modelHealth() {
  return new Promise(resolve => {
    const target = new URL(`${DEFAULT_OLLAMA_URL}/api/tags`);
    const transport = transportFor(target);

    const req = transport.get(
      target,
      { timeout: 5000 },
      res => {
        let raw = "";

        res.setEncoding("utf8");

        res.on("data", chunk => {
          raw += chunk;
        });

        res.on("end", () => {
          try {
            const data = JSON.parse(raw);
            const models = Array.isArray(data.models)
              ? data.models
              : [];

            resolve({
              available: res.statusCode === 200,
              model: DEFAULT_MODEL,
              models: models.map(model => model.name)
            });
          } catch {
            resolve({
              available: false,
              model: DEFAULT_MODEL,
              models: []
            });
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({
        available: false,
        model: DEFAULT_MODEL,
        models: []
      });
    });

    req.on("error", () => {
      resolve({
        available: false,
        model: DEFAULT_MODEL,
        models: []
      });
    });
  });
}

export {
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_URL
};
