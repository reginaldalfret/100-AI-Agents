"""Pandas and NumPy Data Intelligence"""
from typing import Dict, Any, List
import math

def analyze_dataset(data: List[float]) -> Dict[str, Any]:
    if not data:
        return {"error": "Empty dataset"}
    n = len(data)
    mean_val = sum(data) / n
    variance = sum((x - mean_val) ** 2 for x in data) / n if n > 1 else 0.0
    std_dev = math.sqrt(variance)
    sorted_d = sorted(data)
    median_val = sorted_d[n // 2] if n % 2 != 0 else (sorted_d[n//2 - 1] + sorted_d[n//2]) / 2
    q1 = sorted_d[int(0.25 * n)]
    q3 = sorted_d[int(0.75 * n)]
    iqr = q3 - q1
    outliers = [x for x in data if x < q1 - 1.5 * iqr or x > q3 + 1.5 * iqr]
    return {
        "count": n,
        "mean": round(mean_val, 4),
        "median": round(median_val, 4),
        "variance": round(variance, 4),
        "std_dev": round(std_dev, 4),
        "min": min(data),
        "max": max(data),
        "iqr": round(iqr, 4),
        "outliers": outliers,
        "is_air_gapped": True
    }
