import time
import uuid
from pathlib import Path
from typing import Dict, Any, Union
import numpy as np

from ..schema import OCRResult, DocumentMetadata, PageResult
from .image_pipeline import process_image
from .pdf_pipeline import process_pdf

def process_document(
    file_input: Union[str, Path, np.ndarray],
    task_type: str = "FULL_DOCUMENT_UNDERSTANDING",
    options: Dict[str, Any] = None
) -> OCRResult:
    if options is None:
        options = {}

    t0 = time.time()

    if isinstance(file_input, np.ndarray):
        page_res = process_image(file_input, options=options, page_number=1)
        elapsed_ms = (time.time() - t0) * 1000.0
        meta = DocumentMetadata(
            id=str(uuid.uuid4()),
            file_name="numpy_array_image",
            file_type="image",
            page_count=1,
            processing_time_ms=round(elapsed_ms, 2),
            languages=[options.get("lang", "en")]
        )
        res = OCRResult(document=meta, pages=[page_res], full_text=" ".join(t.text for t in page_res.text_elements))
        res.markdown = res.to_markdown()
        return res

    path_obj = Path(file_input)
    if not path_obj.exists():
        raise FileNotFoundError(f"Input file not found: {file_input}")

    ext = path_obj.suffix.lower()
    if ext == ".pdf":
        return process_pdf(str(path_obj), options=options)
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"]:
        page_res = process_image(str(path_obj), options=options, page_number=1)
        elapsed_ms = (time.time() - t0) * 1000.0
        meta = DocumentMetadata(
            id=str(uuid.uuid4()),
            file_name=path_obj.name,
            file_type=ext.lstrip("."),
            page_count=1,
            processing_time_ms=round(elapsed_ms, 2),
            languages=[options.get("lang", "en")]
        )
        res = OCRResult(document=meta, pages=[page_res], full_text=" ".join(t.text for t in page_res.text_elements))
        res.markdown = res.to_markdown()
        return res
    else:
        raise ValueError(f"Unsupported file format: {ext}. Expected PDF or Image.")
