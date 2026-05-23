import json
import re

with open('parsed_regulations.json', 'r', encoding='utf-8') as f:
    chapters = json.load(f)

with open('d:/01_Projects/qlda-ddcn-ht/features/regulations/data/regulationsData.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

top_part = []
for line in lines:
    if line.startswith('const quyCheLamViecChapters: RegChapter[] = ['):
        break
    top_part.append(line)

bottom_part = []
in_bottom = False
for line in lines:
    if line.startswith('export const regulationsData: RegulationDocument[] = ['):
        in_bottom = True
    if in_bottom:
        bottom_part.append(line)

def text_to_id(text):
    import unicodedata
    # create id from string, lowercase, remove accents, replace non-alphanumeric with hyphen
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

icon_map = {
    'Chương I': 'FileText',
    'Chương II': 'Layout',
    'Chương III': 'BarChart3',
    'Chương IV': 'PenTool',
    'Chương V': 'Briefcase',
    'Chương VI': 'TrendingUp',
    'Chương VII': 'Landmark'
}

out_lines = []
out_lines.extend(top_part)
out_lines.append('const quyCheLamViecChapters: RegChapter[] = [\n')

for i, ch in enumerate(chapters):
    ch_id = text_to_id(ch['code'])
    ch_code = ch['code']
    ch_title = ch['title']
    ch_icon = icon_map.get(ch_code, 'FileText')
    
    out_lines.append('    {\n')
    out_lines.append(f'        id: "{ch_id}",\n')
    out_lines.append(f'        code: "{ch_code}",\n')
    out_lines.append(f'        title: "{ch_title}",\n')
    out_lines.append(f'        icon: {ch_icon},\n')
    out_lines.append('        articles: [\n')
    
    for j, art in enumerate(ch['articles']):
        art_id = text_to_id(art['code'])
        art_code = art['code']
        art_title = art['title']
        
        out_lines.append('            {\n')
        out_lines.append(f'                id: "{ch_id}-{art_id}",\n')
        out_lines.append(f'                code: "{art_code}",\n')
        out_lines.append(f'                title: "{art_title}",\n')
        out_lines.append('                content: (\n')
        out_lines.append('                    <div className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-slate-300 text-justify">\n')
        
        for content_line in art['content']:
            escaped_content_line = content_line.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
            out_lines.append(f'                        <p>{escaped_content_line}</p>\n')
            
        out_lines.append('                    </div>\n')
        out_lines.append('                )\n')
        if j < len(ch['articles']) - 1:
            out_lines.append('            },\n')
        else:
            out_lines.append('            }\n')
            
    out_lines.append('        ]\n')
    
    if i < len(chapters) - 1:
        out_lines.append('    },\n')
    else:
        out_lines.append('    }\n')
        
out_lines.append('];\n\n')
out_lines.extend(bottom_part)

with open('d:/01_Projects/qlda-ddcn-ht/features/regulations/data/regulationsData.tsx', 'w', encoding='utf-8') as f:
    f.writelines(out_lines)
