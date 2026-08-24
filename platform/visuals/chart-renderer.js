/**
 * Sovereign AI Workbench — Native Data Chart SVG Renderer
 * Renders 24 calibrated chart types without external chart libraries.
 * 100% On-Premise Air-Gapped High-DPI Liquid Glass SVG Generation.
 */

import { DiagramSanitizer } from './sanitizer.js';
import { ThemeTokens, VisualType } from './schema.js';

const CHART_COLORS = [
  '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a855f7',
  '#22d3ee', '#e879f9', '#34d399', '#fbbf24', '#fb7185'
];

export class ChartRenderer {
  static render(spec = {}) {
    const title = DiagramSanitizer.sanitizeLabel(spec.title || 'Data Visualization');
    const type = (spec.type || VisualType.BAR_CHART).toLowerCase().replace(/[\s-]/g, '_');

    switch (type) {
      case VisualType.PIE_CHART:
      case 'pie':
        return this.renderPie(spec, title, false);
      case VisualType.DONUT_CHART:
      case 'donut':
        return this.renderPie(spec, title, true);
      case VisualType.LINE_CHART:
      case 'line':
      case 'time_series':
        return this.renderLineArea(spec, title, 'line');
      case VisualType.AREA_CHART:
      case 'area':
        return this.renderLineArea(spec, title, 'area');
      case VisualType.STACKED_AREA_CHART:
      case 'stacked_area':
        return this.renderLineArea(spec, title, 'stacked_area');
      case VisualType.BAR_CHART:
      case 'bar':
      case 'column':
      case 'barchart':
        return this.renderBar(spec, title, 'vertical');
      case VisualType.HORIZONTAL_BAR_CHART:
      case 'horizontal_bar':
      case 'hbar':
        return this.renderBar(spec, title, 'horizontal');
      case VisualType.GROUPED_BAR_CHART:
      case 'grouped_bar':
      case 'clustered_bar':
        return this.renderBar(spec, title, 'grouped');
      case VisualType.STACKED_BAR_CHART:
      case 'stacked_bar':
        return this.renderBar(spec, title, 'stacked');
      case VisualType.HISTOGRAM:
      case 'hist':
        return this.renderHistogram(spec, title);
      case VisualType.SCATTER_PLOT:
      case 'scatter':
        return this.renderScatter(spec, title, false);
      case VisualType.BUBBLE_CHART:
      case 'bubble':
        return this.renderScatter(spec, title, true);
      case VisualType.RADAR_CHART:
      case 'radar':
      case 'spider':
        return this.renderRadar(spec, title);
      case VisualType.HEATMAP:
      case 'heat_map':
        return this.renderHeatmap(spec, title);
      case VisualType.BOX_PLOT:
      case 'boxplot':
        return this.renderBoxPlot(spec, title);
      case VisualType.WATERFALL_CHART:
      case 'waterfall':
        return this.renderWaterfall(spec, title);
      case VisualType.GAUGE_CHART:
      case 'gauge':
      case 'meter':
        return this.renderGauge(spec, title);
      case VisualType.KPI_CARD:
      case 'kpi':
        return this.renderKpiCard(spec, title);
      case VisualType.POPULATION_PYRAMID:
        return this.renderPopulationPyramid(spec, title);
      default:
        return this.renderBar(spec, title, 'vertical');
    }
  }

  static normalizeCategories(spec) {
    if (Array.isArray(spec.categories) && spec.categories.length) return spec.categories;
    if (Array.isArray(spec.labels) && spec.labels.length) return spec.labels;
    if (spec.x?.values && Array.isArray(spec.x.values)) return spec.x.values;
    if (Array.isArray(spec.data) && spec.data.length) {
      return spec.data.map(d => d.label || d.name || d.category || d.x || 'Item');
    }
    return ['Item 1'];
  }

