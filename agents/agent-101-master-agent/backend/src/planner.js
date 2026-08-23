import { generateWithOllama } from "./model.js";
import { getSpecialists } from "./registry.js";

function extractJson(text) {
  if (typeof text !== "string") {
    throw new Error("Planner returned a non-text response");
  }

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
      } catch {}
    }
    throw new Error("Planner returned invalid JSON");
  }
}

export async function createPlan(task) {
  if (typeof task !== "string" || !task.trim()) {
    throw new Error("task is required");
  }

  const agents = getSpecialists();

  const agentList = agents
    .map(agent => `- ${agent.agent_id}: ${agent.name} [${agent.category}] (capabilities: ${(agent.capabilities || []).slice(0, 4).join(", ")})`)
    .join("\n");

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

  const prompt = `SPECIALIST CATALOG:
${agentList}

USER TASK TO ORCHESTRATE:
"${task}"

Respond with ONLY the JSON plan object (no markdown, no conversation).`;

  const response = await generateWithOllama({
    system,
    task: prompt,
    temperature: 0.1
  });

  let plan;
  try {
    plan = extractJson(response.response);
  } catch (parseErr) {
    // Robust specialist matching fallback
    const taskLower = task.toLowerCase();
    const matchedSpecialist = agents.find(a =>
      (a.capabilities || []).some(cap => taskLower.includes(cap.toLowerCase())) ||
      (a.name || '').toLowerCase().split(' ').some(w => w.length > 3 && taskLower.includes(w))
    ) || agents.find(a => a.agent_id === 'agent-002') || agents[0];

    plan = {
      complexity: "simple",
      reasoning: "Deterministic fallback routing",
      subtasks: [
        {
          agent_id: matchedSpecialist ? matchedSpecialist.agent_id : "agent-002",
          task
        }
      ]
    };
  }

  if (
    !plan ||
    typeof plan !== "object" ||
    !Array.isArray(plan.subtasks)
  ) {
    plan = {
      complexity: "simple",
      reasoning: "Default direct execution",
      subtasks: []
    };
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
