const fs = require('fs');
const path = require('path');

function extractTextFromJSX(jsxString) {
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(jsxString)) !== null) {
    let content = match[1]
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\\([.*])/g, '$1')
      .trim();
    if (content) paragraphs.push(content);
  }
  if (paragraphs.length === 0) {
    return jsxString.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return paragraphs.join('\n\n');
}

function parseArticles(filePath, chapterMap) {
  const content = fs.readFileSync(filePath, 'utf8');
  const articles = [];
  let currentChapterId = null;
  let sortOrder = 0;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const [oldId, newId] of Object.entries(chapterMap)) {
      const lookAhead = lines.slice(i, i + 3).join(' ');
      if (lookAhead.includes(`id: "${oldId}"`) && (lookAhead.includes('code:') || lookAhead.includes('title:'))) {
        currentChapterId = newId;
        sortOrder = 0;
        break;
      }
    }
    // Support both multi-line and single-line formats
    // Look ahead up to 5 lines for id/code/title/content block
    const block = lines.slice(i, i + 6).join('\n');
    const artMatch = block.match(/id:\s*"([^"]+)"[\s\S]*?code:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?content:/);
    if (artMatch && currentChapterId && !articles.find(a => a.id === artMatch[1])) {
      const idM = { 1: artMatch[1] }, codeM = { 1: artMatch[2] }, titleM = { 1: artMatch[3] };
      // Find the line with 'content:'
      let contentLineIdx = i;
      for (let k = i; k < i + 6 && k < lines.length; k++) {
        if (lines[k].includes('content:')) { contentLineIdx = k; break; }
      }
      if (true) {
        sortOrder++;
        const contentLines = [];
        let depth = 0;
        for (let j = contentLineIdx; j < lines.length; j++) {
          contentLines.push(lines[j]);
          for (const ch of lines[j]) {
            if (ch === '(') depth++;
            if (ch === ')') depth--;
          }
          if (depth <= 0 && contentLines.length > 1) { i = j; break; }
        }
        articles.push({
          id: idM[1], chapter_id: currentChapterId, code: codeM[1], title: titleM[1],
          content: extractTextFromJSX(contentLines.join('\n')), sort_order: sortOrder
        });
      }
    }
  }
  return articles;
}

const esc = s => s.replace(/'/g, "''");

// QCLV
const qclv = parseArticles(
  path.join(__dirname, '..', 'features', 'regulations', 'data', 'regulationsData.tsx'),
  { 'chuong-i': 'qclv-chuong-i', 'chuong-ii': 'qclv-chuong-ii', 'chuong-iii': 'qclv-chuong-iii', 'chuong-iv': 'qclv-chuong-iv', 'chuong-v': 'qclv-chuong-v', 'chuong-vi': 'qclv-chuong-vi', 'chuong-vii': 'qclv-chuong-vii' }
);

// QCDGXL - different ID pattern
const qcdgxl = parseArticles(
  path.join(__dirname, '..', 'features', 'regulations', 'data', 'assessmentRegulationData.tsx'),
  { 'chuong-chung': 'qcdgxl-chung', 'chuong-i': 'qcdgxl-chuong-i', 'chuong-ii': 'qcdgxl-chuong-ii', 'chuong-iii': 'qcdgxl-chuong-iii' }
);

const all = [...qclv, ...qcdgxl];
console.error(`QCLV: ${qclv.length}, QCDGXL: ${qcdgxl.length}, Total: ${all.length}`);

// Output JSON for use with execute_sql
console.log(JSON.stringify(all, null, 2));
