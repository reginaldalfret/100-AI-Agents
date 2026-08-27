/**
 * Sovereign AI Workbench — Local Compute Node Manager
 * 
 * Manages registered local compute resources (Laptop Host, NVIDIA Jetson Node, etc.)
 * over private LAN with zero cloud egress.
 */

import http from "node:http";
import os from "node:os";
import { detectHardware } from "../system/hardware-info.js";
import { evaluateSovereignEgress } from "../security/sovereign-policy.js";

export const NodeType = {
  LAPTOP_LOCAL: "LAPTOP_LOCAL",
  JETSON_LAN: "JETSON_LAN",
  EMBEDDED_EDGE: "EMBEDDED_EDGE"
};

export const NodeStatus = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  DEGRADED: "DEGRADED",
  INITIALIZING: "INITIALIZING"
};

export class ComputeNode {
  constructor(config = {}) {
    this.id = config.id || `node_${Math.random().toString(36).slice(2, 8)}`;
    this.name = config.name || "Local Compute Node";
    this.type = config.type || NodeType.LAPTOP_LOCAL;
    this.host = config.host || "127.0.0.1";
    this.port = config.port || 11434;
    this.sshPort = config.sshPort || 22;
    this.status = config.status || NodeStatus.INITIALIZING;
    this.hardware = config.hardware || {};
    this.availableModels = config.availableModels || [];
    this.modalities = config.modalities || ["text", "code"];
    this.capabilities = config.capabilities || [];
    this.endpoint = config.endpoint || `http://${this.host}:${this.port}`;
    this.lastSeen = null;
    this.lastLatencyMs = null;
    this.runtimeVersion = null;
    this.lastHealthCheck = null;
    this.failureCount = 0;
    this.maxFailuresBeforeOffline = config.maxFailuresBeforeOffline || 2;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      host: this.host,
      port: this.port,
      sshPort: this.sshPort,
      status: this.status,
      hardware: this.hardware,
      availableModels: this.availableModels,
      modalities: this.modalities,
      capabilities: this.capabilities,
      endpoint: this.endpoint,
      lastSeen: this.lastSeen,
      lastLatencyMs: this.lastLatencyMs,
      runtimeVersion: this.runtimeVersion,
      lastHealthCheck: this.lastHealthCheck,
      is_air_gapped: true,
      external_calls: 0
    };
  }
}

export class ComputeNodeManager {
  constructor() {
    this.nodes = new Map();
    this.healthMonitorInterval = null;
    this._initDefaultNodes();
  }

  _initDefaultNodes() {
    // 1. Laptop Local Node
    const laptopHw = detectHardware();
    const laptopNode = new ComputeNode({
      id: "node-laptop-01",
      name: "Laptop Host Node",
      type: NodeType.LAPTOP_LOCAL,
      host: "127.0.0.1",
      port: 11434,
      status: NodeStatus.ONLINE,
      hardware: {
        cpu: laptopHw.cpu.model,
        cores: laptopHw.cpu.cores,
        totalRamGB: laptopHw.memory.totalGB,
        gpu: laptopHw.gpu.name,
        vramGB: laptopHw.gpu.vramGB,
        accelerator: laptopHw.gpu.accelerator
      },
      availableModels: [
        "nemotron-3-nano:latest",
        "qwen2.5-coder:1.5b",
        "gemma3:1b",
        "llama3.2:1b",
        "granite4:1b-h",
        "phi4-mini",
        "smollm2:1.7b",
        "falcon3:1b-instruct-q4_K_M"
      ],
      modalities: ["text", "code", "ocr", "vision"],
      capabilities: ["local-orchestration", "multi-model-gpu", "cpu-specialists"]
    });
    this.nodes.set(laptopNode.id, laptopNode);

    // 2. NVIDIA Jetson LAN Node
    const jetsonHost = process.env.JETSON_HOST || "10.226.242.101";
    const jetsonPort = parseInt(process.env.JETSON_PORT, 10) || 11434;
    const jetsonSshPort = parseInt(process.env.JETSON_SSH_PORT, 10) || 22;

    const jetsonNode = new ComputeNode({
      id: "node-jetson-01",
      name: "NVIDIA Jetson Compute Node",
      type: NodeType.JETSON_LAN,
      host: jetsonHost,
      port: jetsonPort,
      sshPort: jetsonSshPort,
      status: NodeStatus.INITIALIZING,
      hardware: {
        platform: "NVIDIA Jetson",
        accelerator: "NVIDIA Ampere / Orin GPU (CUDA)",
        vramGB: 32,
        architecture: "aarch64 / ARM64"
      },
      availableModels: [
        "Qwen3.8_Unsloth:latest",
        "Qwen3.8_Uncensored:latest"
      ],
      modalities: ["text", "code", "reasoning"],
      capabilities: ["high-capacity-llm", "27b-dense-inference", "large-context-262k", "gpu-accelerated"]
    });
    this.nodes.set(jetsonNode.id, jetsonNode);
  }

