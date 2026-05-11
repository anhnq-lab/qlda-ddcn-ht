import os
import re

# Precise replacement dictionary for hex/color conversions
replacements = {
    # Exact Hex codes
    '#f97316': '#4a90e2',
    '#F97316': '#4a90e2',
    '#ea580c': '#357abd',
    '#EA580C': '#357abd',
    '#9a3412': '#1c456c',
    '#9A3412': '#1c456c',
    '#fdba74': '#dbeafe',
    '#fb923c': '#8fbeee',
    'background=f97316': 'background=4a90e2',
    'background=F97316': 'background=4a90e2',
    'rgba(249, 115, 22, 0.3)': 'rgba(74, 144, 226, 0.3)',
    'rgba(184, 134, 11, 0.4)': 'rgba(74, 144, 226, 0.4)',
    'rgba(249, 115, 22,': 'rgba(74, 144, 226,',
    
    # Custom high-quality Gradients (Orange/Gold -> Nordic Blue)
    'linear-gradient(135deg, #9a3412 0%, #f97316 100%)': 'linear-gradient(135deg, #1c456c 0%, #4a90e2 100%)',
    'linear-gradient(135deg, #333333 0%, #9a3412 100%)': 'linear-gradient(135deg, #112d4e 0%, #1c456c 100%)',
    'linear-gradient(90deg, #fdba74, #fb923c, #f97316)': 'linear-gradient(90deg, #dbeafe, #8fbeee, #4a90e2)',
    'linear-gradient(90deg, #fb923c, #f97316)': 'linear-gradient(90deg, #8fbeee, #4a90e2)',
    'linear-gradient(135deg, #333333 0%, #4A4230 50%, #9a3412 100%)': 'linear-gradient(135deg, #112d4e 0%, #1c456c 50%, #245e96 100%)',
    'linear-gradient(135deg, #4A4230 0%, #9a3412 50%, #f97316 100%)': 'linear-gradient(135deg, #1c456c 0%, #245e96 50%, #4a90e2 100%)',
    'linear-gradient(135deg, #4A3A15 0%, #C49007 100%)': 'linear-gradient(135deg, #1c456c 0%, #357abd 100%)',
    'linear-gradient(90deg, #f97316, #ea580c, transparent)': 'linear-gradient(90deg, #4a90e2, #357abd, transparent)',
    'linear-gradient(90deg, #f97316, rgba(249, 115, 22, 0.3), transparent)': 'linear-gradient(90deg, #4a90e2, rgba(74, 144, 226, 0.3), transparent)',
    
    # Specific component styles
    'linear-gradient(135deg, #ea580c 0%, #f97316 100%)': 'linear-gradient(135deg, #357abd 0%, #4a90e2 100%)',
    'linear-gradient(90deg, #3B82F6, #F97316, #10B981)': 'linear-gradient(90deg, #3b82f6, #4a90e2, #10b981)',
    'linear-gradient(90deg, #fdba74, #f97316)': 'linear-gradient(90deg, #dbeafe, #4a90e2)',
}

# Directories to search
base_dir = r"d:\QuocAnh\2026\01.Project\qlda-ddcn-ht"
target_extensions = ('.tsx', '.ts', '.css', '.html')

modified_files = []

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(filepath, 'r', encoding='latin-1') as f:
                content = f.read()
        except Exception as e:
            print(f"Skipping {filepath} due to read error: {e}")
            return
            
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    # CSS specific cleanups or hover remapping inside index.css
    if filepath.endswith('index.css'):
        # Remap custom colors
        content = content.replace('color: #F97316;', 'color: #4a90e2;')
        content = content.replace('color: #f97316;', 'color: #4a90e2;')
        content = content.replace('background: #F97316;', 'background: #4a90e2;')
        content = content.replace('border-color: #F97316;', 'border-color: #4a90e2;')
        content = content.replace('border-top: 3px solid #f97316;', 'border-top: 3px solid #4a90e2;')
        content = content.replace('accent-color: #F97316;', 'accent-color: #4a90e2;')
        content = content.replace('border: 1.5px solid #F97316;', 'border: 1.5px solid #4a90e2;')
        content = content.replace('text-amber-500', 'text-primary-500')
        content = content.replace('text-amber-600', 'text-primary-600')
        content = content.replace('text-amber-700', 'text-primary-700')
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        modified_files.append(filepath)

# Walk directory recursively
for root, dirs, files in os.walk(base_dir):
    # Skip build/dependency directories
    if any(p in root for p in ['node_modules', '.git', 'dist', '.vite', '.gemini']):
        continue
    for file in files:
        if file.endswith(target_extensions):
            filepath = os.path.join(root, file)
            process_file(filepath)

print(f"Successfully modernized {len(modified_files)} files to Nordic Theme!")
for f in modified_files:
    print(f" - {f}")
