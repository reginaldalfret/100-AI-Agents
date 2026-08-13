from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "platform" / "web" / "index.html"
MARKER = "<!-- agent-ui-polish-v1 -->"

text = INDEX.read_text(encoding="utf-8")

if MARKER in text:
    print("UI polish already applied")
    raise SystemExit(0)

if "</head>" not in text or "</body>" not in text:
    raise SystemExit("index.html is missing </head> or </body>")

style = '''\n<!-- agent-ui-polish-v1 -->\n<link rel="stylesheet" href="/ui-polish.css">\n'''
script = '''\n<!-- agent-ui-polish-v1 -->\n<script src="/ui-polish.js"></script>\n'''

text = text.replace("</head>", style + "</head>", 1)
text = text.replace("</body>", script + "</body>", 1)
INDEX.write_text(text, encoding="utf-8")
print(f"Applied UI polish to {INDEX}")
