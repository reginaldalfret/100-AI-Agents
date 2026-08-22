/**
 * Sovereign AI Workbench — Structured Entity Memory Engine
 * Tracks industrial entities (equipment, components, inspections, documents, standards, measurements).
 */

export class EntityMemory {
  constructor() {
    this.entities = new Map(); // entity_id -> entity_record
  }

  registerEntity(entity) {
    if (!entity || !entity.id) return null;
    const existing = this.entities.get(entity.id) || {
      id: entity.id,
      type: entity.type || "equipment",
      name: entity.name || entity.id,
      attributes: {},
      related_entities: [],
      history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = {
      ...existing,
      ...entity,
      attributes: { ...existing.attributes, ...(entity.attributes || {}) },
      related_entities: [...new Set([...existing.related_entities, ...(entity.related_entities || [])])],
      history: [
        ...existing.history,
        ...(entity.history_entry ? [entity.history_entry] : [])
      ],
      updated_at: new Date().toISOString()
    };

    this.entities.set(entity.id, updated);
    return updated;
  }

  getEntity(entityId) {
    return this.entities.get(entityId) || null;
  }

  queryEntities(filterFn) {
    const all = Array.from(this.entities.values());
    return typeof filterFn === "function" ? all.filter(filterFn) : all;
  }

  clear() {
    this.entities.clear();
  }
}

export const entityMemory = new EntityMemory();
