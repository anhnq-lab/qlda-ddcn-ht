const fs = require('fs');
const path = require('path');

const DIRS = ['features', 'layouts', 'components'];

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Replace bg-bg-surface -> bg-white dark:bg-slate-800
            content = content.replace(/bg-bg-surface/g, 'bg-white dark:bg-slate-800');
            
            // Replace bg-bg-subtle -> bg-slate-50 dark:bg-slate-800
            content = content.replace(/bg-bg-subtle/g, 'bg-slate-50 dark:bg-slate-800');
            
            // Remove /50 from dark mode slate backgrounds (e.g., dark:bg-slate-900/50 -> dark:bg-slate-900)
            content = content.replace(/dark:bg-slate-([0-9]{3})\/([0-9]+)/g, 'dark:bg-slate-');
            
            // Also fix non-dark prefixed bg-slate-X00/Y
            content = content.replace(/bg-slate-([0-9]{3})\/([0-9]+)/g, 'bg-slate-');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

for (const dir of DIRS) {
    processDir(path.join(__dirname, dir));
}
