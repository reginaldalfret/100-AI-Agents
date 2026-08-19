import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_FILE = path.join(ROOT, 'registry', 'agents.json');
const OUTPUT_DIR = path.join(ROOT, 'tests', 'agent-tests');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Domain definitions tailored for all 101 agents
const AGENT_TEST_DATA = {
  // Foundation (1-20)
  1: {
    validTask: "Write an essay analyzing the societal and ethical implications of artificial intelligence in higher education.",
    validContext: { tone: "academic", target_words: 400 },
    invalidTask: "Debug and optimize a PostgreSQL database query execution plan with index tuning.",
  },
  2: {
    validTask: "Write a professional email inquiring about software engineering internship opportunities for Summer 2027.",
    validContext: { recipient: "Hiring Manager", company: "Acme Corp" },
    invalidTask: "Create a 10-question multiple-choice quiz on the French Revolution.",
  },
  3: {
    validTask: "Create a comprehensive study guide and revision plan for advanced cellular biology and genetics.",
    validContext: { subject: "Biology", exam_date: "2026-09-15" },
    invalidTask: "Write a Python script for database connection pooling.",
  },
  4: {
    validTask: "Generate a 5-question multiple choice quiz with answer key and explanations on planetary science.",
    validContext: { difficulty: "medium", format: "multiple-choice" },
    invalidTask: "Draft a corporate resume for a Chief Financial Officer position.",
  },
  5: {
    validTask: "Summarize the key findings, methodology, and conclusion of this 50-page renewable energy transition report.",
    validContext: { format: "bullet-points", max_length: "short" },
    invalidTask: "Debug a memory leak in an asynchronous Node.js microservice.",
  },
  6: {
    validTask: "Check and correct grammar, punctuation, sentence structure, and tone for this draft manuscript.",
    validContext: { style: "formal", dialect: "US English" },
    invalidTask: "Generate a multiple choice quiz on calculus derivatives.",
  },
  7: {
    validTask: "Translate this technical software documentation text from English to Spanish with accurate terminology.",
    validContext: { source_lang: "en", target_lang: "es" },
    invalidTask: "Write an argumentative essay on the Industrial Revolution.",
  },
  8: {
    validTask: "Brainstorm 10 innovative startup ideas solving urban transportation and micromobility congestion.",
    validContext: { sector: "CleanTech", target_audience: "Urban Commuters" },
    invalidTask: "Translate this document to German.",
  },
  9: {
    validTask: "Write a creative story about an astronomer who discovers an anomaly in the cosmic microwave background.",
    validContext: { genre: "Sci-Fi", tone: "suspenseful" },
    invalidTask: "Review SQL database schema for normalized 3NF compliance.",
  },
  10: {
    validTask: "Design a 90-day SMART goal planning roadmap for launching a SaaS product from prototype to beta.",
    validContext: { timeframe: "90 days", milestones: 3 },
    invalidTask: "Debug a React useEffect infinite re-render loop.",
  },
  11: {
    validTask: "Synthesize Cornell-format notes and key takeaway bullets from this executive leadership lecture transcript.",
    validContext: { format: "Cornell Notes" },
    invalidTask: "Write a resume for a Senior Marketing Specialist.",
  },
  12: {
    validTask: "Organize and prioritize this backlog of 15 product tasks using the Eisenhower matrix and Agile sprint scoring.",
    validContext: { framework: "Eisenhower" },
    invalidTask: "Write a short creative story about a detective in 1920s Chicago.",
  },
  13: {
    validTask: "Rewrite and optimize this software engineer resume for ATS parsing and senior cloud architect roles.",
    validContext: { target_role: "Staff Cloud Architect", format: "ATS-optimized" },
    invalidTask: "Generate a 10-question multiple-choice quiz on quantum mechanics.",
  },
  14: {
    validTask: "Analyze candidate profile against Staff Machine Learning Engineer job description and identify skill gaps.",
    validContext: { match_type: "skills_alignment" },
    invalidTask: "Write a fantasy story about dragons and knights.",
  },
  15: {
    validTask: "Conduct a mock interview with 5 behavioral and system design interview questions for a Lead DevOps role.",
    validContext: { role: "DevOps Lead", level: "Senior" },
    invalidTask: "Configure Docker container network bridge.",
  },
  16: {
    validTask: "Draft an internal executive communication memo addressing organizational restructuring and new team charters.",
    validContext: { audience: "All Company", tone: "reassuring, clear" },
    invalidTask: "Debug Python asynchronous asyncio coroutine deadlock.",
  },
  17: {
    validTask: "Perform a comprehensive SWOT analysis for an early-stage electric vertical takeoff aircraft (eVTOL) startup.",
    validContext: { market: "Urban Air Mobility" },
    invalidTask: "Write a resume for a Registered Nurse.",
  },
  18: {
    validTask: "Provide career advisor transition strategy for moving from QA Automation Engineer to AI/ML Research Engineer.",
    validContext: { current_years_exp: 5 },
    invalidTask: "Translate this legal contract from French to English.",
  },
  19: {
    validTask: "Perform a structured decision-making matrix comparing Kubernetes vs AWS ECS for multi-tenant microservices.",
    validContext: { criteria: ["cost", "scalability", "ops overhead"] },
    invalidTask: "Write a rhyming poem about nature.",
  },
  20: {
    validTask: "Conduct a brainstorming session to generate creative growth hacking ideas for B2B developer tool adoption.",
    validContext: { goal: "Developer signups", budget: "low" },
    invalidTask: "Debug Node.js garbage collection memory spike.",
  },

  // Research (21-40)
  21: {
    validTask: "Conduct in-depth web research on the current commercial state and roadmaps of optical quantum computing.",
    validContext: { depth: "deep", focus: "hardware architectures" },
    invalidTask: "Write a resume for a retail store manager.",
  },
  22: {
    validTask: "Perform news research on global semiconductor manufacturing investments and export control updates in 2026.",
    validContext: { timespan: "2026", region: "global" },
    invalidTask: "Generate a 5-question multiple choice quiz on world geography.",
  },
  23: {
    validTask: "Synthesize research paper findings on Sparse Mixture-of-Experts architectures and routing efficiency.",
    validContext: { papers_reviewed: 5 },
    invalidTask: "Write a professional email requesting PTO.",
  },
  24: {
    validTask: "Compile a structured literature review on CRISPR-Cas9 base editing therapeutic trials for sickle cell disease.",
    validContext: { scope: "peer-reviewed 2020-2026" },
    invalidTask: "Debug Python pandas dataframe merge mismatch.",
  },
  25: {
    validTask: "Perform book research synthesizing key mental models and behavioral economics principles from Kahneman and Tversky.",
    validContext: { books: ["Thinking, Fast and Slow"] },
    invalidTask: "Write SQL DDL statements for customer order schema.",
  },
  26: {
    validTask: "Produce a detailed company research profile analyzing Stripe's payment infrastructure, margins, and fintech offerings.",
    validContext: { company: "Stripe", aspects: ["revenue model", "products"] },
    invalidTask: "Translate this marketing brochure to Japanese.",
  },
  27: {
    validTask: "Conduct competitor research comparing Datadog, Dynatrace, and New Relic on pricing, APM, and AI observability.",
    validContext: { domain: "Observability / APM" },
    invalidTask: "Write a fiction novel chapter about outer space.",
  },
  28: {
    validTask: "Perform market research on the global solid-state battery industry size, CAGR, key players, and supply chain.",
    validContext: { forecast_horizon: "2026-2035" },
    invalidTask: "Debug a React Redux state selector error.",
  },
  29: {
    validTask: "Conduct startup research identifying top funded generative AI vertical legaltech startups and their moat.",
    validContext: { vertical: "LegalTech", stage: "Series A-B" },
    invalidTask: "Generate a multiple-choice quiz on European history.",
  },
  30: {
    validTask: "Produce investment research assessing risks, valuation multiples, and market tailwinds for enterprise cybersecurity SaaS.",
    validContext: { asset_class: "Public Equities / SaaS" },
    invalidTask: "Write an email apology for missing a project deadline.",
  },
  31: {
    validTask: "Conduct product research comparing features, pricing, and API capabilities of top vector database solutions.",
    validContext: { products: ["Pinecone", "Qdrant", "Milvus", "Weaviate"] },
    invalidTask: "Write a resume for a High School Teacher.",
  },
  32: {
    validTask: "Conduct travel research and produce a comprehensive 10-day cultural and culinary itinerary for Tokyo and Osaka.",
    validContext: { duration_days: 10, season: "Autumn" },
    invalidTask: "Debug PostgreSQL database deadlocks.",
  },
  33: {
    validTask: "Perform restaurant research on Michelin-starred farm-to-table culinary concepts and sustainable sourcing practices.",
    validContext: { cuisine: "Modern Sustainable", location: "Global" },
    invalidTask: "Write an academic essay on Shakespearean tragedies.",
  },
  34: {
    validTask: "Perform course research analyzing syllabus, prerequisites, and student outcomes for top Computer Vision master programs.",
    validContext: { field: "Computer Vision", level: "Graduate" },
    invalidTask: "Write a job application follow-up email.",
  },
  35: {
    validTask: "Conduct college research comparing tuition, research funding, and faculty citations for top AI PhD programs.",
    validContext: { institutions: ["MIT", "Stanford", "CMU", "UC Berkeley"] },
    invalidTask: "Debug C++ memory leak with valgrind.",
  },
  36: {
    validTask: "Conduct GitHub research analyzing stars, commit velocity, and contributor activity for top open-source LLM frameworks.",
    validContext: { repositories: ["vLLM", "Ollama", "TGI", "llama.cpp"] },
    invalidTask: "Write a creative fiction fairy tale.",
  },
  37: {
    validTask: "Perform document research synthesizing key regulatory compliance mandates from HIPAA and GDPR data governance frameworks.",
    validContext: { focus: "Data Governance & Privacy" },
    invalidTask: "Generate a 5-question quiz on organic chemistry.",
  },
  38: {
    validTask: "Fact-check claim: 'Global solar energy generation exceeded 20% of total worldwide electricity production in 2025.'",
    validContext: { claim_source: "Social Media Claim" },
    invalidTask: "Write a resume for an Interior Designer.",
  },
  39: {
    validTask: "Perform source verification on three cited climate study URLs to verify author credentials, peer review, and funding bias.",
    validContext: { source_count: 3 },
    invalidTask: "Write a follow-up email to a prospective client.",
  },
  40: {
    validTask: "Act as research assistant to formulate thesis hypothesis, methodology design, and comprehensive annotated bibliography.",
    validContext: { topic: "AI-driven algorithmic trading efficiency" },
    invalidTask: "Debug JavaScript async promise rejection unhandled.",
  },

  // Productivity (41-60)
  41: {
    validTask: "Process and triage 20 customer support email threads, categorizing urgency, sentiment, and drafting priority responses.",
    validContext: { mailbox: "support@example.com" },
    invalidTask: "Write an essay on modern economic theory.",
  },
  42: {
    validTask: "Optimize executive calendar schedule, resolving 4 scheduling conflicts and allocating focus time blocks for Q4 planning.",
    validContext: { timezone: "UTC-5", priority: "Client meetings" },
    invalidTask: "Translate this recipe from Italian to English.",
  },
  43: {
    validTask: "Design a task automation workflow connecting webhook events to Slack alerts, Jira ticket creation, and Notion documentation.",
    validContext: { triggers: ["webhook_received"] },
    invalidTask: "Write a resume for a Sales Representative.",
  },
  44: {
    validTask: "Design a systematic file organization taxonomy and automated tagging hierarchy for 5,000 corporate digital assets.",
    validContext: { asset_type: "Marketing & Legal documents" },
    invalidTask: "Generate a multiple-choice quiz on ancient Egypt.",
  },
  45: {
    validTask: "Process and extract structured JSON data from multipage PDF invoices, including line items, VAT, and remittance details.",
    validContext: { pdf_format: "Invoice" },
    invalidTask: "Write a creative novel chapter.",
  },
  46: {
    validTask: "Validate incoming vendor invoices against purchase orders, checking payment terms, line item discrepancies, and discount codes.",
    validContext: { matching_type: "3-way match" },
    invalidTask: "Debug Python code for image edge detection.",
  },
  47: {
    validTask: "Construct complex spreadsheet financial model formulas including INDEX/MATCH, dynamic arrays, and NPV/IRR sensitivity tables.",
    validContext: { software: "Excel / Sheets" },
    invalidTask: "Write an argumentative essay on clean energy.",
  },
  48: {
    validTask: "Perform exploratory data analysis on e-commerce transaction dataset, identifying cohort retention trends and revenue churn.",
    validContext: { metrics: ["CAC", "LTV", "Churn"] },
    invalidTask: "Write an internship inquiry email.",
  },
  49: {
    validTask: "Generate comprehensive monthly executive KPI report summarizing ARR growth, CAC payback, and customer satisfaction metrics.",
    validContext: { period: "October 2026", format: "Executive Brief" },
    invalidTask: "Translate this article to French.",
  },
  50: {
    validTask: "Create a 10-slide investor presentation outline, slide titles, visual layout ideas, and speaker notes for Series A pitch.",
    validContext: { slides_count: 10, audience: "Venture Capitalists" },
    invalidTask: "Debug SQL syntax error on table join.",
  },
  51: {
    validTask: "Analyze product catalog image quality metadata, checking resolution, contrast ratio, background consistency, and alt-text.",
    validContext: { format: "E-Commerce Catalog" },
    invalidTask: "Write a cover letter for a legal assistant job.",
  },
  52: {
    validTask: "Analyze video transcript timestamps to generate chapter breakdown, key highlight clips, and executive summary for product webinar.",
    validContext: { duration_minutes: 45 },
    invalidTask: "Create a 5-question multiple choice quiz on world literature.",
  },
  53: {
    validTask: "Synthesize executive meeting transcript into structured action items, owners, deadlines, key decisions, and follow-up emails.",
    validContext: { meeting_type: "Quarterly Board Meeting" },
    invalidTask: "Write a Python web scraper using BeautifulSoup.",
  },
  54: {
    validTask: "Design conversational voice assistant dialogue trees, intent mappings, and error recovery prompts for banking telephone bot.",
    validContext: { domain: "Banking IVR" },
    invalidTask: "Write an essay on the renaissance period.",
  },
  55: {
    validTask: "Perform thorough code review of pull request checking for security vulnerabilities, race conditions, clean architecture, and tests.",
    validContext: { language: "TypeScript", pr_type: "Authentication Gateway" },
    invalidTask: "Write a creative romance short story.",
  },
  56: {
    validTask: "Debug complex issue: diagnose cause of intermittent socket hangup and unhandled promise rejection in Node.js HTTP server.",
    validContext: { error_stack: "Error: socket hang up at createHangUpError" },
    invalidTask: "Write a formal email asking for salary review.",
  },
  57: {
    validTask: "Generate comprehensive unit and integration test suite using node:test and assert for user authentication and token refresh logic.",
    validContext: { coverage_target: "100%", runner: "node:test" },
    invalidTask: "Write a resume for a Graphic Designer.",
  },
  58: {
    validTask: "Generate detailed OpenAPI 3.0 documentation and Markdown reference guides for multi-tenant billing REST endpoints.",
    validContext: { spec_format: "OpenAPI 3.0" },
    invalidTask: "Generate a multiple-choice quiz on biology.",
  },
  59: {
    validTask: "Design an automated CI/CD and incident management workflow connecting PagerDuty, GitHub Releases, and Datadog synthetic monitors.",
    validContext: { stack: ["GitHub Actions", "PagerDuty", "Datadog"] },
    invalidTask: "Write an essay on global macroeconomics.",
  },
  60: {
    validTask: "Compile daily executive briefing summarizing high-priority calendar events, urgent emails, project milestones, and travel weather.",
    validContext: { date: "2026-08-19" },
    invalidTask: "Debug C++ compiler segmentation fault.",
  },

  // Developer (61-75)
  61: {
    validTask: "Generate TypeScript code for thread-safe in-memory cache with LRU eviction policy, TTL expiration, and atomic updates.",
    validContext: { language: "TypeScript", complexity: "O(1)" },
    invalidTask: "Write a resume for an Accountant.",
  },
  62: {
    validTask: "Design software architecture blueprint for high-throughput distributed event streaming platform handling 50k RPS.",
    validContext: { pattern: "Event Sourcing / CQRS", cloud: "AWS" },
    invalidTask: "Write an email asking for a day off.",
  },
  63: {
    validTask: "Perform codebase analysis identifying circular dependencies, architectural coupling, and unused dead code in monorepo.",
    validContext: { monorepo_tool: "Turborepo" },
    invalidTask: "Write a fiction story about medieval kingdoms.",
  },
  64: {
    validTask: "Perform bug hunting analysis on C++ network parser to detect potential buffer overflow, use-after-free, and integer truncation.",
    validContext: { language: "C++20" },
    invalidTask: "Generate a 5-question quiz on world history.",
  },
  65: {
    validTask: "Perform performance optimization analysis on slow PostgreSQL query, recommending compound indexes, partitioning, and rewrite.",
    validContext: { table_rows: 10000000 },
    invalidTask: "Translate this text into Spanish.",
  },
  66: {
    validTask: "Conduct security audit of GraphQL and REST API gateway identifying OWASP Top 10 risks including Broken Object Level Authorization.",
    validContext: { framework: "GraphQL / Node.js" },
    invalidTask: "Write an essay on the philosophy of stoicism.",
  },
  67: {
    validTask: "Design end-to-end test automation architecture and Playwright test matrix for multi-step e-commerce checkout flow.",
    validContext: { framework: "Playwright", browser: "Chromium" },
    invalidTask: "Write an internship application email.",
  },
  68: {
    validTask: "Analyze dependency tree in package-lock.json to detect vulnerable transitive dependencies, license conflicts, and deprecated packages.",
    validContext: { package_manager: "npm" },
    invalidTask: "Write a poem about the ocean.",
  },
  69: {
    validTask: "Author comprehensive developer-facing API documentation including request/response examples and SDK usage snippets for Webhooks API.",
    validContext: { api_name: "Webhooks V2" },
    invalidTask: "Write a resume for a Kindergarten Teacher.",
  },
  70: {
    validTask: "Refactor legacy 800-line procedural order processing function into clean SOLID architecture using Factory and Strategy patterns.",
    validContext: { target_architecture: "Clean Architecture" },
    invalidTask: "Generate a multiple-choice quiz on geography.",
  },
  71: {
    validTask: "Design normalized PostgreSQL database schema, indexing strategy, and foreign key constraints for multi-tenant SaaS workspace.",
    validContext: { engine: "PostgreSQL 17" },
    invalidTask: "Write a creative fiction sci-fi story.",
  },
  72: {
    validTask: "Author Terraform infrastructure as code configuration for multi-region AWS EKS cluster with managed node groups and VPC peering.",
    validContext: { provider: "AWS", tool: "Terraform" },
    invalidTask: "Write a formal letter to a landlord.",
  },
  73: {
    validTask: "Construct secure multi-stage Dockerfile for Node.js production application with distroless image, non-root user, and layer caching.",
    validContext: { base_image: "gcr.io/distroless/nodejs20-debian12" },
    invalidTask: "Write an essay on Renaissance painting.",
  },
  74: {
    validTask: "Design resilient GitHub Actions CI/CD pipeline with parallel unit tests, security scanning, Docker build, and staging deployment.",
    validContext: { platform: "GitHub Actions" },
    invalidTask: "Translate this paragraph to German.",
  },
  75: {
    validTask: "Implement full-stack Next.js 15 Server Action and React component for real-time multiplayer cursor synchronization with WebSockets.",
    validContext: { framework: "Next.js 15 App Router" },
    invalidTask: "Write a resume for a Corporate Recruiter.",
  },

  // Business (76-90)
  76: {
    validTask: "Draft enterprise B2B sales discovery call script, customer value propositions, and objection handling responses for AI platform.",
    validContext: { deal_size: "$100k ARR", persona: "CTO" },
    invalidTask: "Debug Python asynchronous connection leak.",
  },
  77: {
    validTask: "Formulate outbound lead generation strategy, Ideal Customer Profile (ICP) definition, and multi-touch cold email sequence.",
    validContext: { target_market: "Mid-Market Fintechs" },
    invalidTask: "Generate a 5-question quiz on chemistry.",
  },
  78: {
    validTask: "Qualify inbound sales leads using BANT and MEDDIC frameworks, scoring fit, budget authority, and timeline urgency.",
    validContext: { framework: "MEDDIC" },
    invalidTask: "Configure Docker container volume mounts.",
  },
  79: {
    validTask: "Craft compassionate and de-escalating customer support resolution for an enterprise client experiencing a service disruption.",
    validContext: { severity: "Tier 1 Escalation" },
    invalidTask: "Write SQL database migration scripts.",
  },
  80: {
    validTask: "Develop comprehensive multi-channel product marketing launch plan for developer API platform with launch timeline and KPIs.",
    validContext: { channels: ["ProductHunt", "HackerNews", "LinkedIn", "YouTube"] },
    invalidTask: "Debug C++ memory leak in thread pool.",
  },
  81: {
    validTask: "Create 2-week B2B social media content calendar with viral hooks, carousel slides, and technical founder thought leadership posts.",
    validContext: { platform: "LinkedIn / X" },
    invalidTask: "Write SQL queries for relational joins.",
  },
  82: {
    validTask: "Conduct comprehensive technical SEO audit and keyword strategy for high-intent SaaS landing pages to increase organic signups.",
    validContext: { target_keywords: 20 },
    invalidTask: "Write a creative fiction thriller.",
  },
  83: {
    validTask: "Develop content marketing editorial calendar, topic clusters, and pillar article outlines establishing domain authority in DevOps.",
    validContext: { pillar_topic: "Kubernetes Cost Optimization" },
    invalidTask: "Debug Python pandas dataframe slicing syntax.",
  },
  84: {
    validTask: "Author comprehensive Business Requirements Document (BRD) and user story mapping for modernizing digital payments checkout.",
    validContext: { document_type: "BRD" },
    invalidTask: "Write a poem about winter snow.",
  },
  85: {
    validTask: "Perform financial analysis and DCF valuation model assessing revenue growth rate, gross margins, EBITDA, and terminal value for SaaS.",
    validContext: { model_type: "DCF 5-Year" },
    invalidTask: "Generate a multiple-choice quiz on world capitals.",
  },
  86: {
    validTask: "Prepare month-end accounting reconciliation schedule, accrual journal entries, and deferred revenue amortization schedules.",
    validContext: { standard: "GAAP / ASC 606" },
    invalidTask: "Debug JavaScript async function await rejection.",
  },
  87: {
    validTask: "Formulate e-commerce conversion rate optimization (CRO) audit and cart abandonment recovery sequence for high-volume store.",
    validContext: { monthly_gmv: "$1,000,000" },
    invalidTask: "Write an essay on modern political theory.",
  },
  88: {
    validTask: "Design supply chain inventory optimization model calculating Economic Order Quantity (EOQ) and safety stock buffer levels.",
    validContext: { sku_count: 500 },
    invalidTask: "Write a resume for a Commercial Pilot.",
  },
  89: {
    validTask: "Draft job description, competency rubric, and structured interview evaluation scorecard for Principal Security Engineer.",
    validContext: { role: "Principal Security Engineer" },
    invalidTask: "Debug PostgreSQL database query deadlock.",
  },
  90: {
    validTask: "Construct comprehensive project manager Work Breakdown Structure (WBS), Gantt milestone schedule, and risk mitigation register.",
    validContext: { project: "Global ERP Migration" },
    invalidTask: "Write a creative fantasy adventure story.",
  },

  // Advanced (91-100)
  91: {
    validTask: "Perform autonomous multi-source research synthesizing academic papers, patent filings, and market data on quantum encryption.",
    validContext: { depth: "multi-agent synthesis" },
    invalidTask: "Write a polite email asking for meeting reschedule.",
  },
  92: {
    validTask: "Design autonomous browser automation workflow recipe with intelligent DOM selectors, CAPTCHA handling, and JSON data extraction.",
    validContext: { target_url: "https://example.com/data" },
    invalidTask: "Write an essay on ancient Greek architecture.",
  },
  93: {
    validTask: "Configure enterprise RAG knowledge base architecture with hybrid BM25 + dense vector retrieval, re-ranking, and chunking strategy.",
    validContext: { vector_db: "Milvus", embedding_model: "text-embedding-3-large" },
    invalidTask: "Write a resume for an Administrative Assistant.",
  },
  94: {
    validTask: "Orchestrate a structured multi-agent debate between Proponent and Opponent evaluating Microservices vs Modular Monolith.",
    validContext: { debate_format: "Oxford Style" },
    invalidTask: "Translate this legal agreement into French.",
  },
  95: {
    validTask: "Map and optimize end-to-end enterprise business operations quote-to-cash workflow, removing bottlenecks and manual steps.",
    validContext: { cycle_time_reduction: "30%" },
    invalidTask: "Debug Python code syntax error in loop.",
  },
  96: {
    validTask: "Execute autonomous coding loop: synthesize API endpoint code, run static analysis, generate unit tests, and self-repair syntax errors.",
    validContext: { autonomy_level: "full loop" },
    invalidTask: "Write a marketing newsletter promoting apparel.",
  },
  97: {
    validTask: "Formulate novel AI research scientist hypothesis and ablation study design for improving long-context attention in LLMs.",
    validContext: { focus: "Context Extension & Needle in Haystack" },
    invalidTask: "Write a cover letter for an office clerk.",
  },
  98: {
    validTask: "Construct full startup builder blueprint including Problem-Solution Fit, Lean Canvas, MVP feature prioritization, and Go-To-Market.",
    validContext: { startup_concept: "AI DevSecOps Platform" },
    invalidTask: "Debug SQL database deadlock on update transaction.",
  },
  99: {
    validTask: "Coordinate multi-agent task execution plan, defining message payloads, dependency graphs, and handoff protocols across 5 agents.",
    validContext: { agents_involved: ["agent-021", "agent-048", "agent-061", "agent-057", "agent-084"] },
    invalidTask: "Write an essay on Roman Empire military tactics.",
  },
  100: {
    validTask: "Design and execute dynamic agent orchestrator DAG workflow routing tasks dynamically based on agent health, capability, and latency.",
    validContext: { fleet_size: 100 },
    invalidTask: "Write a resume for a Restaurant Chef.",
  },

  // Master (101)
  101: {
    validTask: "Analyze objective 'Build a modern fintech payment dashboard with automated fraud analysis and generate market report', decompose into specialized subtasks, select optimal specialist agents (e.g. agent-061, agent-048, agent-085), orchestrate execution and synthesize final response.",
    validContext: { mode: "orchestration", priority: "high" },
    invalidTask: "", // Master agent is unrestricted
  }
};

