/**
 * Sovereign AI Workbench — Native Mermaid Parser & SVG Generator
 * Locally parses and converts Mermaid syntax into Liquid Glass SVG without external network calls.
 */

import { DiagramSanitizer } from './sanitizer.js';
import { FlowchartRenderer } from './flowchart-renderer.js';
import { SequenceRenderer } from './sequence-renderer.js';
import { ChartRenderer } from './chart-renderer.js';
import { VisualType } from './schema.js';

export class MermaidRenderer {
  /**
   * Parses a Mermaid code string into a structured specification and renders to SVG.
   */
  static render(code = '') {
    if (typeof code !== 'string' || !code.trim()) {
      return `<svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg"><text x="200" y="35" fill="#94a3b8" text-anchor="middle">Empty Mermaid definition</text></svg>`;
    }

    const lines = code
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('%%'));

    const header = (lines[0] || '').toLowerCase();

    // 1. Flowchart / Graph
    if (header.startsWith('graph') || header.startsWith('flowchart')) {
      const direction = header.split(/\s+/)[1] || 'TB';
      const nodes = [];
      const edges = [];
      const nodeMap = new Map();

      const getOrCreateNode = (rawId, rawLabel = null) => {
        const id = rawId.trim();
        if (!nodeMap.has(id)) {
          const nodeObj = {
            id,
            label: rawLabel ? rawLabel.trim() : id,
            kind: 'default'
          };
          nodeMap.set(id, nodeObj);
          nodes.push(nodeObj);
        } else if (rawLabel) {
          nodeMap.get(id).label = rawLabel.trim();
        }
        return nodeMap.get(id);
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // Match A[Label] -->|text| B[Label] or A --> B
        const edgeMatch = line.match(/^([a-zA-Z0-9_-]+)(?:\[(.*?)\])?\s*(-->|---|==>|\.-+->)\s*(?:\|(.*?)\|)?\s*([a-zA-Z0-9_-]+)(?:\[(.*?)\])?/);
        if (edgeMatch) {
          const [, fromId, fromLabel, arrow, edgeLabel, toId, toLabel] = edgeMatch;
          getOrCreateNode(fromId, fromLabel);
          getOrCreateNode(toId, toLabel);
          edges.push({
            from: fromId,
            to: toId,
            label: edgeLabel || '',
            style: arrow.includes('.') ? 'dashed' : 'solid'
          });
          continue;
        }

        // Single node definition A[Label] or A(Label)
        const singleNode = line.match(/^([a-zA-Z0-9_-]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})/);
        if (singleNode) {
          const [, id, label1, label2, label3] = singleNode;
          getOrCreateNode(id, label1 || label2 || label3 || id);
        }
      }

      return FlowchartRenderer.render({
        type: VisualType.FLOWCHART,
        title: 'Workflow Flowchart',
        direction,
        nodes,
        edges
      });
    }

    // 2. Sequence Diagram
    if (header.startsWith('sequencediagram')) {
      const actors = [];
      const actorSet = new Set();
      const messages = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().startsWith('participant ') || line.toLowerCase().startsWith('actor ')) {
          const name = line.split(/\s+/)[1];
          if (name && !actorSet.has(name)) {
            actorSet.add(name);
            actors.push(name);
          }
          continue;
        }

        // Message: A->>B: text or A-->>B: text
        const msgMatch = line.match(/^([a-zA-Z0-9_-]+)\s*(->>|-->>|->|-->)\s*([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
        if (msgMatch) {
          const [, from, arrow, to, text] = msgMatch;
          if (!actorSet.has(from)) { actorSet.add(from); actors.push(from); }
          if (!actorSet.has(to)) { actorSet.add(to); actors.push(to); }
          messages.push({
            from,
            to,
            label: text,
            type: arrow.startsWith('--') ? 'return' : 'call'
          });
        }
      }

      return SequenceRenderer.render({
        type: VisualType.SEQUENCE,
        title: 'Sequence Diagram',
        actors,
        messages
      });
    }

    // 3. Pie Chart
    if (header.startsWith('pie')) {
      let title = 'Distribution';
      const titleMatch = header.match(/title\s+(.*)/i);
      if (titleMatch) title = titleMatch[1];

      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^"?(.*?)"?\s*:\s*(\d+(?:\.\d+)?)/);
        if (match) {
          data.push({
            label: match[1],
            value: parseFloat(match[2])
          });
        }
      }

      return ChartRenderer.renderPieChart({ data }, title);
    }

    // Fallback simple node-link representation
    return `<svg viewBox="0 0 440 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="436" height="76" rx="8" fill="rgba(30,41,59,0.7)" stroke="rgba(99,102,241,0.3)" />
      <text x="220" y="36" fill="#f1f5f9" font-size="12" font-weight="600" text-anchor="middle">Mermaid Diagram (${DiagramSanitizer.sanitizeLabel(header)})</text>
      <text x="220" y="54" fill="#94a3b8" font-size="10" text-anchor="middle">${lines.length} statement(s) parsed</text>
    </svg>`;
  }
}
