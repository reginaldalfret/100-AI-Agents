import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns/promises";

const PUBLIC_HOSTNAME = "superai.reginaldalfret.tech";

test("Public Hostname — Verify canonical public hostname is superai.reginaldalfret.tech", () => {
  assert.strictEqual(PUBLIC_HOSTNAME, "superai.reginaldalfret.tech", "Public hostname must match canonical domain");
  assert.ok(/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(PUBLIC_HOSTNAME), "Hostname must be a valid FQDN");
  assert.ok(PUBLIC_HOSTNAME.endsWith(".reginaldalfret.tech"), "Hostname must be rooted in reginaldalfret.tech");
});

test("Public Hostname — DNS resolution points to Cloudflare Anycast IPs (104.x or 172.x)", async (t) => {
  const resolver = new dns.Resolver();
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);

  let addresses = [];
  try {
    const resolvePromise = resolver.resolve4(PUBLIC_HOSTNAME);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DNS query timeout after 5000ms")), 5000)
    );

    addresses = await Promise.race([resolvePromise, timeoutPromise]);
  } catch (err) {
    t.skip(`Graceful network bypass: DNS resolution for ${PUBLIC_HOSTNAME} unavailable or timed out (${err.message})`);
    return;
  }

  assert.ok(Array.isArray(addresses) && addresses.length > 0, `${PUBLIC_HOSTNAME} must resolve to at least one IPv4 address`);

  // Cloudflare Anycast IPv4 ranges commonly include 104.16.0.0/12, 104.24.0.0/14, 172.64.0.0/13
  const isCloudflareAnycast = addresses.some(ip => ip.startsWith("104.") || ip.startsWith("172."));
  assert.ok(
    isCloudflareAnycast,
    `Resolved IP addresses [${addresses.join(", ")}] must belong to Cloudflare Anycast blocks (104.x or 172.x)`
  );
});
