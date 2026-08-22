/**
 * SA-S03 Platform — Modular Nemotron Prompt Constructor
 * Separates System, Role, Task, Context, Tools, Evidence, Policy, and Output Format.
 */

export function buildModularPrompt({
  system = "You are an intelligent educational AI specialist.",
  role = "AI Operations Specialist",
  task = "",
  context = {},
  availableTools = [],
  evidence = [],
  policy = "Enforce accuracy, do not fabricate data, and require HITL for modifications.",
  outputFormat = "structured"
}) {
  const sections = [];

  // 1. SYSTEM
  sections.push(`[SYSTEM]\n${system}`);

  // 2. AGENT ROLE
  sections.push(`[ROLE]\n${role}`);

  // 3. TASK
  sections.push(`[TASK]\n${task}`);

  // 4. CONTEXT
  if (Object.keys(context).length > 0) {
    sections.push(`[CONTEXT]\n${JSON.stringify(context, null, 2)}`);
  }

  // 5. AVAILABLE TOOLS
  if (availableTools.length > 0) {
    sections.push(`[AVAILABLE TOOLS]\n${availableTools.join(", ")}`);
  }

  // 6. EVIDENCE
  if (evidence.length > 0) {
    sections.push(`[VERIFIED EVIDENCE]\n${JSON.stringify(evidence, null, 2)}`);
  }

  // 7. POLICY
  sections.push(`[POLICY]\n${policy}`);

  // 8. OUTPUT FORMAT
  sections.push(`[OUTPUT FORMAT]\nReturn response adhering strictly to ${outputFormat} format. Never fabricate missing records.`);

  return sections.join("\n\n");
}
