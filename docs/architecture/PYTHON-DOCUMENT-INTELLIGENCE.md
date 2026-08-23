# Python Document Intelligence & Parsing Architecture

## Invariants
1. **Zero Raw Binary Leakage**: Raw PDF binaries and XMP/C2PA metadata are never passed to LLM context directly.
2. **Structure-Aware Normalization**: Headings, paragraphs, bullet lists, and markdown tables are cleanly separated.
3. **Deterministic Table Parsing**: Tables from PDF, DOCX, XLSX, and CSV are normalized into typed JSON row structures.
