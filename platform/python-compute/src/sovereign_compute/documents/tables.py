"""Table extraction and normalization"""
import re
from typing import List, Dict, Any

def extract_tables(text: str) -> List[Dict[str, Any]]:
    tables = []
    lines = text.splitlines()
    table_lines = []

    for line in lines:
        if "|" in line:
            table_lines.append(line.strip())
        else:
            if len(table_lines) >= 2:
                tables.append(parse_table(table_lines))
            table_lines = []

    if len(table_lines) >= 2:
        tables.append(parse_table(table_lines))
    return tables

def parse_table(lines: List[str]) -> Dict[str, Any]:
    rows = []
    for line in lines:
        parts = [p.strip() for p in line.split("|") if p.strip()]
        if parts and not all(re.match(r"^[-:]+$", p) for p in parts):
            rows.append(parts)

    if not rows:
        return {"headers": [], "rows": [], "row_count": 0}

    headers = rows[0]
    data_rows = rows[1:] if len(rows) > 1 else []
    structured = []
    for r in data_rows:
        row_dict = {}
        for idx, h in enumerate(headers):
            row_dict[h] = r[idx] if idx < len(r) else ""
        structured.append(row_dict)

    return {
        "headers": headers,
        "rows": structured,
        "row_count": len(structured),
        "column_count": len(headers)
    }
