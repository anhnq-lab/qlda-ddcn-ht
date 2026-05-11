const fs = require('fs');
const path = require('path');

const replacements = {
    '#f97316': '#4a90e2',
    '#F97316': '#4a90e2',
    '#ea580c': '#357abd',
    '#EA580C': '#357abd',
    '#9a3412': '#1c456c',
    '#9A3412': '#1c456c',
    'background=f97316': 'background=4a90e2',
    'background=F97316': 'background=4a90e2',
    'rgba(249, 115, 22, 0.3)': 'rgba(74, 144, 226, 0.3)',
    'rgba(184, 134, 11, 0.4)': 'rgba(74, 144, 226, 0.4)',
    'linear-gradient(135deg, #9a3412 0%, #f97316 100%)': 'linear-gradient(135deg, #1c456c 0%, #4a90e2 100%)',
    'linear-gradient(135deg, #333333 0%, #9a3412 100%)': 'linear-gradient(135deg, #112d4e 0%, #1c456c 100%)',
    'linear-gradient(90deg, #fdba74, #fb923c, #f97316)': 'linear-gradient(90deg, #dbeafe, #8fbeee, #4a90e2)',
    'linear-gradient(90deg, #fb923c, #f97316)': 'linear-gradient(90deg, #8fbeee, #4a90e2)',
    'linear-gradient(135deg, #333333 0%, #4A4230 50%, #9a3412 100%)': 'linear-gradient(135deg, #112d4e 0%, #1c456c 50%, #245e96 100%)',
    'linear-gradient(135deg, #4A4230 0%, #9a3412 50%, #f97316 100%)': 'linear-gradient(135deg, #1c456c 0%, #245e96 50%, #4a90e2 100%)',
    'linear-gradient(135deg, #4A3A15 0%, #C49007 100%)': 'linear-gradient(135deg, #1c456c 0%, #357abd 100%)',
    'linear-gradient(90deg, #f97316, #ea580c, transparent)': 'linear-gradient(90deg, #4a90e2, #357abd, transparent)',
    'linear-gradient(90deg, #f97316, rgba(249, 115, 22, 0.3), transparent)': 'linear-gradient(90deg, #4a90e2, rgba(74, 144, 226, 0.3), transparent)',
    'linear-gradient(135deg, #ea580c 0%, #f97316 100%)': 'linear-gradient(135deg, #357abd 0%, #4a90e2 100%)',
    'linear-gradient(90deg, #3B82F6, #F97316, #10B981)': 'linear-gradient(90deg, #3b82f6, #4a90e2, #10b981)',
    'linear-gradient(90deg, #fdba74, #f97316)': 'linear-gradient(90deg, #dbeafe, #4a90e2)',
};

const baseDir = "d:/QuocAnh/2026/01.Project/qlda-ddcn-ht";
const targetExtensions = ['.tsx', '.ts', '.css', '.html'];
const modifiedFiles = [];

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            if (['node_modules', '.git', 'dist', '.vite', '.gemini'].some(p => filepath.includes(p))) {
                return;
            }
            walk(filepath);
        } else {
            const ext = path.extname(filepath);
            if (targetExtensions.includes(ext)) {
                processFile(filepath);
            }
        }
    });
}

function processFile(filepath) {
    let content;
    try {
        content = fs.readFileSync(filepath, 'utf8');
    } catch (e) {
        console.log(`Skipping ${filepath} due to read error: {e.message}`);
        return;
    }

    const original = content;

    // Apply exact replacements
    for (const [oldStr, newStr] of Object.entries(replacements)) {
        content = content.split(oldStr).join(newStr);
    }

    // Specific cleanups for index.css
    if (filepath.endsWith('index.css')) {
        content = content.split('color: #F97316;').join('color: #4a90e2;');
        content = content.split('color: #f97316;').join('color: #4a90e2;');
        content = content.split('background: #F97316;').join('background: #4a90e2;');
        content = content.split('border-color: #F97316;').join('border-color: #4a90e2;');
        content = content.split('border-top: 3px solid #f97316;').join('border-top: 3px solid #4a90e2;');
        content = content.split('accent-color: #F97316;').join('accent-color: #4a90e2;');
        content = content.split('border: 1.5px solid #F97316;').join('border: 1.5px solid #4a90e2;');
        content = content.split('text-amber-500').join('text-primary-500');
        content = content.split('text-amber-600').join('text-primary-600');
        content = content.split('text-amber-700').join('text-primary-700');
    }

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        modifiedFiles.push(filepath);
    }
}

walk(baseDir);
console.log(`\nSuccessfully modernized ${modifiedFiles.length} files to Nordic Theme!`);
modifiedFiles.forEach(f => console.log(` - ${f}`));
