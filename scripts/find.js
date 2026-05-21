const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (['node_modules', '.git', 'dist', '.agent', '.brain', '.claude'].includes(file)) return;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}
const files = walk('.');
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const regex = /import\s+\{([^}]+)\}\s+from\s+['\"][^'\"]*docxHelpers[^'\"]*['\"]/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (match[1].includes('AlignmentType')) {
            console.log('FOUND MATCH IN:', f);
            console.log(match[0]);
        }
    }
});
