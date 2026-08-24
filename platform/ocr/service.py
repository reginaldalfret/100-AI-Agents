import os
import uuid
import base64
import tempfile
from pathlib import Path
from typing import Dict, Any

from .pipeline.document_pipeline import process_document
from .models.registry import list_ocr_models

def handle_ocr_image(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handles single image OCR request via file path or base64 data."""
    image_path = payload.get("image_path") or payload.get("file_path")
    image_base64 = payload.get("image_base64")
    lang = payload.get("lang", "en")
    options = {"lang": lang, **payload.get("options", {})}

    if image_base64:
        temp_dir = tempfile.gettempdir()
        temp_file = Path(temp_dir) / f"ocr_{uuid.uuid4().hex}.png"
        try:
            with open(temp_file, "wb") as f:
                f.write(base64.b64decode(image_base64))
            res = process_document(str(temp_file), options=options)
            return res.to_dict()
        finally:
            if temp_file.exists():
                try:
                    temp_file.unlink()
                except Exception:
                    pass
    elif image_path:
        res = process_document(image_path, options=options)
        return res.to_dict()
    else:
        raise ValueError("Missing 'image_path' or 'image_base64' in payload.")

def handle_ocr_document(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handles multi-page document (PDF/Image) OCR request."""
    file_path = payload.get("file_path") or payload.get("document_path")
    lang = payload.get("lang", "en")
    options = {"lang": lang, **payload.get("options", {})}

    if not file_path:
        raise ValueError("Missing 'file_path' in payload.")

    res = process_document(file_path, options=options)
    return res.to_dict()

def handle_ocr_table(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Extracts tables specifically from image or PDF."""
    res = handle_ocr_document(payload)
    tables = []
    for p in res.get("pages", []):
        tables.extend(p.get("tables", []))
    return {
        "document": res.get("document"),
        "tables": tables,
        "table_count": len(tables),
        "is_air_gapped": True
    }

def handle_ocr_health() -> Dict[str, Any]:
    """Returns OCR engine health status and available offline models."""
    return {
        "status": "healthy",
        "engine": "PaddleOCR 3.7.0 / RapidOCR ONNX",
        "models": list_ocr_models(),
        "is_air_gapped": True,
        "supported_languages": ["en", "ta", "hi", "latin"]
    }
