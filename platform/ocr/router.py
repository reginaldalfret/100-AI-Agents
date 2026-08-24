from enum import Enum
from typing import Dict, Any

class OCRTaskType(Enum):
    OCR_TEXT = "OCR_TEXT"
    DOCUMENT_PARSE = "DOCUMENT_PARSE"
    TABLE_EXTRACTION = "TABLE_EXTRACTION"
    FORMULA_EXTRACTION = "FORMULA_EXTRACTION"
    CHART_EXTRACTION = "CHART_EXTRACTION"
    LAYOUT_ANALYSIS = "LAYOUT_ANALYSIS"
    FULL_DOCUMENT_UNDERSTANDING = "FULL_DOCUMENT_UNDERSTANDING"

def classify_ocr_task(request: Dict[str, Any]) -> OCRTaskType:
    task_str = request.get("task_type", "OCR_TEXT").upper()
    try:
        return OCRTaskType[task_str]
    except KeyError:
        return OCRTaskType.OCR_TEXT

def route_ocr_task(task_type: OCRTaskType, file_path: str, options: Dict[str, Any]) -> Any:
    from .pipeline.document_pipeline import process_document
    return process_document(file_path, task_type, options)
