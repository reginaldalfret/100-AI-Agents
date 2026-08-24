"""
Sovereign AI Workbench — Local High-Fidelity Response Export Engine
Generates PDF, XLSX, and CSV locally on CPU with 0 external network dependencies.
"""

import sys
import json
import os
import re
import csv
from io import BytesIO

def parse_markdown_response(text: str) -> dict:
    lines = text.splitlines()
    sections = []
    tables = []
    code_blocks = []
    
    in_code = False
    code_lang = ""
    code_lines = []
    
    in_table = False
    table_lines = []
    
    current_heading = "Response"
    current_para = []
    
    for line in lines:
        stripped = line.strip()
        
        # Code block boundary
        if stripped.startswith("```"):
            if not in_code:
                if current_para:
                    sections.append({"type": "paragraph", "heading": current_heading, "text": "\n".join(current_para).strip()})
                    current_para = []
                in_code = True
                code_lang = stripped[3:].strip() or "text"
                code_lines = []
            else:
                in_code = False
                code_text = "\n".join(code_lines)
                code_blocks.append({"lang": code_lang, "code": code_text})
                sections.append({"type": "code", "lang": code_lang, "code": code_text})
                code_lines = []
            continue
            
        if in_code:
            code_lines.append(line)
            continue
            
        # Table boundary
        if stripped.startswith("|") and stripped.endswith("|"):
            if not in_table:
                if current_para:
                    sections.append({"type": "paragraph", "heading": current_heading, "text": "\n".join(current_para).strip()})
                    current_para = []
                in_table = True
                table_lines = [stripped]
            else:
                table_lines.append(stripped)
            continue
        elif in_table:
            in_table = False
            # Parse table
            parsed_tbl = parse_table(table_lines)
            if parsed_tbl:
                tables.append(parsed_tbl)
                sections.append({"type": "table", "table": parsed_tbl})
            table_lines = []
            
        # Headings
        if stripped.startswith("#"):
            if current_para:
                sections.append({"type": "paragraph", "heading": current_heading, "text": "\n".join(current_para).strip()})
                current_para = []
            current_heading = stripped.lstrip("#").strip()
            sections.append({"type": "heading", "text": current_heading})
            continue
            
        # Paragraph lines
        if stripped:
            current_para.append(line)
        elif current_para:
            sections.append({"type": "paragraph", "heading": current_heading, "text": "\n".join(current_para).strip()})
            current_para = []
            
    if in_table and table_lines:
        parsed_tbl = parse_table(table_lines)
        if parsed_tbl:
            tables.append(parsed_tbl)
            sections.append({"type": "table", "table": parsed_tbl})
            
    if in_code and code_lines:
        code_text = "\n".join(code_lines)
        code_blocks.append({"lang": code_lang, "code": code_text})
        sections.append({"type": "code", "lang": code_lang, "code": code_text})
        
    if current_para:
        sections.append({"type": "paragraph", "heading": current_heading, "text": "\n".join(current_para).strip()})
        
    return {
        "sections": sections,
        "tables": tables,
        "code_blocks": code_blocks
    }

def parse_table(table_lines: list) -> dict:
    if len(table_lines) < 2:
        return None
    raw_rows = []
    for l in table_lines:
        cells = [c.strip() for c in l.strip("|").split("|")]
        raw_rows.append(cells)
        
    if len(raw_rows) < 2:
        return None
        
    headers = raw_rows[0]
    # Check if second row is separator (e.g. ---|---)
    is_sep = all(re.match(r'^:?-+:?$', c) for c in raw_rows[1])
    data_rows = raw_rows[2:] if is_sep else raw_rows[1:]
    
    # Type conversion for numbers
    typed_rows = []
    for r in data_rows:
        typed_row = []
        for cell in r:
            # Try int
            if re.match(r'^-?\d+$', cell):
                typed_row.append(int(cell))
            # Try float
            elif re.match(r'^-?\d+\.\d+$', cell):
                typed_row.append(float(cell))
            else:
                typed_row.append(cell)
        typed_rows.append(typed_row)
        
    return {
        "headers": headers,
        "rows": typed_rows
    }

def export_pdf(title: str, content: str, out_path: str):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    
    parsed = parse_markdown_response(content)
    doc = SimpleDocTemplate(out_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=12
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )
    
    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a'),
        backColor=colors.HexColor('#f1f5f9'),
        borderPadding=6,
        spaceAfter=8
    )
    
    footer_style = ParagraphStyle(
        'DocFooter',
        parent=styles['Italic'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#94a3b8'),
        spaceBefore=15
    )
    
    story = []
    # Document Header
    story.append(Paragraph("301 Super AI Agents — Sovereign AI Workbench", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#0284c7'))))
    story.append(Spacer(1, 4))
    story.append(Paragraph(title or "AI Response Export", title_style))
    story.append(Spacer(1, 8))
    
    for sec in parsed['sections']:
        stype = sec['type']
        if stype == 'heading':
            story.append(Paragraph(sec['text'], h2_style))
        elif stype == 'paragraph':
            text = sec['text'].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(text, body_style))
        elif stype == 'code':
            code_text = sec['code'].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(f"<b>[{sec.get('lang', 'code').upper()}]</b>", h2_style))
            story.append(Preformatted(code_text, code_style))
        elif stype == 'table':
            tbl_data = [sec['table']['headers']] + [[str(c) for c in r] for r in sec['table']['rows']]
            t = Table(tbl_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8.5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc'))
            ]))
            story.append(t)
            story.append(Spacer(1, 8))
            
    story.append(Spacer(1, 12))
    story.append(Paragraph("Generated locally on-premise by 301 Super AI Agents (SIH 26117). 100% Air-Gapped.", footer_style))
    doc.build(story)

