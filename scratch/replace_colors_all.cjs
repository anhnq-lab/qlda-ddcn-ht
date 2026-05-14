const fs = require('fs');
const path = require('path');

const DIRS = ['components', 'layouts', 'pages', 'lib', 'hooks'].map(d => path.join(__dirname, '..', d));

const replaceColorsInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    const patterns = [
        /(text|bg|border|ring|shadow|from|to|via|divide|fill|stroke)-(amber|orange|yellow)-(\d+)/g,
        /(text|bg|border|ring|shadow|from|to|via|divide|fill|stroke)-(amber|orange|yellow)\b/g
    ];

    patterns.forEach(regex => {
        content = content.replace(regex, (match, prefix, color, shade) => {
            if (shade) {
                return `${prefix}-warning-${shade}`;
            }
            return `${prefix}-warning`;
        });
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
};

const walkSync = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkSync(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            replaceColorsInFile(filePath);
        }
    }
};

DIRS.forEach(walkSync);
console.log('Color replacement complete.');
