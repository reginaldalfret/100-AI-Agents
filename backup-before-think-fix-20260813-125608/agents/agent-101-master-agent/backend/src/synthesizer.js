import { generateWithOllama } from "./model.js";

function extractJson(text) {
  if (typeof text !== "string") {
    throw new Error("Synthesizer returned a non-text response");
  }

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      answer: cleaned
    };
  }
}

export async function synthesize({
  originalTask,
  plan,
  results
}) {
  if (
    typeof originalTask !== "string" ||
    !originalTask.trim()
  ) {
    throw new Error("originalTask is required");
  }

  if (!plan || typeof plan !== "object") {
    throw new Error("plan is required");
  }

  if (!Array.isArray(results)) {
    throw new Error("results must be an array");
  }

  const successfulResults = results.filter(
    result => result.status === "completed"
  );

  const failedResults = results.filter(
    result => result.status === "failed"
  );

  const system = `
You are the final synthesis subsystem of the AI Master Agent.

Your job is to produce the best possible final answer to the user's
original task using the specialist results.

Do not mention internal orchestration unless it is useful to the user.

Resolve conflicts between specialist outputs using your own reasoning.

Do not invent facts that are unsupported by the available results.

Return ONLY valid JSON:

{
  "answer": "final answer for the user",
  "confidence": "high|medium|low",
  "used_agents": ["agent-XXX"]
}
`;

  const prompt = `
ORIGINAL USER TASK:

${originalTask}

MASTER PLAN:

${JSON.stringify(plan, null, 2)}

SUCCESSFUL SPECIALIST RESULTS:

${JSON.stringify(successfulResults, null, 2)}

FAILED SPECIALIST RESULTS:

${JSON.stringify(failedResults, null, 2)}
`;

  const response = await generateWithOllama({
    system,
    task: prompt,
    temperature: 0.2
  });

  const parsed = extractJson(response.response);

  return {
    answer:
      typeof parsed.answer === "string"
        ? parsed.answer
        : JSON.stringify(parsed),
    confidence:
      parsed.confidence || "medium",
    used_agents: Array.isArray(parsed.used_agents)
      ? parsed.used_agents
      : successfulResults.map(
          result => result.agent_id
        )
  };
}
