/**
 * Sovereign AI Workbench — Base Model Provider Interface
 * 
 * Defines standard contract for all local compute model providers (Laptop, Jetson, Edge).
 */

export class BaseModelProvider {
  constructor(config = {}) {
    this.id = config.id || "base-provider";
    this.name = config.name || "Base Provider";
    this.nodeId = config.nodeId || "local";
    this.endpoint = config.endpoint || "http://127.0.0.1:11434";
    this.timeoutMs = config.timeoutMs || 30000;
  }

  async health() {
    throw new Error("health() must be implemented by subclass");
  }

  async listModels() {
    throw new Error("listModels() must be implemented by subclass");
  }

  async generate(options = {}) {
    throw new Error("generate() must be implemented by subclass");
  }

  async stream(options = {}) {
    throw new Error("stream() must be implemented by subclass");
  }
}
