const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../ks/15.4. H Du-thao-Quy-che-danh-gia-xep-loai-can-bo-vien-chuc-va-nguoi-lao-dong (1).md');
const outputFile = path.join(__dirname, '../features/regulations/data/assessmentRegulationData.tsx');

const content = fs.readFileSync(inputFile, 'utf-8');

const lines = content.split('\n');

const chapters = [];
let currentChapter = null;
let currentArticle = null;
let inAppendix = false;

// Helpers
const cleanText = (text) => text.replace(/\*\*/g, '').replace(/#/g, '').trim();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.includes('**Phụ lục 01:') || line.includes('Phụ lục 01: Phiếu đánh giá, xếp loại dành cho')) {
    inAppendix = true;
    break; // Stop parsing at appendices
  }

  // Check for Chapter
  const chapterMatch = line.match(/^#?\s*\**Chương\s+([MDCLXVI]+)\**\s*$/i);
  if (chapterMatch) {
    const chapterNum = chapterMatch[1];
    let chapterTitle = '';
    // Look ahead for the title
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].trim() !== '' && !lines[j].includes('Điều')) {
        chapterTitle = cleanText(lines[j]);
        i = j;
        break;
      }
    }
    
    currentChapter = {
      id: `chuong-${chapterNum.toLowerCase()}`,
      title: `Chương ${chapterNum}: ${chapterTitle}`,
      articles: []
    };
    chapters.push(currentChapter);
    currentArticle = null;
    continue;
  }

  // Check for Article
  const articleMatch = line.match(/^#?\s*\**Điều\s+(\d+)\\\.?\s*(.+)\**$/i);
  if (articleMatch) {
    if (!currentChapter) {
        currentChapter = {
            id: 'chuong-chung',
            title: 'Quy định chung',
            articles: []
        };
        chapters.push(currentChapter);
    }
    const articleNum = articleMatch[1];
    const articleTitle = cleanText(articleMatch[2]);
    
    currentArticle = {
      id: `${currentChapter.id}-dieu-${articleNum}`,
      title: `Điều ${articleNum}. ${articleTitle}`,
      content: []
    };
    currentChapter.articles.push(currentArticle);
    continue;
  }

  // Otherwise, add to current article content
  if (currentArticle && line !== '') {
    // If it's a list item starting with number or letter or hyphen, wrap it or just keep it
    // For simplicity, we just keep the raw line and later map it to <p>
    currentArticle.content.push(line);
  }
}

// Generate TSX
let tsxContent = `import React from 'react';
import { RegChapter } from './regulationsData';

export const assessmentRegulationChapters: RegChapter[] = [
`;

chapters.forEach(chapter => {
  tsxContent += `  {
    id: "${chapter.id}",
    title: "${chapter.title}",
    articles: [
`;
  chapter.articles.forEach(article => {
    tsxContent += `      {
        id: "${article.id}",
        title: "${article.title}",
        content: (
          <div className="space-y-3 text-slate-700 dark:text-slate-300">
`;
    article.content.forEach(p => {
      // Escape quotes and wrap in <p>
      const cleanP = p.replace(/\\/g, '').replace(/"/g, '&quot;').replace(/{/g, '&#123;').replace(/}/g, '&#125;');
      tsxContent += `            <p>${cleanP}</p>\n`;
    });
    tsxContent += `          </div>
        )
      },
`;
  });
  tsxContent += `    ]
  },
`;
});

tsxContent += `];\n`;

fs.writeFileSync(outputFile, tsxContent, 'utf-8');
console.log('Successfully generated assessmentRegulationData.tsx');