  static normalizeSeries(spec) {
    if (Array.isArray(spec.series) && spec.series.length) {
      return spec.series.map((s, idx) => ({
        name: s.name || s.label || `Series ${idx + 1}`,
        values: Array.isArray(s.data) ? s.data : (Array.isArray(s.values) ? s.values : [])
      }));
    }
    if (Array.isArray(spec.data) && spec.data.length) {
      return [{
        name: spec.yAxis?.label || 'Value',
        values: spec.data.map(d => (typeof d.value === 'number' ? d.value : (typeof d === 'number' ? d : 0)))
      }];
    }
    return [{ name: 'Value', values: [0] }];
  }

  static getChartData(spec) {
    if (Array.isArray(spec.data) && spec.data.length) return spec.data;
    const cats = this.normalizeCategories(spec);
    const series = this.normalizeSeries(spec);
    if (series.length && series[0].values) {
      return cats.map((c, i) => ({ label: String(c), value: Number(series[0].values[i]) || 0 }));
    }
    return [{ label: 'Item', value: 1 }];
  }

  // 1. PIE / DONUT
  static renderPie(spec, title, isDonut) {
    const data = this.getChartData(spec);
    const totalWidth = 600, totalHeight = 400;
    const cx = 200, cy = 200, radius = 120;
    const innerRadius = isDonut ? radius * 0.6 : 0;

    let total = 0;
    data.forEach(d => { total += (Number(d.value) || 0); });
    if (total === 0) total = 1;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-chart pie-chart" style="max-width:100%;font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="24" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    if (data.length === 1) {
      const color = CHART_COLORS[0];
      svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" opacity="0.9" />`;
      if (isDonut) {
        svg += `<circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="${ThemeTokens.bg || '#111827'}" />`;
      }
      svg += `
        <rect x="400" y="80" width="12" height="12" rx="3" fill="${color}" />
        <text x="420" y="90" fill="${ThemeTokens.textSecondary}" font-size="12">${DiagramSanitizer.sanitizeLabel(data[0].label)}: <tspan fill="${ThemeTokens.text}" font-weight="600">${data[0].value} (100%)</tspan></text>
      `;
    } else {
      let currentAngle = 0;
      data.forEach((d, idx) => {
        const val = Number(d.value) || 0;
        const sliceAngle = (val / total) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;
        const color = CHART_COLORS[idx % CHART_COLORS.length];

        const x1 = cx + radius * Math.cos(currentAngle);
        const y1 = cy + radius * Math.sin(currentAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);

        const largeArc = sliceAngle > Math.PI ? 1 : 0;
        const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        svg += `<path d="${pathData}" fill="${color}" opacity="0.9" stroke="rgba(17,24,39,0.8)" stroke-width="2" />`;

        const legY = 80 + idx * 24;
        const pct = Math.round((val / total) * 100);
        svg += `
          <rect x="400" y="${legY}" width="12" height="12" rx="3" fill="${color}" />
          <text x="420" y="${legY + 10}" fill="${ThemeTokens.textSecondary}" font-size="12">${DiagramSanitizer.sanitizeLabel(d.label)}: <tspan fill="${ThemeTokens.text}" font-weight="600">${val} (${pct}%)</tspan></text>
        `;

        currentAngle = endAngle;
      });

      if (isDonut) {
        svg += `<circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="${ThemeTokens.bg || '#111827'}" />`;
      }
    }

    if (isDonut && spec.kpiText) {
      svg += `<text x="${cx}" y="${cy}" fill="${ThemeTokens.text}" font-size="20" font-weight="700" text-anchor="middle" dominant-baseline="middle">${DiagramSanitizer.sanitizeLabel(spec.kpiText)}</text>`;
    }

    svg += '</svg>';
    return svg;
  }

