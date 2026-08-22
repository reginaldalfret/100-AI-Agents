const fs = require("fs");
const path = require("path");

const agents = [
  ["AI Writing Agent", "foundation"],
  ["AI Email Agent", "foundation"],
  ["AI Study Agent", "foundation"],
  ["AI Quiz Agent", "foundation"],
  ["AI Summarization Agent", "foundation"],
  ["AI Grammar Agent", "foundation"],
  ["AI Translation Agent", "foundation"],
  ["AI Idea Generation Agent", "foundation"],
  ["AI Storytelling Agent", "foundation"],
  ["AI Goal Planning Agent", "foundation"],
  ["AI Note-Taking Agent", "foundation"],
  ["AI Task Management Agent", "foundation"],
  ["AI Resume Agent", "foundation"],
  ["AI Job Matching Agent", "foundation"],
  ["AI Interview Agent", "foundation"],
  ["AI Communication Agent", "foundation"],
  ["AI SWOT Analysis Agent", "foundation"],
  ["AI Career Advisor Agent", "foundation"],
  ["AI Decision-Making Agent", "foundation"],
  ["AI Brainstorming Agent", "foundation"],

  ["AI Web Research Agent", "research"],
  ["AI News Research Agent", "research"],
  ["AI Research Paper Agent", "research"],
  ["AI Literature Review Agent", "research"],
  ["AI Book Research Agent", "research"],
  ["AI Company Research Agent", "research"],
  ["AI Competitor Research Agent", "research"],
  ["AI Market Research Agent", "research"],
  ["AI Startup Research Agent", "research"],
  ["AI Investment Research Agent", "research"],
  ["AI Product Research Agent", "research"],
  ["AI Travel Research Agent", "research"],
  ["AI Restaurant Research Agent", "research"],
  ["AI Course Research Agent", "research"],
  ["AI College Research Agent", "research"],
  ["AI GitHub Research Agent", "research"],
  ["AI Document Research Agent", "research"],
  ["AI Fact-Checking Agent", "research"],
  ["AI Source Verification Agent", "research"],
  ["AI Research Assistant Agent", "research"],

  ["AI Email Management Agent", "productivity"],
  ["AI Calendar Management Agent", "productivity"],
  ["AI Task Automation Agent", "productivity"],
  ["AI File Organization Agent", "productivity"],
  ["AI PDF Processing Agent", "productivity"],
  ["AI Invoice Processing Agent", "productivity"],
  ["AI Spreadsheet Agent", "productivity"],
  ["AI Data Analysis Agent", "productivity"],
  ["AI Report Generation Agent", "productivity"],
  ["AI Presentation Agent", "productivity"],
  ["AI Image Analysis Agent", "productivity"],
  ["AI Video Analysis Agent", "productivity"],
  ["AI Meeting Assistant Agent", "productivity"],
  ["AI Voice Assistant Agent", "productivity"],
  ["AI Code Review Agent", "productivity"],
  ["AI Debugging Agent", "productivity"],
  ["AI Test Generation Agent", "productivity"],
  ["AI Documentation Agent", "productivity"],
  ["AI Workflow Automation Agent", "productivity"],
  ["AI Personal Assistant Agent", "productivity"],

  ["AI Code Generation Agent", "developer"],
  ["AI Software Architecture Agent", "developer"],
  ["AI Codebase Analysis Agent", "developer"],
  ["AI Bug Hunting Agent", "developer"],
  ["AI Performance Optimization Agent", "developer"],
  ["AI Security Audit Agent", "developer"],
  ["AI Test Engineer Agent", "developer"],
  ["AI Dependency Analysis Agent", "developer"],
  ["AI API Documentation Agent", "developer"],
  ["AI Code Refactoring Agent", "developer"],
  ["AI Database Agent", "developer"],
  ["AI DevOps Agent", "developer"],
  ["AI Docker Agent", "developer"],
  ["AI CI/CD Agent", "developer"],
  ["AI Full-Stack Developer Agent", "developer"],

  ["AI Sales Agent", "business"],
  ["AI Lead Generation Agent", "business"],
  ["AI Lead Qualification Agent", "business"],
  ["AI Customer Support Agent", "business"],
  ["AI Marketing Agent", "business"],
  ["AI Social Media Agent", "business"],
  ["AI SEO Agent", "business"],
  ["AI Content Marketing Agent", "business"],
  ["AI Business Analyst Agent", "business"],
  ["AI Financial Analysis Agent", "business"],
  ["AI Accounting Assistant Agent", "business"],
  ["AI E-Commerce Agent", "business"],
  ["AI Supply Chain Agent", "business"],
  ["AI HR & Recruitment Agent", "business"],
  ["AI Project Manager Agent", "business"],

  ["AI Autonomous Research Agent", "advanced"],
  ["AI Browser Automation Agent", "advanced"],
  ["AI RAG Knowledge Agent", "advanced"],
  ["AI Multi-Agent Debate Agent", "advanced"],
  ["AI Business Operations Agent", "advanced"],
  ["AI Autonomous Coding Agent", "advanced"],
  ["AI AI-Research Scientist Agent", "advanced"],
  ["AI Startup Builder Agent", "advanced"],
  ["AI Multi-Agent Coordinator Agent", "advanced"],
  ["AI Agent Orchestrator Agent", "advanced"]
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/^ai\s+/, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const registry = {
  project: "100-to-1",
  version: "1.0.0",
  total_agents: 100,
  completed_agents: 0,
  agents: agents.map(([name, category], index) => {
    const day = index + 1;
    const agentId = `agent-${String(day).padStart(3, "0")}`;

    return {
      day,
      agent_id: agentId,
      name,
      slug: slugify(name),
      category,
      status: day === 1 ? "ready" : "planned",
      github_repo: "",
      vercel_project: "",
      vercel_url: "",
      api_url: "",
      health_url: "",
      model: "qwen3.5:9b",
      backend: "http://127.0.0.1:11434"
    };
  })
};

const output = path.join(
  __dirname,
  "..",
  "registry",
  "agents.json"
);

fs.writeFileSync(
  output,
  JSON.stringify(registry, null, 2) + "\n"
);

console.log(`Generated registry: ${registry.agents.length} agents`);
