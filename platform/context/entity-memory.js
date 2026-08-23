/**
 * Sovereign AI Workbench — Structured Entity Memory Engine
 * Tracks named entities, technical concepts, equipment IDs, documents, and list items per conversation.
 */

import { ContextPolicy } from './context-policy.js';

export class EntityMemory {
  constructor() {
    this.entities = new Map(); // global entity_id -> entity_record
    this.sessionEntities = new Map(); // conversation_id -> Map(entity_id -> EntityRecord)
  }

  /**
   * Registers or updates an entity (supports both registerEntity(entity) and registerEntity(conversationId, entity)).
   */
  registerEntity(arg1, arg2) {
    let conversationId = null;
    let entity = null;

    if (arg2 && typeof arg1 === 'string') {
      conversationId = arg1;
      entity = arg2;
    } else if (arg1 && typeof arg1 === 'object') {
      entity = arg1;
      conversationId = entity.conversationId || entity.last_mentioned_in || null;
    }

    if (!entity || (!entity.id && !entity.name)) return null;

    const rawId = String(entity.id || entity.name);
    const key = rawId.toLowerCase().trim();

    // 1. Update Global Store
    const globalExisting = this.entities.get(rawId) || this.entities.get(key) || {
      id: rawId,
      name: entity.name || rawId,
      type: entity.type || 'equipment',
      attributes: {},
      related_entities: [],
      history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const globalUpdated = {
      ...globalExisting,
      ...entity,
      id: globalExisting.id || rawId,
      attributes: { ...globalExisting.attributes, ...(entity.attributes || {}) },
      related_entities: [...new Set([...(globalExisting.related_entities || []), ...(entity.related_entities || [])])],
      history: [
        ...(globalExisting.history || []),
        ...(entity.history_entry ? [entity.history_entry] : [])
      ],
      updated_at: new Date().toISOString()
    };

    this.entities.set(rawId, globalUpdated);
    this.entities.set(key, globalUpdated);

    // 2. Update Session Store if conversationId provided
    if (conversationId) {
      if (!this.sessionEntities.has(conversationId)) {
        this.sessionEntities.set(conversationId, new Map());
      }

      const convMap = this.sessionEntities.get(conversationId);
      const existing = convMap.get(key) || {
        id: entity.id || rawId,
        name: entity.name || rawId,
        type: entity.type || 'concept',
        aliases: [],
        attributes: {},
        mentions: 0,
        confidence: entity.confidence || 0.9,
        firstMentionedAt: new Date().toISOString(),
        lastMentionedAt: new Date().toISOString()
      };

      const updated = {
        ...existing,
        ...entity,
        id: existing.id,
        name: entity.name || existing.name,
        type: entity.type || existing.type,
        aliases: Array.from(new Set([...existing.aliases, ...(entity.aliases || [])])),
        attributes: { ...existing.attributes, ...(entity.attributes || {}) },
        mentions: existing.mentions + 1,
        confidence: Math.max(existing.confidence, entity.confidence || 0.9),
        lastMentionedAt: new Date().toISOString()
      };

      convMap.set(key, updated);

      // Enforce entity limit per conversation
      if (convMap.size > ContextPolicy.ENTITY_LIMIT) {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [k, ent] of convMap.entries()) {
          const time = new Date(ent.lastMentionedAt).getTime();
          if (time < oldestTime) {
            oldestTime = time;
            oldestKey = k;
          }
        }
        if (oldestKey) convMap.delete(oldestKey);
      }
    }

    return globalUpdated;
  }

  getEntity(entityId) {
    if (!entityId) return null;
    const raw = String(entityId);
    const key = raw.toLowerCase().trim();
    return this.entities.get(raw) || this.entities.get(key) || null;
  }

  queryEntities(filterFn) {
    const all = Array.from(this.entities.values());
    return typeof filterFn === 'function' ? all.filter(filterFn) : all;
  }

  clear() {
    this.entities.clear();
    this.sessionEntities.clear();
  }

