import time
from pathlib import Path
from typing import Dict, Any, Union
import numpy as np

from ..schema import PageResult
from ..engine.paddle_engine import PaddleOCREngine
from ..engine.preprocessing import preprocess_image
from ..engine.tables import TableExtractor
from ..engine.layout import LayoutAnalyzer

def process_image(
    image_path_or_array: Union[str, Path, np.ndarray],
    options: Dict[str, Any] = None,
    page_number: int = 1
) -> PageResult:
    if options is None:
        options = {}

    engine = PaddleOCREngine()
    table_extractor = TableExtractor()
    layout_analyzer = LayoutAnalyzer()

    processed_img = preprocess_image(image_path_or_array, options)
    lang = options.get("lang", "en")
    
    text_elements = engine.ocr_image(processed_img, lang=lang)
    tables = table_extractor.extract_from_elements(text_elements, page_number=page_number)
    blocks = layout_analyzer.analyze(text_elements, page_number=page_number)

    avg_conf = (
        sum(t.confidence for t in text_elements) / len(text_elements)
        if text_elements else 0.95
    )

    h, w = (processed_img.shape[0], processed_img.shape[1]) if hasattr(processed_img, 'shape') else (0, 0)

    return PageResult(
        page_number=page_number,
        text_elements=text_elements,
        tables=tables,
        formulas=[],
        charts=[],
        blocks=blocks,
        width=w,
        height=h,
        confidence=round(avg_conf, 4)
    )
