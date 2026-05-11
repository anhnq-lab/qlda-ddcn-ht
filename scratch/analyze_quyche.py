# -*- coding: utf-8 -*-
import re

with open(r"d:\QuocAnh\2026\01.Project\qlda-ddcn-ht\Quyche.md", "r", encoding="utf-16-le") as f:
    content = f.read()

# Let's clean up any weird BOM or carriage returns
content = content.replace('\r\n', '\n')

lines = content.split('\n')
print(f"Total lines: {len(lines)}")

chapters = []
articles = []

for idx, line in enumerate(lines):
    line_clean = line.strip()
    if not line_clean:
        continue
    # Look for Chapter headings (e.g. **Chương I**, **Chương II**, etc.)
    if re.search(r'\*\*Chương\s+[IVXLCDM]+\*\*', line_clean, re.IGNORECASE) or re.search(r'^Chương\s+[IVXLCDM]+', line_clean, re.IGNORECASE):
        chapters.append((idx + 1, line_clean))
    # Look for Article headings (e.g. **Điều 1. ...**, **Điều 2. ...**, etc.)
    elif re.search(r'\*\*Điều\s+\d+', line_clean, re.IGNORECASE) or re.search(r'^Điều\s+\d+', line_clean, re.IGNORECASE):
        articles.append((idx + 1, line_clean))

print("\n--- CHAPTERS FOUND ---")
for num, chap in chapters:
    print(f"Line {num}: {chap}")
    # Print the next few non-empty lines to see titles
    next_lines = []
    i = num
    while i < len(lines) and len(next_lines) < 2:
        if lines[i].strip():
            next_lines.append(lines[i].strip())
        i += 1
    print(f"  Next lines: {next_lines}")

print("\n--- ARTICLES FOUND (First 15 and Last 5) ---")
print(f"Total articles found: {len(articles)}")
for num, art in articles[:15]:
    print(f"Line {num}: {art}")
for num, art in articles[-5:]:
    print(f"Line {num}: {art}")
