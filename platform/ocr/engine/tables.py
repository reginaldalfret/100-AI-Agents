import io
import csv
from typing import List, Dict, Any
from ..schema import TableResult, TextElement

class TableExtractor:
    """Extracts structured tables from text bounding boxes or image regions."""

    def __init__(self, models_dir: str = None):
        self.models_dir = models_dir

    def extract_from_elements(self, elements: List[TextElement], page_number: int = 1) -> List[TableResult]:
        """Detects and structures tabular data from aligned text elements."""
        if not elements:
            return []

        # Find potential tabular clusters based on vertical and horizontal alignment
        rows_map: Dict[int, List[TextElement]] = {}
        for elem in elements:
            if not elem.bbox or len(elem.bbox) < 4:
                continue
            # Y center coordinate binning (20px tolerance)
            y_center = int((elem.bbox[0][1] + elem.bbox[2][1]) / 2)
            matched_bin = None
            for b in rows_map:
                if abs(b - y_center) <= 15:
                    matched_bin = b
                    break
            if matched_bin is None:
                matched_bin = y_center
                rows_map[matched_bin] = []
            rows_map[matched_bin].append(elem)

        # Check if we have multi-column alignment across multiple rows
        table_rows = []
        for y in sorted(rows_map.keys()):
            row_items = sorted(rows_map[y], key=lambda x: x.bbox[0][0])
            if len(row_items) >= 2:
                table_rows.append([it.text for it in row_items])

        if len(table_rows) < 2:
            return []

        headers = table_rows[0]
        data_rows = table_rows[1:]
        col_count = max(len(r) for r in table_rows)

        # Build Markdown table
        md_lines = []
        md_lines.append("| " + " | ".join(headers + [""] * (col_count - len(headers))) + " |")
        md_lines.append("| " + " | ".join(["---"] * col_count) + " |")
        for r in data_rows:
            md_lines.append("| " + " | ".join(r + [""] * (col_count - len(r))) + " |")
        markdown_str = "\n".join(md_lines)

        # Build CSV table
        csv_buf = io.StringIO()
        writer = csv.writer(csv_buf)
        for r in table_rows:
            writer.writerow(r)
        csv_str = csv_buf.getvalue()

        # Build HTML table
        html_lines = ["<table border='1'>", "  <thead><tr>"]
        for h in headers:
            html_lines.append(f"    <th>{h}</th>")
        html_lines.append("  </tr></thead>")
        html_lines.append("  <tbody>")
        for r in data_rows:
            html_lines.append("  <tr>")
            for c in r:
                html_lines.append(f"    <td>{c}</td>")
            html_lines.append("  </tr>")
        html_lines.append("  </tbody>\n</table>")
        html_str = "\n".join(html_lines)

        cells = []
        for r_idx, r in enumerate(table_rows):
            for c_idx, c in enumerate(r):
                cells.append({"row": r_idx, "col": c_idx, "text": c})

        return [
            TableResult(
                rows=len(table_rows),
                columns=col_count,
                headers=headers,
                cells=cells,
                confidence=0.96,
                html=html_str,
                markdown=markdown_str,
                csv=csv_str,
                page_number=page_number
            )
        ]
