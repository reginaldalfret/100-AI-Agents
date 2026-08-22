import fs from "node:fs";

async function main() {
  console.log("Testing text inference on gemma3:4b...");
  const start = Date.now();
  const res = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma3:4b",
      prompt: "Explain why an equipment measurement below the minimum allowable threshold requires engineering review in 40 words.",
      stream: false
    })
  });
  const dur = Date.now() - start;
  const data = await res.json();
  console.log("STATUS:", res.status);
  console.log("MODEL:", data.model);
  console.log("RESPONSE:", data.response);
  console.log("DURATION_MS:", dur);
  console.log("EVAL_COUNT:", data.eval_count);
  console.log("EVAL_DURATION_SEC:", (data.eval_duration / 1e9).toFixed(2));
}

main().catch(console.error);
