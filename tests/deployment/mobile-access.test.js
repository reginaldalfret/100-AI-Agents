import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.env.PROJECT_ROOT || path.resolve(__dirname, "../..");
const PUBLIC_URL = "https://superai.reginaldalfret.tech";

test("Mobile Access — index.html contains responsive viewport meta tag", () => {
  const indexHtmlPath = path.join(ROOT_DIR, "platform", "web", "index.html");
  assert.ok(fs.existsSync(indexHtmlPath), "platform/web/index.html must exist");

  const html = fs.readFileSync(indexHtmlPath, "utf8");

  // Regex check for <meta name="viewport" content="width=device-width...
  const viewportRegex = /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']/i;
  assert.ok(
    viewportRegex.test(html),
    "index.html must declare responsive viewport with '<meta name=\"viewport\" content=\"width=device-width...\"'"
  );

  // Verify mobile navigation elements
  assert.ok(
    html.includes('id="mobileMenuToggle"') || html.includes('class="mobile-menu-btn"') || html.includes('drawer'),
    "index.html should include responsive mobile navigation elements"
  );
});

test("Mobile Access — Agent frontend templates include responsive viewport", () => {
  const templateHtmlPath = path.join(ROOT_DIR, "agent-template", "frontend", "index.html");
  if (fs.existsSync(templateHtmlPath)) {
    const templateHtml = fs.readFileSync(templateHtmlPath, "utf8");
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(templateHtml);
    assert.ok(hasViewport, "agent-template frontend index.html must include viewport meta tag");
  }
});

test("Mobile Access — Verify public URL compatibility headers", async (t) => {
  let res;
  try {
    res = await fetch(`${PUBLIC_URL}/`, {
      method: "GET",
      signal: AbortSignal.timeout(8000)
    });
  } catch (err) {
    // Graceful offline fallback: verify server static file header specification
    const serverFile = path.join(ROOT_DIR, "platform", "gateway", "src", "server.js");
    if (fs.existsSync(serverFile)) {
      const serverCode = fs.readFileSync(serverFile, "utf8");
      assert.ok(
        serverCode.includes('"Content-Type": contentType') || serverCode.includes("text/html; charset=utf-8"),
        "Gateway server must configure Content-Type headers for HTML"
      );
      assert.ok(
        serverCode.includes('"Cache-Control": "no-store"') || serverCode.includes("Cache-Control"),
        "Gateway server must configure Cache-Control headers"
      );
    }

    t.skip(`Graceful network bypass: Public URL unreachable (${err.message}); verified gateway code compatibility headers instead`);
    return;
  }

  assert.strictEqual(res.status, 200, "Public URL must return HTTP 200");

  const headers = res.headers;
  const contentType = headers.get("content-type") || "";
  assert.ok(
    contentType.includes("text/html"),
    `Public URL must serve text/html, got: ${contentType}`
  );

  // Check caching headers for responsive mobile asset freshness
  const cacheControl = headers.get("cache-control");
  assert.ok(
    cacheControl !== null,
    "Public URL should provide Cache-Control header for mobile caching policy"
  );
});