def export_xlsx(title: str, content: str, out_path: str):
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    
    parsed = parse_markdown_response(content)
    wb = openpyxl.Workbook()
    
    header_fill = PatternFill(start_color="0284C7", end_color="0284C7", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )
    
    if parsed['tables']:
        # First sheet for main table or summary
        for idx, tbl in enumerate(parsed['tables']):
            sheet_name = f"Table {idx+1}" if len(parsed['tables']) > 1 else "Data Table"
            ws = wb.active if idx == 0 else wb.create_sheet(title=sheet_name)
            ws.title = sheet_name
            
            # Write headers
            for col_num, h in enumerate(tbl['headers'], 1):
                cell = ws.cell(row=1, column=col_num, value=str(h))
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.border = thin_border
                
            # Write data rows
            for row_num, row_data in enumerate(tbl['rows'], 2):
                for col_num, val in enumerate(row_data, 1):
                    cell = ws.cell(row=row_num, column=col_num, value=val)
                    cell.border = thin_border
                    if isinstance(val, (int, float)):
                        cell.alignment = Alignment(horizontal="right")
                    else:
                        cell.alignment = Alignment(horizontal="left")
                        
            # Auto-fit columns
            for col in ws.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = openpyxl.utils.get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = max(max_len + 3, 12)
                
        # Also add summary sheet if prose or code exists
        if any(s['type'] in ['paragraph', 'code'] for s in parsed['sections']):
            ws_summary = wb.create_sheet(title="Full Response", index=0)
            ws_summary.cell(row=1, column=1, value="Section").font = header_font
            ws_summary.cell(row=1, column=1).fill = header_fill
            ws_summary.cell(row=1, column=2, value="Content").font = header_font
            ws_summary.cell(row=1, column=2).fill = header_fill
            
            r_idx = 2
            for s in parsed['sections']:
                stype = s['type']
                if stype == 'heading':
                    ws_summary.cell(row=r_idx, column=1, value="Heading")
                    ws_summary.cell(row=r_idx, column=2, value=s['text']).font = Font(bold=True)
                elif stype == 'paragraph':
                    ws_summary.cell(row=r_idx, column=1, value="Paragraph")
                    ws_summary.cell(row=r_idx, column=2, value=s['text'])
                elif stype == 'code':
                    ws_summary.cell(row=r_idx, column=1, value=f"Code ({s.get('lang', 'text')})")
                    ws_summary.cell(row=r_idx, column=2, value=s['code']).font = Font(name="Consolas")
                r_idx += 1
            ws_summary.column_dimensions['A'].width = 18
            ws_summary.column_dimensions['B'].width = 80
    else:
        # Prose & Code document workbook
        ws = wb.active
        ws.title = "Response Content"
        ws.cell(row=1, column=1, value="Section").font = header_font
        ws.cell(row=1, column=1).fill = header_fill
        ws.cell(row=1, column=2, value="Content").font = header_font
        ws.cell(row=1, column=2).fill = header_fill
        
        r_idx = 2
        for s in parsed['sections']:
            stype = s['type']
            if stype == 'heading':
                ws.cell(row=r_idx, column=1, value="Heading")
                ws.cell(row=r_idx, column=2, value=s['text']).font = Font(bold=True)
            elif stype == 'paragraph':
                ws.cell(row=r_idx, column=1, value="Text")
                ws.cell(row=r_idx, column=2, value=s['text'])
            elif stype == 'code':
                ws.cell(row=r_idx, column=1, value=f"Code ({s.get('lang', 'text')})")
                ws.cell(row=r_idx, column=2, value=s['code']).font = Font(name="Consolas")
            r_idx += 1
        ws.column_dimensions['A'].width = 18
        ws.column_dimensions['B'].width = 80

    wb.save(out_path)

def export_csv(title: str, content: str, out_path: str):
    parsed = parse_markdown_response(content)
    with open(out_path, mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        if parsed['tables']:
            # Main table
            main_tbl = parsed['tables'][0]
            writer.writerow(main_tbl['headers'])
            for r in main_tbl['rows']:
                writer.writerow(r)
        else:
            # Structured prose/code
            writer.writerow(["Section", "Content"])
            for s in parsed['sections']:
                if s['type'] == 'heading':
                    writer.writerow(["Heading", s['text']])
                elif s['type'] == 'paragraph':
                    writer.writerow(["Text", s['text']])
                elif s['type'] == 'code':
                    writer.writerow([f"Code ({s.get('lang', 'text')})", s['code']])

if __name__ == "__main__":
    try:
        sys.stdin.reconfigure(encoding='utf-8')
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

    payload_raw = sys.stdin.read()
    if not payload_raw:
        print(json.dumps({"status": "error", "error": "EMPTY_PAYLOAD"}))
        sys.exit(0)
        
    try:
        data = json.loads(payload_raw)
        title = data.get("title", "Response")
        content = data.get("content", "")
        fmt = data.get("format", "pdf").lower()
        out_path = data.get("out_path", "")
        
        if fmt == "pdf":
            export_pdf(title, content, out_path)
        elif fmt in ["xlsx", "excel"]:
            export_xlsx(title, content, out_path)
        elif fmt == "csv":
            export_csv(title, content, out_path)
        else:
            raise ValueError(f"Unsupported format: {fmt}")
            
        print(json.dumps({
            "status": "success",
            "format": fmt,
            "out_path": out_path,
            "size_bytes": os.path.getsize(out_path) if os.path.exists(out_path) else 0
        }))
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "error": str(e)
        }))
