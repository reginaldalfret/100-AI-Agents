from enum import Enum
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict
import json

class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"        # >= 0.90
    MEDIUM = "MEDIUM"    # 0.70 - 0.89
    LOW = "LOW"          # < 0.70

@dataclass
class TextElement:
    text: str
    confidence: float
    bbox: List[List[float]]
    order: int
    confidence_level: str = "HIGH"

@dataclass
class TableResult:
    rows: int
    columns: int
    headers: List[str]
    cells: List[Dict[str, Any]]
    confidence: float
    html: str
    markdown: str
    csv: str
    page_number: int = 1

@dataclass
class FormulaResult:
    latex: str
    confidence: float
    bbox: List[List[float]]
    page_number: int = 1

@dataclass
class ChartResult:
    chart_type: str
    labels: List[str]
    title: str
    data: Dict[str, Any]
    page_number: int = 1

@dataclass
class LayoutBlock:
    type: str  # title, paragraph, table, formula, chart, header, footer, list
    bbox: List[List[float]]
    confidence: float
    content: str
    page_number: int = 1

@dataclass
class PageResult:
    page_number: int
    text_elements: List[TextElement]
    tables: List[TableResult] = field(default_factory=list)
    formulas: List[FormulaResult] = field(default_factory=list)
    charts: List[ChartResult] = field(default_factory=list)
    blocks: List[LayoutBlock] = field(default_factory=list)
    width: int = 0
    height: int = 0
    confidence: float = 0.95

@dataclass
class DocumentMetadata:
    id: str
    file_name: str
    file_type: str
    page_count: int
    processing_time_ms: float
    device: str = "cpu"
    engine: str = "PaddleOCR 3.7.0 (PP-OCRv6 + PP-StructureV3)"
    languages: List[str] = field(default_factory=lambda: ["en"])
    is_air_gapped: bool = True
    external_calls: int = 0

@dataclass
class OCRResult:
    document: DocumentMetadata
    pages: List[PageResult]
    full_text: str = ""
    markdown: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document": asdict(self.document),
            "pages": [
                {
                    "pageNumber": p.page_number,
                    "text": [asdict(t) for t in p.text_elements],
                    "blocks": [asdict(b) for b in p.blocks],
                    "tables": [asdict(tbl) for tbl in p.tables],
                    "formulas": [asdict(f) for f in p.formulas],
                    "charts": [asdict(c) for c in p.charts],
                    "confidence": p.confidence,
                    "width": p.width,
                    "height": p.height
                }
                for p in self.pages
            ],
            "fullText": self.full_text,
            "markdown": self.markdown,
            "metadata": {
                "languages": self.document.languages,
                "isAirGapped": self.document.is_air_gapped,
                "externalCalls": self.document.external_calls
            }
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)

    def to_markdown(self) -> str:
        if self.markdown:
            return self.markdown
        lines = [f"# Document: {self.document.file_name}\n"]
        for p in self.pages:
            if len(self.pages) > 1:
                lines.append(f"## Page {p.page_number}\n")
            for t in p.text_elements:
                lines.append(t.text)
            for tbl in p.tables:
                if tbl.markdown:
                    lines.append("\n" + tbl.markdown + "\n")
            for f in p.formulas:
                lines.append(f"$$\n{f.latex}\n$$")
            lines.append("")
        return "\n".join(lines)
