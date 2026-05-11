const fs = require('fs');
const path = require('path');

// Read file in UTF-16LE
const filePath = 'd:\\QuocAnh\\2026\\01.Project\\qlda-ddcn-ht\\Quyche.md';
const content = fs.readFileSync(filePath, 'utf16le');

// Clean up carriage returns
const lines = content.replace(/\r\n/g, '\n').split('\n');
console.log(`Total lines in Quyche.md: ${lines.length}`);

const chapters = [];
const articles = [];

lines.forEach((line, idx) => {
    const lineClean = line.trim();
    if (!lineClean) return;

    // Check for chapter
    if (/\*\*Chương\s+[IVXLCDM]+\*\*/i.test(lineClean) || /^Chương\s+[IVXLCDM]+/i.test(lineClean)) {
        chapters.push({ lineNum: idx + 1, text: lineClean });
    }
    // Check for article
    else if (/\*\*Điều\s+\d+/i.test(lineClean) || /^Điều\s+\d+/i.test(lineClean)) {
        articles.push({ lineNum: idx + 1, text: lineClean });
    }
});

console.log("\n--- CHAPTERS FOUND ---");
chapters.forEach((chap) => {
    console.log(`Line ${chap.lineNum}: ${chap.text}`);
    // Print the next non-empty lines
    const nextLines = [];
    let i = chap.lineNum;
    while (i < lines.length && nextLines.length < 2) {
        if (lines[i].trim()) {
            nextLines.push(lines[i].trim());
        }
        i++;
    }
    console.log(`  Title lines:`, nextLines);
});

console.log(`\n--- ARTICLES FOUND (Total: ${articles.length}) ---`);
articles.forEach((art, idx) => {
    if (idx < 10 || idx >= articles.length - 5) {
        console.log(`Line ${art.lineNum}: ${art.text}`);
    } else if (idx === 10) {
        console.log("...");
    }
});
