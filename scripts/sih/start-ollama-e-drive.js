import { spawn } from "node:child_process";
import path from "node:path";
import http from "node:http";

const ollamaPath = path.join(process.env.LOCALAPPDATA || "C:\\Users\\ASUS\\AppData\\Local", "Programs", "Ollama", "ollama.exe");
const modelsDir = "E:\\Smart Automation\\100-AI-Agents\\models\\ollama";

console.log(`Starting Ollama with OLLAMA_MODELS=${modelsDir}`);

const child = spawn(ollamaPath, ["serve"], {
  detached: true,
  stdio: "ignore",
  env: {
    ...process.env,
    OLLAMA_MODELS: modelsDir,
    OLLAMA_HOST: "127.0.0.1:11434"
  }
});

child.unref();

// Wait for health check
let attempts = 0;
const interval = setInterval(() => {
  attempts++;
  const req = http.get("http://127.0.0.1:11434/api/tags", (res) => {
    if (res.statusCode === 200) {
      console.log(`Ollama successfully started on 127.0.0.1:11434 with models at ${modelsDir}`);
      clearInterval(interval);
      process.exit(0);
    }
  });

  req.on("error", () => {
    if (attempts > 15) {
      console.error("Failed to start Ollama after 15 attempts.");
      clearInterval(interval);
      process.exit(1);
    }
  });
}, 800);
