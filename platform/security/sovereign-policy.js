/**
 * Sovereign AI Workbench — Sovereign Execution Policy
 * Enforces strict on-premise execution boundaries and blocks all public cloud egress.
 */

export const NetworkClassification = {
  LOCAL_LOOPBACK: "LOCAL_LOOPBACK",
  PRIVATE_NETWORK: "PRIVATE_NETWORK",
  PUBLIC_EXTERNAL: "PUBLIC_EXTERNAL"
};

export const SovereignState = {
  mode: "SOVEREIGN_MODE",
  is_air_gapped: true,
  allowed_loopback_ips: ["127.0.0.1", "localhost", "::1", "0.0.0.0"],
  allowed_private_cidrs: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
  cloud_ai_blocked: true,
  external_telemetry_blocked: true,
  violations_intercepted: 0
};

export function classifyNetworkDestination(destination) {
  if (!destination) return NetworkClassification.LOCAL_LOOPBACK;

  const destStr = String(destination).toLowerCase().trim();
  let host = destStr;
  try {
    if (destStr.includes("://")) {
      host = new URL(destStr).hostname;
    } else {
      host = destStr.split(":")[0];
    }
  } catch {
    host = destStr.split(":")[0];
  }

  if (SovereignState.allowed_loopback_ips.includes(host)) {
    return NetworkClassification.LOCAL_LOOPBACK;
  }

  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)) {
    return NetworkClassification.PRIVATE_NETWORK;
  }

  return NetworkClassification.PUBLIC_EXTERNAL;
}

export function evaluateSovereignEgress(destination, operation = "network_request") {
  const classification = classifyNetworkDestination(destination);

  if (classification === NetworkClassification.PUBLIC_EXTERNAL) {
    SovereignState.violations_intercepted++;
    return {
      allowed: false,
      decision: "BLOCKED",
      classification,
      destination,
      operation,
      reason: "SOVEREIGN_POLICY_VIOLATION: Outbound external network connections are strictly forbidden in Sovereign Mode.",
      timestamp: new Date().toISOString()
    };
  }

  return {
    allowed: true,
    decision: "ALLOWED",
    classification,
    destination,
    operation,
    timestamp: new Date().toISOString()
  };
}
