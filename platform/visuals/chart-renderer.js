/**
 * Sovereign AI Workbench — Native Data Chart SVG Renderer
 * Renders 18 calibrated chart types without external chart libraries.
 */

import { DiagramSanitizer } from './sanitizer.js';
import { ThemeTokens, VisualType } from './schema.js';

const CHART_COLORS = [
  '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a855f7',
  '#22d3ee', '#e879f9', '#34d399', '#fbbf24', '#fb7185'
];

export class ChartRenderer {
  static render(spec) {
    const title = DiagramSanitizer.sanitizeLabel(spec.title || 'Data Visualization');
    const type = (spec.type || VisualType.BAR_CHART).toLowerCase();

    switch (type) {
      case VisualType.PIE_CHART:
      case 'pie':
        return this.renderPie(spec, title, false);
      case VisualType.DONUT_CHART:
      case 'donut':
        return this.renderPie(spec, title, true);
      case VisualType.LINE_CHART:
      case 'line':
        return this.renderLineArea(spec, title, 'line');
      case VisualType.AREA_CHART:
      case 'area':
        return this.renderLineArea(spec, title, 'area');
      case VisualType.STACKED_AREA_CHART:
      case 'stacked_area':
        return this.renderLineArea(spec, title, 'stacked_area');
      case VisualType.BAR_CHART:
      case 'bar':
        return this.renderBar(spec, title, 'vertical');
      case VisualType.HORIZONTAL_BAR_CHART:
      case 'horizontal_bar':
        return this.renderBar(spec, title, 'horizontal');
      case VisualType.GROUPED_BAR_CHART:
      case 'grouped_bar':
        return this.renderBar(spec, title, 'grouped');
      case VisualType.STACKED_BAR_CHART:
      case 'stacked_bar':
        return this.renderBar(spec, title, 'stacked');
      case VisualType.HISTOGRAM:
        return this.renderHistogram(spec, title);
      case VisualType.SCATTER_PLOT:
      case 'scatter':
        return this.renderScatter(spec, title, false);
      case VisualType.BUBBLE_CHART:
      case 'bubble':
        return this.renderScatter(spec, title, true);
      case VisualType.RADAR_CHART:
      case 'radar':
        return this.renderRadar(spec, title);
      case VisualType.HEATMAP:
        return this.renderHeatmap(spec, title);
      case VisualType.BOX_PLOT:
        return this.renderBoxPlot(spec, title);
      case VisualType.WATERFALL_CHART:
      case 'waterfall':
        return this.renderWaterfall(spec, title);
      case VisualType.GAUGE_CHART:
      case 'gauge':
        return this.renderGauge(spec, title);
      case VisualType.POPULATION_PYRAMID:
        return this.renderPopulationPyramid(spec, title);
      default:
        return this.renderBar(spec, title, 'vertical');
    }
  }

  static getChartData(spec) {
    if (spec.data) return spec.data;
    if (spec.labels && spec.series && spec.series[0] && spec.series[0].values) {
      return spec.labels.map((l, i) => ({ label: l, value: spec.series[0].values[i] }));
    }
    return [];
  }

