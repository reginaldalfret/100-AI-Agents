/**
 * Sovereign AI Workbench — Tabular & Structured Data Parser for Visualizations
 * Normalizes Markdown tables, CSV text, and JSON data into canonical chart specifications.
 */

import { ChartSelector } from './chart-selector.js';
import { VisualType } from './schema.js';

export class VisualDataParser {
  /**
   * Parse a Markdown table string into a structured table object.
   */
  static parseMarkdownTable(tableMarkdown = '') {
    const lines = tableMarkdown.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return null;

    const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean);
    if (!headers.length) return null;

    const dataLines = lines.slice(2); // Skip header and separator
    const rows = [];

    for (const line of dataLines) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    return { headers, rows };
  }

  /**
   * Converts a structured table into a canonical chart specification.
   */
  static tableToChartSpec(tableObj, prompt = '', userType = null) {
    if (!tableObj || !tableObj.headers || !tableObj.rows || !tableObj.rows.length) return null;

    const { headers, rows } = tableObj;
    const firstCol = headers[0];
    const categories = rows.map(r => r[0]);

    // Parse numeric columns
    const series = [];
    for (let c = 1; c < headers.length; c++) {
      const colName = headers[c];
      const values = rows.map(r => {
        const raw = (r[c] || '').replace(/[^0-9.-]/g, '');
        const num = parseFloat(raw);
        return isNaN(num) ? 0 : num;
      });
      series.push({ name: colName, values, data: values });
    }

    const { recommendedType } = ChartSelector.selectChart({
      prompt,
      data: { labels: categories, series },
      columns: headers
    });

    const finalType = userType || recommendedType || VisualType.BAR_CHART;

    // Format single-series data array for simple charts (pie, bar, etc.)
    const data = categories.map((cat, idx) => ({
      label: cat,
      value: series[0]?.values[idx] ?? 0
    }));

    return {
      type: finalType,
      title: headers.join(' vs '),
      xAxis: { label: firstCol, type: 'category' },
      yAxis: { label: headers[1] || 'Value', type: 'number' },
      categories,
      labels: categories,
      series,
      data
    };
  }
}
