"""Layout analysis for text and document pages"""
import re
from typing import Dict, Any, List

def analyze_layout(text: str) -> Dict[str, Any]:
    lines = text.splitlines()
    headings = []
    paragraphs = []
    tables = []
    bullets = []
    current_para = []

    for i, line in enumerate(lines):
        trimmed = line.strip()
        if not trimmed:
            if current_para:
                paragraphs.append("\n".join(current_para))
                current_para = []
            continue
        if re.match(r"^#{1,6}\s+", trimmed) or re.match(r"^[0-9]+(\.[0-9]+)*\s+[A-Z]", trimmed):
            if current_para:
                paragraphs.append("\n".join(current_para))
                current_para = []
            headings.append({"line": i + 1, "text": trimmed})
        elif trimmed.startswith("- ") or trimmed.startswith("* ") or re.match(r"^[0-9]+\.\s+", trimmed):
            if current_para:
                paragraphs.append("\n".join(current_para))
                current_para = []
            bullets.append(trimmed)
        elif "|" in trimmed:
            tables.append(trimmed)
        else:
            current_para.append(trimmed)

    if current_para:
        paragraphs.append("\n".join(current_para))

    return {
        "total_lines": len(lines),
        "headings": headings,
        "heading_count": len(headings),
        "paragraphs": paragraphs,
        "paragraph_count": len(paragraphs),
        "bullets": bullets,
        "bullet_count": len(bullets),
        "has_tables": len(tables) > 0
    }
