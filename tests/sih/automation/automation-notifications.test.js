import { notificationCenter, eventBus, localScheduler, IndustrialEvent } from "../../../platform/automation/index.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Local Automation, Event Bus & Notifications Tests", [
  {
    name: "Dispatches and filters in-app operational notifications by role",
    fn: async () => {
      notificationCenter.clear();
      notificationCenter.notify({
        type: "APPROVAL_REQUIRED",
        title: "Sign-off Needed: HX-204 Form-B Permit",
        severity: "high",
        target_role: "Safety Officer",
        entity_id: "HX-204"
      });

      const safetyNotifs = notificationCenter.getNotifications({ role: "Safety Officer" });
      assert.strictEqual(safetyNotifs.length, 1);
      assert.strictEqual(safetyNotifs[0].entity_id, "HX-204");
    }
  },
  {
    name: "Publishes industrial event and triggers automated notification on threshold breach",
    fn: async () => {
      let eventHandled = false;
      eventBus.subscribe(IndustrialEvent.THRESHOLD_BREACHED, async (payload) => {
        eventHandled = true;
        return { handled: true, equipment_id: payload.equipment_id };
      });

      const pubRes = await eventBus.publish(IndustrialEvent.THRESHOLD_BREACHED, {
        equipment_id: "HX-204",
        message: "Nozzle N3 wall thickness 5.90 mm breached OISD limit (6.80 mm)"
      });

      assert.strictEqual(pubRes.handlers_executed >= 1, true);
      assert.strictEqual(eventHandled, true);
    }
  },
  {
    name: "Registers and triggers local scheduled investigation job",
    fn: async () => {
      const job = localScheduler.registerJob({
        id: "JOB-WEEKLY-HX204",
        name: "Weekly Heat Exchanger Wall Thickness Audit",
        schedule: "EVERY_MONDAY_0800",
        objective: "Perform statutory wall thickness audit on HX-204"
      });

      assert.strictEqual(job.id, "JOB-WEEKLY-HX204");
      const trigRes = await localScheduler.triggerJob("JOB-WEEKLY-HX204");
      assert.strictEqual(trigRes.status, "TRIGGERED");
      assert.ok(trigRes.investigation_id);
    }
  }
]);
