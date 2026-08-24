from typing import List, Dict, Any
from ..schema import LayoutBlock, TextElement

class LayoutAnalyzer:
    """Performs document layout region classification and reading order reconstruction."""

    def analyze(self, elements: List[TextElement], page_number: int = 1) -> List[LayoutBlock]:
        if not elements:
            return []

        blocks = []
        for elem in elements:
            text = elem.text.strip()
            # Heuristic structural classification
            if len(text) < 40 and (text.isupper() or "REPORT" in text or "INVOICE" in text or "TITLE" in text):
                block_type = "title"
            elif text.endswith(":") or (len(text) < 50 and text.istitle()):
                block_type = "heading"
            elif any(sym in text for sym in ["=", "×", "±", "∫", "∑", "\\"]):
                block_type = "formula"
            else:
                block_type = "paragraph"

            blocks.append(LayoutBlock(
                type=block_type,
                bbox=elem.bbox,
                confidence=elem.confidence,
                content=text,
                page_number=page_number
            ))

        return blocks
