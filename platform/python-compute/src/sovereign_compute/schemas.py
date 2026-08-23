"""Request and Response schemas"""
from typing import Dict, Any, Optional

def success_response(data: Any, message: str = "OK") -> Dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data,
        "is_air_gapped": True,
        "external_calls": 0
    }

def error_response(code: str, message: str, details: Optional[Any] = None) -> Dict[str, Any]:
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details
        },
        "is_air_gapped": True,
        "external_calls": 0
    }
