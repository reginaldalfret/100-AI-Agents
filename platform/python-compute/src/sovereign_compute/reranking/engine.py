"""Reciprocal Rank Fusion and Reranking Engine"""
from typing import List, Dict, Any

def rerank_documents(query: str, documents: List[Dict[str, Any]], k: int = 60) -> List[Dict[str, Any]]:
    reranked = []
    for doc in documents:
        bm25_rank = doc.get("bm25_rank", 10)
        vector_rank = doc.get("vector_rank", 10)
        rrf_score = (1.0 / (k + bm25_rank)) + (1.0 / (k + vector_rank))
        copy_doc = dict(doc)
        copy_doc["rrf_score"] = round(rrf_score, 6)
        reranked.append(copy_doc)
    reranked.sort(key=lambda d: d.get("rrf_score", 0), reverse=True)
    return reranked
