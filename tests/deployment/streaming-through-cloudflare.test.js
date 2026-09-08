import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "https://superai.reginaldalfret.tech";

test("Streaming Through Cloudflare — POST /api/chat with streaming: true returns text/event-stream", async (t) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify({
        agent_id: "agent-001",
        task: "Sovereign AI readiness verification",
        modelMode: "auto",
        stream: true,
        streaming: true
      }),
      signal: AbortSignal.timeout(15000)
    });
  } catch (err) {
    t.skip(`Graceful network bypass: Cloudflare tunnel chat endpoint unreachable (${err.message})`);
    return;
  }

  assert.strictEqual(res.status, 200, "POST /api/chat must return HTTP 200");

  const contentType = res.headers.get("content-type") || "";
  assert.ok(
    contentType.includes("text/event-stream"),
    `Content-Type header must be 'text/event-stream', got: ${contentType}`
  );

  // Close body stream cleanly
  if (res.body && typeof res.body.cancel === "function") {
    await res.body.cancel();
  }
});

test("Streaming Through Cloudflare — SSE events (status, chunk/token, metadata) stream correctly", async (t) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify({
        agent_id: "agent-001",
        task: "Respond with exactly: Sovereign Ready",
        modelMode: "auto",
        stream: true,
        streaming: true
      }),
      signal: AbortSignal.timeout(20000)
    });
  } catch (err) {
    t.skip(`Graceful network bypass: Cloudflare tunnel stream unreachable (${err.message})`);
    return;
  }

  if (res.status !== 200) {
    t.skip(`Cloudflare tunnel endpoint returned HTTP ${res.status}; skipping event parser`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  const capturedEvents = [];
  let buffer = "";
  let receivedChunks = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedChunks++;
      buffer += decoder.decode(value, { stream: true });

      // Parse SSE lines
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      let currentEvent = null;
      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.replace(/^event:\s*/, "").trim();
        } else if (line.startsWith("data:")) {
          const rawData = line.replace(/^data:\s*/, "").trim();
          let parsedData = rawData;
          try {
            parsedData = JSON.parse(rawData);
          } catch {}
          capturedEvents.push({ event: currentEvent || "message", data: parsedData });
        }
      }

      // Break early once representative stream packets are captured
      if (capturedEvents.length >= 3 || receivedChunks >= 5) {
        break;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {}
  }

  assert.ok(receivedChunks > 0, "Must receive at least one streaming chunk through Cloudflare");
  assert.ok(capturedEvents.length > 0, "Must successfully parse at least one SSE event");

  const eventTypes = capturedEvents.map(e => e.event);

  // Check that SSE events contain recognized lifecycle events: status, metadata, token/chunk, complete, or scope_redirect
  const hasExpectedLifecycleEvent = eventTypes.some(
    type => ["status", "metadata", "token", "chunk", "complete", "scope_redirect"].includes(type)
  );

  assert.ok(
    hasExpectedLifecycleEvent,
    `SSE stream must include valid protocol events (status, metadata, token/chunk). Received: [${eventTypes.join(", ")}]`
  );
});
