"""Local Dense Vector Embedding Engine"""
import math
import hashlib
from typing import List

def generate_embedding(text: str, dim: int = 384) -> List[float]:
    tokens = text.lower().split()
    vec = [0.0] * dim
    for i, token in enumerate(tokens):
        h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
        for d in range(dim):
            vec[d] += ((h >> (d % 32)) & 1) * 2 - 1
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [round(x / norm, 6) for x in vec]