  static renderPie(spec, title, isDonut) {
    const data = this.getChartData(spec);
    if (!data.length) data.push({label:'Empty', value:1});
    
    const totalWidth = 600;
    const totalHeight = 400;
    const cx = 200;
    const cy = 200;
    const radius = 120;
    const innerRadius = isDonut ? radius * 0.6 : 0;

    let total = 0;
    data.forEach(d => { total += (d.value || 0); });
    if (total === 0) total = 1;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-chart pie-chart" style="max-width:100%;font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="24" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;

    if (data.length === 1 || data[0].value === total) {
      const color = CHART_COLORS[0];
      svg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" stroke="#0f172a" stroke-width="1.5" opacity="0.85" />`;
      if (isDonut) {
        svg += `<circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="${ThemeTokens.bg || '#111827'}" />`;
      }
      svg += `
        <rect x="400" y="80" width="12" height="12" rx="3" fill="${color}" />
        <text x="420" y="90" fill="${ThemeTokens.textSecondary}" font-size="12">${DiagramSanitizer.sanitizeLabel(data[0].label || 'Value')}: <tspan fill="${ThemeTokens.text}" font-weight="600">${data[0].value} (100%)</tspan></text>
      `;
    } else {
      let currentAngle = 0;
      data.forEach((d, idx) => {
        const val = d.value || 0;
        const sliceAngle = (val / total) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;

        const x1 = cx + radius * Math.cos(currentAngle);
        const y1 = cy + radius * Math.sin(currentAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);

        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
        const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        const color = CHART_COLORS[idx % CHART_COLORS.length];

        svg += `<path d="${pathData}" fill="${color}" stroke="#0f172a" stroke-width="1.5" opacity="0.85" />`;

        const legY = 80 + idx * 24;
        const pct = Math.round((val / total) * 100);
        svg += `
          <rect x="400" y="${legY}" width="12" height="12" rx="3" fill="${color}" />
          <text x="420" y="${legY + 10}" fill="${ThemeTokens.textSecondary}" font-size="12">${DiagramSanitizer.sanitizeLabel(d.label || d.name)}: <tspan fill="${ThemeTokens.text}" font-weight="600">${val} (${pct}%)</tspan></text>
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

  static renderLineArea(spec, title, mode) {
    const xLabels = spec.x?.values || spec.labels || (spec.data ? spec.data.map(d=>d.label) : []);
    let seriesList = spec.series || [];
    if (seriesList.length === 0 && spec.data) {
       seriesList = [{ name: 'Value', values: spec.data.map(d => d.value) }];
    }
    if (xLabels.length === 0) xLabels.push('A');
    if (seriesList.length === 0) seriesList.push({name: 'Series', values: [0]});

    const totalWidth = 600;
    const totalHeight = 400;
    const padL = 60, padR = 120, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR;
    const plotH = totalHeight - padT - padB;

    let maxVal = 1;
    if (mode === 'stacked_area') {
      for (let i = 0; i < xLabels.length; i++) {
        let sum = 0;
        seriesList.forEach(s => { sum += (s.values[i] || 0); });
        if (sum > maxVal) maxVal = sum;
      }
    } else {
      seriesList.forEach(s => {
        (s.values || []).forEach(v => { if (v > maxVal) maxVal = v; });
      });
    }
    maxVal = Math.ceil(maxVal * 1.1);

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
        let yOffset = (v / maxVal) * plotH;
        let y = padT + plotH - yOffset;
        if (mode === 'stacked_area') {
           y = prevY[idx] - yOffset;
        }
        points.push({ x, y, v, py: prevY[idx] });
      });
      
      if (points.length === 1) {
         svg += `<circle cx="${points[0].x}" cy="${points[0].y}" r="4" fill="${color}" />`;
      } else if (points.length > 1) {
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        if (mode === 'area') {
          const areaD = `${pathD} L ${points[points.length - 1].x} ${padT + plotH} L ${points[0].x} ${padT + plotH} Z`;
          svg += `<path d="${areaD}" fill="${color}" opacity="0.3" />`;
        } else if (mode === 'stacked_area') {
          const areaD = `${pathD} ` + points.slice().reverse().map(p => `L ${p.x} ${p.py}`).join(' ') + ` Z`;
          svg += `<path d="${areaD}" fill="${color}" opacity="0.5" />`;
        }
        svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" />`;

        if (mode !== 'stacked_area') {
          points.forEach(p => {
            svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="#0f172a" stroke-width="1.5" />`;
          });
        }
      }
      
      if (mode === 'stacked_area') {
         points.forEach((p, idx) => { prevY[idx] = p.y; });
      }

      // Legend
      const legY = padT + sIdx * 20;
      svg += `
        <rect x="${totalWidth - padR + 20}" y="${legY}" width="12" height="12" rx="2" fill="${color}" />
        <text x="${totalWidth - padR + 36}" y="${legY + 10}" fill="${ThemeTokens.textSecondary}" font-size="11">${DiagramSanitizer.sanitizeLabel(s.name || `Series ${sIdx+1}`)}</text>
      `;
    });

    svg += '</svg>';
    return svg;
  }

  static renderBar(spec, title, mode) {
    const xLabels = spec.x?.values || spec.labels || (spec.data ? spec.data.map(d=>d.label) : []);
    let seriesList = spec.series || [];
    if (seriesList.length === 0 && spec.data) {
       seriesList = [{ name: 'Value', values: spec.data.map(d => d.value) }];
    }
    if (xLabels.length === 0) xLabels.push('A');
    if (seriesList.length === 0) seriesList.push({name: 'Series', values: [0]});

    const totalWidth = 600;
    const totalHeight = 400;
    const padL = 70, padR = 120, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR;
    const plotH = totalHeight - padT - padB;
    const isHoriz = mode === 'horizontal';

    let maxVal = 1;
    if (mode === 'stacked') {
      for (let i = 0; i < xLabels.length; i++) {
        let sum = 0;
        seriesList.forEach(s => { sum += (s.values[i] || 0); });
        if (sum > maxVal) maxVal = sum;
      }
    } else {
      seriesList.forEach(s => {
        (s.values || []).forEach(v => { if (v > maxVal) maxVal = v; });
      });
    }
    maxVal = Math.ceil(maxVal * 1.15);

    const categoriesCount = xLabels.length;
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

    const numSeries = seriesList.length;
    let prev = new Array(categoriesCount).fill(0);

    for (let c = 0; c < categoriesCount; c++) {
      const lbl = DiagramSanitizer.sanitizeLabel(xLabels[c] || `Cat ${c+1}`);
      if (isHoriz) {
        const y = padT + c * catBand + catBand/2;
        svg += `<text x="${padL - 10}" y="${y+4}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="end">${lbl}</text>`;
      } else {
        const x = padL + c * catBand + catBand/2;
        svg += `<text x="${x}" y="${totalHeight - padB + 20}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${lbl}</text>`;
      }
      
      seriesList.forEach((s, sIdx) => {
        const val = s.values[c] || 0;
        const color = CHART_COLORS[sIdx % CHART_COLORS.length];
        
        let barW = 0, barH = 0, bx = 0, by = 0;
        
        if (isHoriz) {
           const size = (val/maxVal)*plotW;
           const thickness = mode==='grouped' ? (catBand*0.8)/numSeries : catBand*0.6;
           barW = size;
           barH = thickness;
           bx = padL + (mode==='stacked'? prev[c] : 0);
           by = padT + c * catBand + (catBand - (mode==='grouped'?thickness*numSeries:thickness))/2 + (mode==='grouped'?sIdx*thickness:0);
           if (mode==='stacked') prev[c] += size;
        } else {
           const size = (val/maxVal)*plotH;
           const thickness = mode==='grouped' ? (catBand*0.8)/numSeries : catBand*0.6;
           barW = thickness;
           barH = size;
           bx = padL + c * catBand + (catBand - (mode==='grouped'?thickness*numSeries:thickness))/2 + (mode==='grouped'?sIdx*thickness:0);
           by = padT + plotH - size - (mode==='stacked'? prev[c] : 0);
           if (mode==='stacked') prev[c] += size;
        }

        if (barH > 0 && barW > 0) {
           svg += `<rect x="${bx}" y="${by}" width="${barW}" height="${barH}" rx="2" fill="${color}" opacity="0.85" />`;
        }
      });
    }

    seriesList.forEach((s, sIdx) => {
      const color = CHART_COLORS[sIdx % CHART_COLORS.length];
      const legY = padT + sIdx * 20;
      svg += `
        <rect x="${totalWidth - padR + 20}" y="${legY}" width="12" height="12" rx="2" fill="${color}" />
        <text x="${totalWidth - padR + 36}" y="${legY + 10}" fill="${ThemeTokens.textSecondary}" font-size="11">${DiagramSanitizer.sanitizeLabel(s.name || `Series ${sIdx+1}`)}</text>
      `;
    });

    svg += '</svg>';
    return svg;
  }

  static renderHistogram(spec, title) {
    let bins = spec.bins || spec.data || [];
    if (!bins.length) bins = [{min:0, max:1, count:1}];
    
    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;
    
    let maxCount = 1;
    bins.forEach(b => { if(b.count > maxCount) maxCount = b.count; });
    maxCount = Math.ceil(maxCount * 1.15);
    
    const binW = plotW / bins.length;
    
    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;
    
    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((maxCount / 4) * i);
      const yPos = padT + plotH - (plotH / 4) * i;
      svg += `<line x1="${padL}" y1="${yPos}" x2="${totalWidth - padR}" y2="${yPos}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />`;
      svg += `<text x="${padL - 10}" y="${yPos + 4}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="end">${yVal}</text>`;
    }
    
    bins.forEach((b, i) => {
      const h = (b.count / maxCount) * plotH;
      const x = padL + i * binW;
      const y = padT + plotH - h;
      svg += `<rect x="${x+1}" y="${y}" width="${binW-2}" height="${h}" fill="${CHART_COLORS[0]}" opacity="0.8" />`;
      svg += `<text x="${x+binW/2}" y="${padT+plotH+15}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${b.min}-${b.max}</text>`;
    });
    
    svg += '</svg>';
    return svg;
  }

  static renderScatter(spec, title, isBubble) {
    const data = spec.data || [];
    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 60, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;
    
    let minX=0, maxX=1, minY=0, maxY=1, maxR=1;
    if (data.length > 0) {
      minX = Math.min(...data.map(d=>d.x)); maxX = Math.max(...data.map(d=>d.x));
      minY = Math.min(...data.map(d=>d.y)); maxY = Math.max(...data.map(d=>d.y));
      if (isBubble) maxR = Math.max(...data.map(d=>d.r||1));
    }
    if (minX===maxX) { minX-=1; maxX+=1; }
    if (minY===maxY) { minY-=1; maxY+=1; }
    
    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;
    
    svg += `<line x1="${padL}" y1="${padT+plotH}" x2="${totalWidth-padR}" y2="${padT+plotH}" stroke="${ThemeTokens.border || 'rgba(99,102,241,0.25)'}" />`;
    svg += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+plotH}" stroke="${ThemeTokens.border || 'rgba(99,102,241,0.25)'}" />`;
    
    data.forEach((d, i) => {
      const cx = padL + ((d.x - minX)/(maxX - minX)) * plotW;
      const cy = padT + plotH - ((d.y - minY)/(maxY - minY)) * plotH;
      const r = isBubble ? Math.max(3, ((d.r||1)/maxR)*20) : 5;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.7" stroke="#fff" stroke-width="1" />`;
      if (d.label) svg += `<text x="${cx}" y="${cy-r-2}" fill="${ThemeTokens.textSecondary}" font-size="9" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(d.label)}</text>`;
    });
    
    svg += '</svg>';
    return svg;
  }

  static renderRadar(spec, title) {
    const axes = spec.axes || spec.labels || [];
    let seriesList = spec.series || (spec.data ? [{name:'Value', values: spec.data.map(d=>d.value)}] : []);
    if(axes.length<3) return `<svg viewBox="0 0 400 400"><text x="20" y="20" fill="white">Radar needs at least 3 axes</text></svg>`;
    
    const totalWidth = 600, totalHeight = 400;
    const cx = 300, cy = 220, maxR = 140;
    
    let maxVal = 1;
    seriesList.forEach(s => s.values.forEach(v => { if(v>maxVal) maxVal=v; }));
    
    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="20" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;
    
    const levels = 4;
    for(let l=1; l<=levels; l++) {
      const r = (l/levels)*maxR;
      let pts = [];
      for(let i=0; i<axes.length; i++) {
        const ang = (i/axes.length)*2*Math.PI - Math.PI/2;
        pts.push(`${cx + r*Math.cos(ang)},${cy + r*Math.sin(ang)}`);
      }
      svg += `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(99,102,241,0.2)" />`;
    }
    
    axes.forEach((ax, i) => {
      const ang = (i/axes.length)*2*Math.PI - Math.PI/2;
      const x2 = cx + maxR*Math.cos(ang), y2 = cy + maxR*Math.sin(ang);
      svg += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="rgba(99,102,241,0.3)" />`;
      svg += `<text x="${cx + (maxR+15)*Math.cos(ang)}" y="${cy + (maxR+15)*Math.sin(ang)}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle" dominant-baseline="middle">${DiagramSanitizer.sanitizeLabel(ax)}</text>`;
    });
    
    seriesList.forEach((s, sIdx) => {
      const color = CHART_COLORS[sIdx % CHART_COLORS.length];
      let pts = [];
      s.values.forEach((v, i) => {
        const ang = (i/axes.length)*2*Math.PI - Math.PI/2;
        const r = (v/maxVal)*maxR;
        pts.push(`${cx + r*Math.cos(ang)},${cy + r*Math.sin(ang)}`);
      });
      svg += `<polygon points="${pts.join(' ')}" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="2" />`;
      
      const legY = 60 + sIdx * 20;
      svg += `
        <rect x="20" y="${legY}" width="12" height="12" rx="2" fill="${color}" />
        <text x="36" y="${legY + 10}" fill="${ThemeTokens.textSecondary}" font-size="11">${DiagramSanitizer.sanitizeLabel(s.name)}</text>
      `;
    });
    
    svg += '</svg>';
    return svg;
  }

  static renderHeatmap(spec, title) {
    const mat = spec.matrix || [[1]];
    const xL = spec.xLabels || mat[0].map((_,i)=>`X${i}`);
    const yL = spec.yLabels || mat.map((_,i)=>`Y${i}`);
    
    const totalWidth = 600, totalHeight = 400;
    const padL = 80, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;
    
    let maxV=0; mat.forEach(r => r.forEach(v => { if(v>maxV) maxV=v; }));
    
    const cW = plotW / xL.length, cH = plotH / yL.length;
    
    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;
    
    mat.forEach((row, i) => {
      svg += `<text x="${padL-10}" y="${padT + i*cH + cH/2 + 4}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="end">${DiagramSanitizer.sanitizeLabel(yL[i])}</text>`;
      row.forEach((v, j) => {
        const op = maxV===0? 0 : (v/maxV)*0.8 + 0.2;
        svg += `<rect x="${padL + j*cW}" y="${padT + i*cH}" width="${cW-2}" height="${cH-2}" fill="${CHART_COLORS[0]}" opacity="${op}" rx="2" />`;
        svg += `<text x="${padL + j*cW + cW/2}" y="${padT + i*cH + cH/2 + 4}" fill="#fff" font-size="10" text-anchor="middle">${v}</text>`;
      });
    });
    
    xL.forEach((x, j) => {
      svg += `<text x="${padL + j*cW + cW/2}" y="${padT + plotH + 15}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(x)}</text>`;
    });
    
    svg += '</svg>';
    return svg;
  }

  static renderBoxPlot(spec, title) {
    const data = spec.data || [];
    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;
    
    let maxV = 1;
    data.forEach(d => { if(d.max > maxV) maxV = d.max; });
    
    const bw = plotW / data.length;
    
    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700">${title}</text>`;
    
    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((maxV / 4) * i);
      const yPos = padT + plotH - (plotH / 4) * i;
      svg += `<line x1="${padL}" y1="${yPos}" x2="${totalWidth - padR}" y2="${yPos}" stroke="rgba(99, 102, 241, 0.15)" stroke-dasharray="3,3" />`;
      svg += `<text x="${padL - 10}" y="${yPos + 4}" fill="${ThemeTokens.textMuted}" font-size="10" text-anchor="end">${yVal}</text>`;
    }
    
    data.forEach((d, i) => {
      const cx = padL + i*bw + bw/2;
      const getP = v => padT + plotH - (v/maxV)*plotH;
      const yMin = getP(d.min), yMax = getP(d.max), yQ1 = getP(d.q1), yQ3 = getP(d.q3), yMed = getP(d.median);
      
      svg += `<line x1="${cx}" y1="${yMax}" x2="${cx}" y2="${yQ3}" stroke="${CHART_COLORS[0]}" stroke-width="2" />`;
      svg += `<line x1="${cx}" y1="${yMin}" x2="${cx}" y2="${yQ1}" stroke="${CHART_COLORS[0]}" stroke-width="2" />`;
      svg += `<line x1="${cx-10}" y1="${yMax}" x2="${cx+10}" y2="${yMax}" stroke="${CHART_COLORS[0]}" stroke-width="2" />`;
      svg += `<line x1="${cx-10}" y1="${yMin}" x2="${cx+10}" y2="${yMin}" stroke="${CHART_COLORS[0]}" stroke-width="2" />`;
      
      svg += `<rect x="${cx-15}" y="${yQ3}" width="30" height="${yQ1-yQ3}" fill="${CHART_COLORS[0]}" opacity="0.6" rx="2" />`;
      svg += `<line x1="${cx-15}" y1="${yMed}" x2="${cx+15}" y2="${yMed}" stroke="#fff" stroke-width="2" />`;
      
      svg += `<text x="${cx}" y="${padT + plotH + 15}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(d.label)}</text>`;
    });
    
    svg += '</svg>';
    return svg;
  }

  static renderWaterfall(spec, title) {
    const data = spec.data || [];
    const totalWidth = 600, totalHeight = 400;
    const padL = 60, padR = 40, padT = 60, padB = 60;
    const plotW = totalWidth - padL - padR, plotH = totalHeight - padT - padB;
    
    let maxV = 1;
    let curr = 0;
    data.forEach(d => {
      if(d.type==='total') { if(d.value>maxV) maxV=d.value; curr = d.value; }
      else { curr += (d.type==='decrease' ? -d.value : d.value); if(curr>maxV) maxV=curr; }
    });
    
    const bw = plotW / data.length;
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
      if(d.type==='total') { startV=0; endV=d.value; curr=d.value; color=CHART_COLORS[1]; }
      else if(d.type==='decrease') { startV=curr; endV=curr-d.value; curr-=d.value; color=ThemeTokens.danger||'#ef4444'; }
      else { startV=curr; endV=curr+d.value; curr+=d.value; color=ThemeTokens.success||'#10b981'; }
      
      const topV = Math.max(startV, endV), botV = Math.min(startV, endV);
      const yT = padT + plotH - (topV/maxV)*plotH;
      const yB = padT + plotH - (botV/maxV)*plotH;
      const h = yB - yT;
      
      const bx = padL + i*bw + bw*0.2;
      svg += `<rect x="${bx}" y="${yT}" width="${bw*0.6}" height="${h}" fill="${color}" rx="2" opacity="0.9" />`;
      if(i>0 && data[i-1].type!=='total') {
        const py = padT + plotH - (startV/maxV)*plotH;
        svg += `<line x1="${bx-bw*0.8}" y1="${py}" x2="${bx}" y2="${py}" stroke="rgba(255,255,255,0.3)" stroke-dasharray="2,2" />`;
      }
      svg += `<text x="${bx+bw*0.3}" y="${padT + plotH + 15}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(d.label)}</text>`;
    });
    
