# Sovereign Visualization Engine & Automatic Chart Selection

**Platform**: Sovereign AI Workbench (SIH Problem Statement 26117)  
**Status**: 100% On-Premise Air-Gapped SVG Visual Generation & Automatic Data Classifier

---

## 1. Executive Summary

The Sovereign Visualization Subsystem generates high-DPI Liquid Glass interactive SVGs for 24 distinct visualization and chart types without external cloud dependencies or third-party charting libraries.

### Supported Visualization Categories & Types

1. **Comparison**
   - `bar_chart`: Vertical discrete categorical value comparisons.
   - `horizontal_bar_chart`: Horizontal ranking and long-label comparisons.
   - `grouped_bar_chart`: Side-by-side multi-series comparisons.
   - `stacked_bar_chart`: Total group magnitude and category contributions.
2. **Trend & Time-Series**
   - `line_chart`: Continuous trend progression over time.
   - `area_chart`: Volume and magnitude of trend changes.
   - `stacked_area_chart`: Compositional area changes over continuous intervals.
3. **Distribution & Statistical**
   - `histogram`: Continuous statistical frequency distributions with automatic binning.
   - `box_plot`: 5-number summary (Min, Q1, Median, Q3, Max) and outlier spread.
4. **Relationship & Correlation**
   - `scatter_plot`: 2D XY numerical correlation pairs.
   - `bubble_chart`: 3D relationship (X, Y, Magnitude/Size).
5. **Composition & Proportions**
   - `pie_chart`: Part-to-whole categorical shares.
   - `donut_chart`: Proportions with central KPI callout.
   - `waterfall_chart`: Cumulative sequential variance bridge.
6. **Matrix & Multi-Dimensional**
   - `heatmap`: 2D intensity and correlation matrices.
   - `radar_chart`: Multi-axial multivariate performance radar.
7. **KPI & Operational**
   - `gauge_chart`: Radial metric gauges with calibrated thresholds.
   - `kpi_card`: High-impact single metric cards with delta indicators.
   - `population_pyramid`: Bi-lateral comparative distribution.
8. **Process & Structural**
   - `timeline`: Chronological milestones and roadmaps.
   - `flowchart`: Directed process logic and workflows.
   - `architecture`: Multi-tier system architecture diagrams.
   - `sequence`: Lifeline interactions and messaging protocols.

---

## 2. Automatic Chart Selection & Data Shape Analysis

The `ChartSelector` module automatically analyzes natural language intent and structured data shape:
- **Category + Numeric** $ightarrow$ `bar_chart` / `horizontal_bar_chart`
- **Date/Time + Numeric** $ightarrow$ `line_chart` / `area_chart`
- **Continuous Distribution** $ightarrow$ `histogram` / `box_plot`
- **XY Coordinates** $ightarrow$ `scatter_plot` / `bubble_chart`
- **Part of 100% Total** $ightarrow$ `pie_chart` / `donut_chart`
- **2D Matrix Array** $ightarrow$ `heatmap`
- **Sequential Variance** $ightarrow$ `waterfall_chart`

---

## 3. Direct Markdown Table Conversion

The `VisualDataParser` converts Markdown and CSV tables into canonical visualization specifications on the fly, allowing immediate chart rendering from tabular data.

---

## 4. Multi-Format Export

Every visual card renders as a responsive SVG viewport with Liquid Glass styling and one-click direct export options:
- **[ PNG ]**: High-DPI rasterization via Canvas API ($2\times$ scale).
- **[ JPG ]**: Solid-background export ($0.93$ quality).
- **[ SVG ]**: Scalable vector XML export.
- **[ Source ]**: JSON/Mermaid specification copy.
