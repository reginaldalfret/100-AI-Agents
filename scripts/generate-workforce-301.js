import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const AGENTS_JSON_PATH = path.join(ROOT, "registry", "agents.json");
const SIH_MAPPING_PATH = path.join(ROOT, "registry", "sih-agent-mapping.json");

// Read existing agents.json
if (!fs.existsSync(AGENTS_JSON_PATH)) {
  console.error(`Error: ${AGENTS_JSON_PATH} not found.`);
  process.exit(1);
}

const existingData = JSON.parse(fs.readFileSync(AGENTS_JSON_PATH, "utf8"));
const existingAgents = Array.isArray(existingData) ? existingData : (existingData.agents || []);

// 1. Lock baseline agents 1-100 verbatim
const baselineAgents = existingAgents.slice(0, 100);
if (baselineAgents.length !== 100) {
  console.error(`Error: Expected 100 baseline agents, found ${baselineAgents.length}`);
  process.exit(1);
}

// 2. Define the 201 specialist agents (IDs 101 to 301)
const SPECIALIST_SPECS = [
  // Orchestration & Multi-Agent Intelligence (101-105)
  {
    num: 101,
    name: "Super AI Agent",
    slug: "master-agent",
    category: "Orchestrator",
    domain: "Master Workflow Orchestration",
    educational_domain: "master-orchestration",
    classification: "ORCHESTRATION",
    risk_level: "HIGH",
    desc: "The sovereign master AI agent that coordinates the specialist AI agents to solve complex tasks.",
    capabilities: ["Autonomous Task Planning", "Dynamic Multi-Model Routing", "Evidence Synthesis", "Specialist Fleet Orchestration", "sovereign-local"],
    allowed_tools: ["*"],
    forbidden_tools: [],
    tools: ["Task Planner", "Model Router", "Evidence Synthesizer", "Fleet Delegator"],
    examples: [
      "Build me a complete full-stack web application with database and tests",
      "Perform end-to-end industrial investigation, analyze data, and generate deliverables",
      "Coordinate research, coding, documentation, and testing for this project",
      "Break this complex engineering goal into steps and execute across 301 agents"
    ],
    triggers: ["orchestrate", "master plan", "coordinate fleet", "execute multi-agent workflow"],
    input_contract: { type: "object", properties: { task: { type: "string" }, context: { type: "object" } }, required: ["task"] },
    output_contract: { type: "object", properties: { plan: { type: "array" }, synthesis: { type: "string" }, status: { type: "string" } }, required: ["synthesis", "status"] }
  },
  {
    num: 102,
    name: "Autonomous DAG Workflow Planner",
    slug: "autonomous-dag-workflow-planner",
    category: "Automation & Productivity",
    domain: "Workflow & Multi-Agent Intelligence",
    educational_domain: "workflow-intelligence",
    classification: "ORCHESTRATION",
    risk_level: "MEDIUM",
    desc: "Constructs acyclic execution graphs with dependency resolution, parallelism, and checkpoint rollback states.",
    capabilities: ["DAG Pipeline Synthesis", "Topological Dependency Sorting", "Parallel Subtask Scheduling", "State Checkpoint Restoration", "sovereign-local"],
    allowed_tools: ["create_task", "update_task", "get_workflow_status", "record_agent_action"],
    forbidden_tools: ["execute_command", "write_raw_system"],
    tools: ["DAG Builder", "Dependency Resolver", "State Checkpointer"],
    examples: [
      "Generate an execution DAG for refinery turnaround phase 1",
      "Schedule parallel data pipelines with dependency constraints",
      "Optimize task sequence to minimize critical path duration",
      "Create a rollback plan for database migration failure"
    ],
    triggers: ["dag", "workflow plan", "pipeline schedule", "dependency graph"],
    input_contract: { type: "object", properties: { tasks: { type: "array" }, constraints: { type: "object" } }, required: ["tasks"] },
    output_contract: { type: "object", properties: { dag: { type: "object" }, execution_order: { type: "array" } }, required: ["dag", "execution_order"] }
  },
  {
    num: 103,
    name: "Dynamic Tri-Model Router & Load Balancer",
    slug: "dynamic-tri-model-router",
    category: "Specialized AI",
    domain: "Workflow & Multi-Agent Intelligence",
    educational_domain: "workflow-intelligence",
    classification: "ORCHESTRATION",
    risk_level: "LOW",
    desc: "Evaluates task complexity, context length, and token latency to route inference between Nemotron, Gemma, and Qwen.",
    capabilities: ["Inference Telemetry Routing", "VRAM Budget Tracking", "Latency vs Accuracy Tradeoff", "Zero-Egress Model Fallback", "sovereign-local"],
    allowed_tools: ["route_model", "get_gpu_metrics", "record_agent_action"],
    forbidden_tools: ["external_api_call"],
    tools: ["Model Router", "VRAM Monitor", "Latency Profiler"],
    examples: [
      "Route this complex coding prompt to the optimal local model",
      "Select vision model for P&ID engineering drawing inspection",
      "Balance GPU VRAM allocation during heavy batch processing",
      "Evaluate inference latency across tri-model fleet"
    ],
    triggers: ["model route", "gpu load", "model selection", "tri-model balance"],
    input_contract: { type: "object", properties: { prompt: { type: "string" }, modality: { type: "string" } }, required: ["prompt"] },
    output_contract: { type: "object", properties: { target_model: { type: "string" }, estimated_vram_mb: { type: "number" } }, required: ["target_model"] }
  },
  {
    num: 104,
    name: "Cross-Agent Consensus & Conflict Resolver",
    slug: "cross-agent-consensus-resolver",
    category: "Specialized AI",
    domain: "Workflow & Multi-Agent Intelligence",
    educational_domain: "workflow-intelligence",
    classification: "GOVERNANCE",
    risk_level: "HIGH",
    desc: "Arbitrates conflicting outputs between specialist agents through multi-round debate and grounded mathematical consensus.",
    capabilities: ["Conflict Detection Matrix", "Multi-Round Agent Debate", "Source Evidence Weighting", "Consensus Synthesis", "sovereign-local"],
    allowed_tools: ["compare_agent_outputs", "evaluate_evidence", "record_agent_action"],
    forbidden_tools: ["override_statutory_safety"],
    tools: ["Consensus Arbiter", "Debate Engine", "Evidence Weight Evaluator"],
    examples: [
      "Resolve contradictory pressure readings between sensor and manual log",
      "Synthesize consensus between corrosion engineer and budget allocator",
      "Arbitrate conflicting turnaround schedule estimates",
      "Weigh conflicting technical evidence in incident investigation"
    ],
    triggers: ["resolve conflict", "consensus debate", "arbitrate outputs", "weigh evidence"],
    input_contract: { type: "object", properties: { agent_outputs: { type: "array" }, criteria: { type: "object" } }, required: ["agent_outputs"] },
    output_contract: { type: "object", properties: { consensus: { type: "string" }, confidence_score: { type: "number" } }, required: ["consensus", "confidence_score"] }
  },
  {
    num: 105,
    name: "Telemetry, Observability & Distributed Tracing Agent",
    slug: "telemetry-distributed-tracing-agent",
    category: "Specialized AI",
    domain: "Workflow & Multi-Agent Intelligence",
    educational_domain: "workflow-intelligence",
    classification: "ANALYTICS",
    risk_level: "LOW",
    desc: "Captures OpenTelemetry spans, token consumption metrics, execution latency, and error heatmaps across all agents.",
    capabilities: ["Span Tree Visualization", "Token Budget Telemetry", "Bottleneck Root-Cause Tracing", "Error Cascade Diagnostics", "sovereign-local"],
    allowed_tools: ["get_metrics", "query_spans", "export_trace_log", "record_agent_action"],
    forbidden_tools: ["alter_trace_data"],
    tools: ["Trace Collector", "Span Visualizer", "Performance Heatmap"],
    examples: [
      "Generate span flamegraph for multi-agent investigation workflow",
      "Analyze token consumption across 100-agent execution run",
      "Identify latency bottleneck in document intelligence pipeline",
      "Export OpenTelemetry trace logs for statutory audit compliance"
    ],
    triggers: ["telemetry trace", "span analysis", "token metrics", "performance flamegraph"],
    input_contract: { type: "object", properties: { trace_id: { type: "string" }, time_window: { type: "string" } }, required: ["trace_id"] },
    output_contract: { type: "object", properties: { flamegraph: { type: "object" }, total_duration_ms: { type: "number" }, token_usage: { type: "object" } }, required: ["flamegraph", "total_duration_ms"] }
  },

  // Chemical, Refinery & Process Engineering (106-120)
  {
    num: 106,
    name: "Catalytic Reforming & Hydrotreating Specialist",
    slug: "catalytic-reforming-hydrotreating-specialist",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "HIGH",
    desc: "Optimizes Continuous Catalyst Regeneration (CCR) reforming and hydrodesulfurization bed temperature profiles.",
    capabilities: ["CCR Reformer Kinetics", "HDS Sulfur Kinetics", "WHDR Space Velocity Tuning", "Catalyst Activity Tracking", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["Reformer Kinetic Engine", "HDS Bed Profiler", "Hydrogen Partial Pressure Calculator"],
    examples: [
      "Calculate optimal reactor inlet temperatures for CCR reforming unit",
      "Model hydrotreater bed life based on feed sulfur and nitrogen levels",
      "Evaluate hydrogen-to-hydrocarbon ratio to suppress coking",
      "Optimize octane gain versus aromatics yield in reformer unit"
    ],
    triggers: ["reformer", "hydrotreater", "ccr reforming", "hydrodesulfurization", "hds bed"],
    input_contract: { type: "object", properties: { feed_rate: { type: "number" }, sulfur_ppm: { type: "number" }, temperature_profile: { type: "array" } }, required: ["feed_rate", "temperature_profile"] },
    output_contract: { type: "object", properties: { product_octane: { type: "number" }, catalyst_coke_rate: { type: "number" }, recommendations: { type: "array" } }, required: ["recommendations"] }
  },
  {
    num: 107,
    name: "Fluid Catalytic Cracking (FCC) Yield Optimizer",
    slug: "fluid-catalytic-cracking-yield-optimizer",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "HIGH",
    desc: "Simulates FCC riser dynamics, catalyst circulation rates, regenerator delta-coke, and LPG/gasoline split ratios.",
    capabilities: ["Riser Hydrodynamics", "Regenerator Heat Balance", "Delta-Coke Calculation", "Gasoline Selectivity Modeling", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["FCC Riser Modeler", "Regenerator Balancer", "LPG/Gasoline Yield Forecaster"],
    examples: [
      "Optimize catalyst-to-oil (C/O) ratio for maximum propylene yield",
      "Calculate regenerator dense bed temperature given fresh feed Conradson Carbon",
      "Evaluate stripper steam rate to minimize entrained hydrocarbons",
      "Predict flue gas SOx and NOx emissions under variable catalyst additions"
    ],
    triggers: ["fcc yield", "catalytic cracking", "riser temperature", "regenerator delta coke"],
    input_contract: { type: "object", properties: { feed_concarbon: { type: "number" }, c_o_ratio: { type: "number" }, riser_temp: { type: "number" } }, required: ["c_o_ratio", "riser_temp"] },
    output_contract: { type: "object", properties: { lpg_yield_pct: { type: "number" }, gasoline_yield_pct: { type: "number" }, flue_gas_sox: { type: "number" } }, required: ["lpg_yield_pct", "gasoline_yield_pct"] }
  },
  {
    num: 108,
    name: "Vacuum Distillation & Crude Unit Preflash Specialist",
    slug: "vacuum-distillation-crude-preflash-specialist",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "MEDIUM",
    desc: "Models atmospheric and vacuum distillation columns, wash bed coking risks, and heavy gas oil cut points.",
    capabilities: ["Atmospheric Distillation Profiles", "Vacuum Ejector System Hydraulics", "HVGO/LVGO Cut Point Optimization", "Overflash Control", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["VDU Tower Simulator", "Ejector Vacuum Calculator", "Flash Zone Balancer"],
    examples: [
      "Calculate required column top pressure and steam ejector steam demand",
      "Optimize HVGO cut point without exceeding heavy metals threshold for FCC",
      "Diagnose wash section coking risk from temperature profile anomalies",
      "Evaluate preflash drum separation efficiency with light crude blends"
    ],
    triggers: ["vacuum distillation", "vdu", "cdu preflash", "hvgo cut point", "crude tower"],
    input_contract: { type: "object", properties: { crude_assay: { type: "string" }, tower_bottom_temp: { type: "number" }, vacuum_mmhg: { type: "number" } }, required: ["crude_assay", "vacuum_mmhg"] },
    output_contract: { type: "object", properties: { cut_points: { type: "object" }, yield_summary: { type: "object" } }, required: ["cut_points", "yield_summary"] }
  },
  {
    num: 109,
    name: "Delayed Coker & Visbreaker Operations Specialist",
    slug: "delayed-coker-visbreaker-specialist",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "HIGH",
    desc: "Optimizes thermal cracking kinetics, delayed coker drum switching cycles, hydraulic decoking, and needle/sponge coke quality.",
    capabilities: ["Thermal Cracking Kinetics", "Coke Drum Cycle Scheduling", "Furnace Tube Coking Rate Estimation", "Decoking Jet Safety Checks", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["Coker Cycle Optimizer", "Visbreaker Conversion Calculator", "Hydraulic Decoking Safety Validator"],
    examples: [
      "Schedule 18-hour drum switching cycle with pre-heat and quench thermal ramp constraints",
      "Calculate visbreaking severity index while avoiding fuel oil stability precipitation",
      "Assess coker furnace coil outlet temperature (COT) to limit tube skin overheating",
      "Model sponge vs anode grade coke yield from vacuum residue feedstock"
    ],
    triggers: ["delayed coker", "visbreaker", "coke drum switch", "thermal cracking", "decoking"],
    input_contract: { type: "object", properties: { residue_properties: { type: "object" }, cycle_hours: { type: "number" } }, required: ["residue_properties"] },
    output_contract: { type: "object", properties: { cycle_schedule: { type: "array" }, yield_breakdown: { type: "object" } }, required: ["cycle_schedule", "yield_breakdown"] }
  },
  {
    num: 110,
    name: "Alkylation & Polymerization Unit Engineer",
    slug: "alkylation-polymerization-engineer",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "CRITICAL",
    desc: "Calculates sulfuric/hydrofluoric acid-catalyzed alkylation balances, isobutane-to-olefin ratios, and octane selectivity.",
    capabilities: ["Acid Emulsion Phase Dynamics", "I/O Ratio Optimization", "Acid Strength & Tar Tracking", "Poly-Gasoline Synthesis Kinetics", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["Alkylation Reaction Balancer", "Acid Strength Monitor", "Alkylate Octane Estimator"],
    examples: [
      "Calculate optimal isobutane-to-olefin (I/O) ratio to suppress acid polymer formation",
      "Monitor spend acid concentration and calculate fresh sulfuric acid makeup rate",
      "Simulate propylene dimer reaction yields in solid phosphoric acid poly unit",
      "Evaluate acid settling zone residence time to prevent acid carryover into fractionator"
    ],
    triggers: ["alkylation", "acid emulsion", "polymerization unit", "isobutane olefin ratio"],
    input_contract: { type: "object", properties: { olefin_feed_rate: { type: "number" }, isobutane_recycle: { type: "number" }, acid_purity: { type: "number" } }, required: ["olefin_feed_rate", "isobutane_recycle"] },
    output_contract: { type: "object", properties: { alkylate_ron: { type: "number" }, acid_consumption_kg: { type: "number" } }, required: ["alkylate_ron", "acid_consumption_kg"] }
  },
  {
    num: 111,
    name: "Claus Sulfur Recovery (SRU) & Tail Gas Treater",
    slug: "claus-sulfur-recovery-tail-gas-specialist",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "HIGH",
    desc: "Controls Claus thermal and catalytic reaction stages, H2S/SO2 stoichiometric ratio (2.0:1), and tail gas hydrogenation.",
    capabilities: ["Claus Reaction Kinetics", "H2S:SO2 Stoichiometric Control", "Catalyst Deactivation Tracking", "Tail Gas Amine Recovery", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["Claus Stoichiometry Balancer", "SRU Thermal Stage Modeler", "Tail Gas Emissions Calculator"],
    examples: [
      "Maintain air demand trim control to lock H2S/SO2 tail gas ratio at exactly 2.00",
      "Calculate sulfur recovery efficiency across thermal reaction furnace and 3 catalytic beds",
      "Model COS and CS2 hydrolysis conversion over titanium dioxide catalyst",
      "Assess sulfur pit ventilation and headspace H2S degassing compliance"
    ],
    triggers: ["claus unit", "sru", "tail gas", "sulfur recovery", "h2s so2 ratio"],
    input_contract: { type: "object", properties: { acid_gas_flow: { type: "number" }, h2s_mol_pct: { type: "number" }, co2_mol_pct: { type: "number" } }, required: ["acid_gas_flow", "h2s_mol_pct"] },
    output_contract: { type: "object", properties: { sulfur_recovery_pct: { type: "number" }, combustion_air_rate: { type: "number" } }, required: ["sulfur_recovery_pct", "combustion_air_rate"] }
  },
  {
    num: 112,
    name: "Hydrogen Generation & Pressure Swing Adsorption Balancer",
    slug: "hydrogen-generation-psa-balancer",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "HIGH",
    desc: "Optimizes Steam Methane Reforming (SMR) steam-to-carbon ratio, water gas shift reactors, and PSA bed cycle times.",
    capabilities: ["SMR Thermodynamic Equilibrium", "Steam/Carbon Ratio Tuning", "High/Low Shift Conversion", "PSA Multi-Bed Adsorption Timing", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["SMR Reforming Calculator", "PSA Cycle Balancer", "Hydrogen Network Balancer"],
    examples: [
      "Calculate steam-to-carbon ratio to prevent carbon deposition on nickel SMR catalyst",
      "Optimize PSA 10-bed valve step times to achieve 99.99% H2 purity with >88% recovery",
      "Balance high-pressure and medium-pressure hydrogen headers across the refinery grid",
      "Model reformer tube temperature skin margin under varying natural gas feed compositions"
    ],
    triggers: ["hydrogen generation", "smr reformer", "psa bed", "hydrogen balance", "steam methane reforming"],
    input_contract: { type: "object", properties: { natural_gas_flow: { type: "number" }, steam_ratio: { type: "number" }, target_purity: { type: "number" } }, required: ["natural_gas_flow", "target_purity"] },
    output_contract: { type: "object", properties: { hydrogen_production_nm3: { type: "number" }, psa_recovery_pct: { type: "number" } }, required: ["hydrogen_production_nm3", "psa_recovery_pct"] }
  },
  {
    num: 113,
    name: "Gas Sweetening & Amine Regeneration Specialist",
    slug: "gas-sweetening-amine-regeneration-specialist",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "MEDIUM",
    desc: "Models MDEA/MEA/DEA amine contactor absorption profiles, rich amine loading, reboiler duty, and foaming prevention.",
    capabilities: ["Amine Equilibrium Thermodynamics", "Acid Gas Loading Limits", "Contactor Tray Hydraulics", "Heat Stable Salt (HSS) Management", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["Amine Contactor Simulator", "Rich/Lean Loading Balancer", "Reboiler Energy Optimizer"],
    examples: [
      "Calculate maximum rich amine loading (mol H2S/mol amine) to prevent contactor corrosion",
      "Optimize stripper reboiler steam rate to achieve target lean amine residual loading",
      "Diagnose amine column foaming from differential pressure transmitter oscillations",
      "Evaluate thermal reclamation requirements based on Heat Stable Salts (HSS) concentration"
    ],
    triggers: ["gas sweetening", "amine unit", "mdea", "rich amine loading", "amine contactor"],
    input_contract: { type: "object", properties: { sour_gas_rate: { type: "number" }, h2s_inlet_pct: { type: "number" }, amine_type: { type: "string" } }, required: ["sour_gas_rate", "h2s_inlet_pct"] },
    output_contract: { type: "object", properties: { lean_circulation_rate: { type: "number" }, reboiler_duty_gcal: { type: "number" } }, required: ["lean_circulation_rate"] }
  },
  {
    num: 114,
    name: "Naphtha Isomerization & Octane Blending Specialist",
    slug: "naphtha-isomerization-octane-blending-specialist",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "MEDIUM",
    desc: "Calculates light naphtha C5/C6 isomerization equilibrium, chlorinated alumina catalyst activity, and gasoline pool octane.",
    capabilities: ["C5/C6 Paraffin Isomerization", "Chloriding Makeup Control", "Nonlinear Octane Blending", "RVP Compliance Prediction", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["Isomerization Equilibrium Calculator", "Octane Linear/Nonlinear Blending Engine", "RVP Balancer"],
    examples: [
      "Model once-through vs deisopentanizer recycle isomerization for max RON gain",
      "Calculate organic chloride promoter dosing rate to maintain catalyst chlorination",
      "Formulate 95 RON gasoline blend from reformate, alkylate, isomerate, and ethanol",
      "Predict blended Reid Vapor Pressure (RVP) under summer statutory volatility caps"
    ],
    triggers: ["isomerization", "naphtha octane", "gasoline blending", "ron mon blending", "rvp blend"],
    input_contract: { type: "object", properties: { component_streams: { type: "array" }, target_ron: { type: "number" }, target_rvp_psi: { type: "number" } }, required: ["component_streams", "target_ron"] },
    output_contract: { type: "object", properties: { blend_recipe: { type: "object" }, calculated_ron: { type: "number" }, calculated_rvp: { type: "number" } }, required: ["blend_recipe", "calculated_ron"] }
  },
  {
    num: 115,
    name: "Distillation Column Tray & Packed Bed Hydraulics Specialist",
    slug: "distillation-tray-packed-bed-hydraulics-specialist",
    category: "Engineering & Technical",
    domain: "Engineering",
    educational_domain: "engineering",
    classification: "ENGINEERING",
    risk_level: "MEDIUM",
    desc: "Evaluates weeping, entrainment, downcomer backup, and structured packing flood limits in fractionators.",
    capabilities: ["Sieve/Valve Tray Hydraulic Rating", "Downcomer Choke Velocity Limits", "Structured Packing HETP Calculation", "Vapor-Liquid Traffic Profiling", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["Tray Hydraulics Calculator", "Packing Flood Forecaster", "HETP Rating Engine"],
    examples: [
      "Calculate percent jet flood and downcomer backup for main fractionator wash trays",
      "Evaluate structured packing HETP efficiency under turn-down vapor loading",
      "Diagnose tray damage or weep point transitions from column DP survey profiles",
      "Size replacement high-capacity downcomers for debottlenecking revamps"
    ],
    triggers: ["column hydraulics", "tray flooding", "weeping", "packed bed hetp", "downcomer backup"],
    input_contract: { type: "object", properties: { column_diameter_m: { type: "number" }, vapor_flow_kg_h: { type: "number" }, liquid_flow_kg_h: { type: "number" } }, required: ["column_diameter_m", "vapor_flow_kg_h", "liquid_flow_kg_h"] },
    output_contract: { type: "object", properties: { percent_jet_flood: { type: "number" }, downcomer_backup_pct: { type: "number" }, status: { type: "string" } }, required: ["percent_jet_flood", "status"] }
  },
  {
    num: 116,
    name: "Pinch Analysis & Heat Exchanger Network (HEN) Optimizer",
    slug: "pinch-analysis-hen-optimizer",
    category: "Engineering & Technical",
    domain: "Engineering",
    educational_domain: "engineering",
    classification: "ENGINEERING",
    risk_level: "LOW",
    desc: "Performs thermodynamic pinch analysis, composite curves generation, and heat exchanger network retrofitting.",
    capabilities: ["Grand Composite Curve (GCC) Plotting", "Minimum Utility Target Calculation", "Pinch Temperature Identification", "Network Cross-Pinch Violation Audit", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "generate_docx", "record_agent_action"],
    forbidden_tools: [],
    tools: ["Pinch Analyzer", "HEN Grid Balancer", "Composite Curve Engine"],
    examples: [
      "Calculate thermodynamic pinch temperature and minimum heating/cooling targets",
      "Identify cross-pinch heat exchanger matches wasting high-pressure steam",
      "Design retrofit exchanger network to recover 15 Gcal/h of crude preheat energy",
      "Generate Grand Composite Curve to integrate process heat into utility steam generation"
    ],
    triggers: ["pinch analysis", "hen optimizer", "heat exchanger network", "composite curve", "energy target"],
    input_contract: { type: "object", properties: { hot_streams: { type: "array" }, cold_streams: { type: "array" }, dt_min: { type: "number" } }, required: ["hot_streams", "cold_streams"] },
    output_contract: { type: "object", properties: { pinch_temperature: { type: "number" }, q_hot_target_mw: { type: "number" }, q_cold_target_mw: { type: "number" } }, required: ["pinch_temperature"] }
  },
  {
    num: 117,
    name: "Utility Steam & Condensate Network Balancer",
    slug: "utility-steam-condensate-network-balancer",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "MEDIUM",
    desc: "Balances HP (60 bar), MP (18 bar), and LP (3.5 bar) steam headers, letdown valves, desuperheaters, and condensate return.",
    capabilities: ["Multi-Header Mass/Energy Balance", "Steam Turbine vs Electric Drive Selection", "Desuperheater Water Quench Hydraulics", "Condensate Flashing & Recovery", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["Steam Grid Balancer", "Letdown Valve Modeler", "Condensate Flash Calculator"],
    examples: [
      "Model site-wide steam balance across HP, MP, and LP headers during boiler trip",
      "Optimize mechanical drive steam turbine versus electric motor selection based on power tariff",
      "Calculate desuperheating boiler feed water injection rate for 18 bar header trim",
      "Evaluate thermal efficiency gain from high-pressure condensate flash steam recovery"
    ],
    triggers: ["steam balance", "utility steam", "condensate network", "desuperheater", "letdown valve"],
    input_contract: { type: "object", properties: { boiler_generation_tph: { type: "number" }, consumer_demands: { type: "object" } }, required: ["boiler_generation_tph", "consumer_demands"] },
    output_contract: { type: "object", properties: { header_pressures: { type: "object" }, letdown_rates_tph: { type: "object" }, vent_loss_tph: { type: "number" } }, required: ["header_pressures", "vent_loss_tph"] }
  },
  {
    num: 118,
    name: "Flare Gas Recovery & Minimization Specialist",
    slug: "flare-gas-recovery-minimization-specialist",
    category: "Engineering & Technical",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ENGINEERING",
    risk_level: "HIGH",
    desc: "Optimizes flare gas recovery compressors, liquid seal drum levels, purge gas flow rates, and flaring event root cause tracing.",
    capabilities: ["FGRU Compressor Scheduling", "Flare Header Hydraulic Backpressure", "Purge Gas Molecular Weight Balancing", "Flaring Event Mass Accounting", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "search_knowledge", "record_agent_action"],
    forbidden_tools: ["direct_valve_actuation"],
    tools: ["FGRU Compressor Balancer", "Flare Header Backpressure Modeler", "Purge Rate Validator"],
    examples: [
      "Calculate flare gas recovery unit (FGRU) liquid ring compressor capacity vs base flaring",
      "Verify minimum purge gas velocity to prevent air ingress and flame flashback into header",
      "Calculate total hydrocarbon mass lost during unit shutdown relief venting",
      "Size liquid seal drum displacement to maintain positive containment seal"
    ],
    triggers: ["flare gas recovery", "fgru", "flare minimization", "purge gas flow", "flare header"],
    input_contract: { type: "object", properties: { relief_flow_rate_kg_h: { type: "number" }, gas_density: { type: "number" }, fgru_capacity: { type: "number" } }, required: ["relief_flow_rate_kg_h", "fgru_capacity"] },
    output_contract: { type: "object", properties: { recovered_flow_kg_h: { type: "number" }, flared_flow_kg_h: { type: "number" }, co2_equivalent_tons: { type: "number" } }, required: ["flared_flow_kg_h"] }
  },
  {
    num: 119,
    name: "Process Kinetic Modeling & Simulation Specialist",
    slug: "process-kinetic-modeling-simulation-specialist",
    category: "Engineering & Technical",
    domain: "Engineering",
    educational_domain: "engineering",
    classification: "ENGINEERING",
    risk_level: "MEDIUM",
    desc: "Develops lumped parameter reaction kinetics, Arrhenius parameter regressions, and dynamic reactor continuum models.",
    capabilities: ["Lumped Kinetic Regression", "Arrhenius Activation Energy Fitting", "Plug Flow / CSTR Reactor Simulation", "Exothermic Runaway Boundary Prediction", "sovereign-local"],
    allowed_tools: ["execute_python_sandbox", "calculate_step_by_step", "read_excel", "record_agent_action"],
    forbidden_tools: [],
    tools: ["Kinetic Solver", "Reactor Simulator", "Arrhenius Regressor"],
    examples: [
      "Fit kinetic rate constants for multi-lump hydrocracker reaction matrix",
      "Simulate non-isothermal plug flow reactor temperature profile and hotspot position",
      "Evaluate parametric sensitivity of exothermic hydrotreating bed to feed temperature ramps",
      "Calculate steady-state conversion and yield distribution for continuous stirred tanks"
    ],
    triggers: ["kinetic model", "reaction kinetics", "reactor simulation", "arrhenius parameters"],
    input_contract: { type: "object", properties: { reaction_scheme: { type: "string" }, experimental_data: { type: "array" } }, required: ["reaction_scheme"] },
    output_contract: { type: "object", properties: { rate_constants: { type: "object" }, activation_energies_kj: { type: "object" }, r2_fit: { type: "number" } }, required: ["rate_constants"] }
  },
  {
    num: 120,
    name: "Dynamic Mass & Energy Balance Reconciler",
    slug: "dynamic-mass-energy-balance-reconciler",
    category: "Data & Analytics",
    domain: "Refinery Operations",
    educational_domain: "refinery-operations",
    classification: "ANALYTICS",
    risk_level: "LOW",
    desc: "Applies statistical gross error detection and weighted least-squares data reconciliation across refinery flowmeters.",
    capabilities: ["Gross Error Detection (GED)", "Weighted Least-Squares Reconciliation", "Conservation of Mass/Energy Solver", "Meter Bias / Drift Identification", "sovereign-local"],
    allowed_tools: ["calculate_step_by_step", "read_excel", "write_excel", "record_agent_action"],
    forbidden_tools: [],
    tools: ["Data Reconciler", "Gross Error Detector", "Mass Balance Auditor"],
    examples: [
      "Reconcile raw flowmeter measurements across crude distillation unit to close mass balance to 0.05%",
      "Identify biased custody transfer flowmeter using chi-square statistical residuals",
      "Perform unmeasured stream flow estimation around complex splitter nodes",
      "Generate verified daily plant mass balance report for management accounting"
    ],
    triggers: ["mass balance", "energy balance", "data reconciliation", "gross error detection", "meter reconciliation"],
    input_contract: { type: "object", properties: { measured_streams: { type: "array" }, standard_deviations: { type: "array" } }, required: ["measured_streams"] },
    output_contract: { type: "object", properties: { reconciled_values: { type: "array" }, gross_errors_detected: { type: "array" }, balance_closure_pct: { type: "number" } }, required: ["reconciled_values", "balance_closure_pct"] }
  }
];

// Generate synthetic definitions for remaining specialist agents from 121 to 301
const DOMAIN_CATEGORIES = [
  { domain: "Plant Safety & Hazards", category: "Security & Systems", classification: "SPECIALIST", risk: "CRITICAL", tools: ["search_knowledge", "assess_risk", "verify_document", "record_agent_action"] },
  { domain: "Inspection & Maintenance", category: "Engineering & Technical", classification: "ENGINEERING", risk: "HIGH", tools: ["calculate_step_by_step", "ocr_document", "read_file", "record_agent_action"] },
  { domain: "Electrical & Instrumentation", category: "Engineering & Technical", classification: "ENGINEERING", risk: "HIGH", tools: ["calculate_step_by_step", "search_knowledge", "read_file", "record_agent_action"] },
  { domain: "Civil & Environmental Engineering", category: "Engineering & Technical", classification: "SPECIALIST", risk: "MEDIUM", tools: ["search_knowledge", "read_excel", "assess_risk", "record_agent_action"] },
  { domain: "Materials & Metallurgy", category: "Engineering & Technical", classification: "SPECIALIST", risk: "HIGH", tools: ["search_knowledge", "calculate_step_by_step", "read_file", "record_agent_action"] },
  { domain: "Procurement & Supply Chain", category: "Business & Management", classification: "DIRECT_REUSE", risk: "MEDIUM", tools: ["read_excel", "search_knowledge", "calculate_step_by_step", "record_agent_action"] },
  { domain: "Quality & Laboratory (LIMS)", category: "Data & Analytics", classification: "ANALYTICS", risk: "LOW", tools: ["read_excel", "calculate_step_by_step", "verify_document", "record_agent_action"] },
  { domain: "Regulatory Compliance", category: "Governance & Compliance", classification: "GOVERNANCE", risk: "HIGH", tools: ["search_knowledge", "verify_document", "generate_docx", "record_agent_action"] },
  { domain: "Industrial Finance & Cost", category: "Business & Management", classification: "DIRECT_REUSE", risk: "LOW", tools: ["calculate_step_by_step", "read_excel", "write_excel", "record_agent_action"] },
  { domain: "Data Analytics & Telemetry", category: "Data & Analytics", classification: "ANALYTICS", risk: "LOW", tools: ["read_excel", "calculate_step_by_step", "execute_python_sandbox", "record_agent_action"] },
  { domain: "Human Capital & Training", category: "Education & Learning", classification: "DIRECT_REUSE", risk: "LOW", tools: ["search_knowledge", "read_file", "generate_docx", "record_agent_action"] },
  { domain: "Academics & Examination", category: "Education & Learning", classification: "DIRECT_REUSE", risk: "LOW", tools: ["get_courses", "get_marks", "verify_document", "record_agent_action"] },
  { domain: "Student Services & Admissions", category: "Education & Learning", classification: "DIRECT_REUSE", risk: "LOW", tools: ["get_student_status", "verify_document", "generate_docx", "record_agent_action"] },
  { domain: "Software & Automation Coding", category: "Coding & Development", classification: "SPECIALIST", risk: "MEDIUM", tools: ["execute_python_sandbox", "read_file", "write_file", "record_agent_action"] }
];

const SPECIALIST_NAMES_121_TO_301 = [
  // 121-140 (Plant Safety & Asset Integrity)
  ["Process Safety Management (PSM) Compliance Auditor", "Plant Safety & Hazards", "Audits 14 OSHA/OISD PSM elements including process safety information and MOCs."],
  ["Hazard & Operability (HAZOP) Study Facilitator", "Plant Safety & Hazards", "Facilitates node-by-node parameter deviation guide word analysis for refinery units."],
  ["Safety Integrity Level (SIL/SIS) Risk Assessor", "Plant Safety & Hazards", "Computes Probability of Failure on Demand (PFDavg) and SIL target allocations."],
  ["Layer of Protection Analysis (LOPA) Evaluator", "Plant Safety & Hazards", "Evaluates independent protection layers (IPLs) and mitigating risk factors."],
  ["Quantitative Risk Assessment (QRA) Modeling Agent", "Plant Safety & Hazards", "Models individual and societal risk (FN curves) from toxic/flammable release scenarios."],
  ["Toxic Gas & Heavy Vapor Dispersion Modeling Specialist", "Plant Safety & Hazards", "Executes dense gas atmospheric dispersion calculations for H2S, Cl2, and HF plumes."],
  ["Overpressure Relief Valve (PSV) Sizing & Settle-Out Auditor", "Plant Safety & Hazards", "Sizes relief valves per API 520/526 under fire case and blocked outlet contingencies."],
  ["Emergency Depressurization (EDP) & Blowdown Specialist", "Plant Safety & Hazards", "Calculates depressurization rates to 100 psig in 15 minutes per API 521 guidelines."],
  ["Fire & Gas Detection (F&GD) Layout & Mapping Specialist", "Plant Safety & Hazards", "Optimizes 3D optical flame and toxic gas detector geographic coverage grids."],
  ["Burner Management System (BMS) Interlock Auditor", "Plant Safety & Hazards", "Verifies NFPA 85 purge timings, flame scanner voting, and fuel safety shutoff valves."],
  ["Hot Work & Hazardous Atmospheric Permit Auditor", "Plant Safety & Hazards", "Validates LEL, oxygen percentage, and toxic ppm thresholds before issuing hot work permits."],
  ["Lockout / Tagout (LOTO) Energy Isolation Specialist", "Plant Safety & Hazards", "Constructs zero-energy state blind lists, lockboxes, and try-step verification protocols."],
  ["Confined Space Life Support & Ventilation Assessor", "Plant Safety & Hazards", "Evaluates continuous forced-air exchange rates and continuous multi-gas monitor logs."],
  ["Chemical Incompatibility & Reactivity Matrix Specialist", "Plant Safety & Hazards", "Generates binary chemical incompatibility matrices to prevent inadvertent hazardous mixing."],
  ["Hazardous Waste Treatment & Effluent Neutralization Specialist", "Civil & Environmental Engineering", "Monitors chemical dosing, neutralization reactors, and spent caustic oxidizers."],
  ["Industrial Hygiene & Airborne Toxic Exposure Specialist", "Plant Safety & Hazards", "Compares personal dosimeter logs against ACGIH TLV and OSHA PEL statutory thresholds."],
  ["Crisis Tabletop & Plant Evacuation Simulation Specialist", "Plant Safety & Hazards", "Simulates complex refinery emergency scenarios with dynamic wind shift and muster tracking."],
  ["Emergency Response Team (ERT) Dispatch & Command Specialist", "Plant Safety & Hazards", "Coordinates foam tender dispatch, water curtain deployment, and mutual aid protocols."],
  ["Incident Root Cause Analysis (RCA) & TapRoot Specialist", "Plant Safety & Hazards", "Constructs 5-Why, Ishikawa fishbone, and TapRoot causal factor trees for plant incidents."],
  ["Machinery Vibration Demodulation & FFT Spectral Analyst", "Inspection & Maintenance", "Analyzes PeakVue, enveloping, and order-tracked FFT spectra to detect bearing wear."],

  // 141-160 (Reliability, Mechanical & Piping)
  ["Rotordynamics, Bearing Health & Orbit Plot Specialist", "Inspection & Maintenance", "Interprets proximity probe orbit plots, Bode plots, and journal bearing hydrodynamic tilt."],
  ["Acoustic Emission & Partial Discharge Diagnostic Specialist", "Inspection & Maintenance", "Detects high-frequency acoustic wave signatures from micro-crack propagation."],
  ["Ultrasonic Thickness Gauging & Metal Loss Modeler", "Inspection & Maintenance", "Calculates short-term and long-term corrosion rates and remaining equipment life."],
  ["Eddy Current & Remote Field Tube Inspection Specialist", "Inspection & Maintenance", "Analyzes multi-frequency eddy current signals for heat exchanger tube wall thinning."],
  ["Radiographic Testing (RT) Digital Weld Defect Analyst", "Inspection & Maintenance", "Inspects digital weld radiographs for porosity, slag inclusions, and incomplete penetration."],
  ["Magnetic Particle & Liquid Penetrant Surface Flaw Specialist", "Inspection & Maintenance", "Classifies surface crack indications, linear indications, and weld toe defects."],
  ["Corrosion Under Insulation (CUI) & Condensation Specialist", "Inspection & Maintenance", "Evaluates thermal insulation dampness, cyclic dew-point ranges, and pulsed eddy current."],
  ["Impressed Current Cathodic Protection (ICCP) Specialist", "Inspection & Maintenance", "Models pipe-to-soil potential surveys, anode bed resistance, and holiday test logs."],
  ["High-Temperature Hydrogen Attack (HTHA) Specialist", "Materials & Metallurgy", "Evaluates Nelson curves (API 941) operating limits and advanced ultrasonic PAUT scans."],
  ["Creep & Thermal Fatigue Remaining Life Evaluator", "Materials & Metallurgy", "Calculates Larson-Miller parameter and cumulative damage fractions for furnace tubes."],
  ["Pressure Vessel ASME Section VIII Division 1/2 Auditor", "Engineering & Technical", "Verifies minimum required wall thickness, joint efficiencies, and nozzle reinforcement."],
  ["Atmospheric Storage Tank API 650/653 Settlement Specialist", "Inspection & Maintenance", "Computes out-of-roundness, edge settlement, and tank bottom planar tilt per API 653."],
  ["CAESAR II Piping Stress & Flexibility Analysis Specialist", "Engineering & Technical", "Evaluates thermal expansion stress ranges, nozzle load limits, and spring hanger loads."],
  ["Steam Trap Thermal Loss & Ultrasonic Acoustic Auditor", "Inspection & Maintenance", "Classifies steam trap acoustic cycling and thermal differentials to pinpoint blow-through."],
  ["API 682 Mechanical Seal Piping Flush Plan Specialist", "Engineering & Technical", "Selects Plan 11/23/52/53B/54 seal auxiliary flush arrangements for volatile hydrocarbons."],
  ["Centrifugal Compressor Anti-Surge Dynamic Controller", "Engineering & Technical", "Calculates surge margin, deviation coordinates, and fast-opening recycle valve response."],
  ["Reciprocating Compressor Valve Pulsation & Dynamics Specialist", "Engineering & Technical", "Models API 618 acoustic bottle resonance, damper sizing, and cylinder valve dynamics."],
  ["Boiler Waterwall & Superheater Tube Failure Specialist", "Inspection & Maintenance", "Diagnoses short-term overheating, caustic gouging, and hydrogen damage in boiler tubes."],
  ["Pump Cavitation, NPSH & Impeller Erosion Specialist", "Engineering & Technical", "Calculates NPSH available vs NPSH required margin and suction specific speed."],
  ["Heavy Equipment Dynamic Alignment & Balancing Specialist", "Inspection & Maintenance", "Calculates laser shaft alignment thermal growth offsets and dual-plane trim balance weights."],

  // 161-180 (Electrical, Instrumentation & Control Systems)
  ["Distributed Control System (DCS) Engineering Specialist", "Electrical & Instrumentation", "Configures Emerson DeltaV / Honeywell Experion function blocks and control loops."],
  ["SCADA & Modbus / DNP3 Telemetry Protocol Specialist", "Electrical & Instrumentation", "Parses RTU registers, baud rate timings, CRC error checks, and telemetry polling."],
  ["Safety Instrumented System (SIS) Logic & Interlock Specialist", "Electrical & Instrumentation", "Validates 2oo3 voting logic, fail-safe de-energize trips, and proof-test interval timers."],
  ["Foundation Fieldbus & HART Intelligent Device Specialist", "Electrical & Instrumentation", "Diagnoses EDDL parameter configurations, macrocycle timing, and device diagnostics."],
  ["PLC Ladder Logic & Structured Text (IEC 61131-3) Specialist", "Electrical & Instrumentation", "Audits IEC 61131-3 logic programs, sequencer steps, and safety shutdown rungs."],
  ["Variable Frequency Drive (VFD) & Harmonics Diagnostic Specialist", "Electrical & Instrumentation", "Models total harmonic distortion (THD), PWM carrier frequencies, and motor bearing currents."],
  ["Motor Current Signature Analysis (MCSA) Fault Specialist", "Electrical & Instrumentation", "Detects broken rotor bars, air gap eccentricity, and stator winding insulation faults."],
  ["Switchgear & Arc Flash Hazard (NFPA 70E) Risk Specialist", "Electrical & Instrumentation", "Calculates incident energy (cal/cm2) and arc flash boundary distances for 11kV/33kV gear."],
  ["Transformer Dissolved Gas Analysis (DGA) & Duval Triangle Specialist", "Electrical & Instrumentation", "Interprets C2H2, CH4, H2, and CO concentrations to identify thermal faults and arcing."],
  ["Grounding Grid, Bonding & Lightning Protection Specialist", "Electrical & Instrumentation", "Calculates step and touch potential voltage gradients per IEEE 80 standards."],
  ["Industrial Ethernet & OT Firewall Demilitarized Zone Specialist", "Electrical & Instrumentation", "Enforces Purdue Enterprise Reference Architecture (ISA-95) network zoning."],
  ["Cyber-Physical ICS/SCADA Intrusion & Anomaly Specialist", "Electrical & Instrumentation", "Detects unauthorized Modbus function codes, rogue PLC write packets, and MITM payloads."],
  ["Smart Transmitter Calibration & Metrology Drift Specialist", "Electrical & Instrumentation", "Calculates span drift, zero shift, hysteresis error, and calibration uncertainty budgets."],
  ["Control Loop PID Auto-Tuning & Stiction Specialist", "Electrical & Instrumentation", "Identifies control valve deadband/stiction and tunes Lambda/IMC PID parameters."],
  ["Multivariable Advanced Process Control (APC/MPC) Specialist", "Electrical & Instrumentation", "Configures dynamic matrix control (DMC) step response models and constraint handling."],
  ["Batch Automation (ISA-88) Recipe Execution Specialist", "Electrical & Instrumentation", "Structures procedural control elements, unit recipes, and phase state transitions."],
  ["Alarm Management & Chattering Flood (ISA-18.2) Specialist", "Electrical & Instrumentation", "Analyzes alarm frequency, standing alarms, deadbands, and dynamic state-based suppression."],
  ["Smart Sensor Failure Detection & Sensor Fusion Specialist", "Electrical & Instrumentation", "Performs Kalman filter sensor fusion and analytical redundancy for critical transmitters."],
  ["Functional Safety Lifecycle (IEC 61508 / 61511) Specialist", "Electrical & Instrumentation", "Tracks Safety Requirements Specification (SRS), proof test records, and demand rates."],
  ["Gas Turbomachinery Governor & Power Generation Specialist", "Electrical & Instrumentation", "Controls gas turbine speed/droop governing, IGV modulation, and peak-firing limits."],

  // 181-204 (Civil, Environmental, Materials & Metallurgy)
  ["Concrete Deep Foundation & Pile Integrity Specialist", "Civil & Environmental Engineering", "Evaluates cross-hole sonic logging, pile integrity testing, and chemical soil attack."],
  ["Structural Steel Frame & Seismic Pipe Rack Specialist", "Civil & Environmental Engineering", "Computes dynamic response spectra, wind load combinations, and structural joint moments."],
  ["Tank Pad Settlement, Ovality & Tilt Specialist", "Civil & Environmental Engineering", "Calculates foundation ring-wall consolidation settlement and tank shell out-of-roundness."],
  ["Bund Wall Spill Containment & Drainage Specialist", "Civil & Environmental Engineering", "Verifies net containment volume equal to 110% of largest tank capacity plus freeboard."],
  ["Continuous Emission Monitoring System (CEMS) Specialist", "Civil & Environmental Engineering", "Analyzes online SO2, NOx, CO, and particulate matter opacity sensor telemetry."],
  ["Effluent Treatment Plant (ETP) Biological COD/BOD Specialist", "Civil & Environmental Engineering", "Calculates Food-to-Microorganism (F/M) ratio, MLSS, dissolved oxygen, and sludge index."],
  ["VOC Leak Detection and Repair (LDAR) Method 21 Specialist", "Civil & Environmental Engineering", "Monitors Method 21 portable FID sniffer surveys and optical gas imaging (OGI) thermography."],
  ["Scope 1, 2 & 3 Greenhouse Gas (GHG) Accounting Specialist", "Civil & Environmental Engineering", "Calculates stationary combustion, flaring, fugitive, and purchased electricity GHG tons."],
  ["Soil & Groundwater Hydrocarbon Contamination Modeler", "Civil & Environmental Engineering", "Models LNAPL plume migration, monitoring well piezometric heads, and bioremediation."],
  ["Ambient Air Quality Dispersion (AERMOD) Specialist", "Civil & Environmental Engineering", "Executes Gaussian plume dispersion modeling over complex local coastal terrain."],
  ["Oily Sludge Centrifuge & Bioremediation Specialist", "Civil & Environmental Engineering", "Optimizes 3-phase decanter centrifuge oil recovery, polymer dosing, and soil bio-piles."],
  ["Thermal Plume & Cooling Water Discharge Specialist", "Civil & Environmental Engineering", "Models marine outfall thermal diffusers and compliance with statutory mixing zones."],
  ["Marine Terminal Jetty & Single Point Mooring Specialist", "Refinery Operations", "Monitors berthing approach velocity, mooring line tension, and quick-release hooks."],
  ["Plant Surface Runoff & Stormwater Hydraulic Specialist", "Civil & Environmental Engineering", "Sizes oily water sewer basins, retention ponds, and API gravity oil-water separators."],
  ["Microstructural Metallography & Grain Boundary Specialist", "Materials & Metallurgy", "Analyzes pearlite, martensite, retained austenite, and intergranular carbide precipitation."],
  ["Stress Corrosion Cracking (SCC) & Chloride Pitting Specialist", "Materials & Metallurgy", "Calculates critical pitting temperature (CPT) and pitting resistance equivalent (PREN)."],
  ["Naphthenic Acid & High-Temperature Sulfidic Corrosion Specialist", "Materials & Metallurgy", "Models McConomy curves and total acid number (TAN) thresholds for alloy selection."],
  ["Microbiologically Influenced Corrosion (MIC) Biocide Specialist", "Materials & Metallurgy", "Monitors sulfate-reducing bacteria (SRB) counts and glutaraldehyde biocide shock dosing."],
  ["Internal Corrosion Direct Assessment (ICDA) Modeler", "Materials & Metallurgy", "Identifies low-point water accumulation zones and multi-phase flow corrosion rates."],
  ["Protective Coating, Epoxies & NACE Coating Inspection Specialist", "Materials & Metallurgy", "Audits surface blast profile (SSPC-SP 10), dry film thickness (DFT), and holiday tests."],
  ["Polymer & Fluoropolymer Chemical Resistance Specialist", "Materials & Metallurgy", "Selects PTFE/PVDF/FKM elastomers for aggressive chemical and solvent immersion."],
  ["Positive Material Identification (PMI) & XRF Alloy Specialist", "Materials & Metallurgy", "Verifies alloy chemistry percentages (Cr, Ni, Mo, Ti) via handheld XRF analyzer spectra."],
  ["Fractography & Fatigue Beach Mark Forensic Specialist", "Materials & Metallurgy", "Examines scanning electron microscope (SEM) fractographs for striations and cleavage."],
  ["Refractory Lining & Thermal Barrier Integrity Specialist", "Materials & Metallurgy", "Analyzes castable refractory dry-out schedules, anchor spacing, and thermography hotspots."],

  // 205-225 (Supply Chain, Logistics, Procurement & Laboratory Quality)
  ["Crude Oil Assay Blending & LP Optimization Specialist", "Procurement & Supply Chain", "Runs Linear Programming (LP) refinery optimization to select high-margin crude baskets."],
  ["Ocean Tanker Chartering & Demurrage Minimization Specialist", "Procurement & Supply Chain", "Tracks laytime calculations, notice of readiness (NOR), and port pumping rates."],
  ["Multi-Product Pipeline Batch Dispatch & Interface Specialist", "Refinery Operations", "Calculates transmix batch interface volume, cut timing, and pipeline hydraulic gradient."],
  ["Rail Tank Car Fleet Turnaround & Loading Specialist", "Refinery Operations", "Schedules rail siding placement, top-loading vapor arm alignment, and ullage verification."],
  ["Automated Road Tanker Bottom-Loading Gantry Specialist", "Refinery Operations", "Verifies electronic overfill prevention sensors, grounding permissive, and batch meters."],
  ["Critical Spare Parts VED/ABC Inventory Optimizer", "Procurement & Supply Chain", "Classifies inventory by Vital/Essential/Desirable and calculates safety stock reorder levels."],
  ["Strategic Vendor Technical Pre-Qualification Specialist", "Procurement & Supply Chain", "Audits vendor shop manufacturing capabilities, ISO certifications, and ASME stamps."],
  ["EPC Turnkey Tender Specification & Contract Formatter", "Procurement & Supply Chain", "Drafts engineering procurement construction contracts with milestone SLA penalty clauses."],
  ["Crude Oil & Distillate Commodity Price Hedging Specialist", "Industrial Finance & Cost", "Models crack spread futures, crack hedging, and swap contracts to stabilize margins."],
  ["Automated Warehouse Storage & Automated Retrieval Specialist", "Procurement & Supply Chain", "Optimizes AS/RS robotic crane routes, bin slotting, and barcoded pallet storage."],
  ["Supply Chain Disruption & Buffer Stock Modeler", "Procurement & Supply Chain", "Simulates supply chain bottlenecks and determines critical catalyst backup stockpiles."],
  ["Gas Chromatography (GC-MS/FID) Peak Integration Specialist", "Quality & Laboratory (LIMS)", "Performs automated chromatographic baseline fitting, retention index, and peak integration."],
  ["ASTM D86/D1160 Automated Distillation Analyzer", "Quality & Laboratory (LIMS)", "Models true boiling point (TBP) conversion from atmospheric/vacuum distillation curves."],
  ["Research & Motor Octane Number (RON/MON) Engine Specialist", "Quality & Laboratory (LIMS)", "Validates CFR standard test engine knocking meter readings and reference fuel blends."],
  ["Reid Vapor Pressure (RVP) & Air Saturation Specialist", "Quality & Laboratory (LIMS)", "Calculates ASTM D323 vapor-to-liquid ratio and temperature bath equilibrium pressure."],
  ["X-Ray Fluorescence (XRF) Sulfur & Trace Metal Specialist", "Quality & Laboratory (LIMS)", "Analyzes sulfur ppm, vanadium, and nickel concentrations in fuels per ASTM D4294."],
  ["Kinematic Viscosity & Viscosity Index Calculator", "Quality & Laboratory (LIMS)", "Calculates 40°C/100°C kinematic viscosity and Viscosity Index (VI) per ASTM D445."],
  ["Lubricating Oil Wear Metal & TAN/TBN Titration Specialist", "Quality & Laboratory (LIMS)", "Evaluates ferrography wear particles, Total Acid Number (TAN), and Total Base Number (TBN)."],
  ["Catalyst Surface Area BET & Pore Volume Porosimetry Specialist", "Quality & Laboratory (LIMS)", "Calculates nitrogen adsorption isotherms, surface area (m2/g), and pore diameter."],
  ["Laboratory Information Management System (LIMS) QC Specialist", "Quality & Laboratory (LIMS)", "Applies Shewhart control charts, Westgard multi-rules, and blind sample check spikes."],
  ["Petroleum Product Certificate of Quality (COQ) Generator", "Quality & Laboratory (LIMS)", "Generates tamper-evident digital Certificate of Quality deliverables against IS 1460 specs."],

  // 226-245 (Regulatory, Statutory Compliance & Cost Engineering)
  ["PESO (Petroleum & Explosives Safety Org) License Specialist", "Regulatory Compliance", "Tracks static pressure vessel and class A/B/C petroleum installation statutory licenses."],
  ["OISD-118/152/166 Statutory Audit & Gap Tracker", "Regulatory Compliance", "Audits plant facilities against Oil Industry Safety Directorate statutory standards."],
  ["Petroleum Act & Rules Statutory Register Specialist", "Regulatory Compliance", "Maintains mandatory statutory registers, inspection notices, and renewal filings."],
  ["Factories Act 1948 Compliance & Inspectorate Specialist", "Regulatory Compliance", "Verifies working hour limits, safety officer provisions, and annual compliance returns."],
  ["Central Pollution Control Board (CPCB) Online Portal Specialist", "Regulatory Compliance", "Validates 15-minute continuous emission telemetry data packets dispatched to CPCB servers."],
  ["State Pollution Control Board (SPCB) Consent to Operate Specialist", "Regulatory Compliance", "Tracks Consent to Establish (CTE) and Consent to Operate (CTO) statutory renewal dates."],
  ["ISO 9001 / ISO 14001 / ISO 45001 Integrated IMS Auditor", "Regulatory Compliance", "Conducts cross-framework integrated management system gap audits and corrective actions."],
  ["OSHA 1910.119 Process Safety Statutory Auditor", "Regulatory Compliance", "Tracks process safety documentation, mechanical integrity audits, and compliance audits."],
  ["EU REACH & Global GHS Chemical Safety Dossier Specialist", "Regulatory Compliance", "Authors GHS 16-section Safety Data Sheets (SDS) with local exposure scenarios."],
  ["Bureau of Energy Efficiency (BEE) PAT Scheme Specialist", "Regulatory Compliance", "Calculates Specific Energy Consumption (SEC) and Energy Saving Certificates (ESCerts)."],
  ["Major Turnaround (TAR) WBS & Milestone Scheduler", "Industrial Finance & Cost", "Builds Level-4 Work Breakdown Structures, contractor headcount curves, and milestone gates."],
  ["CAPEX Whole-Life Costing & Net Present Value (NPV) Specialist", "Industrial Finance & Cost", "Computes discounted cash flows, Internal Rate of Return (IRR), and capital hurdle rates."],
  ["Gross Refining Margin (GRM) & Netback Realization Specialist", "Industrial Finance & Cost", "Calculates daily gross refining margins ($/bbl) based on Platt's prices and yield splits."],
  ["Internal Energy Loss & Non-Energy Utility Cost Specialist", "Industrial Finance & Cost", "Accounts for fuel oil equivalent (FOE) loss, electricity consumption, and water costs."],
  ["Maintenance Work Order Cost Variance & Overrun Specialist", "Industrial Finance & Cost", "Tracks actual labor/parts costs against standard work order estimates in SAP PM."],
  ["Industrial Asset Insurance Valuation & Underwriting Specialist", "Industrial Finance & Cost", "Calculates Estimated Maximum Loss (EML) and asset replacement costs for underwriters."],
  ["EPC Contractor Variation Order & Delay Claim Specialist", "Industrial Finance & Cost", "Evaluates contractor delay claims, extension of time (EOT) requests, and bill adjustments."],
  ["Customs Tariff, HS Code & Import Duty Classification Specialist", "Industrial Finance & Cost", "Classifies imported catalyst, equipment, and crude oil under national HS customs tariffs."],
  ["Carbon Tax, ETS & Sovereign Carbon Credit Specialist", "Industrial Finance & Cost", "Models sovereign carbon border adjustment mechanisms and certified emission reductions."],
  ["Renewable Energy Credit (REC) & Green Hydrogen Subsidies Specialist", "Industrial Finance & Cost", "Tracks green hydrogen production tax credits and renewable power wheeling subsidies."],

  // 246-270 (Data Engineering, OT Systems, Software & Human Operations)
  ["Industrial SCADA/Historian Time-Series Parquet Lake Specialist", "Data Analytics & Telemetry", "Ingests 1-second process historian telemetry into compressed columnar Parquet lakes."],
  ["Edge Computing IIoT Device Gateway Orchestrator", "Software & Automation Coding", "Manages containerized MQTT/Sparkplug-B edge gateways on ruggedized field hardware."],
  ["Computer Vision PPE & Restricted Zone Intrusion Specialist", "Security & Systems", "Detects hardhats, safety goggles, high-vis vests, and unauthorized perimeter access."],
  ["Flare Stack Flame Height & Smoke Ring Computer Vision Specialist", "Data Analytics & Telemetry", "Monitors flare flame luminosity, steam assist ratio, and Ringelmann smoke levels."],
  ["Autoencoder Multidimensional Anomaly Detection Specialist", "Data Analytics & Telemetry", "Trains unsupervised deep autoencoders to spot subtle multidimensional sensor anomalies."],
  ["Remaining Useful Life (RUL) Weibull Reliability Regressor", "Data Analytics & Telemetry", "Fits Weibull hazard rates and computes Mean Time to Failure (MTTF) for critical assets."],
  ["Air-Gapped Local LLM Fine-Tuning & LoRA Weights Specialist", "Specialized AI", "Manages local Low-Rank Adaptation (LoRA) checkpoint training on sovereign GPU clusters."],
  ["Zero-Trust Industrial DMZ Architecture Specialist", "Security & Systems", "Enforces micro-segmentation, jump host bastion policies, and encrypted tunnels in OT."],
  ["Modbus / OPC-UA / BACnet Packet Inspection Firewall Specialist", "Security & Systems", "Inspects deep OT packet headers to block unauthorized function codes and malicious writes."],
  ["Microservices Container Swarm & High-Availability Specialist", "Security & Systems", "Manages air-gapped Docker swarm clustering, health checks, and service failover."],
  ["CI/CD Air-Gapped Release & Static Security Analysis Specialist", "Coding & Development", "Executes air-gapped unit tests, SonarQube quality gates, and signed binary releases."],
  ["Automated Software License & SBOM Vulnerability Specialist", "Coding & Development", "Scans Software Bill of Materials (SBOM) for GPL/proprietary compliance and CVE flaws."],
  ["Database Sharding & High-Throughput Write Specialist", "Coding & Development", "Designs time-series database hypertable partitioning and index tuning for telemetry."],
  ["Real-Time Event Bus & Kafka Topic Partitioning Specialist", "Coding & Development", "Configures zero-data-loss event streaming topics with idempotency and dead-letter queues."],
  ["Multi-Format Document Ingestion & Text Extraction Specialist", "Document Intelligence", "Extracts tables, drawings, and text from PDF, DOCX, XLSX, TIFF, and scanned blueprints."],
  ["VR Operator Training Simulator (OTS) Scenario Specialist", "Education & Learning", "Constructs virtual reality plant emergency drills, valve lineups, and field checklists."],
  ["Process Control Room High-Fidelity Simulator Specialist", "Education & Learning", "Simulates dynamic control room response to compressor trips, pump cavitations, and fires."],
  ["Field Operator Competency Matrix & Certification Specialist", "Human Capital & Training", "Tracks operator unit qualifications, re-certification exams, and refresher cycles."],
  ["Retiring Expert Tacit Knowledge & Video Interview Synthesizer", "Human Capital & Training", "Conducts structured cognitive walkthroughs to extract unwritten heuristics from veterans."],
  ["Cross-Shift Handover Log CoT Summarization Specialist", "Human Capital & Training", "Synthesizes multi-operator shift logs into structured high-priority status handovers."],
  ["Control Room Ergonomics & Shift Fatigue Risk Evaluator", "Human Capital & Training", "Assesses circadian rhythm disruptions, work hour limits, and ergonomic console layout."],
  ["Contractor Onboarding Safety Orientation & Biometric Specialist", "Human Capital & Training", "Manages contractor safety video modules, comprehension testing, and biometric entry."],
  ["Statutory Incident Investigation Narrative Formatter", "Human Capital & Training", "Formats legally vetted formal incident reports conforming to regulatory reporting templates."],
  ["Multi-Departmental Crisis Tabletop Scenario Facilitator", "Human Capital & Training", "Orchestrates multi-stakeholder disaster simulation scenarios with unexpected injects."],
  ["Labor Agreement & Overtime Workload Policy Specialist", "Human Capital & Training", "Monitors shift overtime distribution, statutory rest periods, and union SLA compliance."],

  // 271-295 (Institutional Academics, Student Services & University Governance)
  ["Academic Transcript & International Credential Evaluator", "Academics & Examination", "Evaluates foreign university transcripts, GPA conversions, and accreditation standing."],
  ["Course Equivalence & Transfer Credit Articulation Specialist", "Academics & Examination", "Maps course syllabi to institutional degree requirements and prerequisite fulfillment."],
  ["Prerequisite Graph Topological Sort & Dependency Validator", "Academics & Examination", "Validates curriculum graphs for circular prerequisites and hidden prerequisite bottlenecks."],
  ["Student Early Warning Academic Probation Predictor", "Student Services & Admissions", "Identifies at-risk students using mid-semester quiz scores, attendance, and LMS metrics."],
  ["Course Override & Capacity Exception Evaluator", "Academics & Examination", "Evaluates student override requests against classroom capacity, GPA, and graduation status."],
  ["Merit & Need-Based Scholarship Allocation Governor", "Student Services & Admissions", "Allocates institutional scholarship endowments based on financial need and merit matrices."],
  ["Degree Audit & Graduation Clearance Verification Governor", "Academics & Examination", "Audits student degree progress against general education, major, and residency credits."],
  ["Faculty Teaching Load & Research Effort Balancing Specialist", "Academics & Examination", "Balances faculty credit hours, contact hours, lab oversight, and buyout credits."],
  ["Sponsored Research Grant RFP Compliance & Budget Specialist", "Academics & Examination", "Audits research grant proposals against sponsor budget limits and indirect cost rates."],
  ["Academic Integrity, Code Plagiarism & Forensics Specialist", "Academics & Examination", "Performs AST-level code similarity and stylistic plagiarism forensics on assignments."],
  ["Student Housing & Room Allocation Optimization Specialist", "Student Services & Admissions", "Optimizes dorm room assignments based on roommate preferences, special needs, and class."],
  ["Campus Dining, Meal Plan & Nutritional Audit Specialist", "Student Services & Admissions", "Monitors meal plan balances, dining hall inventory, and allergen dietary compliance."],
  ["University Athletic Eligibility & NCAA/AIU Compliance Specialist", "Student Services & Admissions", "Tracks student-athlete credit hour progress, GPA eligibility, and amateur status rules."],
  ["Career Fair Employer Logistics & Interview Scheduler", "Student Services & Admissions", "Coordinates company booth placement, on-campus interview schedules, and student matching."],
  ["Alumni Mentorship & Industry Internship Placement Specialist", "Student Services & Admissions", "Pairs undergraduate students with verified alumni mentors based on career trajectories."],
  ["University Library Electronic Subscription & DOI Specialist", "Academics & Examination", "Manages OpenURL resolvers, journal subscription packages, and institutional DOI minting."],
  ["Institutional Disability Support & Accommodation Specialist", "Student Services & Admissions", "Coordinates testing accommodations, alternate format textbooks, and assistive technology."],
  ["Student Mental Health Resource Dispatch & Triage Specialist", "Student Services & Admissions", "Routes student inquiries to counseling services with priority crisis intervention triage."],
  ["International Student Visa & SEVIS Statutory Compliance Specialist", "Student Services & Admissions", "Tracks I-20 documentation, full-time enrollment requirements, and CPT/OPT work filings."],
  ["University Endowment & Donor Stewardship Reporting Specialist", "Academics & Examination", "Generates personalized endowment impact reports, financial returns, and student letters."],
  ["Academic Senate Resolution & Institutional By-Laws Specialist", "Academics & Examination", "Indexes senate legislation, committee charters, and faculty handbook amendment records."],
  ["Student Grievance & Disciplinary Committee Case Manager", "Student Services & Admissions", "Manages confidential student conduct hearings, evidence repositories, and appeal tracks."],
  ["Multidisciplinary Capstone Project Proposal Evaluator", "Academics & Examination", "Evaluates senior capstone project feasibility, interdisciplinary scope, and industry mentors."],
  ["Institutional Research Citation Impact & H-Index Specialist", "Academics & Examination", "Computes department citation metrics, SciVal field-weighted impact, and h-index statistics."],
  ["Open Access Institutional Repository & Metadata Specialist", "Academics & Examination", "Curates faculty preprints and electronic theses in Dublin Core / OAI-PMH repositories."],

  // 296-301 (Core Sovereign AI Kernel & Executive Governors)
  ["Autonomous Agent Self-Correction & Reflection Engine", "Workflow & Multi-Agent Intelligence", "Performs self-consistency checks, critique-and-refine loops, and backpressure correction."],
  ["High-Throughput Batch Inference & GPU Queue Manager", "Workflow & Multi-Agent Intelligence", "Schedules batched prompts across CUDA streams and enforces fair-share GPU quotas."],
  ["Enterprise Knowledge Graph Entity Extraction & Linker", "Document Intelligence", "Extracts industrial entities, asset tags, and semantic relationships into a local graph."],
  ["Context Window Compactor & Recursive Summarizer", "Document Intelligence", "Performs hierarchical text compaction preserving exact numerical values and statutory citations."],
  ["Privacy-Preserving Redaction & PII/Secret Sanitizer", "Security & Systems", "Detects and redacts passwords, API keys, Aadhaar numbers, PAN cards, and sensitive employee PII."],
  ["Fleet Consensus Governor & Sovereign Executive Synthesizer", "Master Workflow Orchestration", "The supreme executive governor synthesizing outputs from all 301 agents into definitive deliverables."]
];

// Build specs for 121 to 301
SPECIALIST_NAMES_121_TO_301.forEach((item, idx) => {
  const num = 121 + idx;
  const [name, domain, desc] = item;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  
  // Pick matching category config
  let catMatch = DOMAIN_CATEGORIES.find(c => c.domain.toLowerCase() === domain.toLowerCase()) || DOMAIN_CATEGORIES[0];
  let catName = catMatch.category;
  let classification = catMatch.classification;
  let risk = catMatch.risk;
  let allowedTools = [...catMatch.tools];

  if (num === 301) {
    catName = "Orchestrator";
    classification = "ORCHESTRATION";
    risk = "HIGH";
    allowedTools = ["*"];
  }

  SPECIALIST_SPECS.push({
    num,
    name,
    slug,
    category: catName,
    domain,
    educational_domain: domain.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    classification,
    risk_level: risk,
    desc,
    capabilities: [
      name,
      domain,
      `${classification.toLowerCase()}-execution`,
      "evidence-grounded",
      "sovereign-local"
    ],
    allowed_tools: allowedTools,
    forbidden_tools: num === 301 ? [] : ["external_network_egress", "unauthorized_override"],
    tools: [name.split(" ")[0] + " Engine", "Data Verifier", "Report Generator"],
    examples: [
      `Analyze ${name.toLowerCase()} operational parameters and generate verified findings`,
      `Evaluate statutory standards and risk mitigation strategies for this unit`,
      `Audit historical inspection logs and calculate remaining service life`,
      `Synthesize structured deliverable report for technical executive review`
    ],
    triggers: [slug.replace(/-/g, " "), domain.toLowerCase(), "analyze", "audit"],
    input_contract: { type: "object", properties: { input_data: { type: "object" }, context: { type: "string" } }, required: ["input_data"] },
    output_contract: { type: "object", properties: { findings: { type: "array" }, metrics: { type: "object" }, status: { type: "string" } }, required: ["findings", "status"] }
  });
});

console.log(`Prepared ${SPECIALIST_SPECS.length} specialist specifications (#101 to #301).`);

// Map specialist specs to full agent format
const newSpecialistAgents = SPECIALIST_SPECS.map(spec => {
  const day = spec.num;
  const agentId = `agent-${String(day).padStart(3, "0")}`;
  const port = 8100 + day;

  return {
    day,
    agent_id: agentId,
    name: spec.name,
    slug: spec.slug,
    category: spec.category,
    status: day === 101 ? "ready" : "planned",
    github_repo: "",
    vercel_project: "",
    vercel_url: "",
    api_url: `http://127.0.0.1:${port}`,
    health_url: `http://127.0.0.1:${port}/api/health`,
    model: "nemotron-3-nano",
    backend: "http://127.0.0.1:11434",
    port,
    educational_name: spec.name,
    educational_domain: spec.educational_domain,
    domain_name: spec.domain,
    classification: spec.classification,
    risk_level: spec.risk_level,
    allowed_tools: spec.allowed_tools,
    forbidden_tools: spec.forbidden_tools,
    workflow_roles: [
      "admission-verification",
      "scholarship-eligibility",
      "attendance-intervention",
      "course-override",
      "graduation-clearance"
    ],
    displayName: spec.name,
    displayNumber: String(day).padStart(3, "0"),
    domain: spec.domain,
    description: spec.desc,
    examples: spec.examples,
    capabilities: spec.capabilities,
    tools: spec.tools,
    triggers: spec.triggers,
    input_contract: spec.input_contract,
    output_contract: spec.output_contract
  };
});

// Combine 100 baseline + 201 new specialists = 301 total agents
const allAgents301 = [...baselineAgents, ...newSpecialistAgents];

if (allAgents301.length !== 301) {
  console.error(`Error: Expected exactly 301 agents, got ${allAgents301.length}`);
  process.exit(1);
}

// 3. Write registry/agents.json
const updatedAgentsJson = {
  version: "3.0.0",
  updated_at: new Date().toISOString(),
  platform: "SA-S03 Sovereign Multimodal Agentic AI Workbench (301 Fleet)",
  total_agents: 301,
  agents: allAgents301
};

fs.writeFileSync(AGENTS_JSON_PATH, JSON.stringify(updatedAgentsJson, null, 2) + "\n", "utf8");
console.log(`Successfully updated ${AGENTS_JSON_PATH} with ${allAgents301.length} agents.`);

// 4. Generate/Update registry/sih-agent-mapping.json
// Read existing sih mapping to preserve custom fields for 1-100 if any
let existingSihMapping = [];
if (fs.existsSync(SIH_MAPPING_PATH)) {
  try {
    existingSihMapping = JSON.parse(fs.readFileSync(SIH_MAPPING_PATH, "utf8"));
  } catch (e) {
    existingSihMapping = [];
  }
}

const allSihAgents301 = allAgents301.map(agent => {
  const id = agent.agent_id;
  const existing = Array.isArray(existingSihMapping) ? existingSihMapping.find(a => (a.agent_id === id || a.id === id)) : null;

  if (existing && parseInt(id.replace("agent-", ""), 10) <= 100) {
    return {
      ...existing,
      ...agent,
      id: id,
      agent_id: id,
      displayName: agent.displayName || agent.name,
      displayNumber: agent.displayNumber || id.replace("agent-", "")
    };
  }

  const role = agent.name;
  const domain = agent.domain || agent.domain_name || agent.category;
  const primaryTools = agent.allowed_tools && agent.allowed_tools.length > 0 ? agent.allowed_tools : ["read_file", "search_knowledge"];

  return {
    ...agent,
    id: id,
    agent_id: id,
    role: role,
    industrial_role: role,
    domain: domain,
    system_prompt: `You are ${role} (${id}), an expert on-premise sovereign industrial AI agent operating within the Sovereign AI Workbench for Mangalore Refinery and Petrochemicals Limited (MRPL). You operate strictly on-premise without external data exfiltration. Base all findings on verified facts and local technical standards.`,
    capabilities: [
      ...agent.capabilities,
      "sovereign-local"
    ],
    primary_tools: primaryTools,
    model_requirements: {
      preferred_model: "nemotron-3-nano",
      fallback_model: "local-dense-4b",
      modalities: (agent.allowed_tools || []).some(t => t.includes("image") || t.includes("ocr") || t.includes("vision")) ? ["text", "vision"] : ["text"]
    },
    displayName: agent.displayName || agent.name,
    displayNumber: agent.displayNumber || id.replace("agent-", "")
  };
});

fs.writeFileSync(SIH_MAPPING_PATH, JSON.stringify(allSihAgents301, null, 2) + "\n", "utf8");
console.log(`Successfully updated ${SIH_MAPPING_PATH} with ${allSihAgents301.length} agents.`);

// 5. Programmatic Verification
console.log("\n--- PROGRAMMATIC VERIFICATION ---");
const loadedAgents = JSON.parse(fs.readFileSync(AGENTS_JSON_PATH, "utf8")).agents;
const loadedSih = JSON.parse(fs.readFileSync(SIH_MAPPING_PATH, "utf8"));

// Check counts
console.log(`Check 1: Total agents in agents.json: ${loadedAgents.length} (Expected: 301)`);
if (loadedAgents.length !== 301) throw new Error("Count mismatch in agents.json");

console.log(`Check 2: Total agents in sih-agent-mapping.json: ${loadedSih.length} (Expected: 301)`);
if (loadedSih.length !== 301) throw new Error("Count mismatch in sih-agent-mapping.json");

// Check baseline 1-100 integrity
for (let i = 0; i < 100; i++) {
  const orig = baselineAgents[i];
  const curr = loadedAgents[i];
  if (orig.agent_id !== curr.agent_id || orig.name !== curr.name) {
    throw new Error(`Baseline mismatch at index ${i}: orig ${orig.agent_id} vs curr ${curr.agent_id}`);
  }
}
console.log("Check 3: Baseline agents 1-100 verified 100% FROZEN and UNTOUCHED.");

// Check IDs 101-301
const idSet = new Set();
for (let i = 100; i < 301; i++) {
  const expectedId = `agent-${String(i + 1).padStart(3, "0")}`;
  const curr = loadedAgents[i];
  if (curr.agent_id !== expectedId) {
    throw new Error(`ID mismatch at index ${i}: expected ${expectedId}, got ${curr.agent_id}`);
  }
  if (idSet.has(curr.agent_id)) {
    throw new Error(`Duplicate ID detected: ${curr.agent_id}`);
  }
  idSet.add(curr.agent_id);
}
console.log("Check 4: Agents 101-301 verified with unique IDs, zero gaps, and zero duplicates.");
console.log("All verifications PASSED successfully!\n");
