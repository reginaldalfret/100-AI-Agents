import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:\\Smart Automation\\100-AI-Agents';

const AGENT_MAPPINGS = [
  { id: "agent-001", num: "001", name: "Writing AI Agent", category: "Writing & Communication", desc: "Creates clear articles, essays, letters, reports, and written content." },
  { id: "agent-002", num: "002", name: "Email AI Agent", category: "Writing & Communication", desc: "Drafts professional emails, announcements, replies, and newsletters." },
  { id: "agent-003", num: "003", name: "Study AI Agent", category: "Education & Learning", desc: "Generates flashcards, practice problems, and active recall study guides." },
  { id: "agent-004", num: "004", name: "Quiz AI Agent", category: "Education & Learning", desc: "Creates interactive quizzes, tests, and knowledge check questionnaires." },
  { id: "agent-005", num: "005", name: "Summarization AI Agent", category: "Writing & Communication", desc: "Condenses long articles, reports, and transcripts into concise summaries." },
  { id: "agent-006", num: "006", name: "Grammar AI Agent", category: "Writing & Communication", desc: "Checks grammar, syntax, punctuation, style, and tone accuracy." },
  { id: "agent-007", num: "007", name: "Translation AI Agent", category: "Writing & Communication", desc: "Translates text across multiple languages with context preservation." },
  { id: "agent-008", num: "008", name: "Idea Generation AI Agent", category: "Design & Creative", desc: "Brainstorms creative concepts, product angles, and innovative solutions." },
  { id: "agent-009", num: "009", name: "Storytelling AI Agent", category: "Design & Creative", desc: "Crafts engaging narrative arcs, scenarios, case studies, and storytelling." },
  { id: "agent-010", num: "010", name: "Goal Planning AI Agent", category: "Automation & Productivity", desc: "Breaks objectives into SMART goals, milestones, and daily tracking." },
  { id: "agent-011", num: "011", name: "Note Taking AI Agent", category: "Automation & Productivity", desc: "Organizes unstructured notes into clean Cornell and outline structures." },
  { id: "agent-012", num: "012", name: "Task Management AI Agent", category: "Automation & Productivity", desc: "Prioritizes daily to-do lists, backlog items, and urgency matrices." },
  { id: "agent-013", num: "013", name: "Resume AI Agent", category: "Business & Management", desc: "Tailors resumes, optimizes bullet points for ATS, and writes cover letters." },
  { id: "agent-014", num: "014", name: "Job Matching AI Agent", category: "Business & Management", desc: "Analyzes job requirements and aligns skillsets for career placement." },
  { id: "agent-015", num: "015", name: "Interview AI Agent", category: "Business & Management", desc: "Conducts mock interviews, behavioral questions, and feedback coaching." },
  { id: "agent-016", num: "016", name: "Communication AI Agent", category: "Writing & Communication", desc: "Polishes interpersonal messages, negotiation dialogue, and memos." },
  { id: "agent-017", num: "017", name: "SWOT Analysis AI Agent", category: "Business & Management", desc: "Conducts Strengths, Weaknesses, Opportunities, and Threats evaluations." },
  { id: "agent-018", num: "018", name: "Career Advisor AI Agent", category: "Business & Management", desc: "Provides career roadmaps, promotion strategy, and skill gap plans." },
  { id: "agent-019", num: "019", name: "Decision Making AI Agent", category: "Business & Management", desc: "Applies decision trees, pros/cons weighting, and trade-off matrices." },
  { id: "agent-020", num: "020", name: "Brainstorming AI Agent", category: "Design & Creative", desc: "Facilitates divergent thinking, mind maps, and lateral brainstorms." },
  { id: "agent-021", num: "021", name: "Web Research AI Agent", category: "Research & Knowledge", desc: "Searches on-premise knowledge bases and synthesizes topical findings." },
  { id: "agent-022", num: "022", name: "News Research AI Agent", category: "Research & Knowledge", desc: "Curates and summarizes industry developments and news feeds." },
  { id: "agent-023", num: "023", name: "Research Paper AI Agent", category: "Research & Knowledge", desc: "Analyzes scientific papers, methodologies, citations, and abstracts." },
  { id: "agent-024", num: "024", name: "Literature Review AI Agent", category: "Research & Knowledge", desc: "Synthesizes multi-source academic literature and thematic trends." },
  { id: "agent-025", num: "025", name: "Book Research AI Agent", category: "Research & Knowledge", desc: "Extracts key chapter takeaways, book outlines, and bibliographies." },
  { id: "agent-026", num: "026", name: "Company Research AI Agent", category: "Business & Management", desc: "Profiles organizations, leadership structures, and business offerings." },
  { id: "agent-027", num: "027", name: "Competitor Research AI Agent", category: "Business & Management", desc: "Analyzes market competitors, positioning, and feature matrices." },
  { id: "agent-028", num: "028", name: "Market Research AI Agent", category: "Business & Management", desc: "Evaluates target demographics, TAM/SAM sizing, and market forces." },
  { id: "agent-029", num: "029", name: "Startup Research AI Agent", category: "Business & Management", desc: "Assesses startup pitch viability, business models, and launch risks." },
  { id: "agent-030", num: "030", name: "Investment Research AI Agent", category: "Business & Management", desc: "Evaluates investment criteria, valuation multiples, and ROI metrics." },
  { id: "agent-031", num: "031", name: "Product Research AI Agent", category: "Business & Management", desc: "Analyzes product specifications, user reviews, and product tradeoffs." },
  { id: "agent-032", num: "032", name: "Travel Research AI Agent", category: "Automation & Productivity", desc: "Plans travel itineraries, logistical schedules, and travel checklists." },
  { id: "agent-033", num: "033", name: "Restaurant Research AI Agent", category: "Automation & Productivity", desc: "Recommends catering, menus, dietary options, and dining venues." },
  { id: "agent-034", num: "034", name: "Course Research AI Agent", category: "Education & Learning", desc: "Curates training courses, syllabi, learning roadmaps, and curricula." },
  { id: "agent-035", num: "035", name: "College Research AI Agent", category: "Education & Learning", desc: "Researches academic programs, admission requirements, and prerequisites." },
  { id: "agent-036", num: "036", name: "GitHub Research AI Agent", category: "Coding & Development", desc: "Analyzes open-source repositories, dependencies, stars, and code licenses." },
  { id: "agent-037", num: "037", name: "Document Research AI Agent", category: "Research & Knowledge", desc: "Searches through PDF/Word archives for targeted clauses and sections." },
  { id: "agent-038", num: "038", name: "Fact Checking AI Agent", category: "Research & Knowledge", desc: "Cross-references claims against verified local documents and evidence." },
  { id: "agent-039", num: "039", name: "Source Verification AI Agent", category: "Research & Knowledge", desc: "Validates provenance, author authority, and source reliability." },
  { id: "agent-040", num: "040", name: "Research Assistant AI Agent", category: "Research & Knowledge", desc: "Coordinates end-to-end background investigations and briefing packs." },
  { id: "agent-041", num: "041", name: "Email Management AI Agent", category: "Automation & Productivity", desc: "Organizes inbox rules, auto-triage filters, and canned responses." },
  { id: "agent-042", num: "042", name: "Calendar Management AI Agent", category: "Automation & Productivity", desc: "Resolves scheduling conflicts and coordinates meeting agendas." },
  { id: "agent-043", num: "043", name: "Task Automation AI Agent", category: "Automation & Productivity", desc: "Automates repetitive workflows, recurring cron jobs, and pipelines." },
  { id: "agent-044", num: "044", name: "File Organization AI Agent", category: "Automation & Productivity", desc: "Organizes folder structures, naming conventions, and file archiving." },
  { id: "agent-045", num: "045", name: "PDF Processing AI Agent", category: "Automation & Productivity", desc: "Parses PDF layouts, extracts form fields, tables, and text streams." },
  { id: "agent-046", num: "046", name: "Invoice Processing AI Agent", category: "Business & Management", desc: "Extracts invoice line items, dates, vendor details, and totals." },
  { id: "agent-047", num: "047", name: "Spreadsheet AI Agent", category: "Data & Analytics", desc: "Creates Excel/CSV formulas, models calculations, and cleans tables." },
  { id: "agent-048", num: "048", name: "Data Analysis AI Agent", category: "Data & Analytics", desc: "Analyzes datasets, identifies trends, correlations, and key insights." },
  { id: "agent-049", num: "049", name: "Report Generation AI Agent", category: "Data & Analytics", desc: "Generates formatted business, technical, and operational reports." },
  { id: "agent-050", num: "050", name: "Presentation AI Agent", category: "Design & Creative", desc: "Structures presentation slide decks, visual outlines, and speaking notes." },
  { id: "agent-051", num: "051", name: "Image Analysis AI Agent", category: "Specialized AI", desc: "Analyzes photos, technical drawings, defects, and visual features." },
  { id: "agent-052", num: "052", name: "Video Analysis AI Agent", category: "Specialized AI", desc: "Analyzes video scenes, timestamps, and activity summaries." },
  { id: "agent-053", num: "053", name: "Meeting Assistant AI Agent", category: "Writing & Communication", desc: "Prepares meeting agendas, transcribes key points, and action items." },
  { id: "agent-054", num: "054", name: "Voice Assistant AI Agent", category: "Specialized AI", desc: "Formats voice assistant responses for natural speech flow and SSML." },
  { id: "agent-055", num: "055", name: "Code Review AI Agent", category: "Coding & Development", desc: "Reviews pull requests, analyzes code quality, security, and cleanliness." },
  { id: "agent-056", num: "056", name: "Debugging AI Agent", category: "Coding & Development", desc: "Identifies bugs, analyzes error stack traces, and provides fixes." },
  { id: "agent-057", num: "057", name: "Test Generation AI Agent", category: "Specialized AI", desc: "Generates unit tests, integration test suites, and mock fixtures." },
  { id: "agent-058", num: "058", name: "Documentation AI Agent", category: "Writing & Communication", desc: "Writes comprehensive software documentation, READMEs, and wikis." },
  { id: "agent-059", num: "059", name: "Workflow Automation AI Agent", category: "Automation & Productivity", desc: "Builds multi-step automated workflows, approvals, and event triggers." },
  { id: "agent-060", num: "060", name: "Personal Assistant AI Agent", category: "Automation & Productivity", desc: "Coordinates schedules, drafts reminders, and manages daily tasks." },
  { id: "agent-061", num: "061", name: "Code Generation AI Agent", category: "Coding & Development", desc: "Writes clean code, implements algorithms, and solves software tasks." },
  { id: "agent-062", num: "062", name: "Software Architecture AI Agent", category: "Coding & Development", desc: "Architects scalable microservices, system layers, and data flows." },
  { id: "agent-063", num: "063", name: "Codebase Analysis AI Agent", category: "Coding & Development", desc: "Analyzes codebase structure, module coupling, and dead code." },
  { id: "agent-064", num: "064", name: "Bug Hunting AI Agent", category: "Coding & Development", desc: "Performs deep static analysis to find edge case software defects." },
  { id: "agent-065", num: "065", name: "Performance Optimization AI Agent", category: "Coding & Development", desc: "Profiles CPU/memory bottlenecks, load times, and caching." },
  { id: "agent-066", num: "066", name: "Security Audit AI Agent", category: "Security & Systems", desc: "Audits source code and systems for vulnerabilities and OWASP compliance." },
  { id: "agent-067", num: "067", name: "Test Engineer AI Agent", category: "Specialized AI", desc: "Designs end-to-end regression suites, test plans, and assertions." },
  { id: "agent-068", num: "068", name: "Dependency Analysis AI Agent", category: "Coding & Development", desc: "Audits package dependencies, vulnerabilities, and upgrade paths." },
  { id: "agent-069", num: "069", name: "API Documentation AI Agent", category: "Coding & Development", desc: "Generates OpenAPI specifications, endpoint contracts, and API docs." },
  { id: "agent-070", num: "070", name: "Code Refactoring AI Agent", category: "Coding & Development", desc: "Refactors complex code into clean, modular, and maintainable patterns." },
  { id: "agent-071", num: "071", name: "Database AI Agent", category: "Data & Analytics", desc: "Designs database schemas, SQL queries, indexes, and migrations." },
  { id: "agent-072", num: "072", name: "DevOps AI Agent", category: "Security & Systems", desc: "Configures Docker containers, deployment scripts, and infrastructure." },
  { id: "agent-073", num: "073", name: "Docker AI Agent", category: "Security & Systems", desc: "Authors multi-stage Dockerfiles, compose files, and container configs." },
  { id: "agent-074", num: "074", name: "CI/CD AI Agent", category: "Security & Systems", desc: "Configures GitHub Actions, automated test runs, and build pipelines." },
  { id: "agent-075", num: "075", name: "Full-Stack Developer AI Agent", category: "Coding & Development", desc: "Builds full-stack features connecting frontend UI to backend APIs." },
  { id: "agent-076", num: "076", name: "Sales AI Agent", category: "Business & Management", desc: "Drafts sales pitches, outbound outreach, and objection handling." },
  { id: "agent-077", num: "077", name: "Lead Generation AI Agent", category: "Business & Management", desc: "Identifies ideal prospect profiles, lead criteria, and qualification." },
  { id: "agent-078", num: "078", name: "Lead Qualification AI Agent", category: "Business & Management", desc: "Scores leads using BANT and MEDDIC qualification frameworks." },
  { id: "agent-079", num: "079", name: "Customer Support AI Agent", category: "Writing & Communication", desc: "Drafts empathetic customer service replies and troubleshooting steps." },
  { id: "agent-080", num: "080", name: "Marketing AI Agent", category: "Business & Management", desc: "Plans marketing campaigns, value propositions, copywriting, and funnels." },
  { id: "agent-081", num: "081", name: "Social Media AI Agent", category: "Business & Management", desc: "Creates engaging social posts, hashtags, threads, and content calendars." },
  { id: "agent-082", num: "082", name: "SEO AI Agent", category: "Business & Management", desc: "Optimizes search engine rankings, keywords, meta tags, and structure." },
  { id: "agent-083", num: "083", name: "Content Marketing AI Agent", category: "Business & Management", desc: "Plans content strategy, blog pillars, and distribution channels." },
  { id: "agent-084", num: "084", name: "Business Analyst AI Agent", category: "Business & Management", desc: "Analyzes business workflows, KPIs, and process optimization." },
  { id: "agent-085", num: "085", name: "Financial Analysis AI Agent", category: "Business & Management", desc: "Analyzes financial statements, margins, ROI, budgets, and cash flows." },
  { id: "agent-086", num: "086", name: "Accounting Assistant AI Agent", category: "Business & Management", desc: "Assists with bookkeeping ledger categorization, reconciliation, and VAT." },
  { id: "agent-087", num: "087", name: "E-Commerce AI Agent", category: "Business & Management", desc: "Optimizes product listings, descriptions, cart conversions, and reviews." },
  { id: "agent-088", num: "088", name: "Supply Chain AI Agent", category: "Business & Management", desc: "Analyzes inventory reorder points, logistics, and supplier lead times." },
  { id: "agent-089", num: "089", name: "HR & Recruitment AI Agent", category: "Business & Management", desc: "Drafts job descriptions, onboarding plans, and workplace policies." },
  { id: "agent-090", num: "090", name: "Project Manager AI Agent", category: "Business & Management", desc: "Tracks deliverables, manages timelines, risks, and project status reports." },
  { id: "agent-091", num: "091", name: "Autonomous Research AI Agent", category: "Research & Knowledge", desc: "Executes deep multi-step autonomous research and structured synthesis." },
  { id: "agent-092", num: "092", name: "Browser Automation AI Agent", category: "Automation & Productivity", desc: "Designs browser automation scripts, DOM selectors, and scraping." },
  { id: "agent-093", num: "093", name: "RAG Knowledge AI Agent", category: "Research & Knowledge", desc: "Indexes document embeddings and performs high-precision semantic search." },
  { id: "agent-094", num: "094", name: "Multi-Agent Debate AI Agent", category: "Specialized AI", desc: "Orchestrates multi-perspective agent debate and consensus synthesis." },
  { id: "agent-095", num: "095", name: "Business Operations AI Agent", category: "Business & Management", desc: "Models standard operating procedures, SLAs, and organizational throughput." },
  { id: "agent-096", num: "096", name: "Autonomous Coding AI Agent", category: "Coding & Development", desc: "Plans, writes, and self-tests end-to-end software modules autonomously." },
  { id: "agent-097", num: "097", name: "AI Research Scientist AI Agent", category: "Specialized AI", desc: "Evaluates machine learning architectures, loss functions, and benchmarks." },
  { id: "agent-098", num: "098", name: "Startup Builder AI Agent", category: "Business & Management", desc: "Coordinates product ideation, tech stacks, and rapid go-to-market execution." },
  { id: "agent-099", num: "099", name: "Multi-Agent Coordinator AI Agent", category: "Specialized AI", desc: "Coordinates inter-agent message passing and workflow handoffs." },
  { id: "agent-100", num: "100", name: "General Assistant AI Agent", category: "Automation & Productivity", desc: "Provides versatile assistance across tasks, inquiries, and workflows." },
  { id: "agent-101", num: "101", name: "Super AI Agent", category: "Orchestrator", desc: "The master AI agent that coordinates the specialist AI agents to solve complex tasks." }
];

