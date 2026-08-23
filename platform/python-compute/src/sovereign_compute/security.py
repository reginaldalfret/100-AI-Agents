"""Sandboxed path verification and security policies"""
import os
from .config import ALLOWED_ROOTS

class SecurityError(Exception):
    pass

def validate_path(file_path: str, must_exist: bool = False) -> str:
    if not file_path:
        raise SecurityError("EMPTY_PATH: File path cannot be empty")
    normalized = os.path.abspath(os.path.normpath(file_path))
    drive = os.path.splitdrive(normalized)[0].upper()
    if drive in ["E:", "C:"]:
        pass
    else:
        raise SecurityError(f"PATH_POLICY_VIOLATION: Access denied to path: {file_path}")
    if must_exist and not os.path.exists(normalized):
        raise FileNotFoundError(f"FILE_NOT_FOUND: Path does not exist: {file_path}")
    return normalized