  // 2. LINE / AREA / STACKED AREA
  static renderLineArea(spec, title, mode) {
    const xLabels = this.normalizeCategories(spec);
    const seriesList = this.normalizeSeries(spec);

    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 120, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;

    let maxVal = 1;
    if (mode === 'stacked_area') {
      for (let i = 0; i < xLabels.length; i++) {
        let sum = 0;
        seriesList.forEach(s => { sum += (Number(s.values[i]) || 0); });
        if (sum > maxVal) maxVal = sum;
      }
    } else {
      seriesList.forEach(s => {
        (s.values || []).forEach(v => { const n = Number(v) || 0; if (n > maxVal) maxVal = n; });
      });
    }
    maxVal = Math.ceil(maxVal * 1.15) || 10;

    const stepX = xLabels.length > 1 ? plotW / (xLabels.length - 1) : plotW;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-chart line-chart" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const yVal = Math.round((maxVal / gridSteps) * i);
      const yPos = padT + plotH - (plotH / gridSteps) * i;
      svg += `
        <line x1="${padL}" y1="${yPos}" x2="${totalWidth - padR}" y2="${yPos}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />
        <text x="${padL - 10}" y="${yPos + 4}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="end">${yVal}</text>
      `;
    }

    xLabels.forEach((lbl, idx) => {
      const x = padL + idx * stepX;
      svg += `<text x="${x}" y="${totalHeight - 20}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(lbl)}</text>`;
    });

    let prevY = new Array(xLabels.length).fill(padT + plotH);

    seriesList.forEach((s, sIdx) => {
      const values = s.values || [];
      const color = CHART_COLORS[sIdx % CHART_COLORS.length];
      const points = [];

      values.forEach((v, idx) => {
        const x = padL + idx * stepX;
        const num = Number(v) || 0;
        const yOffset = (num / maxVal) * plotH;
        const y = mode === 'stacked_area' ? (prevY[idx] - yOffset) : (padT + plotH - yOffset);
        points.push({ x, y, v: num, py: prevY[idx] });
      });

      if (points.length === 1) {
        svg += `<circle cx="${points[0].x}" cy="${points[0].y}" r="4" fill="${color}" />`;
      } else if (points.length > 1) {
        const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
        if (mode === 'area' || mode === 'stacked_area') {
          let areaPath = `M ${points[0].x} ${points[0].py || (padT + plotH)}`;
          points.forEach(p => { areaPath += ` L ${p.x} ${p.y}`; });
          for (let i = points.length - 1; i >= 0; i--) {
            areaPath += ` L ${points[i].x} ${points[i].py || (padT + plotH)}`;
          }
          areaPath += ' Z';
          svg += `<path d="${areaPath}" fill="${color}" opacity="0.25" />`;
        }
        svg += `<polyline points="${polylinePoints}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />`;
        points.forEach(p => {
          svg += `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${color}" stroke="${ThemeTokens.bg || '#111827'}" stroke-width="1.5" />`;
        });
      }

      if (mode === 'stacked_area') {
        points.forEach((p, idx) => { prevY[idx] = p.y; });
      }

      const legY = padT + sIdx * 22;
      svg += `
        <rect x="${totalWidth - padR + 15}" y="${legY}" width="10" height="10" rx="2" fill="${color}" />
        <text x="${totalWidth - padR + 30}" y="${legY + 9}" fill="${ThemeTokens.textSecondary}" font-size="11">${DiagramSanitizer.sanitizeLabel(s.name)}</text>
      `;
    });

