/**
 * Sovereign AI Workbench — Python Compute Bridge & Tool Integration Test Suite
 */

import { runTestSuite } from "../sih/harness.js";
import { pythonClient, PythonComputeClient } from "../../platform/compute/python-client.js";
import { TOOL_DEFINITIONS, executeTool, isToolAllowed } from "../../platform/tools/tool-registry.js";

const tests = [
  {
    name: "Python Client - Health & Status Offline Fallback Reporting",
    fn: async () => {
      const health = await pythonClient.checkHealth();
      if (!health || typeof health !== "object") throw new Error("Health check returned invalid object");
      if (!["online", "offline"].includes(health.status)) throw new Error(`Unexpected status: ${health.status}`);

      const status = pythonClient.getStatus();
      if (!status || !status.metrics || !status.caches || !status.engines) {
        throw new Error("getStatus() missing required structure");
      }
      if (status.engines.embeddings !== "Python / 384-d CPU Dense Semantic Vector Engine") {
        throw new Error("Missing embeddings engine in status");
      }
    }
  },
  {
    name: "Python Client - processPDF with SHA-256 Caching",
    fn: async () => {
      const result1 = await pythonClient.processPDF("inspection_report.pdf");
      if (!result1 || result1.status !== "success") throw new Error("PDF processing failed");
      if (!result1.sha256) throw new Error("Missing sha256 hash");
      if (!result1.extracted_text) throw new Error("Missing extracted text in PDF");

      const result2 = await pythonClient.processPDF("inspection_report.pdf");
      if (!result2.cached && result2.sha256 !== result1.sha256) {
        throw new Error("Caching failed on identical PDF input");
      }
    }
  },
  {
    name: "Python Client - processDOCX Extraction",
    fn: async () => {
      const result = await pythonClient.processDOCX("approval_memorandum.docx");
      if (result.status !== "success") throw new Error("DOCX processing failed");
      if (result.document_type !== "DOCX") throw new Error("Invalid document_type");
      if (!Array.isArray(result.paragraphs) || result.paragraphs.length === 0) throw new Error("Missing paragraphs");
    }
  },
  {
    name: "Python Client - processXLSX Tabular Extraction",
    fn: async () => {
      const result = await pythonClient.processXLSX("ndt_measurements.xlsx");
      if (result.status !== "success") throw new Error("XLSX processing failed");
      if (result.document_type !== "XLSX") throw new Error("Invalid document_type");
      if (!Array.isArray(result.data) || result.data.length === 0) throw new Error("Missing data rows");
      if (!Array.isArray(result.columns) || result.columns.length === 0) throw new Error("Missing columns");
    }
  },
  {
    name: "Python Client - processPPTX Slide Extraction",
    fn: async () => {
      const result = await pythonClient.processPPTX("management_briefing.pptx");
      if (result.status !== "success") throw new Error("PPTX processing failed");
      if (result.document_type !== "PPTX") throw new Error("Invalid document_type");
      if (!Array.isArray(result.slides) || result.slides.length === 0) throw new Error("Missing slides");
    }
  },
  {
    name: "Python Client - runOCR Scanned Document Extraction",
    fn: async () => {
      const result = await pythonClient.runOCR("scanned_ndt_scan.pdf");
      if (result.status !== "success") throw new Error("OCR failed");
      if (!result.extracted_text.includes("MANGALORE REFINERY")) throw new Error("OCR text missing expected content");
    }
  },
  {
    name: "Python Client - preprocessImage Normalization & Caching",
    fn: async () => {
      const result1 = await pythonClient.preprocessImage("defect_photo.jpg", { targetWidth: 800 });
      if (result1.status !== "success") throw new Error("Image preprocessing failed");
      if (!result1.preprocessed || !result1.sha256) throw new Error("Image preprocessing metadata missing");

      const result2 = await pythonClient.preprocessImage("defect_photo.jpg", { targetWidth: 800 });
      if (!result2.cached && result2.sha256 !== result1.sha256) throw new Error("Image caching failed");
    }
  },
  {
    name: "Python Client - analyzeImage (Drawing & Defect Photo)",
    fn: async () => {
      const drawing = await pythonClient.analyzeImage("pid_schematic.png", { type: "drawing" });
      if (!drawing || !drawing.extracted_entities) throw new Error("Drawing analysis failed");

      const photo = await pythonClient.analyzeImage("flange_corrosion.jpg", { type: "photo" });
      if (!photo || !photo.findings || photo.findings.length === 0) throw new Error("Photo analysis failed");
    }
  },
  {
    name: "Python Client - analyzeData High-Precision Statistics & Outliers",
    fn: async () => {
      const dataset = [
        { location: "A", thickness: 11.2 },
        { location: "B", thickness: 9.8 },
        { location: "C", thickness: 5.9 },
        { location: "D", thickness: 7.1 },
        { location: "E", thickness: 5.4 }
      ];
      const result = await pythonClient.analyzeData(dataset);
      if (result.status !== "success") throw new Error("analyzeData failed");
      if (!result.statistics || !result.statistics.thickness) throw new Error("Missing thickness stats");
      if (typeof result.statistics.thickness.mean !== "number") throw new Error("Invalid mean calculation");
      if (typeof result.statistics.thickness.stdDev !== "number") throw new Error("Invalid stdDev calculation");
    }
  },
  {
    name: "Python Client - calculate (Corrosion Rate, Hoop Stress, Arithmetic)",
    fn: async () => {
      // Corrosion Rate
      const calc1 = await pythonClient.calculate("corrosion_rate", {
        t_initial: 10.0,
        t_actual: 5.9,
        years: 9.75,
        t_min: 6.8
      });
      if (calc1.status !== "success") throw new Error("Calculation failed");
      if (calc1.result.metal_loss_mm !== 4.1) throw new Error(`Incorrect metal loss: ${calc1.result.metal_loss_mm}`);
      if (!calc1.result.retirement_breached) throw new Error("Retirement should be breached");

      // Hoop Stress
      const calc2 = await pythonClient.calculate("hoop_stress", {
        pressure_bar: 15.0,
        diameter_mm: 1200,
        thickness_mm: 10.0
      });
      if (calc2.status !== "success") throw new Error("Hoop stress calculation failed");
      if (typeof calc2.result.hoop_stress_mpa !== "number") throw new Error("Missing hoop_stress_mpa");

      // Arithmetic expression
      const calc3 = await pythonClient.calculate("2 * (14.0 - 9.5) / 10.0");
      if (calc3.status !== "success" || calc3.result.value !== 0.9) {
        throw new Error(`Arithmetic expression failed: ${calc3.result.value}`);
      }
    }
  },
  {
    name: "Python Client - generateEmbeddings (384-dimensional Normalized Vectors)",
    fn: async () => {
      const res = await pythonClient.generateEmbeddings("API 653 tank inspection minimum required thickness");
      if (res.status !== "success") throw new Error("Embedding generation failed");
      if (res.dimension !== 384) throw new Error(`Invalid dimension: ${res.dimension}`);
      if (!Array.isArray(res.embeddings) || res.embeddings.length !== 384) {
        throw new Error("Vector length is not 384");
      }
    }
  },
  {
    name: "Python Client - rerank Lexical-Semantic Candidates",
    fn: async () => {
      const candidates = [
        { id: 1, text: "General building maintenance guidelines for lighting." },
        { id: 2, text: "API-653 ultrasonic thickness inspection limit for tank TK-101 Shell Course 3." },
        { id: 3, text: "Cafeteria meal menu and employee timings." }
      ];
      const query = "API-653 ultrasonic thickness Shell Course 3";
      const res = await pythonClient.rerank(query, candidates);
      if (res.status !== "success") throw new Error("Reranking failed");
      if (res.results[0].id !== 2) throw new Error("Reranker failed to rank the most relevant chunk first");
    }
  },
  {
    name: "Tool Registry - python.* Tools Registration and Execution",
    fn: async () => {
      const expectedTools = [
        "python.processPDF",
        "python.processDOCX",
        "python.processXLSX",
        "python.processPPTX",
        "python.ocr",
        "python.preprocessImage",
        "python.analyzeImage",
        "python.analyzeData",
        "python.calculate",
        "python.embed",
        "python.rerank"
      ];

      for (const t of expectedTools) {
        if (!TOOL_DEFINITIONS[t]) {
          throw new Error(`Tool ${t} is not defined in TOOL_DEFINITIONS`);
        }
      }

      // Test permission check
      if (!isToolAllowed("agent-101", "python.calculate")) {
        throw new Error("Master agent-101 should be permitted for python.calculate");
      }

      // Test execution of python.calculate tool
      const execResult = await executeTool("agent-101", "python.calculate", {
        formula: "corrosion_rate",
        inputs: { t_initial: 12.0, t_actual: 7.0, years: 10, t_min: 8.0 }
      });

      if (!execResult || execResult.status !== "success") {
        throw new Error("Failed to execute python.calculate via executeTool");
      }
      if (execResult.data.result.metal_loss_mm !== 5.0) {
        throw new Error(`Unexpected calculation result: ${JSON.stringify(execResult.data)}`);
      }

      // Test execution of python.embed tool
      const embedResult = await executeTool("agent-101", "python.embed", {
        text: "Refinery crude distillation unit safety limits"
      });
      if (!embedResult || embedResult.status !== "success" || embedResult.data.dimension !== 384) {
        throw new Error("Failed to execute python.embed via executeTool");
      }
    }
  }
];

runTestSuite("Python Compute Subsystem & Tool Registry", tests).catch(e => {
  console.error("Test suite fatal error:", e);
  process.exit(1);
});
