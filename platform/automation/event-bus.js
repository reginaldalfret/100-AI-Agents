/**
 * Sovereign AI Workbench — Local Industrial Event Bus
 * Dispatches on-premise events (NEW_DOCUMENT, NEW_INSPECTION, ANOMALY_DETECTED) to trigger automated workflows.
 */

import { notificationCenter } from "./notification-center.js";

export const IndustrialEvent = {
  NEW_DOCUMENT: "NEW_DOCUMENT",
  NEW_INSPECTION_RECORD: "NEW_INSPECTION_RECORD",
  ANOMALY_DETECTED: "ANOMALY_DETECTED",
  THRESHOLD_BREACHED: "THRESHOLD_BREACHED"
};

class EventBus {
  constructor() {
    this.subscribers = new Map(); // event_name -> [handlers]
  }

  subscribe(eventName, handler) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }
    this.subscribers.get(eventName).push(handler);
    return () => this.unsubscribe(eventName, handler);
  }

  unsubscribe(eventName, handler) {
    const list = this.subscribers.get(eventName) || [];
    this.subscribers.set(eventName, list.filter(h => h !== handler));
  }

  async publish(eventName, payload = {}) {
    const list = this.subscribers.get(eventName) || [];
    const results = [];

    // Trigger in-app notification
    if (eventName === IndustrialEvent.THRESHOLD_BREACHED || eventName === IndustrialEvent.ANOMALY_DETECTED) {
      notificationCenter.notify({
        type: "HIGH_RISK_FINDING",
        title: `Critical Alert: ${eventName}`,
        message: payload.message || `Anomaly detected on ${payload.equipment_id || "equipment"}`,
        severity: "critical",
        target_role: "Safety Officer",
        entity_id: payload.equipment_id
      });
    }

    for (const handler of list) {
      try {
        const res = await handler(payload);
        results.push(res);
      } catch (err) {
        results.push({ error: err.message });
      }
    }

    return { event: eventName, handlers_executed: list.length, results };
  }
}

export const eventBus = new EventBus();
