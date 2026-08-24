import cv2
import numpy as np
from pathlib import Path
from typing import Union, Dict, Any, Optional

def preprocess_image(
    image_input: Union[str, Path, np.ndarray],
    options: Optional[Dict[str, Any]] = None
) -> np.ndarray:
    """Applies adaptive contrast, orientation and noise reduction."""
    if options is None:
        options = {}

    if isinstance(image_input, (str, Path)):
        img = cv2.imread(str(image_input))
        if img is None:
            raise FileNotFoundError(f"Could not read image at {image_input}")
    else:
        img = image_input.copy()

    # Optional grayscale conversion if requested
    if options.get("grayscale", False) and len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    # Adaptive contrast enhancement (CLAHE) for low-contrast images
    if options.get("enhance_contrast", False):
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l2 = clahe.apply(l)
        lab = cv2.merge((l2, a, b))
        img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    return img