  /**
   * Extract and register entities from message content automatically.
   */
  extractEntitiesFromText(conversationId, text, role = 'user') {
    if (!text || typeof text !== 'string') return [];
    const clean = text.trim();
    const registered = [];

    // 1. Industrial Asset Tags (HX-204, TK-101, P-301, V-102, etc.)
    const tagMatches = clean.match(/\b(HX-\d+[A-Z]?|TK-\d+|P-\d+|V-\d+|C-\d+|DWG-\d+|SOP-\d+)\b/gi) || [];
    for (const tag of tagMatches) {
      const ent = this.registerEntity(conversationId, {
        id: tag.toUpperCase(),
        name: tag.toUpperCase(),
        type: 'equipment',
        confidence: 0.98
      });
      if (ent) registered.push(ent);
    }

    // 2. Technical Frameworks / Technologies (React, Vue, Node.js, Python, TypeScript, JavaScript, PostgreSQL, MySQL, SQLite, Docker, Kubernetes, Ollama, Gemma, Nemotron, Qwen, C++, Rust, Go)
    const techMatches = clean.match(/\b(React|Vue|Angular|Node\.js|Python|TypeScript|JavaScript|PostgreSQL|MySQL|SQLite|Docker|Kubernetes|Ollama|Gemma|Nemotron|Qwen|C\+\+|Rust|Go)\b/gi) || [];
    for (const tech of techMatches) {
      const ent = this.registerEntity(conversationId, {
        id: tech.toLowerCase(),
        name: tech,
        type: 'technology',
        confidence: 0.95
      });
      if (ent) registered.push(ent);
    }

    // 3. Prominent Technical Domains & Core Concepts (renewable energy, solar energy, wind energy, corrosion rate, etc.)
    const domainMatches = clean.match(/\b(renewable\s+energy|solar\s+energy|wind\s+energy|hydro\s+power|geothermal|biomass|corrosion\s+rate|ultrasonic\s+thickness|remaining\s+life|heat\s+exchanger)\b/gi) || [];
    for (const domain of domainMatches) {
      const ent = this.registerEntity(conversationId, {
        id: domain.toLowerCase(),
        name: domain,
        type: 'concept',
        confidence: 0.96
      });
      if (ent) registered.push(ent);
    }

    // 4. Extract bullet/numbered list items if assistant message
    if (role === 'assistant') {
      const lines = clean.split('\n');
      let ordinal = 0;
      for (const line of lines) {
        const match = line.match(/^(\d+\.|\*|-)\s+\*?\*?([A-Za-z0-9\s_-]+)\*?\*?[:\-–]?/);
        if (match && match[2]) {
          const item = match[2].trim();
          if (item.length >= 2 && item.length <= 40) {
            const ent = this.registerEntity(conversationId, {
              id: item.toLowerCase(),
              name: item,
              type: 'list_item',
              attributes: { ordinal: ordinal++ },
              confidence: 0.92
            });
            if (ent) registered.push(ent);
          }
        }
      }
    }

    return registered;
  }

  getEntities(conversationId) {
    if (!this.sessionEntities.has(conversationId)) return [];
    return Array.from(this.sessionEntities.get(conversationId).values());
  }

  findEntity(conversationId, nameOrId) {
    if (!this.sessionEntities.has(conversationId) || !nameOrId) return null;
    const key = String(nameOrId).toLowerCase().trim();
    return this.sessionEntities.get(conversationId).get(key) || null;
  }

  clearSession(conversationId) {
    this.sessionEntities.delete(conversationId);
  }

  serialize(conversationId) {
    return this.getEntities(conversationId);
  }

  hydrate(conversationId, entitiesList = []) {
    if (!Array.isArray(entitiesList)) return;
    this.clearSession(conversationId);
    for (const ent of entitiesList) {
      this.registerEntity(conversationId, ent);
    }
  }
}

export const entityMemory = new EntityMemory();
