import os
from pathlib import Path
from typing import Dict, Any, List

OCR_MODELS = {
    "det_model": {
        "name": "en_PP-OCRv6_det_infer",
        "required": True,
        "purpose": "Text Detection",
        "languages": ["en"]
    },
    "rec_model_en": {
        "name": "en_PP-OCRv6_rec_infer",
        "required": True,
        "purpose": "English Text Recognition",
        "languages": ["en"]
    },
    "rec_model_ta": {
        "name": "recognition/ta_PP-OCRv4_mobile_rec",
        "required": False,
        "purpose": "Tamil Text Recognition",
        "languages": ["ta"]
    },
    "rec_model_hi": {
        "name": "recognition/devanagari_PP-OCRv5_mobile_rec",
        "required": False,
        "purpose": "Hindi Text Recognition",
        "languages": ["hi"]
    },
    "cls_model": {
        "name": "ch_ppocr_mobile_v2.0_cls_infer",
        "required": True,
        "purpose": "Text Direction Classification",
        "languages": ["multilingual"]
    },
    "layout_model": {
        "name": "picodet_lcnet_x1_0_fgd_layout_infer",
        "required": False,
        "purpose": "Layout Analysis",
        "languages": ["en"]
    },
    "table_model": {
        "name": "en_ppstructure_mobile_v2.0_SLANet_infer",
        "required": False,
        "purpose": "Table Structure Recognition",
        "languages": ["en"]
    },
    "formula_model": {
        "name": "PP-FormulaNet",
        "required": False,
        "purpose": "Formula Recognition",
        "languages": ["en"]
    }
}

def verify_models(models_dir: str) -> bool:
    dir_path = Path(models_dir)
    for key, info in OCR_MODELS.items():
        if info["required"]:
            model_path = dir_path / info["name"]
            if not model_path.exists():
                raise FileNotFoundError(f"Required offline OCR model is missing or corrupted: {info['name']}")
    return True

def get_model_path(model_id: str, models_dir: str) -> str:
    if model_id not in OCR_MODELS:
        raise ValueError(f"Unknown model id: {model_id}")
    return str(Path(models_dir) / OCR_MODELS[model_id]["name"])

def list_ocr_models() -> List[Dict[str, Any]]:
    return [{"id": k, **v} for k, v in OCR_MODELS.items()]
