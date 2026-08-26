"""Configuration for Sovereign Compute Microservice"""
import os

HOST = os.environ.get("COMPUTE_HOST", "127.0.0.1")
PORT = int(os.environ.get("COMPUTE_PORT", "8305"))
ALLOWED_ROOTS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")),
    os.path.abspath(os.environ.get("TEMP", os.path.join(os.path.dirname(__file__), "..", "..", "..", "temp"))),
    os.path.abspath(os.environ.get("LOCALAPPDATA", os.path.join(os.path.dirname(__file__), "..", "..", "..", "cache")))
]
MAX_PAYLOAD_BYTES = 50 * 1024 * 1024
TIMEOUT_SECONDS = 30
