/**
 * Sovereign AI Workbench — In-App Notification Center
 * Dispatches and stores local operational notifications (approvals required, conflicts, high-risk findings).
 */

export class NotificationCenter {
  constructor() {
    this.notifications = [];
  }

  notify(event) {
    const item = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: event.type || "INFO", // APPROVAL_REQUIRED, HIGH_RISK_FINDING, EVIDENCE_CONFLICT, TASK_COMPLETED
      title: event.title || "Notification",
      message: event.message || "",
      severity: event.severity || "medium", // low, medium, high, critical
      target_role: event.target_role || "Engineer",
      entity_id: event.entity_id || null,
      read: false,
      timestamp: new Date().toISOString()
    };

    this.notifications.unshift(item);
    return item;
  }

  getNotifications(filter = {}) {
    let list = [...this.notifications];
    if (filter.role) {
      list = list.filter(n => n.target_role === filter.role || n.target_role === "All");
    }
    if (filter.unread_only) {
      list = list.filter(n => !n.read);
    }
    return list;
  }

  markRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    return notif;
  }

  clear() {
    this.notifications = [];
  }
}

export const notificationCenter = new NotificationCenter();
