# SOVEREIGN AI WORKBENCH — PRIVATE LOCAL CONNECTORS & DATA CLASSIFICATION

**System:** Sovereign AI Workbench  
**Module:** On-Premise Data Connectors & Security Policy  
**Date:** August 22, 2026  

---

## 1. Connector Taxonomy

1. **`LocalFilesystemConnector`**: Ingests NDT reports, drawings, and spreadsheets from local disk.
2. **`LocalSQLiteConnector`**: Queries air-gapped relational plant asset databases.
3. **`LocalRESTConnector`**: Connects to internal SCADA / DCS historian endpoints within the private plant subnet.

---

## 2. Air-Gap Protection & Data Classification

- **Strict Network Boundary:** Connectors targeting public internet hosts are rejected with `SOVEREIGNTY_VIOLATION`.
- **Classification Tiers:**
  - `PUBLIC`: Open technical standards (e.g. OISD-STD-129, API-653).
  - `INTERNAL`: Plant maintenance manuals and operating logs.
  - `CONFIDENTIAL`: Live inspection reports, P&ID schematics, and chemical formulations.
  - `RESTRICTED`: Statutory compliance violations, incident records, and executive memos.
