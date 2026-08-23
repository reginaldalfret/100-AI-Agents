/**
 * Script to update all 101 agents in sih-agent-mapping.json and agents.json
 * with 100% authentic, role-specific, capability-aligned descriptions, capabilities, and examples.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PROFILES = {
  "001": {
    name: "Writing AI Agent",
    category: "Writing & Communication",
    description: "Creates clear articles, formal essays, business proposals, and polished written content.",
    capabilities: ["Article Writing", "Content Polishing", "Style Enhancement", "Document Drafting"],
    tools: ["Text Formatter", "Style Linter", "Document Exporter"],
    examples: [
      "Write a professional article about renewable energy",
      "Draft an executive announcement letter for our team",
      "Improve and polish this draft for clarity and tone",
      "Write a persuasive proposal introduction for stakeholders"
    ]
  },
  "002": {
    name: "Email AI Agent",
    category: "Writing & Communication",
    description: "Drafts professional emails, executive notices, polite replies, and follow-ups.",
    capabilities: ["Email Composition", "Polite Reply Generation", "Tone Adaptation", "Follow-up Structuring"],
    tools: ["Email Formatter", "Subject Generator", "Template Manager"],
    examples: [
      "Write a professional email to my manager requesting a project review",
      "Draft a polite reply to this client addressing their concerns",
      "Make this email draft more concise and professional",
      "Write a follow-up email after an engineering sync"
    ]
  },
  "003": {
    name: "Study AI Agent",
    category: "Education & Learning",
    description: "Generates study plans, active recall guides, flashcards, and concept explanations.",
    capabilities: ["Study Plan Generation", "Concept Simplification", "Flashcard Creation", "Revision Coaching"],
    tools: ["Study Planner", "Flashcard Builder", "Concept Explainer"],
    examples: [
      "Create a 7-day study plan for my upcoming exams",
      "Explain this complex topic in simple terms with analogies",
      "Make flashcards and summary notes from this textbook chapter",
      "Help me revise this topic quickly before my test"
    ]
  },
  "004": {
    name: "Quiz AI Agent",
    category: "Education & Learning",
    description: "Creates interactive quizzes, multiple-choice tests, and knowledge assessments.",
    capabilities: ["Quiz Generation", "Assessment Design", "Answer Key Formulation", "Knowledge Testing"],
    tools: ["Quiz Builder", "Question Bank", "Score Calculator"],
    examples: [
      "Create a 10-question multiple-choice quiz on industrial safety",
      "Generate true/false questions with detailed explanations",
      "Build a practice test for beginner Python students",
      "Quiz my knowledge on heat exchanger operating principles"
    ]
  },
  "005": {
    name: "Summarization AI Agent",
    category: "Writing & Communication",
    description: "Condenses long documents, research reports, and transcripts into concise summaries.",
    capabilities: ["Document Summarization", "Key Takeaway Extraction", "Executive Briefing", "Bullet Synthesis"],
    tools: ["Text Condenser", "Keypoint Extractor", "Executive Formatter"],
    examples: [
      "Summarize this 10-page report into 5 key bullet points",
      "Generate an executive summary of this technical document",
      "Condense this meeting transcript into key decisions made",
      "Extract the core takeaways from this research paper"
    ]
  },
  "006": {
    name: "Grammar AI Agent",
    category: "Writing & Communication",
    description: "Checks grammar, syntax, punctuation, style, and tone consistency.",
    capabilities: ["Grammar Correction", "Punctuation Polishing", "Sentence Restructuring", "Readability Analysis"],
    tools: ["Grammar Linter", "Spell Checker", "Style Analyzer"],
    examples: [
      "Proofread this article and correct all grammatical errors",
      "Improve the sentence structure and punctuation in this draft",
      "Check this document for passive voice and style consistency",
      "Highlight spelling mistakes and suggest better vocabulary"
    ]
  },
  "007": {
    name: "Translation AI Agent",
    category: "Writing & Communication",
    description: "Translates text across multiple languages with context and terminology preservation.",
    capabilities: ["Multi-Language Translation", "Technical Term Preservation", "Contextual Localization", "Cultural Adaptation"],
    tools: ["Language Translator", "Glossary Matcher", "Localization Checker"],
    examples: [
      "Translate this technical SOP into Spanish accurately",
      "Translate this announcement into French, German, and Japanese",
      "Preserve engineering terminology while translating this manual",
      "Check this translated text for contextual and idiomatic accuracy"
    ]
  },
  "008": {
    name: "Idea Generation AI Agent",
    category: "Design & Creative",
    description: "Brainstorms creative concepts, product angles, and innovative problem solutions.",
    capabilities: ["Creative Ideation", "Product Concepting", "Lateral Thinking", "Innovation Frameworks"],
    tools: ["Idea Generator", "Concept Mapper", "Brainstorm Matrix"],
    examples: [
      "Brainstorm 10 innovative product ideas for renewable energy",
      "Generate creative marketing angles for our new platform",
      "Suggest novel solutions to reduce industrial equipment downtime",
      "Give me 5 unique angles for an industrial research project"
    ]
  },
  "009": {
    name: "Storytelling AI Agent",
    category: "Design & Creative",
    description: "Crafts engaging narrative arcs, scenarios, case studies, and storytelling.",
    capabilities: ["Narrative Crafting", "Case Study Writing", "Character & Scene Building", "Emotional Arc Structuring"],
    tools: ["Story Builder", "Narrative Formatter", "Scenario Generator"],
    examples: [
      "Write an engaging customer case study about solving outage risks",
      "Craft a compelling narrative around our team's engineering milestone",
      "Turn these technical achievements into an inspiring story",
      "Develop a scenario walkthrough for training new plant engineers"
    ]
  },
  "010": {
    name: "Goal Planning AI Agent",
    category: "Automation & Productivity",
    description: "Breaks objectives into SMART goals, milestones, and daily accountability tracking.",
    capabilities: ["SMART Goal Formulation", "Milestone Tracking", "OKR Structuring", "Action Planning"],
    tools: ["Goal Tracker", "Milestone Planner", "OKR Builder"],
    examples: [
      "Break this annual target into quarterly SMART goals",
      "Create a 30-60-90 day milestone plan for this project",
      "Structure my weekly priorities using an OKR framework",
      "Set up an accountability checklist for team deliverables"
    ]
  },
  "011": {
    name: "Note Taking AI Agent",
    category: "Automation & Productivity",
    description: "Organizes unstructured notes into clean Cornell, outline, and knowledge formats.",
    capabilities: ["Cornell Note Structuring", "Action Item Extraction", "Outline Generation", "Knowledge Tagging"],
    tools: ["Note Organizer", "Outline Formatter", "Tagging Engine"],
    examples: [
      "Format these rough meeting notes using the Cornell method",
      "Extract action items and key decisions from this discussion",
      "Organize these scattered thoughts into a structured outline",
      "Create a clean knowledge base entry from these bullet points"
    ]
  },
  "012": {
    name: "Task Management AI Agent",
    category: "Automation & Productivity",
    description: "Prioritizes daily to-do lists, backlog items, and urgency matrices.",
    capabilities: ["Eisenhower Matrix Prioritization", "Backlog Grooming", "Time Estimation", "Sprint Planning"],
    tools: ["Task Prioritizer", "Time Estimator", "Backlog Organizer"],
    examples: [
      "Prioritize my daily tasks using the Eisenhower Matrix",
      "Break down this complex deliverable into manageable sub-tasks",
      "Estimate task durations and create an optimal daily schedule",
      "Organize our sprint backlog by urgency and impact"
    ]
  },
  "013": {
    name: "Resume AI Agent",
    category: "Business & Management",
    description: "Tailors resumes, optimizes bullet points for ATS screening, and writes cover letters.",
    capabilities: ["ATS Optimization", "Resume Bullet Rewriting", "Cover Letter Drafting", "Skill Highlighting"],
    tools: ["ATS Scanner", "Resume Builder", "Keyword Optimizer"],
    examples: [
      "Optimize my resume bullet points for ATS screening",
      "Tailor my resume for a Senior Software Engineer position",
      "Rewrite my job experience using strong action verbs and metrics",
      "Draft a compelling cover letter highlighting my leadership skills"
    ]
  },
  "014": {
    name: "Job Matching AI Agent",
    category: "Business & Management",
    description: "Analyzes qualifications and aligns skillsets for career placement and job matching.",
    capabilities: ["Job Fit Analysis", "Skill Gap Identification", "Career Path Alignment", "Role Comparison"],
    tools: ["Skill Matcher", "Gap Analyzer", "Career Navigator"],
    examples: [
      "Analyze my skill set and identify matching job titles",
      "Compare my qualifications against this job description",
      "Find skill gaps I need to address for a Systems Architect role",
      "Recommend career paths based on my technical background"
    ]
  },
  "015": {
    name: "Interview AI Agent",
    category: "Business & Management",
    description: "Conducts mock interviews, behavioral coaching, and technical interview preparation.",
    capabilities: ["Mock Interview Simulation", "STAR Method Coaching", "Technical Question Generation", "Feedback Evaluation"],
    tools: ["Mock Interviewer", "STAR Evaluator", "Feedback Engine"],
    examples: [
      "Conduct a mock behavioral interview for an engineering lead role",
      "Ask me 5 technical questions on distributed systems",
      "Evaluate my answer to: 'Tell me about a time you resolved a conflict'",
      "Give me feedback on how to structure my answers using STAR method"
    ]
  },
  "016": {
    name: "Communication AI Agent",
    category: "Writing & Communication",
    description: "Polishes interpersonal messages, negotiation dialogue, and organizational memos.",
    capabilities: ["Interpersonal Messaging", "Constructive Feedback Polishing", "Negotiation Dialogue", "Memo Drafting"],
    tools: ["Communication Polisher", "Tone Checker", "Memo Formatter"],
    examples: [
      "Draft a constructive message to resolve a team disagreement",
      "Polish this feedback to be encouraging and actionable",
      "Write a clear inter-departmental memo about system maintenance",
      "Help me prepare talking points for an executive presentation"
    ]
  },
  "017": {
    name: "SWOT Analysis AI Agent",
    category: "Business & Management",
    description: "Conducts Strengths, Weaknesses, Opportunities, and Threats evaluations for business strategy.",
    capabilities: ["SWOT Matrix Generation", "Internal Capability Audit", "External Risk Assessment", "Strategic Synthesis"],
    tools: ["SWOT Analyzer", "Matrix Generator", "Strategy Evaluator"],
    examples: [
      "Perform a comprehensive SWOT analysis for our new software tool",
      "Identify external threats and internal weaknesses in this strategy",
      "Evaluate market opportunities for expanding our on-premise offering",
      "Create a SWOT matrix for upgrading our legacy infrastructure"
    ]
  },
  "018": {
    name: "Career Advisor AI Agent",
    category: "Business & Management",
    description: "Provides career roadmaps, promotion strategies, and skill acquisition plans.",
    capabilities: ["Career Roadmapping", "Promotion Strategy", "Skill Acquisition Planning", "Industry Transition Guidance"],
    tools: ["Career Planner", "Skill Matrix", "Roadmap Builder"],
    examples: [
      "Create a 3-year career development roadmap for transitioning to AI",
      "Suggest high-impact certifications for industrial automation",
      "How should I negotiate my promotion to Staff Engineer?",
      "Identify growth opportunities in on-premise enterprise software"
    ]
  },
  "019": {
    name: "Decision Making AI Agent",
    category: "Business & Management",
    description: "Applies decision trees, pros/cons weighting, and trade-off matrices for complex choices.",
    capabilities: ["Decision Matrix Formulation", "Pros & Cons Weighting", "Trade-Off Analysis", "Risk-Reward Evaluation"],
    tools: ["Decision Matrix", "Trade-Off Calculator", "Risk Model"],
    examples: [
      "Build a decision matrix comparing on-premise vs hybrid architectures",
      "Weigh the pros and cons of migrating to microservices",
      "Apply a risk-reward framework to this proposed timeline change",
      "Help me evaluate 3 competing vendor proposals objectively"
    ]
  },
  "020": {
    name: "Brainstorming AI Agent",
    category: "Design & Creative",
    description: "Facilitates divergent thinking, mind maps, and lateral brainstorms for teams.",
    capabilities: ["Divergent Thinking", "Mind Mapping", "Six Thinking Hats", "Feature Brainstorming"],
    tools: ["Mind Mapper", "Brainstorm Engine", "Creative Prompt Generator"],
    examples: [
      "Generate 20 divergent ideas to improve user retention",
      "Run a 'six thinking hats' exercise on this product pivot",
      "Brainstorm edge cases we might encounter in air-gapped deployments",
      "Create a mind map of feature ideas for industrial AI workflows"
    ]
  },
  "021": {
    name: "Web Research AI Agent",
    category: "Research & Knowledge",
    description: "Searches on-premise knowledge bases and synthesizes topical research findings.",
    capabilities: ["Technical Web Synthesis", "Topical Fact Finding", "Knowledge Aggregation", "Hardware & Spec Research"],
    tools: ["Knowledge Searcher", "Fact Aggregator", "Spec Analyzer"],
    examples: [
      "Synthesize research on state-of-the-art LLM quantization techniques",
      "Gather technical specifications on RTX 2050 CUDA capabilities",
      "Summarize best practices for local Ollama stream orchestration",
      "Compile key industry benchmarks for 4B parameter open-weight models"
    ]
  },
  "022": {
    name: "News Research AI Agent",
    category: "Research & Knowledge",
    description: "Curates and summarizes industry developments, tech news, and regulatory updates.",
    capabilities: ["Industry News Curation", "Trend Spotting", "Regulatory Tracking", "Event Summarization"],
    tools: ["News Aggregator", "Trend Tracker", "Briefing Generator"],
    examples: [
      "Summarize recent developments in open-source AI models",
      "Track trends in on-premise sovereign cloud regulations",
      "Compile news highlights on edge AI hardware advancements",
      "Curate industry news on industrial IoT safety compliance"
    ]
  },
  "023": {
    name: "Research Paper AI Agent",
    category: "Research & Knowledge",
    description: "Analyzes scientific papers, methodologies, mathematical formulations, and citations.",
    capabilities: ["Paper Breakdown", "Methodology Analysis", "Math & Formula Explanation", "Citation Tracing"],
    tools: ["Paper Parser", "Methodology Inspector", "Citation Extractor"],
    examples: [
      "Summarize the methodology and findings of this research paper",
      "Explain the mathematical formulation of this attention mechanism",
      "Extract benchmark results and comparison tables from this PDF",
      "Analyze the limitations and future work section of this study"
    ]
  },
  "024": {
    name: "Literature Review AI Agent",
    category: "Research & Knowledge",
    description: "Synthesizes multi-source academic literature, themes, and historical trends.",
    capabilities: ["Thematic Synthesis", "Literature Mapping", "Consensus & Debate Tracking", "Bibliography Building"],
    tools: ["Lit Mapper", "Theme Extractor", "Bibliography Builder"],
    examples: [
      "Synthesize academic literature on multi-agent consensus protocols",
      "Map the evolution of local token streaming architectures",
      "Identify key authors and seminal papers in prompt distillation",
      "Write a thematic literature review on industrial predictive maintenance"
    ]
  },
  "025": {
    name: "Book Research AI Agent",
    category: "Research & Knowledge",
    description: "Extracts key chapter takeaways, book mental models, and structured reading notes.",
    capabilities: ["Chapter Summarization", "Mental Model Extraction", "Actionable Takeaway Indexing", "Book Outline Creation"],
    tools: ["Book Summarizer", "Mental Model Indexer", "Note Formatter"],
    examples: [
      "Summarize the core mental models from 'Thinking in Systems'",
      "Extract key management principles from 'High Output Management'",
      "Create chapter-by-chapter reading notes for 'Designing Data-Intensive Applications'",
      "Highlight actionable takeaways from 'Clean Architecture'"
    ]
  },
  "026": {
    name: "Company Research AI Agent",
    category: "Business & Management",
    description: "Profiles enterprise organizations, operational divisions, and technology landscapes.",
    capabilities: ["Company Profiling", "Operational Division Mapping", "Corporate Governance Analysis", "Technology Modernization Audit"],
    tools: ["Company Profiler", "Org Chart Mapper", "Division Analyzer"],
    examples: [
      "Profile the organizational structure and core business of MRPL",
      "Analyze the key operational divisions in petroleum refining",
      "Summarize corporate governance and safety mandates for industrial plants",
      "Compile a company overview focusing on technology modernization"
    ]
  },
  "027": {
    name: "Competitor Research AI Agent",
    category: "Business & Management",
    description: "Analyzes competitor positioning, feature parity, and market differentiation.",
    capabilities: ["Feature Parity Matrix", "Competitor SWOT", "Pricing & Privacy Model Comparison", "Moat Evaluation"],
    tools: ["Feature Matrix Builder", "Competitor Tracker", "Differentiation Analyzer"],
    examples: [
      "Analyze feature parity between local AI workbenches",
      "Create a competitive landscape matrix for on-premise LLM tools",
      "Identify unique differentiators of our 101 AI Agent fleet",
      "Compare privacy and air-gap guarantees across enterprise platforms"
    ]
  },
  "028": {
    name: "Market Research AI Agent",
    category: "Business & Management",
    description: "Evaluates target demographics, TAM/SAM sizing, and market adoption forces.",
    capabilities: ["TAM/SAM Sizing", "Market Trend Forecasting", "Adoption Barrier Analysis", "Sector Demand Profiling"],
    tools: ["Market Sizer", "Trend Forecaster", "Demand Analyzer"],
    examples: [
      "Analyze market demand for air-gapped sovereign AI in manufacturing",
      "Estimate TAM and SAM for local enterprise AI deployments",
      "Identify key customer adoption hurdles for local LLM hardware",
      "Compile demographic and sector demand trends for privacy-first AI"
    ]
  },
  "029": {
    name: "Startup Research AI Agent",
    category: "Business & Management",
    description: "Assesses startup pitch viability, unit economics, business models, and launch risks.",
    capabilities: ["Lean Canvas Audit", "Unit Economics Modeling", "GTM Strategy Assessment", "Moat & Defensibility Analysis"],
    tools: ["Pitch Evaluator", "Economics Modeler", "Risk Assessment Tool"],
    examples: [
      "Evaluate the unit economics and viability of this SaaS idea",
      "Analyze customer acquisition channels for developer tooling",
      "Review this lean canvas for potential market risks",
      "Assess the defensibility and moat of an on-premise AI platform"
    ]
  },
  "030": {
    name: "Investment Research AI Agent",
    category: "Business & Management",
    description: "Evaluates investment criteria, capital expenditures, payback periods, and ROI metrics.",
    capabilities: ["ROI Modeling", "CAPEX vs OPEX Comparison", "Payback Period Calculation", "Risk-Adjusted Return Analysis"],
    tools: ["ROI Calculator", "CAPEX Analyzer", "Payback Modeler"],
    examples: [
      "Calculate the expected ROI for upgrading plant server hardware",
      "Evaluate capital expenditure vs operational savings for local AI",
      "Analyze risk-adjusted return metrics for automation projects",
      "Build a payback period model for automated inspection reporting"
    ]
  },
  "031": {
    name: "Product Research AI Agent",
    category: "Business & Management",
    description: "Analyzes product specifications, user stories, feature trade-offs, and acceptance criteria.",
    capabilities: ["User Story Formulation", "Acceptance Criteria Definition", "Feature Trade-Off Modeling", "UX Specification"],
    tools: ["Story Builder", "Acceptance Linter", "Spec Analyzer"],
    examples: [
      "Compare user experience specifications between chat interfaces",
      "Analyze product telemetry to identify drop-off in agent selection",
      "Define user stories and acceptance criteria for token streaming",
      "Evaluate feature tradeoffs between latency and model accuracy"
    ]
  },
  "032": {
    name: "Travel Research AI Agent",
    category: "Automation & Productivity",
    description: "Plans travel itineraries, logistics checklists, schedules, and expense budgets.",
    capabilities: ["Itinerary Planning", "Logistics Checklisting", "Route Optimization", "Expense Estimation"],
    tools: ["Itinerary Builder", "Logistics Planner", "Expense Calculator"],
    examples: [
      "Plan a detailed 3-day itinerary for an engineering site visit",
      "Create a logistics checklist for international conference travel",
      "Recommend optimal transit routes and lodging near the plant",
      "Draft a travel expense budget and per diem estimate"
    ]
  },
  "033": {
    name: "Restaurant Research AI Agent",
    category: "Automation & Productivity",
    description: "Recommends catering, dining venues, business meals, and dietary accommodations.",
    capabilities: ["Venue Recommendation", "Catering Planning", "Dietary Accommodation Check", "Business Dining Selection"],
    tools: ["Venue Finder", "Menu Planner", "Dietary Checker"],
    examples: [
      "Find top-rated dining venues for an executive team dinner",
      "Suggest catering menus with dietary accommodations for 50 people",
      "Recommend business lunch locations with quiet meeting spaces",
      "Curate dining options near the industrial complex"
    ]
  },
  "034": {
    name: "Course Research AI Agent",
    category: "Education & Learning",
    description: "Curates training courses, technical roadmaps, learning syllabi, and certifications.",
    capabilities: ["Curriculum Design", "Certification Comparison", "Syllabus Structuring", "Learning Roadmap Building"],
    tools: ["Curriculum Builder", "Course Finder", "Syllabus Formatter"],
    examples: [
      "Create a structured curriculum for mastering Prompt Engineering",
      "Recommend the best courses for learning PyTorch and CUDA programming",
      "Build an 8-week syllabus for Industrial IoT and sensor analytics",
      "Compare online certification programs for Systems Architecture"
    ]
  },
  "035": {
    name: "College Research AI Agent",
    category: "Education & Learning",
    description: "Researches academic programs, admission requirements, prerequisites, and university rankings.",
    capabilities: ["University Program Comparison", "Prerequisite Auditing", "Tuition & Ranking Analysis", "Admission Requirement Check"],
    tools: ["Program Finder", "Prerequisite Checker", "Ranking Analyzer"],
    examples: [
      "Research top graduate programs in AI and Autonomous Systems",
      "Compare admission requirements and tuition for engineering colleges",
      "Identify universities with strong research labs in edge computing",
      "Compile prerequisite course lists for computer science degrees"
    ]
  },
  "036": {
    name: "GitHub Research AI Agent",
    category: "Coding & Development",
    description: "Analyzes open-source repositories, commit velocity, dependencies, and license compliance.",
    capabilities: ["Repo Architecture Analysis", "License Compliance Audit", "Dependency Graphing", "Activity & Star Velocity Tracking"],
    tools: ["Repo Inspector", "License Auditor", "Dependency Grapher"],
    examples: [
      "Analyze the repository architecture and license of this open-source project",
      "Check star velocity, commit activity, and active maintainers",
      "Compare dependency graphs between two competing npm libraries",
      "Review open issues and PR turnaround times on this repository"
    ]
  },
  "037": {
    name: "Document Research AI Agent",
    category: "Research & Knowledge",
    description: "Searches through PDF/Word archives for targeted clauses, standards, and technical sections.",
    capabilities: ["Archive Search", "Clause Extraction", "Technical Section Lookup", "SOP Cross-Referencing"],
    tools: ["Archive Searcher", "Clause Finder", "SOP Matcher"],
    examples: [
      "Search through these SOP documents for emergency shutdown protocols",
      "Find all references to valve maintenance in the technical manual",
      "Extract clauses relating to warranty and liability from this agreement",
      "Locate ultrasonic thickness testing guidelines across archival PDFs"
    ]
  },
  "038": {
    name: "Fact Checking AI Agent",
    category: "Research & Knowledge",
    description: "Cross-references claims against verified local datasets, engineering standards, and documents.",
    capabilities: ["Numerical Claim Verification", "Standard Compliance Check", "Evidence Grounding", "Assertion Auditing"],
    tools: ["Fact Verifier", "Standard Validator", "Assertion Auditor"],
    examples: [
      "Verify this numerical claim against the provided baseline dataset",
      "Cross-reference these inspection figures with historical logs",
      "Check whether this technical statement complies with ASME standards",
      "Identify unverified assertions or conflicting numbers in this brief"
    ]
  },
  "039": {
    name: "Source Verification AI Agent",
    category: "Research & Knowledge",
    description: "Validates provenance, author authority, inspection timestamps, and source reliability.",
    capabilities: ["Provenance Validation", "Metadata Tampering Check", "Author Authority Verification", "Citation Grounding"],
    tools: ["Provenance Checker", "Metadata Validator", "Citation Inspector"],
    examples: [
      "Validate the provenance and timestamp of this NDT inspection record",
      "Verify the author authority and certification level on this document",
      "Check if this citation maps to an official engineering handbook",
      "Inspect document metadata for tampering or mismatched revisions"
    ]
  },
  "040": {
    name: "Research Assistant AI Agent",
    category: "Research & Knowledge",
    description: "Coordinates end-to-end background investigations, literature collation, and briefing packs.",
    capabilities: ["Dossier Compilation", "Background Investigation", "Multi-Thread Synthesis", "Reference Collation"],
    tools: ["Dossier Builder", "Briefing Formatter", "Reference Collation Engine"],
    examples: [
      "Compile a comprehensive research dossier on industrial heat exchangers",
      "Gather background data, historical context, and technical diagrams",
      "Synthesize multiple research threads into an executive briefing",
      "Organize reference links, citations, and summaries for a whitepaper"
    ]
  },
  "041": {
    name: "Email Management AI Agent",
    category: "Automation & Productivity",
    description: "Organizes inbox rules, auto-triage filters, canned responses, and email workflows.",
    capabilities: ["Inbox Triage Rules", "Canned Response Generation", "Email Categorization", "Priority Filtering"],
    tools: ["Triage Engine", "Template Manager", "Inbox Rule Builder"],
    examples: [
      "Create automated email triage rules for urgent equipment alerts",
      "Draft templated responses for common customer inquiries",
      "Organize inbox folder structures for project communications",
      "Summarize unread high-priority emails from this morning"
    ]
  },
  "042": {
    name: "Calendar Management AI Agent",
    category: "Automation & Productivity",
    description: "Resolves scheduling conflicts, coordinates time blocks, and prepares meeting agendas.",
    capabilities: ["Conflict Resolution", "Timezone Coordination", "Agenda Timeboxing", "Recurring Event Setup"],
    tools: ["Calendar Scheduler", "Timezone Converter", "Agenda Planner"],
    examples: [
      "Resolve schedule overlaps between team sprint reviews",
      "Propose optimal meeting times across different time zones",
      "Create structured meeting agendas with allotted time blocks",
      "Set up recurring reminders for weekly status check-ins"
    ]
  },
  "043": {
    name: "Task Automation AI Agent",
    category: "Automation & Productivity",
    description: "Automates repetitive workflows, recurring cron jobs, data pipelines, and alert triggers.",
    capabilities: ["Cron Job Authoring", "Pipeline Automation", "Log Parsing & Alerting", "Scratch File Cleanup"],
    tools: ["Cron Scheduler", "Pipeline Builder", "Alert Trigger"],
    examples: [
      "Write a script to automate recurring data exports every morning",
      "Automate log parsing and alert triggers for system failures",
      "Create a cron job schedule to clean temporary scratch files",
      "Build an automated workflow to notify admins on threshold breaches"
    ]
  },
  "044": {
    name: "File Organization AI Agent",
    category: "Automation & Productivity",
    description: "Organizes folder structures, naming conventions, duplicate purging, and file archiving.",
    capabilities: ["Folder Hierarchy Design", "Naming Convention Standardization", "Duplicate Detection", "Archive Organization"],
    tools: ["File Organizer", "Duplicate Finder", "Hierarchy Builder"],
    examples: [
      "Design a standardized file naming convention for inspection reports",
      "Organize nested project folders by year, quarter, and equipment ID",
      "Identify duplicate and outdated files in this archive directory",
      "Create a clean folder hierarchy for multi-agent deliverables"
    ]
  },
  "045": {
    name: "PDF Processing AI Agent",
    category: "Automation & Productivity",
    description: "Parses PDF layouts, extracts tables to CSV, merges documents, and handles forms.",
    capabilities: ["Table Extraction to CSV", "Form Field Parsing", "PDF Merging & Splitting", "Diagram Extraction"],
    tools: ["PDF Table Extractor", "PDF Merger", "Form Parser"],
    examples: [
      "Extract all tables from this PDF report into CSV format",
      "Parse form fields and metadata from scanned inspection PDFs",
      "Merge these three technical appendices into a single document",
      "Extract high-resolution embedded diagrams from this PDF"
    ]
  },
  "046": {
    name: "Invoice Processing AI Agent",
    category: "Business & Management",
    description: "Extracts invoice line items, dates, vendor details, totals, and PO matching.",
    capabilities: ["Line Item Extraction", "PO Matching", "Tax & Total Validation", "Ledger Export"],
    tools: ["Invoice Parser", "PO Matcher", "Ledger Exporter"],
    examples: [
      "Extract invoice number, line items, tax, and total due from this invoice",
      "Match invoice line items against the purchase order record",
      "Validate vendor tax ID and bank details on this billing document",
      "Export structured invoice data into an accounting ledger format"
    ]
  },
  "047": {
    name: "Spreadsheet AI Agent",
    category: "Data & Analytics",
    description: "Creates Excel/CSV formulas, financial models, pivot tables, and data cleaning routines.",
    capabilities: ["Advanced Formula Writing", "Pivot Table Setup", "Financial Modeling", "Data Deduplication"],
    tools: ["Formula Generator", "Pivot Builder", "Data Cleaner"],
    examples: [
      "Write a dynamic XLOOKUP formula to merge customer and order tables",
      "Create an Excel financial model with conditional formatting",
      "Build a pivot table summary showing monthly expenditure by department",
      "Clean messy column data and remove duplicate rows in this CSV"
    ]
  },
  "048": {
    name: "Data Analysis AI Agent",
    category: "Data & Analytics",
    description: "Analyzes datasets, identifies correlations, computes statistics, and surfaces actionable trends.",
    capabilities: ["Statistical Analysis", "Anomaly Detection", "Trend & Pattern Discovery", "Correlation Modeling"],
    tools: ["Statistics Engine", "Anomaly Detector", "Trend Modeler"],
    examples: [
      "Analyze this CSV dataset for correlations, trends, and anomalies",
      "Identify the top 5 drivers of equipment downtime from these logs",
      "Calculate statistical distributions, percentiles, and standard deviation",
      "Generate actionable insights and summary charts from this data"
    ]
  },
  "049": {
    name: "Report Generation AI Agent",
    category: "Data & Analytics",
    description: "Generates formatted business, engineering, and operational reports (.docx / PDF).",
    capabilities: ["DOCX Report Generation", "Executive Summarization", "Chart Integration", "Deliverable Packaging"],
    tools: ["DOCX Builder", "Chart Formatter", "Report Packager"],
    examples: [
      "Generate an official inspection report with risk ratings and charts",
      "Create a quarterly operational performance report for management",
      "Format this analysis into a clean Word document (.docx)",
      "Compile project milestones, budget tracking, and deliverables into a PDF"
    ]
  },
  "050": {
    name: "Presentation AI Agent",
    category: "Design & Creative",
    description: "Structures presentation slide decks, visual outlines, speaker notes, and pitch decks.",
    capabilities: ["PPTX Slide Deck Building", "Speaker Note Drafting", "Presentation Outlining", "Visual Hierarchy Design"],
    tools: ["PPTX Builder", "Speaker Note Generator", "Outline Designer"],
    examples: [
      "Create a 10-slide PowerPoint presentation outline for this project",
      "Draft executive speaker notes for each slide in this deck",
      "Turn this technical report into a visually engaging slide deck (.pptx)",
      "Structure a pitch deck covering problem, solution, market, and team"
    ]
  },
  "051": {
    name: "Image Analysis AI Agent",
    category: "Specialized AI",
    description: "Analyzes photos, technical drawings, surface defects, and visual features via Gemma 3 Vision.",
    capabilities: ["Surface Defect Detection", "Component Identification", "OCR from Photos", "Before/After Comparison"],
    tools: ["Vision Engine", "OCR Tool", "Image Inspector"],
    examples: [
      "Analyze this equipment photo for visible surface corrosion and cracks",
      "Detect and label industrial components in this technical image",
      "Extract text and serial numbers from this equipment nameplate photo",
      "Compare before and after maintenance photos to verify repairs"
    ]
  },
  "052": {
    name: "Video Analysis AI Agent",
    category: "Specialized AI",
    description: "Analyzes video scenes, timestamps, safety compliance, and activity event logs.",
    capabilities: ["Scene Timestamping", "Safety Compliance Verification", "Anomaly Movement Detection", "Video Action Logging"],
    tools: ["Video Analyzer", "Timestamp Logger", "Compliance Inspector"],
    examples: [
      "Summarize key events and timestamps in this surveillance video",
      "Detect safety equipment compliance (helmets, vests) in this video",
      "Identify machinery anomalies or erratic movements in this clip",
      "Generate a text log of actions observed across video frames"
    ]
  },
  "053": {
    name: "Meeting Assistant AI Agent",
    category: "Writing & Communication",
    description: "Prepares meeting agendas, transcribes key discussion points, and tracks action item owners.",
    capabilities: ["Meeting Minutes Generation", "Agenda Formulation", "Decision Tracking", "Action Item Assignment"],
    tools: ["Minutes Builder", "Agenda Formatter", "Action Tracker"],
    examples: [
      "Generate structured meeting minutes and action item assignments",
      "Draft a clear meeting agenda with objectives and discussion topics",
      "Summarize key decisions made during this engineering sync",
      "Send automated follow-up messages to owners of assigned action items"
    ]
  },
  "054": {
    name: "Voice Assistant AI Agent",
    category: "Specialized AI",
    description: "Formats voice assistant responses, natural conversational pacing, and SSML audio markup.",
    capabilities: ["SSML Audio Markup", "Conversational Text Optimization", "Hands-Free Command Trees", "Audio Summarization"],
    tools: ["SSML Formatter", "Audio Optimizer", "Command Tree Builder"],
    examples: [
      "Format text responses for natural, concise voice synthesizer readout",
      "Convert complex tables into conversational audio summaries",
      "Generate SSML markup with appropriate pacing and pauses",
      "Design interactive voice command trees for hands-free plant use"
    ]
  },
  "055": {
    name: "Code Review AI Agent",
    category: "Coding & Development",
    description: "Reviews pull requests, analyzes code quality, security, and SOLID design adherence.",
    capabilities: ["PR Diff Review", "Concurrency & Race Condition Detection", "SOLID Principles Check", "Style & Cleanliness Audit"],
    tools: ["PR Reviewer", "Concurrency Analyzer", "Style Linter"],
    examples: [
      "Review this pull request for bugs, security risks, and code smells",
      "Check this code for concurrency issues and race conditions",
      "Suggest performance and readability improvements for this module",
      "Verify that this PR adheres to SOLID design principles"
    ]
  },
  "056": {
    name: "Debugging AI Agent",
    category: "Coding & Development",
    description: "Identifies bugs, analyzes error stack traces, and provides minimal, safe fixes.",
    capabilities: ["Stack Trace Analysis", "Memory Leak Diagnosis", "Async Error Fixing", "Root Cause Identification"],
    tools: ["Stack Trace Debugger", "Memory Inspector", "Patch Generator"],
    examples: [
      "Find the root cause of this stack trace and runtime crash",
      "Debug why this async Promise is rejecting unexpectedly",
      "Fix the off-by-one error in this array partitioning function",
      "Explain why this memory leak occurs and provide a safe fix"
    ]
  },
  "057": {
    name: "Test Generation AI Agent",
    category: "Specialized AI",
    description: "Generates unit tests, integration test suites, parameter fixtures, and assertions.",
    capabilities: ["Unit Test Generation", "Integration Test Suite Design", "Mock & Fixture Creation", "Edge Case Assertion"],
    tools: ["Test Generator", "Fixture Builder", "Mock Engine"],
    examples: [
      "Generate comprehensive unit tests with edge cases in Node.js test runner",
      "Write integration tests for this REST endpoint with mock data",
      "Generate parameterized property-based tests for this algorithm",
      "Create mock fixtures and assertions for error scenarios"
    ]
  },
  "058": {
    name: "Documentation AI Agent",
    category: "Writing & Communication",
    description: "Writes comprehensive software documentation, READMEs, architecture guides, and wikis.",
    capabilities: ["README.md Authoring", "API Documentation", "Architecture Guides", "JSDoc / Docstring Generation"],
    tools: ["Markdown Formatter", "Docstring Generator", "Architecture Documenter"],
    examples: [
      "Write complete Markdown API documentation with code examples",
      "Create a comprehensive README.md with setup and usage instructions",
      "Document this architecture with module descriptions and data flow",
      "Generate JSDoc / docstring comments for all exported functions"
    ]
  },
  "059": {
    name: "Workflow Automation AI Agent",
    category: "Automation & Productivity",
    description: "Builds multi-step automated workflows, escalation approvals, and event-driven triggers.",
    capabilities: ["Multi-Step Workflow Design", "Approval Escalation Modeling", "Event Trigger Setup", "Pipeline Orchestration"],
    tools: ["Workflow Designer", "Escalation Modeler", "Event Connector"],
    examples: [
      "Design an automated approval workflow with escalation timeouts",
      "Build an event-driven automation trigger for sensor threshold alerts",
      "Connect document upload to automated OCR and database indexing",
      "Map out a multi-stage data processing pipeline"
    ]
  },
  "060": {
    name: "Personal Assistant AI Agent",
    category: "Automation & Productivity",
    description: "Coordinates daily tasks, drafts quick replies, tracks deadlines, and provides morning briefings.",
    capabilities: ["Daily Schedule Coordination", "Priority Reminders", "Quick Reply Drafting", "Morning Briefing Compilation"],
    tools: ["Assistant Coordinator", "Reminder Engine", "Briefing Generator"],
    examples: [
      "Organize my schedule, tasks, and priorities for the day",
      "Draft quick replies to pending messages and inquiries",
      "Track my ongoing projects and remind me of upcoming deadlines",
      "Prepare a daily morning briefing with key news and calendar items"
    ]
  },
  "061": {
    name: "Code Generation AI Agent",
    category: "Coding & Development",
    description: "Writes clean code, implements algorithms, interfaces, and backend services via Qwen Coder.",
    capabilities: ["Algorithm Implementation", "TypeScript Interface Generation", "CRUD Service Authoring", "Worker Queue Design"],
    tools: ["Code Synthesizer", "Interface Generator", "CRUD Builder"],
    examples: [
      "Write a clean Python class implementing an LRU cache with tests",
      "Generate a TypeScript interface and parser for this JSON schema",
      "Implement a thread-safe worker queue in Node.js",
      "Write a complete CRUD service with input validation"
    ]
  },
  "062": {
    name: "Software Architecture AI Agent",
    category: "Coding & Development",
    description: "Architects scalable microservices, bounded contexts, C4 diagrams, and event systems.",
    capabilities: ["Microservice Architecture", "Domain-Driven Design", "Message Queue Selection", "C4 Diagram Modeling"],
    tools: ["Architecture Modeler", "Domain Mapper", "C4 Diagrammer"],
    examples: [
      "Design a fault-tolerant microservices architecture for IoT telemetry",
      "Define bounded contexts and domain models for our platform",
      "Evaluate message queue architectures (RabbitMQ vs Kafka vs Redis)",
      "Create a C4 architecture diagram model for the Sovereign Workbench"
    ]
  },
  "063": {
    name: "Codebase Analysis AI Agent",
    category: "Coding & Development",
    description: "Analyzes codebase structure, module coupling, dead code, and cyclomatic complexity.",
    capabilities: ["Circular Dependency Audit", "Dead Code Identification", "Cyclomatic Complexity Calculation", "Dependency Graphing"],
    tools: ["Complexity Analyzer", "Dependency Grapher", "Dead Code Finder"],
    examples: [
      "Analyze circular dependencies and modular coupling in this repository",
      "Identify dead code, unused exports, and duplicate utilities",
      "Calculate cyclomatic complexity and maintainability index across files",
      "Generate a dependency graph of all platform backend modules"
    ]
  },
  "064": {
    name: "Bug Hunting AI Agent",
    category: "Coding & Development",
    description: "Performs deep static analysis to find edge-case software defects, overflows, and leaks.",
    capabilities: ["Static Defect Detection", "Auth Middleware Edge Cases", "Overflow & Precision Auditing", "Resource Leak Hunting"],
    tools: ["Static Analyzer", "Edge Case Inspector", "Leak Hunter"],
    examples: [
      "Perform static analysis to find potential null pointer exceptions",
      "Hunt for unhandled edge cases in this authentication middleware",
      "Identify potential integer overflow or precision loss in calculations",
      "Detect resource leaks and unclosed file handles in this codebase"
    ]
  },
  "065": {
    name: "Performance Optimization AI Agent",
    category: "Coding & Development",
    description: "Profiles CPU/memory bottlenecks, optimizes SQL queries, caching, and bundle size.",
    capabilities: ["SQL Query Optimization", "Memory Profiling", "Memoization & Caching", "Bundle Size Reduction"],
    tools: ["Query Optimizer", "Profiler Engine", "Cache Designer"],
    examples: [
      "Optimize this SQL query to reduce execution time and table scans",
      "Profile and reduce memory consumption in this streaming pipeline",
      "Implement memoization and caching for expensive compute functions",
      "Reduce frontend bundle size and optimize DOM re-rendering"
    ]
  },
  "066": {
    name: "Security Audit AI Agent",
    category: "Security & Systems",
    description: "Audits source code and systems for vulnerabilities, OWASP compliance, and crypto safety.",
    capabilities: ["OWASP Top 10 Audit", "Injection & XSS Prevention", "Cryptographic Review", "Input Validation Check"],
    tools: ["Security Scanner", "Vulnerability Auditor", "Crypto Inspector"],
    examples: [
      "Audit this API endpoint for OWASP Top 10 vulnerabilities",
      "Check this code for SQL injection, XSS, and CSRF vulnerabilities",
      "Review cryptographic implementation and key management practices",
      "Perform a static security analysis on all input validation layers"
    ]
  },
  "067": {
    name: "Test Engineer AI Agent",
    category: "Specialized AI",
    description: "Designs end-to-end regression suites, test coverage matrices, and load testing plans.",
    capabilities: ["E2E Test Strategy", "Streaming UI Test Scenarios", "Load & Concurrency Testing", "Coverage Matrix Planning"],
    tools: ["Test Planner", "Load Tester", "Coverage Analyzer"],
    examples: [
      "Design an end-to-end regression test strategy for our AI workbench",
      "Build automated UI test scenarios for streaming responses",
      "Create load testing scripts to measure throughput under concurrency",
      "Establish a test coverage matrix across all platform endpoints"
    ]
  },
  "068": {
    name: "Dependency Analysis AI Agent",
    category: "Coding & Development",
    description: "Audits package dependencies, vulnerabilities, licenses, and upgrade paths.",
    capabilities: ["Vulnerability Auditing", "License Compliance Check", "Upgrade Path Recommendation", "Conflict Resolution"],
    tools: ["Dependency Auditor", "License Checker", "Version Resolver"],
    examples: [
      "Audit package.json for outdated or vulnerable dependencies",
      "Identify supply chain risks and restrictive third-party licenses",
      "Recommend safe upgrade paths for core platform packages",
      "Detect transitive dependency conflicts in this project"
    ]
  },
  "069": {
    name: "API Documentation AI Agent",
    category: "Coding & Development",
    description: "Generates OpenAPI specifications, endpoint contracts, curl examples, and SSE stream docs.",
    capabilities: ["OpenAPI 3.0 Authoring", "Payload Schema Documentation", "SSE Stream Contract Design", "curl / Postman Examples"],
    tools: ["OpenAPI Generator", "Payload Documenter", "curl Formatter"],
    examples: [
      "Generate an OpenAPI 3.0 YAML specification for our gateway endpoints",
      "Write clear request and response payload examples for /api/chat",
      "Document SSE event streams, headers, and error codes",
      "Create interactive Postman / curl examples for our REST API"
    ]
  },
  "070": {
    name: "Code Refactoring AI Agent",
    category: "Coding & Development",
    description: "Refactors complex code into clean, modular, and maintainable patterns.",
    capabilities: ["Modular Decomposition", "Async/Await Modernization", "Duplicate Logic Extraction", "Readability Improvement"],
    tools: ["Code Refactorer", "Pattern Modernizer", "Module Extractor"],
    examples: [
      "Refactor this 500-line monolithic function into clean, modular helpers",
      "Convert this callback-based code to modern async/await syntax",
      "Extract duplicated business logic into a shared utility service",
      "Improve variable naming and eliminate deep nesting in this module"
    ]
  },
  "071": {
    name: "Database AI Agent",
    category: "Data & Analytics",
    description: "Designs database schemas, SQL queries, indexes, and partition migrations.",
    capabilities: ["Schema Normalization", "Window Function SQL", "Index Strategy Design", "Partition Migration Scripting"],
    tools: ["Schema Designer", "Query Builder", "Index Optimizer"],
    examples: [
      "Design a normalized PostgreSQL schema for industrial maintenance logs",
      "Write an optimized SQL query with window functions for trend analysis",
      "Create indexes and analyze query execution plans for slow queries",
      "Write a migration script to add partitioned tables for time-series data"
    ]
  },
  "072": {
    name: "DevOps AI Agent",
    category: "Security & Systems",
    description: "Configures Docker containers, deployment scripts, environment variables, and boot triggers.",
    capabilities: ["Docker Stack Configuration", "Container Health Checking", "Environment Variable Management", "Boot Initialization Scripting"],
    tools: ["DevOps Configurator", "Health Checker", "Init Script Builder"],
    examples: [
      "Write a Dockerfile and docker-compose.yml for running our AI stack",
      "Configure automated health checks and restart policies for containers",
      "Set up environment variable management for production deployment",
      "Create shell scripts to initialize local Ollama models on system boot"
    ]
  },
  "073": {
    name: "Docker AI Agent",
    category: "Security & Systems",
    description: "Authors multi-stage Dockerfiles, compose files, layer caches, and volume mounts.",
    capabilities: ["Multi-Stage Dockerfiles", "Layer Cache Optimization", "Non-Root User Security", "Volume Mount Configuration"],
    tools: ["Dockerfile Builder", "Layer Optimizer", "Compose Formatter"],
    examples: [
      "Create a lightweight multi-stage Dockerfile for our Node.js gateway",
      "Optimize Docker layer caching to speed up build times",
      "Configure non-root user security permissions in the container",
      "Set up Docker volume mounts for persistent conversation storage"
    ]
  },
  "074": {
    name: "CI/CD AI Agent",
    category: "Security & Systems",
    description: "Configures GitHub Actions, automated test runs, security gates, and release pipelines.",
    capabilities: ["GitHub Actions Workflows", "Automated Lint & Test Gates", "Semantic Versioning", "Air-Gap Release Verification"],
    tools: ["Workflow Author", "CI Pipeline Builder", "Changelog Generator"],
    examples: [
      "Build a GitHub Actions workflow to run test suites on every pull request",
      "Configure automated linting, unit tests, and security scans in CI",
      "Set up automated semantic versioning and changelog generation",
      "Create a deployment pipeline that verifies zero egress before release"
    ]
  },
  "075": {
    name: "Full-Stack Developer AI Agent",
    category: "Coding & Development",
    description: "Builds full-stack features connecting frontend UI components to backend gateway APIs.",
    capabilities: ["End-to-End Feature Development", "Optimistic UI Updates", "SVG & CSS Visualizations", "SSE Stream Integration"],
    tools: ["Full-Stack Synthesizer", "SSE Integrator", "UI Widget Builder"],
    examples: [
      "Build a complete feature connecting the frontend UI to gateway endpoints",
      "Implement optimistic UI updates with error rollback for chat actions",
      "Create a responsive data visualization widget using SVG and CSS",
      "Integrate real-time Server-Sent Events into a liquid-glass chat view"
    ]
  },
  "076": {
    name: "Sales AI Agent",
    category: "Business & Management",
    description: "Drafts sales pitches, objection handling scripts, outreach emails, and ROI comparisons.",
    capabilities: ["B2B Pitch Drafting", "Objection Handling", "Outreach Personalization", "ROI Presentation"],
    tools: ["Pitch Builder", "Objection Handler", "Outreach Formatter"],
    examples: [
      "Draft a compelling B2B sales pitch for our Sovereign AI Workbench",
      "Write objection handling scripts for enterprise security concerns",
      "Create customized outreach emails for industrial plant managers",
      "Highlight ROI and cost savings of on-premise AI vs cloud subscriptions"
    ]
  },
  "077": {
    name: "Lead Generation AI Agent",
    category: "Business & Management",
    description: "Identifies ideal prospect profiles, lead criteria, outreach strategies, and account targets.",
    capabilities: ["ICP Definition", "Account Target Identification", "CTO Outreach Tailoring", "Lead Criteria Formulation"],
    tools: ["ICP Modeler", "Account Prospector", "Lead Scorer"],
    examples: [
      "Define ideal customer profiles (ICP) for on-premise AI software",
      "Identify prospective enterprise accounts in refining and manufacturing",
      "Create targeted outreach messaging tailored for Chief Technology Officers",
      "Compile lead generation criteria based on compliance and security needs"
    ]
  },
  "078": {
    name: "Lead Qualification AI Agent",
    category: "Business & Management",
    description: "Scores leads using BANT / MEDDIC frameworks, readiness assessments, and hardware checks.",
    capabilities: ["BANT Scoring", "Hardware Readiness Check", "Qualification Scorecards", "Decision Maker Mapping"],
    tools: ["BANT Evaluator", "Scorecard Builder", "Readiness Checker"],
    examples: [
      "Qualify incoming leads using the BANT (Budget, Authority, Need, Timeline) framework",
      "Score prospect readiness for deploying on-premise AI infrastructure",
      "Assess technical prerequisites (GPU hardware, system RAM) for prospective clients",
      "Generate a qualification scorecard for enterprise opportunities"
    ]
  },
  "079": {
    name: "Customer Support AI Agent",
    category: "Writing & Communication",
    description: "Drafts empathetic customer support replies, troubleshooting guides, and friendly FAQs.",
    capabilities: ["Empathetic Support Drafting", "Troubleshooting Guide Authoring", "Feature Instruction", "FAQ Generation"],
    tools: ["Support Responder", "Troubleshooting Builder", "FAQ Formatter"],
    examples: [
      "Draft an empathetic and solution-focused reply to a user issue",
      "Create a troubleshooting guide for local Ollama model connection errors",
      "Write clear instructions for exporting and downloading generated reports",
      "Formulate friendly canned responses for frequent user questions"
    ]
  },
  "080": {
    name: "Marketing AI Agent",
    category: "Business & Management",
    description: "Plans marketing campaigns, value propositions, landing page copy, and funnel strategies.",
    capabilities: ["Campaign Planning", "Value Proposition Design", "Landing Page Copywriting", "Funnel Strategy"],
    tools: ["Campaign Planner", "Copywriter Engine", "Funnel Modeler"],
    examples: [
      "Create a comprehensive launch campaign for our 101 AI Agent fleet",
      "Define clear value propositions emphasizing 100% air-gap sovereignty",
      "Draft compelling marketing copy for our product landing page",
      "Plan a content marketing funnel targeting industrial automation engineers"
    ]
  },
  "081": {
    name: "Social Media AI Agent",
    category: "Business & Management",
    description: "Creates engaging social posts, technical threads, hashtags, and social calendars.",
    capabilities: ["LinkedIn Post Crafting", "Technical Thread Design", "Hashtag Strategy", "Content Calendar Scheduling"],
    tools: ["Post Creator", "Thread Builder", "Calendar Scheduler"],
    examples: [
      "Write an engaging LinkedIn post announcing our Sovereign AI release",
      "Create a Twitter/X thread breaking down our local multi-agent architecture",
      "Draft compelling product teaser posts with relevant technical hashtags",
      "Plan a 2-week social media content calendar with key feature spotlights"
    ]
  },
  "082": {
    name: "SEO AI Agent",
    category: "Business & Management",
    description: "Optimizes search engine rankings, keyword strategy, meta tags, and content structure.",
    capabilities: ["Meta Tag Optimization", "Keyword Research", "Readability Auditing", "Blog Topic Strategy"],
    tools: ["Meta Optimizer", "Keyword Researcher", "SEO Auditor"],
    examples: [
      "Optimize title tags, meta descriptions, and headers for sovereign AI keywords",
      "Perform keyword research for on-premise enterprise AI solutions",
      "Audit site content for search intent, keyword density, and readability",
      "Suggest high-intent blog topics to drive organic search traffic"
    ]
  },
  "083": {
    name: "Content Marketing AI Agent",
    category: "Business & Management",
    description: "Plans content marketing strategies, pillar articles, lead magnets, and infographics.",
    capabilities: ["Pillar Article Authoring", "Lead Magnet Structuring", "Content Repurposing", "Editorial Calendar Planning"],
    tools: ["Article Planner", "Lead Magnet Builder", "Editorial Scheduler"],
    examples: [
      "Write an in-depth pillar article on 'Why Sovereign AI is the Future of Industry'",
      "Create a lead magnet checklist for evaluating on-premise AI readiness",
      "Repurpose a technical whitepaper into 3 blog posts and infographics",
      "Develop an editorial calendar focused on industrial intelligence"
    ]
  },
  "084": {
    name: "Business Analyst AI Agent",
    category: "Business & Management",
    description: "Analyzes business workflows, process bottlenecks, functional specifications, and KPIs.",
    capabilities: ["Workflow Mapping", "Bottleneck Analysis", "Functional Spec Authoring", "KPI Definition"],
    tools: ["Process Mapper", "Bottleneck Detector", "Spec Formatter"],
    examples: [
      "Map out current state vs future state workflows for document approvals",
      "Identify process bottlenecks and compute turnaround time savings",
      "Write formal business requirements and functional specifications",
      "Define KPIs and success metrics for enterprise AI adoption"
    ]
  },
  "085": {
    name: "Financial Analysis AI Agent",
    category: "Business & Management",
    description: "Analyzes financial statements, EBITDA, revenue forecasts, and sensitivity models.",
    capabilities: ["EBITDA & Margin Calculation", "Revenue Forecasting", "Sensitivity Modeling", "Cash Flow Impact Analysis"],
    tools: ["Financial Modeler", "Forecast Engine", "Sensitivity Calculator"],
    examples: [
      "Analyze our financial statement to calculate operating margin and EBITDA",
      "Build a 3-year revenue and expense forecast model",
      "Perform sensitivity analysis on infrastructure costs vs user growth",
      "Evaluate cash flow impact of hardware amortization vs cloud OPEX"
    ]
  },
  "086": {
    name: "Accounting Assistant AI Agent",
    category: "Business & Management",
    description: "Assists with bookkeeping ledger categorization, bank reconciliation, and asset depreciation.",
    capabilities: ["Expense Categorization", "Bank Reconciliation", "Depreciation Scheduling", "Trial Balance Preparation"],
    tools: ["Ledger Categorizer", "Reconciliation Matcher", "Depreciation Calculator"],
    examples: [
      "Categorize monthly expense transactions into chart of accounts",
      "Reconcile bank statement entries against internal billing ledgers",
      "Calculate depreciation schedules for GPU workstation hardware",
      "Prepare a preliminary trial balance and variance report"
    ]
  },
  "087": {
    name: "E-Commerce AI Agent",
    category: "Business & Management",
    description: "Optimizes product listings, descriptions, cart conversion funnels, and customer review insights.",
    capabilities: ["Product Title & Listing Optimization", "Customer Review Mining", "Bundle Strategy Design", "Cart Abandonment Sequences"],
    tools: ["Listing Optimizer", "Review Miner", "Bundle Designer"],
    examples: [
      "Optimize product titles, bullet points, and descriptions for conversion",
      "Analyze customer reviews to identify top product improvement areas",
      "Recommend cross-sell and up-sell product bundle strategies",
      "Design an abandoned cart recovery email sequence"
    ]
  },
  "088": {
    name: "Supply Chain AI Agent",
    category: "Business & Management",
    description: "Analyzes inventory reorder points, economic order quantity (EOQ), logistics, and supplier lead times.",
    capabilities: ["EOQ & Reorder Modeling", "Lead Time Risk Assessment", "Inventory Turnover Optimization", "Logistics Route Planning"],
    tools: ["EOQ Modeler", "Lead Time Analyzer", "Inventory Planner"],
    examples: [
      "Calculate optimal economic order quantity (EOQ) and reorder points",
      "Analyze supplier lead times and identify single-point supply chain risks",
      "Build an inventory turnover model for critical spare parts",
      "Recommend logistics routing to minimize transit delays and freight costs"
    ]
  },
  "089": {
    name: "HR & Recruitment AI Agent",
    category: "Business & Management",
    description: "Drafts job descriptions, onboarding plans, interview scorecards, and workplace policies.",
    capabilities: ["Inclusive Job Description Drafting", "Onboarding Plan Creation", "Competency Scorecard Design", "Workplace Policy Authoring"],
    tools: ["JD Builder", "Onboarding Planner", "Scorecard Designer"],
    examples: [
      "Draft an inclusive job description for a Lead AI Systems Engineer",
      "Create an onboarding plan and checklist for new engineering hires",
      "Design standard interview scorecards for technical competencies",
      "Draft clear workplace policy guidelines for internal AI tool usage"
    ]
  },
  "090": {
    name: "Project Manager AI Agent",
    category: "Business & Management",
    description: "Tracks deliverables, manages WBS milestones, Gantt schedules, and project status reports.",
    capabilities: ["WBS & Gantt Scheduling", "Critical Path Tracking", "Status Report Generation", "Cross-Team Coordination"],
    tools: ["WBS Builder", "Gantt Planner", "Status Reporter"],
    examples: [
      "Build a comprehensive project work breakdown structure (WBS) and Gantt schedule",
      "Track project milestones, dependencies, and critical path items",
      "Generate a weekly project status report with risks and mitigation plans",
      "Coordinate deliverables and deadlines across multiple engineering teams"
    ]
  },
  "091": {
    name: "Autonomous Research AI Agent",
    category: "Research & Knowledge",
    description: "Executes deep multi-step autonomous research, gap detection, and evidence-grounded synthesis.",
    capabilities: ["Autonomous Multi-Step Investigation", "Knowledge Gap Detection", "Hypothesis Formulation & Testing", "Evidence-Grounded Synthesis"],
    tools: ["Autonomous Researcher", "Gap Detector", "Evidence Synthesizer"],
    examples: [
      "Conduct an autonomous multi-source investigation into plant thermal efficiency",
      "Iteratively gather evidence, identify knowledge gaps, and synthesize answers",
      "Formulate grounded hypotheses and test them against internal records",
      "Generate a comprehensive autonomous research report with cited proofs"
    ]
  },
  "092": {
    name: "Browser Automation AI Agent",
    category: "Automation & Productivity",
    description: "Designs Playwright / Puppeteer browser automation scripts, DOM selectors, and scraping flows.",
    capabilities: ["Playwright / Puppeteer Scripting", "Resilient DOM Selection", "Visual Regression Capture", "Headless Report Export"],
    tools: ["Browser Script Generator", "DOM Selector Engine", "Screenshot Runner"],
    examples: [
      "Generate Playwright / Puppeteer automation scripts for dashboard testing",
      "Write resilient DOM selectors and action sequences for web workflows",
      "Automate periodic screenshot capture and visual regression checks",
      "Design headless browser workflows to export internal HTML reports"
    ]
  },
  "093": {
    name: "RAG Knowledge AI Agent",
    category: "Research & Knowledge",
    description: "Indexes document embeddings and performs high-precision semantic search over internal archives.",
    capabilities: ["Semantic Document Indexing", "Grounded Citation Retrieval", "Chunking Strategy Optimization", "Local Knowledge QA"],
    tools: ["Embedding Indexer", "Semantic Retriever", "Citation Matcher"],
    examples: [
      "Index internal engineering manuals and perform high-precision semantic search",
      "Retrieve relevant SOP clauses with grounded document citations",
      "Optimize chunking strategies and embedding distance for technical text",
      "Answer complex questions strictly grounded in our local knowledge base"
    ]
  },
  "094": {
    name: "Multi-Agent Debate AI Agent",
    category: "Specialized AI",
    description: "Orchestrates multi-perspective agent debate, argument stress-testing, and consensus synthesis.",
    capabilities: ["Multi-Perspective Debate Orchestration", "Opposing Argument Synthesis", "Consensus Recommendation", "Premise Stress-Testing"],
    tools: ["Debate Moderator", "Argument Synthesizer", "Consensus Engine"],
    examples: [
      "Orchestrate a structured debate between safety and cost optimization perspectives",
      "Synthesize opposing arguments on equipment replacement vs repair",
      "Formulate a balanced consensus recommendation with trade-off analysis",
      "Identify underlying assumptions and stress-test strategic arguments"
    ]
  },
  "095": {
    name: "Business Operations AI Agent",
    category: "Business & Management",
    description: "Models standard operating procedures, SLAs, shift handovers, and operational throughput.",
    capabilities: ["SOP Modeling", "SLA & Escalation Mapping", "Shift Handover Optimization", "Throughput Bottleneck Elimination"],
    tools: ["SOP Modeler", "SLA Engine", "Throughput Analyzer"],
    examples: [
      "Model end-to-end standard operating procedures for plant incident response",
      "Define operational SLAs and escalation matrices for equipment alerts",
      "Optimize shift handover protocols to prevent critical communication gaps",
      "Conduct a throughput analysis to eliminate operational friction"
    ]
  },
  "096": {
    name: "Autonomous Coding AI Agent",
    category: "Coding & Development",
    description: "Plans, writes, and self-tests end-to-end software modules autonomously with test verification.",
    capabilities: ["Autonomous Module Generation", "Self-Testing & Patch Verification", "Multi-File Code Synthesis", "Specification Execution"],
    tools: ["Autonomous Coder", "Self-Tester", "Patch Validator"],
    examples: [
      "Plan, generate, test, and refactor a complete backend microservice",
      "Autonomously implement a feature from technical specification to passing tests",
      "Identify bugs, generate patches, and verify them against the test suite",
      "Execute multi-step autonomous code changes with verification"
    ]
  },
  "097": {
    name: "AI Research Scientist AI Agent",
    category: "Specialized AI",
    description: "Evaluates machine learning architectures, loss functions, token efficiency, and model benchmarks.",
    capabilities: ["Inference Throughput Evaluation", "Ablation Study Design", "Perplexity & Token Profiling", "Reasoning Benchmark Design"],
    tools: ["ML Benchmark Evaluator", "Ablation Runner", "Perplexity Profiler"],
    examples: [
      "Evaluate local model inference throughput, latency, and memory footprint",
      "Design ablation studies to measure prompt optimization performance",
      "Compare token efficiency and perplexity across quantized models",
      "Formulate benchmarks to measure agent reasoning and accuracy"
    ]
  },
  "098": {
    name: "Startup Builder AI Agent",
    category: "Business & Management",
    description: "Coordinates product ideation, MVP architectures, technical roadmaps, and go-to-market execution.",
    capabilities: ["Zero-to-One Product Blueprinting", "MVP Scope Definition", "Rapid Architecture Design", "GTM Execution Planning"],
    tools: ["Blueprint Modeler", "MVP Scoper", "GTM Planner"],
    examples: [
      "Develop a complete zero-to-one product blueprint and technical roadmap",
      "Define value proposition, MVP feature scope, and rapid iteration plan",
      "Design product architecture optimized for speed of execution",
      "Formulate a go-to-market plan for launching our sovereign AI product"
    ]
  },
  "099": {
    name: "Multi-Agent Coordinator AI Agent",
    category: "Specialized AI",
    description: "Coordinates inter-agent message passing, task handoffs, failovers, and output synthesis.",
    capabilities: ["Inter-Agent Message Passing", "Task Sequential Dispatching", "Failover & Retry Handling", "Multi-Agent Output Synthesis"],
    tools: ["Agent Dispatcher", "Message Bus", "Synthesis Aggregator"],
    examples: [
      "Coordinate workflow handoffs and data passing between specialist agents",
      "Dispatch tasks to Writing, Coding, and Analysis agents sequentially",
      "Monitor agent execution states and handle failover or retries",
      "Synthesize partial outputs from multiple agents into a unified result"
    ]
  },
  "100": {
    name: "General Assistant AI Agent",
    category: "Automation & Productivity",
    description: "Provides versatile assistance across tasks, drafting, reasoning, organization, and agent guidance.",
    capabilities: ["General Task Assistance", "Multi-Domain Drafting", "Problem Solving & Reasoning", "Specialist Agent Guidance"],
    tools: ["General Assistant", "Reasoning Engine", "Agent Directory Guide"],
    examples: [
      "Help me organize my work, plan my day, and summarize key tasks",
      "Explain complex concepts clearly and provide structured answers",
      "Assist with drafting, editing, calculating, and problem solving",
      "Guide me on selecting the right specialist AI agent for my current goal"
    ]
  },
  "101": {
    name: "Super AI Agent",
    category: "Orchestrator",
    description: "The master AI agent that coordinates the specialist AI agents to solve complex tasks.",
    capabilities: ["Autonomous Task Planning", "Dynamic Multi-Model Routing", "Evidence Synthesis", "Specialist Fleet Orchestration"],
    tools: ["Task Planner", "Model Router", "Evidence Synthesizer", "Fleet Delegator"],
    examples: [
      "Build me a complete full-stack web application with database and tests",
      "Perform end-to-end industrial investigation, analyze data, and generate deliverables",
      "Coordinate research, coding, documentation, and testing for this project",
      "Break this complex engineering goal into steps and execute across 101 agents"
    ]
  }
};

// 1. Update sih-agent-mapping.json
const sihPath = path.join(ROOT, 'registry/sih-agent-mapping.json');
const sihAgents = JSON.parse(fs.readFileSync(sihPath, 'utf8'));

sihAgents.forEach(agent => {
  const num = String(agent.displayNumber || agent.day || parseInt(agent.agent_id.replace(/\D/g, ''), 10)).padStart(3, '0');
  const profile = PROFILES[num];
  if (profile) {
    agent.displayName = profile.name;
    agent.name = profile.name;
    agent.category = profile.category;
    agent.domain = profile.category;
    agent.description = profile.description;
    const caps = [...profile.capabilities];
    if (!caps.includes('sovereign-local')) caps.push('sovereign-local');
    agent.capabilities = caps;
    agent.tools = profile.tools;
    agent.examples = profile.examples;
  }
});

fs.writeFileSync(sihPath, JSON.stringify(sihAgents, null, 2) + '\n', 'utf8');
console.log('Updated sih-agent-mapping.json with 101 authentic profiles');

// 2. Update agents.json
const agentsJsonPath = path.join(ROOT, 'registry/agents.json');
const agentsJson = JSON.parse(fs.readFileSync(agentsJsonPath, 'utf8'));

agentsJson.agents.forEach(agent => {
  const num = String(agent.displayNumber || agent.day || parseInt(agent.agent_id.replace(/\D/g, ''), 10)).padStart(3, '0');
  const profile = PROFILES[num];
  if (profile) {
    agent.displayName = profile.name;
    agent.name = profile.name;
    agent.category = profile.category;
    agent.domain = profile.category;
    agent.description = profile.description;
    const caps = [...profile.capabilities];
    if (!caps.includes('sovereign-local')) caps.push('sovereign-local');
    agent.capabilities = caps;
    agent.tools = profile.tools;
    agent.examples = profile.examples;
  }
});

fs.writeFileSync(agentsJsonPath, JSON.stringify(agentsJson, null, 2) + '\n', 'utf8');
console.log('Updated agents.json with 101 authentic profiles');
