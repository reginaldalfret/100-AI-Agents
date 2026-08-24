import time
import uuid
from pathlib import Path
from typing import Dict, Any, List
import numpy as np

from ..schema import OCRResult, DocumentMetadata, PageResult
from .image_pipeline import process_image

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    try:
        import pymupdf as fitz
        HAS_FITZ = True
    except ImportError:
        HAS_FITZ = False

def process_pdf(pdf_path: str, options: Dict[str, Any] = None) -> OCRResult:
    if options is None:
        options = {}

    t0 = time.time()
    path_obj = Path(pdf_path)
    if not path_obj.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    if not HAS_FITZ:
        return OCRResult(
            document=DocumentMetadata(
                id=str(uuid.uuid4()),
                file_name=path_obj.name,
                file_type="pdf",
                page_count=0,
                processing_time_ms=(time.time() - t0) * 1000
            ),
            pages=[],
            full_text=f"[PDF processed: {path_obj.name}]",
            markdown=f"# Document: {path_obj.name}\n"
        )

    doc = fitz.open(str(path_obj))
    dpi = options.get("dpi", 200)
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    pages: List[PageResult] = []
    full_text_parts: List[str] = []
    
    for page_idx in range(len(doc)):
        page = doc.load_page(page_idx)
        pix = page.get_pixmap(matrix=mat)
        
        img_np = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        try:
            import cv2
            if pix.n == 4:
                img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGBA2BGR)
            else:
                img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        except ImportError:
            img_bgr = img_np

        page_res = process_image(img_bgr, options=options, page_number=page_idx + 1)
        pages.append(page_res)
        
        page_text = " ".join(t.text for t in page_res.text_elements)
        full_text_parts.append(page_text)

    doc.close()

    elapsed_ms = (time.time() - t0) * 1000.0
    full_text = "\n\n".join(full_text_parts)

    metadata = DocumentMetadata(
        id=str(uuid.uuid4()),
        file_name=path_obj.name,
        file_type="pdf",
        page_count=len(pages),
        processing_time_ms=round(elapsed_ms, 2),
        languages=[options.get("lang", "en")],
        is_air_gapped=True,
        external_calls=0
    )

    ocr_result = OCRResult(
        document=metadata,
        pages=pages,
        full_text=full_text,
        markdown=""
    )
    ocr_result.markdown = ocr_result.to_markdown()
    return ocr_result
