/**
 * Sovereign AI Workbench — Canonical Dataset Registry
 * Manages dataset metadata, persistence under E:\Smart Automation\100-AI-Agents\data\datasets, and query engine binding.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadDatasetFile } from "./dataset-parser.js";
import { profileDataset } from "./schema-profiler.js";
import { loadDatasetIntoEngine, unloadDatasetFromEngine, isDatasetLoadedInEngine } from "./sql-engine.js";

const DATASETS_BASE_DIR = path.resolve("data/datasets");
const PARQUET_DIR = path.join(DATASETS_BASE_DIR, "parquet");
const DB_DIR = path.join(DATASETS_BASE_DIR, "db");
const REGISTRY_FILE = path.join(DATASETS_BASE_DIR, "registry.json");

// Ensure directories exist
[DATASETS_BASE_DIR, PARQUET_DIR, DB_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

let registryStore = [];

function loadRegistryStore() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
      if (Array.isArray(data)) {
        registryStore = data;
      }
    }
  } catch (err) {
    console.warn("[DATASET_REGISTRY] Could not read registry.json:", err.message);
    registryStore = [];
  }
}

function persistRegistryStore() {
  try {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registryStore, null, 2), "utf8");
  } catch (err) {
    console.error("[DATASET_REGISTRY] Could not write registry.json:", err.message);
  }
}

loadRegistryStore();

export async function ingestDatasetFile({ filename, buffer, filePath, originalName }) {
  const datasetId = `ds_${crypto.randomBytes(6).toString("hex")}`;
  const ext = path.extname(filename || originalName || filePath || ".csv").toLowerCase();
  const baseName = path.basename(filename || originalName || "dataset", ext);
  const safeFilename = `${datasetId}_${baseName}${ext}`;
  const targetPath = path.join(DATASETS_BASE_DIR, safeFilename);

  if (buffer) {
    fs.writeFileSync(targetPath, buffer);
  } else if (filePath && filePath !== targetPath) {
    fs.copyFileSync(filePath, targetPath);
  }

  // 1. Parse File
  const parsedData = loadDatasetFile(targetPath);

  // 2. Profile Schema
  const profile = profileDataset(parsedData);

  // 3. Load into In-Memory SQL Engine
  loadDatasetIntoEngine(datasetId, parsedData, profile);

  const now = new Date().toISOString();
  const datasetRecord = {
    dataset_id: datasetId,
    filename: originalName || filename || safeFilename,
    path: targetPath,
    storage_path: targetPath,
    format: ext.replace(/^\./, "").toUpperCase(),
    rows: profile.rowCount,
    columns: profile.columnCount,
    schema: profile,
    created_at: now,
    updated_at: now,
    status: "READY"
  };

  registryStore.unshift(datasetRecord);
  persistRegistryStore();

  return datasetRecord;
}

export function getDatasetById(datasetId) {
  if (!datasetId) return null;
  const ds = registryStore.find(d => d.dataset_id === datasetId || d.filename === datasetId);
  if (ds && !isDatasetLoadedInEngine(ds.dataset_id)) {
    // Re-hydrate into SQL engine if needed
    try {
      const parsed = loadDatasetFile(ds.path);
      loadDatasetIntoEngine(ds.dataset_id, parsed, ds.schema);
    } catch (err) {
      console.warn(`[DATASET_REGISTRY] Failed to re-hydrate dataset ${ds.dataset_id}:`, err.message);
    }
  }
  return ds || null;
}

export function listAllDatasets() {
  return registryStore.map(ds => ({
    dataset_id: ds.dataset_id,
    filename: ds.filename,
    format: ds.format,
    rows: ds.rows,
    columns: ds.columns,
    status: ds.status,
    created_at: ds.created_at
  }));
}

export function deleteDataset(datasetId) {
  const idx = registryStore.findIndex(d => d.dataset_id === datasetId);
  if (idx === -1) return false;

  const ds = registryStore[idx];
  unloadDatasetFromEngine(ds.dataset_id);

  try {
    if (fs.existsSync(ds.path)) fs.unlinkSync(ds.path);
  } catch {
    // ignore
  }

  registryStore.splice(idx, 1);
  persistRegistryStore();
  return true;
}