  getNodes() {
    return Array.from(this.nodes.values()).map(node => node.toJSON());
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId) || null;
  }

  getNodeByModel(modelName) {
    for (const node of this.nodes.values()) {
      if (node.status === NodeStatus.ONLINE) {
        if (node.availableModels.some(m => m.toLowerCase().includes(modelName.toLowerCase()) || modelName.toLowerCase().includes(m.toLowerCase()))) {
          return node;
        }
      }
    }
    return null;
  }

  getJetsonNode() {
    return this.nodes.get("node-jetson-01") || null;
  }

  getLaptopNode() {
    return this.nodes.get("node-laptop-01") || null;
  }

  async checkNodeHealth(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { error: `Node ${nodeId} not found`, status: NodeStatus.OFFLINE };
    }

    const egressCheck = evaluateSovereignEgress(node.endpoint, "NODE_HEALTH_CHECK");
    if (!egressCheck.allowed) {
      node.status = NodeStatus.OFFLINE;
      return { error: "Sovereign policy violation: non-local endpoint", status: NodeStatus.OFFLINE };
    }

    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${node.endpoint}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const durationMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map(m => m.name || m.model);

        node.status = NodeStatus.ONLINE;
        node.lastSeen = new Date().toISOString();
        node.lastLatencyMs = durationMs;
        node.lastHealthCheck = new Date().toISOString();
        node.failureCount = 0;
        if (models.length > 0) {
          node.availableModels = models;
        }

        // Try getting version
        try {
          const verRes = await fetch(`${node.endpoint}/api/version`, {
            signal: AbortSignal.timeout(1500)
          });
          if (verRes.ok) {
            const verData = await verRes.json();
            node.runtimeVersion = verData.version || "Ollama";
          }
        } catch {}

        return {
          nodeId: node.id,
          name: node.name,
          status: NodeStatus.ONLINE,
          latencyMs: durationMs,
          runtimeVersion: node.runtimeVersion,
          availableModels: node.availableModels,
          inferenceReady: true,
          is_air_gapped: true
        };
      } else {
        node.failureCount++;
        if (node.failureCount >= node.maxFailuresBeforeOffline) {
          node.status = NodeStatus.DEGRADED;
        }
        return {
          nodeId: node.id,
          name: node.name,
          status: node.status,
          latencyMs: durationMs,
          inferenceReady: false,
          error: `HTTP ${res.status}`
        };
      }
    } catch (err) {
      node.failureCount++;
      if (node.failureCount >= node.maxFailuresBeforeOffline) {
        node.status = NodeStatus.OFFLINE;
      }
      return {
        nodeId: node.id,
        name: node.name,
        status: node.status,
        latencyMs: null,
        inferenceReady: false,
        error: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Unreachable')
      };
    }
  }

  async checkAllNodes() {
    const results = {};
    for (const [id, node] of this.nodes.entries()) {
      results[id] = await this.checkNodeHealth(id);
    }
    return results;
  }

  startHealthMonitor(intervalMs = 15000) {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }
    this.checkAllNodes().catch(() => {});
    this.healthMonitorInterval = setInterval(() => {
      this.checkAllNodes().catch(() => {});
    }, intervalMs);
    // Unref so process can exit cleanly
    if (this.healthMonitorInterval.unref) {
      this.healthMonitorInterval.unref();
    }
  }

  stopHealthMonitor() {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = null;
    }
  }
}

export const nodeManager = new ComputeNodeManager();
