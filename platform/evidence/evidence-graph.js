/**
 * Sovereign AI Workbench — Evidence Graph & Relationship Engine
 * Manages evidence nodes, relationships (SUPPORTS, CONTRADICTS, etc.), and source authority hierarchy.
 */

export const EvidenceRelation = {
  SUPPORTS: "SUPPORTS",
  CONTRADICTS: "CONTRADICTS",
  DERIVED_FROM: "DERIVED_FROM",
  REFERS_TO: "REFERS_TO",
  PRECEDES: "PRECEDES",
  SUPERSEDES: "SUPERSEDES",
  RELATED_TO: "RELATED_TO"
};

export const SourceAuthority = {
  OFFICIAL_SOP: { level: 100, name: "Statutory Standard / Official SOP" },
  TECHNICAL_SPEC: { level: 80, name: "Approved Technical Specification" },
  NDT_INSPECTION_REPORT: { level: 70, name: "Verified NDT Ultrasonic Report" },
  HISTORICAL_LOG: { level: 50, name: "Historical Plant Database Log" },
  INFORMAL_NOTE: { level: 30, name: "Informal Shift Note" }
};

export class EvidenceGraph {
  constructor() {
    this.nodes = new Map(); // evidence_id -> EvidenceNode
    this.edges = [];        // { from_id, to_id, relation, metadata }
  }

  addEvidenceNode(evidence) {
    if (!evidence || !evidence.id) return null;
    const node = {
      id: evidence.id,
      entity_id: evidence.entity_id || "general",
      type: evidence.type || "measurement",
      title: evidence.title || evidence.id,
      content: evidence.content || "",
      numeric_value: evidence.numeric_value !== undefined ? evidence.numeric_value : null,
      unit: evidence.unit || null,
      source: evidence.source || "local_system",
      authority: evidence.authority || SourceAuthority.NDT_INSPECTION_REPORT,
      epistemic_type: evidence.epistemic_type || "FACT",
      timestamp: evidence.timestamp || new Date().toISOString()
    };

    this.nodes.set(node.id, node);
    return node;
  }

  addRelationship(fromId, toId, relation, metadata = {}) {
    const edge = {
      from_id: fromId,
      to_id: toId,
      relation: relation || EvidenceRelation.RELATED_TO,
      metadata,
      timestamp: new Date().toISOString()
    };
    this.edges.push(edge);
    return edge;
  }

  findConflicts(entityId) {
    const conflicts = [];
    for (const edge of this.edges) {
      if (edge.relation === EvidenceRelation.CONTRADICTS) {
        const nodeA = this.nodes.get(edge.from_id);
        const nodeB = this.nodes.get(edge.to_id);
        if (nodeA && nodeB && (!entityId || nodeA.entity_id === entityId)) {
          conflicts.push({
            edge,
            node_a: nodeA,
            node_b: nodeB,
            resolution_advice: nodeA.authority.level >= nodeB.authority.level
              ? `Prioritize ${nodeA.title} (Authority level: ${nodeA.authority.level}) over ${nodeB.title}`
              : `Prioritize ${nodeB.title} (Authority level: ${nodeB.authority.level}) over ${nodeA.title}`
          });
        }
      }
    }
    return conflicts;
  }

  getEvidenceForEntity(entityId) {
    const result = [];
    for (const node of this.nodes.values()) {
      if (node.entity_id === entityId) {
        result.push(node);
      }
    }
    return result;
  }

  exportEvidencePackage(investigationId, entityId) {
    const nodes = entityId ? this.getEvidenceForEntity(entityId) : Array.from(this.nodes.values());
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = this.edges.filter(e => nodeIds.has(e.from_id) && nodeIds.has(e.to_id));

    return {
      package_id: `EV-PKG-${investigationId || Date.now()}`,
      investigation_id: investigationId || "INV-GENERAL",
      entity_id: entityId || "all",
      exported_at: new Date().toISOString(),
      nodes,
      edges,
      total_evidence_count: nodes.length,
      conflicts_detected: this.findConflicts(entityId),
      sovereign_guarantee: {
        total_external_calls: 0,
        is_air_gapped: true
      }
    };
  }
}

export const evidenceGraph = new EvidenceGraph();
