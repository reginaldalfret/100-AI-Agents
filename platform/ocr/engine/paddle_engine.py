import os
import threading
from pathlib import Path
from typing import List, Dict, Any, Union, Optional
import numpy as np

from ..schema import TextElement, ConfidenceLevel

SUPPORTED_LANGUAGES = {
    'en': {'name': 'English', 'model': 'PP-OCRv6_rec_small', 'unified': True},
    'ta': {'name': 'Tamil', 'model': 'ta_PP-OCRv4_mobile_rec', 'unified': False},
    'hi': {'name': 'Hindi (Devanagari)', 'model': 'devanagari_PP-OCRv5_mobile_rec', 'unified': False},
    'latin': {'name': 'Latin (50 Languages)', 'model': 'PP-OCRv6_rec_small', 'unified': True}
}

class PaddleOCREngine:
    """Production offline OCR Engine supporting multilingual character recognition."""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(PaddleOCREngine, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self, models_dir: Optional[str] = None):
        if getattr(self, '_initialized', False):
            return
            
        self.models_dir = Path(models_dir) if models_dir else Path(__file__).parent.parent / "models"
        self.use_gpu = False
        self.ocr_version = 'PP-OCRv6'
        self._engines: Dict[str, Any] = {}
        self._initialized = True

    def _get_engine(self, lang: str = 'en'):
        norm_lang = lang.lower() if lang else 'en'
        if norm_lang not in SUPPORTED_LANGUAGES:
            norm_lang = 'en'

        if norm_lang in self._engines:
            return self._engines[norm_lang]

        try:
            from rapidocr_onnxruntime import RapidOCR
            engine = RapidOCR()
            self._engines[norm_lang] = engine
            return engine
        except ImportError:
            try:
                from paddleocr import PaddleOCR
                engine = PaddleOCR(use_angle_cls=True, lang=norm_lang, use_gpu=self.use_gpu)
                self._engines[norm_lang] = engine
                return engine
            except Exception as e:
                raise RuntimeError(f"Required offline OCR model or engine is missing: {e}")

    def ocr_image(
        self,
        image_path_or_array: Union[str, np.ndarray, Path],
        lang: str = 'en'
    ) -> List[TextElement]:
        """Executes OCR on an image and returns structured text elements."""
        engine = self._get_engine(lang)

        if isinstance(image_path_or_array, Path):
            image_path_or_array = str(image_path_or_array)

        try:
            if hasattr(engine, '__call__'):
                results, elapse = engine(image_path_or_array)
            else:
                raw = engine.ocr(image_path_or_array, cls=True)
                results = []
                if raw and raw[0]:
                    for line in raw[0]:
                        results.append((line[0], line[1][0], float(line[1][1])))
        except Exception as e:
            return []

        elements: List[TextElement] = []
        if not results:
            return elements

        for idx, item in enumerate(results):
            if not item or len(item) < 3:
                continue
            box, text, score = item[0], item[1], float(item[2])
            
            if score >= 0.90:
                conf_level = ConfidenceLevel.HIGH
            elif score >= 0.70:
                conf_level = ConfidenceLevel.MEDIUM
            else:
                conf_level = ConfidenceLevel.LOW

            coords = box if isinstance(box, list) else box.tolist() if hasattr(box, 'tolist') else []

            elements.append(TextElement(
                text=str(text).strip(),
                confidence=round(score, 4),
                bbox=coords,
                order=idx,
                confidence_level=conf_level.value
            ))

        return elements