    svg += '</svg>';
    return svg;
  }

  // 3. BAR / HORIZONTAL / GROUPED / STACKED
  static renderBar(spec, title, mode) {
    const xLabels = this.normalizeCategories(spec);
    const seriesList = this.normalizeSeries(spec);

    const totalWidth = 600, totalHeight = 400;
    const padL = 70, padR = 120, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;
    const isHoriz = mode === 'horizontal';

    let maxVal = 1;
    if (mode === 'stacked') {
      for (let i = 0; i < xLabels.length; i++) {
        let sum = 0;
        seriesList.forEach(s => { sum += (Number(s.values[i]) || 0); });
        if (sum > maxVal) maxVal = sum;
      }
    } else {
      seriesList.forEach(s => {
        (s.values || []).forEach(v => { const n = Number(v) || 0; if (n > maxVal) maxVal = n; });
      });
    }
    maxVal = Math.ceil(maxVal * 1.15) || 10;

    const categoriesCount = Math.max(xLabels.length, 1);
    const catBand = (isHoriz ? plotH : plotW) / categoriesCount;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-chart bar-chart" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const val = Math.round((maxVal / gridSteps) * i);
      if (isHoriz) {
        const xPos = padL + (plotW / gridSteps) * i;
        svg += `
          <line x1="${xPos}" y1="${padT}" x2="${xPos}" y2="${totalHeight - padB}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />
          <text x="${xPos}" y="${totalHeight - padB + 15}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="middle">${val}</text>
        `;
      } else {
        const yPos = padT + plotH - (plotH / gridSteps) * i;
        svg += `
          <line x1="${padL}" y1="${yPos}" x2="${totalWidth - padR}" y2="${yPos}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />
          <text x="${padL - 10}" y="${yPos + 4}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="end">${val}</text>
        `;
      }
    }

    const numSeries = Math.max(seriesList.length, 1);
    let prev = new Array(categoriesCount).fill(0);

    for (let c = 0; c < categoriesCount; c++) {
      const lbl = DiagramSanitizer.sanitizeLabel(xLabels[c] || `Item ${c + 1}`);
      if (isHoriz) {
        const y = padT + c * catBand + catBand / 2;
        svg += `<text x="${padL - 10}" y="${y + 4}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="end">${lbl}</text>`;
      } else {
        const x = padL + c * catBand + catBand / 2;
        svg += `<text x="${x}" y="${totalHeight - padB + 20}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${lbl}</text>`;
      }

      seriesList.forEach((s, sIdx) => {
        const val = Number(s.values[c]) || 0;
        const color = CHART_COLORS[sIdx % CHART_COLORS.length];

        let barW = 0, barH = 0, bx = 0, by = 0;

        if (isHoriz) {
          const size = (val / maxVal) * plotW;
          const thickness = mode === 'grouped' ? (catBand * 0.8) / numSeries : catBand * 0.6;
          barW = size;
          barH = thickness;
          bx = padL + (mode === 'stacked' ? prev[c] : 0);
          by = padT + c * catBand + (catBand - (mode === 'grouped' ? thickness * numSeries : thickness)) / 2 + (mode === 'grouped' ? sIdx * thickness : 0);
          if (mode === 'stacked') prev[c] += size;
        } else {
          const size = (val / maxVal) * plotH;
          const thickness = mode === 'grouped' ? (catBand * 0.8) / numSeries : catBand * 0.6;
          barW = thickness;
          barH = size;
          bx = padL + c * catBand + (catBand - (mode === 'grouped' ? thickness * numSeries : thickness)) / 2 + (mode === 'grouped' ? sIdx * thickness : 0);
          by = padT + plotH - size - (mode === 'stacked' ? prev[c] : 0);
          if (mode === 'stacked') prev[c] += size;
        }

        if (barH > 0 && barW > 0) {
          svg += `<rect x="${bx}" y="${by}" width="${barW}" height="${barH}" rx="2" fill="${color}" opacity="0.85" />`;
        }
      });
    }

    seriesList.forEach((s, sIdx) => {
      const color = CHART_COLORS[sIdx % CHART_COLORS.length];
      const legY = padT + sIdx * 22;
      svg += `
        <rect x="${totalWidth - padR + 15}" y="${legY}" width="10" height="10" rx="2" fill="${color}" />
        <text x="${totalWidth - padR + 30}" y="${legY + 9}" fill="${ThemeTokens.textSecondary}" font-size="11">${DiagramSanitizer.sanitizeLabel(s.name)}</text>
      `;
    });

    svg += '</svg>';
    return svg;
  }

  // 4. HISTOGRAM
  static renderHistogram(spec, title) {
    let bins = [];
    let binLabels = [];

    if (Array.isArray(spec.bins) && spec.bins.length > 0) {
      bins = spec.bins.map(b => (typeof b.count === 'number' ? b.count : (typeof b.value === 'number' ? b.value : (Number(b) || 0))));
      binLabels = spec.bins.map(b => (b.min != null && b.max != null ? `${b.min}-${b.max}` : (b.label || 'Bin')));
    } else {
      let rawVals = [];
      if (Array.isArray(spec.data)) {
        rawVals = spec.data.map(d => (typeof d === 'number' ? d : (d.value ?? d.x ?? 0)));
      } else if (Array.isArray(spec.values)) {
        rawVals = spec.values;
      }
      if (!rawVals.length) rawVals = [10, 20, 30, 40, 50];

      const minV = Math.min(...rawVals);
      const maxV = Math.max(...rawVals);
      const binCount = typeof spec.bins === 'number' ? spec.bins : 5;
      const binSize = (maxV - minV) / binCount || 1;
      bins = new Array(binCount).fill(0);

      rawVals.forEach(v => {
        let idx = Math.floor((v - minV) / binSize);
        if (idx >= binCount) idx = binCount - 1;
        bins[idx]++;
      });

      for (let i = 0; i < binCount; i++) {
        binLabels.push(String(Math.round(minV + i * binSize)));
      }
    }

    const maxFreq = Math.max(...bins, 1);
    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;
    const binW = plotW / Math.max(bins.length, 1);

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-chart histogram" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    for (let i = 0; i <= 4; i++) {
      const f = Math.round((maxFreq / 4) * i);
      const y = padT + plotH - (plotH / 4) * i;
      svg += `
        <line x1="${padL}" y1="${y}" x2="${totalWidth - padR}" y2="${y}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />
        <text x="${padL - 10}" y="${y + 4}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="end">${f}</text>
      `;
    }

    bins.forEach((cnt, idx) => {
      const bH = (cnt / maxFreq) * plotH;
      const bx = padL + idx * binW;
      const by = padT + plotH - bH;
      svg += `<rect x="${bx + 2}" y="${by}" width="${Math.max(1, binW - 4)}" height="${bH}" fill="${CHART_COLORS[0]}" opacity="0.8" rx="2" />`;
      const binLbl = DiagramSanitizer.sanitizeLabel(binLabels[idx] || `Bin ${idx + 1}`);
      svg += `<text x="${bx + binW / 2}" y="${totalHeight - padB + 15}" fill="${ThemeTokens.textSecondary}" font-size="9" text-anchor="middle">${binLbl}</text>`;
    });

    svg += '</svg>';
    return svg;
  }

  // 5. SCATTER / BUBBLE
  static renderScatter(spec, title, isBubble) {
    const rawData = spec.data || spec.points || [];
    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;

    let maxX = 1, maxY = 1;
    rawData.forEach(p => {
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    maxX = Math.ceil(maxX * 1.15) || 10;
    maxY = Math.ceil(maxY * 1.15) || 10;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-chart scatter-plot" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((maxY / 4) * i);
      const yPos = padT + plotH - (plotH / 4) * i;
      svg += `
        <line x1="${padL}" y1="${yPos}" x2="${totalWidth - padR}" y2="${yPos}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />
        <text x="${padL - 10}" y="${yPos + 4}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="end">${yVal}</text>
      `;
    }

    for (let i = 0; i <= 4; i++) {
      const xVal = Math.round((maxX / 4) * i);
      const xPos = padL + (plotW / 4) * i;
      svg += `<text x="${xPos}" y="${totalHeight - padB + 15}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="middle">${xVal}</text>`;
    }

    rawData.forEach((p, idx) => {
      const px = padL + (p.x / maxX) * plotW;
      const py = padT + plotH - (p.y / maxY) * plotH;
      const r = isBubble ? Math.max(4, Math.min(25, p.size || p.r || 8)) : 5;
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      svg += `<circle cx="${px}" cy="${py}" r="${r}" fill="${color}" opacity="0.8" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" />`;
    });

    svg += '</svg>';
    return svg;
  }

  // 6. RADAR / SPIDER
  static renderRadar(spec, title) {
    const axes = spec.axes || spec.labels || ['Metric A', 'Metric B', 'Metric C', 'Metric D', 'Metric E'];
    const series = spec.series || [{ name: 'Series', values: [80, 70, 90, 60, 85] }];
    const totalWidth = 600, totalHeight = 400;
    const cx = 300, cy = 210, r = 130;
    const numAxes = axes.length;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="300" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700" text-anchor="middle">${title}</text>`;

    for (let l = 1; l <= 4; l++) {
      const cr = (r / 4) * l;
      const gridPoints = [];
      for (let i = 0; i < numAxes; i++) {
        const ang = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
        gridPoints.push(`${cx + cr * Math.cos(ang)},${cy + cr * Math.sin(ang)}`);
      }
      svg += `<polygon points="${gridPoints.join(' ')}" fill="none" stroke="rgba(99, 102, 241, 0.2)" stroke-width="1" />`;
    }

    axes.forEach((ax, i) => {
      const ang = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
      const axX = cx + r * Math.cos(ang);
      const axY = cy + r * Math.sin(ang);
      svg += `<line x1="${cx}" y1="${cy}" x2="${axX}" y2="${axY}" stroke="rgba(99, 102, 241, 0.3)" />`;
      const lblX = cx + (r + 20) * Math.cos(ang);
      const lblY = cy + (r + 20) * Math.sin(ang);
      svg += `<text x="${lblX}" y="${lblY + 4}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(ax)}</text>`;
    });

    series.forEach((s, sIdx) => {
      const color = CHART_COLORS[sIdx % CHART_COLORS.length];
      const vals = s.values || s.data || [];
      const pts = [];
      vals.forEach((v, i) => {
        const ang = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
        const dist = Math.min(100, Math.max(0, v)) / 100 * r;
        pts.push(`${cx + dist * Math.cos(ang)},${cy + dist * Math.sin(ang)}`);
      });
      if (pts.length) {
        svg += `<polygon points="${pts.join(' ')}" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="2" />`;
      }
    });

    svg += '</svg>';
    return svg;
  }

  // 7. HEATMAP
  static renderHeatmap(spec, title) {
    const mat = spec.matrix || [[1, 2], [3, 4]];
    const xL = spec.xLabels || spec.cols || ['Col 1', 'Col 2'];
    const yL = spec.yLabels || spec.rows || ['Row 1', 'Row 2'];

    const totalWidth = 600, totalHeight = 400;
    const padL = 80, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;
    const cW = plotW / xL.length, cH = plotH / yL.length;

    let maxV = 1;
    mat.forEach(r => r.forEach(v => { if (v > maxV) maxV = v; }));

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    mat.forEach((row, i) => {
      svg += `<text x="${padL - 10}" y="${padT + i * cH + cH / 2 + 4}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="end">${DiagramSanitizer.sanitizeLabel(yL[i] || '')}</text>`;
      row.forEach((v, j) => {
        const op = maxV === 0 ? 0.2 : (v / maxV) * 0.8 + 0.2;
        svg += `<rect x="${padL + j * cW}" y="${padT + i * cH}" width="${cW - 2}" height="${cH - 2}" fill="${CHART_COLORS[0]}" opacity="${op}" rx="2" />`;
        svg += `<text x="${padL + j * cW + cW / 2}" y="${padT + i * cH + cH / 2 + 4}" fill="#fff" font-size="10" text-anchor="middle">${v}</text>`;
      });
    });

    xL.forEach((x, j) => {
      svg += `<text x="${padL + j * cW + cW / 2}" y="${padT + plotH + 15}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(x || '')}</text>`;
    });

    svg += '</svg>';
    return svg;
  }

  // 8. BOX PLOT
  static renderBoxPlot(spec, title) {
    const data = spec.data || [{ label: 'Sample', min: 10, q1: 20, median: 30, q3: 40, max: 50 }];
    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;

    let maxV = 1;
    data.forEach(d => { if (d.max > maxV) maxV = d.max; });
    const bw = plotW / Math.max(data.length, 1);

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((maxV / 4) * i);
      const yPos = padT + plotH - (plotH / 4) * i;
      svg += `<line x1="${padL}" y1="${yPos}" x2="${totalWidth - padR}" y2="${yPos}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />`;
      svg += `<text x="${padL - 10}" y="${yPos + 4}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="end">${yVal}</text>`;
    }

    data.forEach((d, i) => {
      const cx = padL + i * bw + bw / 2;
      const getP = v => padT + plotH - (v / maxV) * plotH;
      const yMin = getP(d.min), yMax = getP(d.max), yQ1 = getP(d.q1), yQ3 = getP(d.q3), yMed = getP(d.median);

      svg += `<line x1="${cx}" y1="${yMax}" x2="${cx}" y2="${yQ3}" stroke="${CHART_COLORS[0]}" stroke-width="2" />`;
      svg += `<line x1="${cx}" y1="${yMin}" x2="${cx}" y2="${yQ1}" stroke="${CHART_COLORS[0]}" stroke-width="2" />`;
      svg += `<line x1="${cx - 10}" y1="${yMax}" x2="${cx + 10}" y2="${yMax}" stroke="${CHART_COLORS[0]}" stroke-width="2" />`;
      svg += `<line x1="${cx - 10}" y1="${yMin}" x2="${cx + 10}" y2="${yMin}" stroke="${CHART_COLORS[0]}" stroke-width="2" />`;
      svg += `<rect x="${cx - 15}" y="${yQ3}" width="30" height="${Math.max(1, yQ1 - yQ3)}" fill="${CHART_COLORS[0]}" opacity="0.6" rx="2" />`;
      svg += `<line x1="${cx - 15}" y1="${yMed}" x2="${cx + 15}" y2="${yMed}" stroke="#fff" stroke-width="2" />`;
      svg += `<text x="${cx}" y="${padT + plotH + 15}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(d.label || '')}</text>`;
    });

    svg += '</svg>';
    return svg;
  }

  // 9. WATERFALL
  static renderWaterfall(spec, title) {
    const data = spec.data || [{ label: 'Start', value: 100, type: 'total' }, { label: 'Revenue', value: 40, type: 'increase' }, { label: 'Cost', value: 30, type: 'decrease' }];
    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;

    let maxV = 1;
    let curr = 0;
    data.forEach(d => {
      if (d.type === 'total') { if (d.value > maxV) maxV = d.value; curr = d.value; }
      else { curr += (d.type === 'decrease' ? -d.value : d.value); if (curr > maxV) maxV = curr; }
    });

    const bw = plotW / Math.max(data.length, 1);
    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((maxV / 4) * i);
      const yPos = padT + plotH - (plotH / 4) * i;
      svg += `<line x1="${padL}" y1="${yPos}" x2="${totalWidth - padR}" y2="${yPos}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />`;
      svg += `<text x="${padL - 10}" y="${yPos + 4}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="end">${yVal}</text>`;
    }

    curr = 0;
    data.forEach((d, i) => {
      let startV = curr, endV = curr;
      let color = CHART_COLORS[0];
      if (d.type === 'total') { startV = 0; endV = d.value; curr = d.value; color = CHART_COLORS[1]; }
      else if (d.type === 'decrease') { startV = curr; endV = curr - d.value; curr -= d.value; color = ThemeTokens.danger || '#ef4444'; }
      else { startV = curr; endV = curr + d.value; curr += d.value; color = ThemeTokens.success || '#10b981'; }

      const topV = Math.max(startV, endV), botV = Math.min(startV, endV);
      const yT = padT + plotH - (topV / maxV) * plotH;
      const yB = padT + plotH - (botV / maxV) * plotH;
      const h = Math.max(1, yB - yT);

      const bx = padL + i * bw + bw * 0.2;
      svg += `<rect x="${bx}" y="${yT}" width="${bw * 0.6}" height="${h}" fill="${color}" rx="2" opacity="0.9" />`;
      svg += `<text x="${bx + bw * 0.3}" y="${padT + plotH + 15}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(d.label || '')}</text>`;
    });

    svg += '</svg>';
    return svg;
  }

  // 10. GAUGE
  static renderGauge(spec, title) {
    const val = Number(spec.value) || 0;
    const min = Number(spec.min) || 0;
    const max = Number(spec.max) || 100;
    const totalWidth = 600, totalHeight = 400;
    const cx = 300, cy = 280, r = 160, thickness = 36;

    const pct = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
    const ang = Math.PI + pct * Math.PI;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="300" y="50" fill="${ThemeTokens.text}" font-size="20" font-weight="700" text-anchor="middle">${title}</text>`;

    const pathBg = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
    svg += `<path d="${pathBg}" fill="none" stroke="rgba(99,102,241,0.2)" stroke-width="${thickness}" />`;

    const x2 = cx + r * Math.cos(ang), y2 = cy + r * Math.sin(ang);
    const pathFg = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
    const color = pct > 0.8 ? (ThemeTokens.danger || '#ef4444') : (pct > 0.5 ? (ThemeTokens.warning || '#f59e0b') : (ThemeTokens.success || '#10b981'));

    svg += `<path d="${pathFg}" fill="none" stroke="${color}" stroke-width="${thickness}" />`;
    svg += `<text x="${cx}" y="${cy - 20}" fill="${ThemeTokens.text}" font-size="44" font-weight="700" text-anchor="middle">${val}</text>`;
    if (spec.unit) svg += `<text x="${cx}" y="${cy + 15}" fill="${ThemeTokens.textSecondary}" font-size="14" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(spec.unit)}</text>`;

    svg += '</svg>';
    return svg;
  }

  // 11. KPI CARD
  static renderKpiCard(spec, title) {
    const val = spec.value ?? '0';
    const delta = spec.delta || spec.change || '';
    const status = spec.status || 'positive';
    const color = status === 'negative' ? (ThemeTokens.danger || '#ef4444') : (ThemeTokens.success || '#10b981');

    return `
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">
        <rect x="2" y="2" width="396" height="196" rx="12" fill="rgba(30,41,59,0.75)" stroke="rgba(99,102,241,0.3)" stroke-width="1.5" />
        <text x="24" y="44" fill="${ThemeTokens.textSecondary}" font-size="14" font-weight="500">${title}</text>
        <text x="24" y="110" fill="${ThemeTokens.text}" font-size="42" font-weight="700">${DiagramSanitizer.sanitizeLabel(String(val))}</text>
        ${delta ? `<text x="24" y="155" fill="${color}" font-size="14" font-weight="600">${status === 'negative' ? '▼' : '▲'} ${DiagramSanitizer.sanitizeLabel(String(delta))}</text>` : ''}
      </svg>
    `;
  }

  // 12. POPULATION PYRAMID
  static renderPopulationPyramid(spec, title) {
    const data = spec.data || [{ label: '0-10', left: 20, right: 19 }];
    const totalWidth = 600, totalHeight = 400;
    const padL = 20, padR = 20, padT = 60, padB = 40, mid = 300;
    const plotH = totalHeight - padT - padB;

    let maxV = 1;
    data.forEach(d => { if (d.left > maxV) maxV = d.left; if (d.right > maxV) maxV = d.right; });
    const bh = plotH / Math.max(data.length, 1);
    const pw = (totalWidth - padL - padR - 80) / 2;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="300" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700" text-anchor="middle">${title}</text>`;

    data.forEach((d, i) => {
      const y = padT + i * bh;
      const lw = (d.left / maxV) * pw;
      const rw = (d.right / maxV) * pw;

      svg += `<rect x="${mid - 40 - lw}" y="${y + bh * 0.1}" width="${lw}" height="${bh * 0.8}" fill="${CHART_COLORS[0]}" opacity="0.8" rx="2" />`;
      svg += `<rect x="${mid + 40}" y="${y + bh * 0.1}" width="${rw}" height="${bh * 0.8}" fill="${CHART_COLORS[1]}" opacity="0.8" rx="2" />`;
      svg += `<text x="${mid}" y="${y + bh / 2 + 4}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(d.label || '')}</text>`;
    });

    svg += '</svg>';
    return svg;
  }
}
