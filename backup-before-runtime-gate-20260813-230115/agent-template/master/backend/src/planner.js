import { generateWithOllama } from "./model.js";
import { getSpecialists } from "./registry.js";

function extractJson(text) {
  if (typeof text !== "string") {
    throw new Error("Planner returned a non-text response");
  }

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Planner returned invalid JSON");
  }
}

export async function createPlan(task) {
  if (typeof task !== "string" || !task.trim()) {
    throw new Error("task is required");
  }

  const agents = getSpecialists();

  const catalog = agents.map(agent => ({
    agent_id: agent.agent_id,
    name: agent.name,
    category: agent.category,
    capabilities: Array.isArray(agent.capabilities)
      ? agent.capabilities
      : []
  }));

  const system = `
You are the planning subsystem of the AI Master Agent.

Your job is to analyze a user's task and determine which specialist
agents, if any, should handle subtasks.

You MUST only select agent IDs from the supplied catalog.

Return ONLY valid JSON.

Required format:

{
  "complexity": "simple|moderate|complex",
  "reasoning": "short explanation",
  "subtasks": [
    {
      "agent_id": "agent-XXX",
      "task": "specific actionable subtask"
    }
  ]
}

Rules:

1. Never invent an agent ID.
2. Use the minimum number of agents necessary.
3. A simple task may use zero specialists.
4. Moderate or complex tasks may use multiple specialists.
5. Every subtask must be independently actionable.
6. Never select agent-101.
7. Do not delegate work that the Master Agent can perform directly.
`;

  const prompt = `
USER TASK:

${task}

AVAILABLE SPECIALIST AGENTS:

${JSON.stringify(catalog, null, 2)}
`;

  const response = await generateWithOllama({
    system,
    task: prompt,
    temperature: 0.1
  });

  const plan = extractJson(response.response);

  if (
    !plan ||
    typeof plan !== "object" ||
    !Array.isArray(plan.subtasks)
  ) {
    throw new Error("Invalid master plan");
  }

  const validIds = new Set(
    agents.map(agent => agent.agent_id)
  );

  plan.subtasks = plan.subtasks.filter(
    subtask =>
      subtask &&
      validIds.has(subtask.agent_id) &&
      typeof subtask.task === "string" &&
      subtask.task.trim()
  );

  return plan;
}
