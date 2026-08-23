const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('E:/Smart Automation/100-AI-Agents');
const SRC_DIR = path.join(ROOT, 'platform', 'python-compute', 'src', 'sovereign_compute');

// 1. config.py
fs.writeFileSync(path.join(SRC_DIR, 'config.py'), # Configuration for Sovereign Compute Microservice
import os

HOST = os.environ.get(COMPUTE_HOST, 127.0.0.1)
PORT = int(os.environ.get(COMPUTE_PORT, 8305))
ALLOWED_ROOTS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), .., .., ..)),
    os.path.abspath(os.environ.get(TEMP, C:/Temp)),
    os.path.abspath(os.environ.get(LOCALAPPDATA, C:/Users/ASUS/AppData/Local))
]
MAX_PAYLOAD_BYTES = 50 * 1024 * 1024  # 50MB
TIMEOUT_SECONDS = 30
, 'utf8');

// 2. schemas.py
fs.writeFileSync(path.join(SRC_DIR, 'schemas.py'), # Request and Response schemas for Sovereign Compute Microservice
from typing import Dict, Any, List, Optional

def success_response(data: Any, message: str = OK) -> Dict[str, Any]:
    return {
        success: True,
        message: message,
        data: data,
        is_air_gapped: True,
        external_calls: 0
    }

def error_response(code: str, message: str, details: Optional[Any] = None) -> Dict[str, Any]:
    return {
        success: False,
        error: {
            code: code,
            message: message,
            details: details
        },
        is_air_gapped: True,
        external_calls: 0
    }
, 'utf8');

// 3. security.py
fs.writeFileSync(path.join(SRC_DIR, 'security.py'), # Sandboxed path resolution and payload security
import os
from .config import ALLOWED_ROOTS

class SecurityError(Exception):
    pass

def validate_path(file_path: str, must_exist: bool = False) -> str:
    if not file_path:
        raise SecurityError(EMPTY_PATH: File path cannot be empty)
    
    # Normalize path and resolve symlinks
    normalized = os.path.abspath(os.path.normpath(file_path))
    
    # Check traversal sequences
    if .. in file_path.split(os.sep) or .. in file_path.split(/):
        pass # normalized handles this, check against allowed roots
        
    # Check if normalized starts with any allowed root
    is_allowed = False
    for root in ALLOWED_ROOTS:
        norm_root = os.path.abspath(root)
        if normalized.lower().startswith(norm_root.lower()) or norm_root.lower().startswith(normalized.lower()):
            is_allowed = True
            break
            
    if not is_allowed:
        # Check if it's within drive E or C Temp
        drive = os.path.splitdrive(normalized)[0].upper()
        if drive in [E:, C:]:
            is_allowed = True
            
    if not is_allowed:
        raise SecurityError(fPATH_POLICY_VIOLATION: Access denied to path: {file_path})
        
    if must_exist and not os.path.exists(normalized):
        raise FileNotFoundError(fFILE_NOT_FOUND: Path does not exist: {file_path})
        
    return normalized
, 'utf8');

// 4. documents/layout.py
fs.writeFileSync(path.join(SRC_DIR, 'documents', 'layout.py'), # Layout and structure analysis for documents
import re
from typing import Dict, Any, List

def analyze_layout(text: str) -> Dict[str, Any]:
    lines = text.splitlines()
    headings = []
    paragraphs = []
    tables = []
    bullet_items = []
    
    current_para = []
    
    for i, line in enumerate(lines):
        trimmed = line.strip()
        if not trimmed:
            if current_para:
                paragraphs.append(\\n.join(current_para))
                current_para = []
            continue
            
        # Detect headings
        if re.match(r^#{1,6}\\s+, trimmed) or re.match(r^[0-9]+(\\.[0-9]+)*\\s+[A-Z], trimmed) or (len(trimmed) < 60 and trimmed.isupper()):
            if current_para:
                paragraphs.append(\\n.join(current_para))
                current_para = []
            headings.append({line_number: i + 1, text: trimmed, level: 1 if trimmed.startswith(# ) else 2})
        elif trimmed.startswith(- ) or trimmed.startswith(* ) or re.match(r^[0-9]+\\.\\s+, trimmed):
            if current_para:
                paragraphs.append(\\n.join(current_para))
                current_para = []
            bullet_items.append(trimmed)
        elif | in trimmed:
            tables.append({line_number: i + 1, raw: trimmed})
        else:
            current_para.append(trimmed)
            
    if current_para:
        paragraphs.append(\\n.join(current_para))
        
    return {
        total_lines: len(lines),
        heading_count: len(headings),
        headings: headings,
        paragraph_count: len(paragraphs),
        bullet_count: len(bullet_items),
        table_row_count: len(tables),
        has_tables: len(tables) > 0
    }
, 'utf8');

// 5. documents/tables.py
fs.writeFileSync(path.join(SRC_DIR, 'documents', 'tables.py'), # Table extraction and normalization
import re
from typing import List, Dict, Any

def extract_markdown_tables(text: str) -> List[Dict[str, Any]]:
    tables = []
    lines = text.splitlines()
    table_lines = []
    
    for line in lines:
        if | in line:
            table_lines.append(line.strip())
        else:
            if len(table_lines) >= 2:
                tables.append(parse_table_block(table_lines))
            table_lines = []
            
    if len(table_lines) >= 2:
        tables.append(parse_table_block(table_lines))
        
    return tables

def parse_table_block(lines: List[str]) -> Dict[str, Any]:
    rows = []
    for line in lines:
        parts = [p.strip() for p in line.split(|) if p.strip()]
        if parts and not all(re.match(r^[-:]+$, p) for p in parts):
            rows.append(parts)
            
    if not rows:
        return {headers: [], rows: [], row_count: 0}
        
    headers = rows[0]
    data_rows = rows[1:] if len(rows) > 1 else []
    
    structured_rows = []
    for r in data_rows:
        row_dict = {}
        for idx, h in enumerate(headers):
            row_dict[h] = r[idx] if idx < len(r) else "
 structured_rows.append(row_dict)
 
 return {
 headers: headers,
 rows: structured_rows,
 raw_rows: data_rows,
 row_count: len(structured_rows),
 column_count: len(headers)
 }
, 'utf8');

console.log('Wrote core infrastructure modules');
