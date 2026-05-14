const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, '..', 'features');

const replaceColorsInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern to match Tailwind color classes like text-amber-500, bg-orange-50, etc.
    const patterns = [
        /(text|bg|border|ring|shadow|from|to|via|divide|fill|stroke)-(amber|orange|yellow)-(\d+)/g,
        /(text|bg|border|ring|shadow|from|to|via|divide|fill|stroke)-(amber|orange|yellow)\b/g
    ];

    patterns.forEach(regex => {
        content = content.replace(regex, (match, prefix, color, shade) => {
            if (shade) {
                return `${prefix}-warning-${shade}`;
            }
            return `${prefix}-warning`; // for cases like bg-amber (if they exist)
        });
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
};

const walkSync = (dir) => {
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

walkSync(DIRECTORY);
console.log('Color replacement complete.');