    svg += '</svg>';
    return svg;
  }

  static renderGauge(spec, title) {
    const val = spec.value || 0;
    const min = spec.min || 0;
    const max = spec.max || 100;
    
    const totalWidth = 600, totalHeight = 400;
    const cx = 300, cy = 300, r = 180, thickness = 40;
    
    const pct = Math.max(0, Math.min(1, (val-min)/(max-min)));
    const ang = Math.PI + pct*Math.PI;
    
    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="300" y="50" fill="${ThemeTokens.text}" font-size="20" font-weight="700" text-anchor="middle">${title}</text>`;
    
    const pathBg = `M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`;
    svg += `<path d="${pathBg}" fill="none" stroke="rgba(99,102,241,0.2)" stroke-width="${thickness}" />`;
    
    const x2 = cx + r*Math.cos(ang), y2 = cy + r*Math.sin(ang);
    const largeArc = pct > 0.5 ? 0 : 0; 
    const pathFg = `M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
    
    let color = CHART_COLORS[0];
    if(spec.thresholds) {
      color = ThemeTokens.success||'#10b981';
    }
    
    svg += `<path d="${pathFg}" fill="none" stroke="${color}" stroke-width="${thickness}" />`;
    
    svg += `<text x="${cx}" y="${cy-20}" fill="${ThemeTokens.text}" font-size="48" font-weight="700" text-anchor="middle">${val}</text>`;
    svg += `<text x="${cx-r}" y="${cy+20}" fill="${ThemeTokens.textSecondary}" font-size="14" text-anchor="middle">${min}</text>`;
    svg += `<text x="${cx+r}" y="${cy+20}" fill="${ThemeTokens.textSecondary}" font-size="14" text-anchor="middle">${max}</text>`;
    
    svg += '</svg>';
    return svg;
  }

  static renderPopulationPyramid(spec, title) {
    const data = spec.data || [];
    const totalWidth = 600, totalHeight = 400;
    const padL = 20, padR = 20, padT = 60, padB = 40, mid = 300;
    const plotH = totalHeight - padT - padB;
    
    let maxV = 1;
    data.forEach(d => { if(d.left>maxV) maxV=d.left; if(d.right>maxV) maxV=d.right; });
    
    const bh = plotH / data.length;
    
    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="300" y="30" fill="${ThemeTokens.text}" font-size="16" font-weight="700" text-anchor="middle">${title}</text>`;
    
    const pw = (totalWidth - padL - padR - 80)/2; 
    
    data.forEach((d, i) => {
      const y = padT + i*bh;
      const lw = (d.left/maxV)*pw;
      const rw = (d.right/maxV)*pw;
      
      svg += `<rect x="${mid - 40 - lw}" y="${y+bh*0.1}" width="${lw}" height="${bh*0.8}" fill="${CHART_COLORS[0]}" opacity="0.8" rx="2" />`;
      svg += `<rect x="${mid + 40}" y="${y+bh*0.1}" width="${rw}" height="${bh*0.8}" fill="${CHART_COLORS[1]}" opacity="0.8" rx="2" />`;
      svg += `<text x="${mid}" y="${y+bh/2+4}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${DiagramSanitizer.sanitizeLabel(d.label)}</text>`;
    });
    
    svg += `<text x="${mid - 40 - pw/2}" y="${totalHeight-10}" fill="${ThemeTokens.textSecondary}" font-size="12" text-anchor="middle">Left</text>`;
    svg += `<text x="${mid + 40 + pw/2}" y="${totalHeight-10}" fill="${ThemeTokens.textSecondary}" font-size="12" text-anchor="middle">Right</text>`;
    
    svg += '</svg>';
    return svg;
  }
}
