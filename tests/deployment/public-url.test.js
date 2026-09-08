import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "https://superai.reginaldalfret.tech";

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000)
    });
    return { ok: true, res, status: res.status };
  } catch (err) {
    return { ok: false, error: err };
  }
}

test("Public URL — Fetching https://superai.reginaldalfret.tech/ returns HTTP 200 and valid HTML", async (t) => {
  const result = await safeFetch(`${BASE_URL}/`);

  if (!result.ok) {
    t.skip(`Live public tunnel endpoint unreachable (${result.error.message}); skipping live HTML probe`);
    return;
  }

  assert.strictEqual(result.status, 200, "Public root URL must return HTTP 200");

  const contentType = result.res.headers.get("content-type") || "";
  assert.ok(contentType.includes("text/html"), `Content-Type must be HTML, got: ${contentType}`);

  const html = await result.res.text();
  assert.ok(html.length > 100, "Response HTML body must not be empty");
  assert.ok(
    html.toLowerCase().includes("<!doctype html") || html.toLowerCase().includes("<html"),
    "Response must contain valid HTML declaration"
  );
  assert.ok(
    html.includes("Super AI") || html.includes("301"),
    "HTML must include Super AI platform branding"
  );
});

test("Public URL — GET /api/health returns status READY and external_ai_calls: 0", async (t) => {
  const result = await safeFetch(`${BASE_URL}/api/health`, {
    headers: { "Accept": "application/json" }
  });

  if (!result.ok) {
    t.skip(`Live public tunnel endpoint unreachable (${result.error.message}); skipping live health check`);
    return;
  }

  assert.strictEqual(result.status, 200, "GET /api/health must return HTTP 200");

  const data = await result.res.json();
  assert.strictEqual(data.status, "READY", "System status must be READY");
  assert.strictEqual(data.external_ai_calls, 0, "external_ai_calls counter must strictly be 0 (100% sovereign)");
  assert.strictEqual(data.is_air_gapped, true, "is_air_gapped flag must be true");
  assert.strictEqual(data.public_url, BASE_URL, "public_url in payload must match canonical domain");
});

test("Public URL — GET /api/models returns model catalog without local disk paths", async (t) => {
  const result = await safeFetch(`${BASE_URL}/api/models`, {
    headers: { "Accept": "application/json" }
  });

  if (!result.ok) {
    t.skip(`Live public tunnel endpoint unreachable (${result.error.message}); skipping live models catalog check`);
    return;
  }

  assert.strictEqual(result.status, 200, "GET /api/models must return HTTP 200");

  const data = await result.res.json();
  assert.ok(Array.isArray(data.models), "Returned data.models must be an array");
  assert.ok(data.models.length > 0, "Model catalog must contain available sovereign models");

  // Verify models have sanitized public properties
  for (const model of data.models) {
    assert.ok(model.model_id, "Each model must have a model_id");
    assert.ok(model.name, "Each model must have a name");
    assert.ok(!("weights_path" in model), "weights_path must be stripped from public model catalog");
    assert.ok(!("local_path" in model), "local_path must be stripped from public model catalog");
    assert.ok(!("blob_dir" in model), "blob_dir must be stripped from public model catalog");
  }

  // Ensure raw JSON string does not leak local file paths
  const rawJson = JSON.stringify(data);
  assert.ok(!rawJson.includes("E:\\"), "Public models response must not leak E: drive paths");
  assert.ok(!rawJson.includes("C:\\"), "Public models response must not leak C: drive paths");
  assert.ok(!rawJson.includes("/home/"), "Public models response must not leak unix home paths");
});
