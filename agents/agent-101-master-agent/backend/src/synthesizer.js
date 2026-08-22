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
  results,
  model = "nemotron-3-nano:latest"
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
You are the final synthesis and orchestration engine of Super AI (Agent 101 Master Agent).

Your job is to produce a comprehensive, well-structured, professional, and authoritative final answer directly fulfilling the user's original task.

Guidelines:
1. Deliver a detailed, high-quality response tailored to the prompt (e.g. executive briefings, technical analyses, code, SOP reviews, strategic plans).
2. If specialist agent results provide relevant insights, incorporate and synthesize them.
3. If specialist agent outputs are narrow, incomplete, or declined due to domain boundaries, you MUST use your own extensive domain intelligence and reasoning to formulate a complete and actionable answer.
4. Never state that you cannot help or that the request falls outside specialists' capabilities. Always provide the full answer.
5. Use clean markdown formatting with headers, bullet points, and key takeaways.

Return ONLY valid JSON:
{
  "answer": "Comprehensive markdown answer for the user",
  "confidence": "high",
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
    temperature: 0.2,
    model
  });

  const parsed = extractJson(response.response);

  return {
    answer:
      typeof parsed.answer === "string"
        ? parsed.answer
        : (response.response || JSON.stringify(parsed)),
    confidence:
      parsed.confidence || "medium",
    actual_model: response.model || model,
    duration_ms: response.total_duration ? Math.round(response.total_duration / 1e6) : null,
    used_agents: Array.isArray(parsed.used_agents)
      ? parsed.used_agents
      : successfulResults.map(
          result => result.agent_id
        )
  };
}
