"""Sovereign Compute Localhost HTTP Server"""
import http.server
import socketserver
import json
import sys
import os
from pathlib import Path

# Ensure src directory is in sys.path when executed directly as a script
_SRC_DIR = str(Path(__file__).resolve().parent.parent)
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

try:
    from sovereign_compute.config import HOST, PORT
    from sovereign_compute.schemas import success_response, error_response
    from sovereign_compute.documents.pdf import process_pdf
    from sovereign_compute.documents.docx import process_docx
    from sovereign_compute.documents.xlsx import process_xlsx
    from sovereign_compute.documents.pptx import process_pptx
    from sovereign_compute.ocr.engine import run_ocr
    from sovereign_compute.vision.preprocess import preprocess_image
    from sovereign_compute.vision.image import analyze_image_features
    from sovereign_compute.data.analytics import analyze_dataset
    from sovereign_compute.data.statistics import calculate_corrosion_rate
    from sovereign_compute.embeddings.engine import generate_embedding
    from sovereign_compute.reranking.engine import rerank_documents
    from sovereign_compute.stt.engine import transcribe_audio, get_stt_health
except ImportError:
    from .config import HOST, PORT
    from .schemas import success_response, error_response
    from .documents.pdf import process_pdf
    from .documents.docx import process_docx
    from .documents.xlsx import process_xlsx
    from .documents.pptx import process_pptx
    from .ocr.engine import run_ocr
    from .vision.preprocess import preprocess_image
    from .vision.image import analyze_image_features
    from .data.analytics import analyze_dataset
    from .data.statistics import calculate_corrosion_rate
    from .embeddings.engine import generate_embedding
    from .reranking.engine import rerank_documents
    from .stt.engine import transcribe_audio, get_stt_health

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

class ComputeHandler(http.server.BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ["/health", "/api/health"]:
            self._send_json(200, success_response({
                "status": "healthy",
                "service": "sovereign-compute",
                "version": "2.0.0",
                "capabilities": ["pdf", "docx", "xlsx", "pptx", "ocr", "vision", "analytics", "calculations", "embeddings", "reranking", "stt"]
            }))
        elif self.path in ["/stt/health", "/api/stt/health"]:
            self._send_json(200, success_response(get_stt_health()))
        else:
            self._send_json(404, error_response("NOT_FOUND", f"Endpoint {self.path} not found"))

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length)
        try:
            payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            payload = {}

        path = self.path.rstrip("/")
        try:
            if path in ["/pdf/process", "/api/pdf/process"]:
                res = process_pdf(payload.get("file_path", ""))
                self._send_json(200, success_response(res))
            elif path in ["/docx/process", "/api/docx/process"]:
                res = process_docx(payload.get("file_path", ""))
                self._send_json(200, success_response(res))
            elif path in ["/xlsx/process", "/api/xlsx/process"]:
                res = process_xlsx(payload.get("file_path", ""))
                self._send_json(200, success_response(res))
            elif path in ["/pptx/process", "/api/pptx/process"]:
                res = process_pptx(payload.get("file_path", ""))
                self._send_json(200, success_response(res))
            elif path in ["/ocr", "/api/ocr"]:
                res = run_ocr(payload.get("image_path", ""), payload.get("mode", "standard"))
                self._send_json(200, success_response(res))
            elif path in ["/image/preprocess", "/api/image/preprocess"]:
                res = preprocess_image(payload.get("image_path", ""), payload.get("operations"))
                self._send_json(200, success_response(res))
            elif path in ["/image/analyze", "/api/image/analyze"]:
                res = analyze_image_features(payload.get("image_path", ""), payload.get("task_type", "pid"))
                self._send_json(200, success_response(res))
            elif path in ["/data/analyze", "/api/data/analyze"]:
                res = analyze_dataset(payload.get("data", []))
                self._send_json(200, success_response(res))
            elif path in ["/calculate", "/api/calculate"]:
                res = calculate_corrosion_rate(
                    payload.get("nominal_mm", 12.5),
                    payload.get("measured_mm", 10.2),
                    payload.get("years", 5.0)
                )
                self._send_json(200, success_response(res))
            elif path in ["/embeddings", "/api/embeddings"]:
                res = generate_embedding(payload.get("text", ""))
                self._send_json(200, success_response({"embedding": res, "dimensions": len(res)}))
            elif path in ["/rerank", "/api/rerank"]:
                res = rerank_documents(payload.get("query", ""), payload.get("documents", []))
                self._send_json(200, success_response(res))
            elif path in ["/stt/transcribe", "/api/stt/transcribe"]:
                res = transcribe_audio(
                    audio_path=payload.get("audio_path"),
                    audio_base64=payload.get("audio_base64"),
                    locale=payload.get("locale", "en-IN")
                )
                self._send_json(200, success_response(res))
            else:
                self._send_json(404, error_response("NOT_FOUND", f"POST endpoint {self.path} not found"))
        except Exception as e:
            self._send_json(500, error_response("COMPUTE_ERROR", str(e)))

def run_server():
    server = ReusableTCPServer((HOST, PORT), ComputeHandler)
    print(f"[SOVEREIGN COMPUTE] Server running on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()

if __name__ == "__main__":
    run_server()