console.log('Synchronizing 101 Super AI Agents taxonomy across registry...');

const sihMappingPath = path.join(ROOT, 'registry', 'sih-agent-mapping.json');
let sihAgents = JSON.parse(fs.readFileSync(sihMappingPath, 'utf8'));

const agentsJsonPath = path.join(ROOT, 'registry', 'agents.json');
let agentsJson = JSON.parse(fs.readFileSync(agentsJsonPath, 'utf8'));

AGENT_MAPPINGS.forEach(target => {
  const existingSih = sihAgents.find(a => a.agent_id === target.id || a.id === target.id);
  if (existingSih) {
    existingSih.name = target.name;
    existingSih.displayName = target.name;
    existingSih.displayNumber = target.num;
    existingSih.category = target.category;
    existingSih.domain = target.category;
    existingSih.description = target.desc;
  }

  const existingJson = agentsJson.agents.find(a => a.agent_id === target.id);
  if (existingJson) {
    existingJson.name = target.name;
    existingJson.displayName = target.name;
    existingJson.displayNumber = target.num;
    existingJson.category = target.category;
    existingJson.domain = target.category;
    existingJson.description = target.desc;
  }
});

fs.writeFileSync(sihMappingPath, JSON.stringify(sihAgents, null, 2), 'utf8');
fs.writeFileSync(agentsJsonPath, JSON.stringify(agentsJson, null, 2), 'utf8');

console.log('Successfully aligned 101 Super AI Agents taxonomy 1:1 with agent capabilities!');