export function generateAllAgentTests() {
  console.log(`Reading registry: ${REGISTRY_FILE}`);
  const registryData = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  const agents = registryData.agents;

  console.log(`Generating test specifications for ${agents.length} agents...`);

  let generatedCount = 0;

  for (const agent of agents) {
    const day = agent.day;
    const testData = AGENT_TEST_DATA[day] || {
      validTask: `Perform specialized ${agent.name} operations for ${agent.category} domain.`,
      validContext: { category: agent.category },
      invalidTask: `Write unrelated programming code and debug PostgreSQL database.`
    };

    const validPayload = {
      task: testData.validTask,
      context: testData.validContext || { test: true },
      parameters: {
        temperature: 0.3
      },
      output_format: "structured"
    };

    const invalidPayload = {
      task: testData.invalidTask || "Translate this text to Latin and generate poetry."
    };

    const negativeTests = [
      {
        name: "empty_request_body",
        description: "Verify agent rejects completely empty payload with 400 status",
        payload: {},
        expected_status: 400,
        expected_error: "task is required"
      },
      {
        name: "empty_task_string",
        description: "Verify agent rejects empty task string with 400 status",
        payload: { task: "   " },
        expected_status: 400,
        expected_error: "task is required"
      },
      {
        name: "missing_task_field",
        description: "Verify agent rejects payload without task property",
        payload: { context: { topic: "test" }, parameters: { temp: 0.5 } },
        expected_status: 400,
        expected_error: "task is required"
      },
      {
        name: "oversized_task",
        description: "Verify agent rejects task exceeding 20000 character limit",
        payload: { task_type: "oversized" },
        expected_status: 400,
        expected_error: "task exceeds the 20000 character limit"
      }
    ];

    const expectedBehavior = {
      health: {
        status: ["ok", "degraded", "offline"],
        required_fields: ["status", "agent_id", "version", "timestamp"]
      },
      contract_check: {
        status: "success",
        agent_id: agent.agent_id,
        result_type: ["string", "object"],
        metadata_fields: ["model", "output_format", "capabilities"]
      },
      valid_test: {
        status: "success",
        agent_id: agent.agent_id,
        allows_execution: true
      },
      invalid_test: agent.agent_id === "agent-101" ? {
        status: ["success", "rejected"],
        notes: "Master agent is intentionally unrestricted; delegates or synthesizes"
      } : {
        status: "rejected",
        error_code: "AGENT_CAPABILITY_MISMATCH",
        rejection_reason: ["unknown-or-out-of-scope", "capability-mismatch"]
      },
      negative_tests: {
        status: "error",
        error_required: true,
        http_status: 400
      }
    };

    let agentCapabilities = [];
    const agentDirName = `${agent.agent_id}-${agent.slug}`;
    const agentJsonPath = path.join(ROOT, 'agents', agentDirName, 'agent.json');
    if (fs.existsSync(agentJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(agentJsonPath, 'utf8'));
        agentCapabilities = parsed.capabilities || [];
      } catch {}
    }

    const testSpec = {
      agent_id: agent.agent_id,
      day: agent.day,
      name: agent.name,
      slug: agent.slug,
      category: agent.category,
      port: agent.port || (8100 + Number(agent.day)),
      capabilities: agentCapabilities,
      valid_test: {
        description: `Domain-specific task exercising ${agent.name} capabilities`,
        payload: validPayload
      },
      invalid_test: {
        description: `Cross-domain task designed to trigger capability-gate rejection`,
        payload: invalidPayload
      },
      negative_tests: negativeTests,
      expected_behavior: expectedBehavior
    };

    const targetFile = path.join(OUTPUT_DIR, `${agent.agent_id}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(testSpec, null, 2) + '\n', 'utf8');
    generatedCount++;
  }

  console.log(`Successfully generated ${generatedCount} test specifications in ${OUTPUT_DIR}`);
  return generatedCount;
}

if (process.argv[1] && process.argv[1].endsWith('generate-agent-tests.js')) {
  generateAllAgentTests();
}
