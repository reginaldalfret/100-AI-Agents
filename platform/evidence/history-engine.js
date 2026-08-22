/**
 * Sovereign AI Workbench — Historical Comparison & Trend Analysis Engine
 * Evaluates multi-year inspection degradation rates, calculates corrosion loss, and projects threshold crossing.
 */

export class HistoryEngine {
  constructor() {
    this.equipmentRecords = new Map(); // equipment_id -> [{ year, thickness_mm, date, notes }]
    this._initDefaultRefineryHistory();
  }

  _initDefaultRefineryHistory() {
    this.equipmentRecords.set("HX-204", [
      { year: 2024, thickness_mm: 7.20, date: "2024-03-15", standard: "OISD-STD-129" },
      { year: 2025, thickness_mm: 6.80, date: "2025-03-10", standard: "OISD-STD-129" },
      { year: 2026, thickness_mm: 5.90, date: "2026-08-20", standard: "OISD-STD-129" }
    ]);
  }

  recordMeasurement(equipmentId, measurement) {
    const list = this.equipmentRecords.get(equipmentId) || [];
    list.push({
      year: measurement.year || new Date().getFullYear(),
      thickness_mm: measurement.thickness_mm,
      date: measurement.date || new Date().toISOString().split("T")[0],
      standard: measurement.standard || "API-653"
    });
    list.sort((a, b) => a.year - b.year);
    this.equipmentRecords.set(equipmentId, list);
    return list;
  }

  analyzeTrend(equipmentId, retirementLimitMm = 6.80) {
    const history = this.equipmentRecords.get(equipmentId) || [];
    if (history.length < 2) {
      return {
        equipment_id: equipmentId,
        has_sufficient_history: false,
        datapoints_count: history.length,
        message: "At least 2 historical inspection data points required for trend analysis."
      };
    }

    const first = history[0];
    const latest = history[history.length - 1];
    const prev = history[history.length - 2];

    const totalYears = Math.max(1, latest.year - first.year);
    const totalMetalLoss = Number((first.thickness_mm - latest.thickness_mm).toFixed(2));
    const longTermRate = Number((totalMetalLoss / totalYears).toFixed(3)); // mm/year

    const recentYears = Math.max(1, latest.year - prev.year);
    const recentLoss = Number((prev.thickness_mm - latest.thickness_mm).toFixed(2));
    const shortTermRate = Number((recentLoss / recentYears).toFixed(3)); // mm/year

    const currentThickness = latest.thickness_mm;
    const isBelowRetirement = currentThickness < retirementLimitMm;
    const deficitMm = isBelowRetirement ? Number((retirementLimitMm - currentThickness).toFixed(2)) : 0;

    let remainingLifeYears = 0.0;
    if (!isBelowRetirement && shortTermRate > 0) {
      remainingLifeYears = Number(((currentThickness - retirementLimitMm) / shortTermRate).toFixed(2));
    }

    return {
      equipment_id: equipmentId,
      has_sufficient_history: true,
      datapoints_count: history.length,
      history_timeline: history,
      current_thickness_mm: currentThickness,
      retirement_limit_mm: retirementLimitMm,
      is_below_retirement_limit: isBelowRetirement,
      statutory_deficit_mm: deficitMm,
      long_term_corrosion_rate_mm_yr: longTermRate,
      short_term_corrosion_rate_mm_yr: shortTermRate,
      corrosion_acceleration_detected: shortTermRate > (longTermRate * 1.5),
      calculated_remaining_life_years: remainingLifeYears,
      engineering_recommendation: isBelowRetirement
        ? "MANDATORY_REPAIR: Thickness breached statutory retirement limit. Issue immediate weld-overlay/sleeve permit."
        : `OPERATIONAL: ${remainingLifeYears} years remaining life. Next mandatory NDT in 12 months.`
    };
  }
}

export const historyEngine = new HistoryEngine();
