/**
 * Script một lần: Extract text từ TSX data files và insert vào regulation_articles.
 * Chạy: node scripts/seed_regulation_articles.cjs
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jkaddjllseephsiaqvds.supabase.co';

// Try reading from .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([^=]+)=(.+)/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Chapter ID mapping: old ID -> new ID (with document prefix)
const QCLV_CHAPTER_MAP = {
  'chuong-i': 'qclv-chuong-i',
  'chuong-ii': 'qclv-chuong-ii',
  'chuong-iii': 'qclv-chuong-iii',
  'chuong-iv': 'qclv-chuong-iv',
  'chuong-v': 'qclv-chuong-v',
  'chuong-vi': 'qclv-chuong-vi',
  'chuong-vii': 'qclv-chuong-vii',
};

const QCDGXL_CHAPTER_MAP = {
  'chuong-chung': 'qcdgxl-chung',
  'chuong-i': 'qcdgxl-chuong-i',
  'chuong-ii': 'qcdgxl-chuong-ii',
  'chuong-iii': 'qcdgxl-chuong-iii',
};

function extractTextFromJSX(jsxString) {
  // Remove JSX wrapper div tags
  let text = jsxString;
  // Extract text from <p>...</p> tags
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(text)) !== null) {
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
    // Fallback: strip all tags
    text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  }
  return paragraphs.join('\n\n');
}

function parseArticlesFromTSX(filePath, chapterMap) {
  const content = fs.readFileSync(filePath, 'utf8');
  const articles = [];

  // Find all article blocks with id, code, title, content
  const articleRegex = /\{\s*id:\s*"([^"]+)",\s*code:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*content:\s*\(([\s\S]*?)\)\s*\}/g;

  let currentChapterId = null;
  let articleIndex = 0;

  // First, find chapter boundaries
  const chapterStarts = [];
  const chapterIdRegex = /id:\s*"([^"]+)",\s*\n\s*code:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)"/g;
  let chMatch;
  while ((chMatch = chapterIdRegex.exec(content)) !== null) {
    if (chapterMap[chMatch[1]]) {
      chapterStarts.push({ id: chMatch[1], pos: chMatch.index });
    }
  }

  // Parse articles with simpler regex approach
  const lines = content.split('\n');
  let inArticle = false;
  let articleId = '', articleCode = '', articleTitle = '';
  let contentLines = [];
  let braceDepth = 0;
  let chapterIdx = 0;
  let sortOrder = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect chapter start by looking for chapter ids in chapterMap
    for (const [oldId, newId] of Object.entries(chapterMap)) {
      const lookAhead = lines.slice(i, i + 3).join(' ');
      if (lookAhead.includes(`id: "${oldId}"`) && (lookAhead.includes('code:') || lookAhead.includes('title:'))) {
        currentChapterId = newId;
        sortOrder = 0;
        break;
      }
    }

    // Detect article start - support single-line and multi-line formats
    const block = lines.slice(i, i + 6).join('\n');
    const artMatch = block.match(/id:\s*"([^"]+)"[\s\S]*?code:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?content:/);

    if (artMatch && currentChapterId && !articles.find(a => a.id === artMatch[1])) {
      articleId = artMatch[1];
      articleCode = artMatch[2];
      articleTitle = artMatch[3];
      // Find content: line
      let contentLineIdx = i;
      for (let k = i; k < i + 6 && k < lines.length; k++) {
        if (lines[k].includes('content:')) { contentLineIdx = k; break; }
      }

      inArticle = true;
      contentLines = [];
      braceDepth = 0;
      sortOrder++;

        // Collect content JSX
        for (let j = contentLineIdx; j < lines.length; j++) {
          contentLines.push(lines[j]);
          // Count opening and closing parens/braces to find end
          for (const ch of lines[j]) {
            if (ch === '(') braceDepth++;
            if (ch === ')') braceDepth--;
          }
          if (braceDepth <= 0 && contentLines.length > 1) {
            i = j;
            break;
          }
        }

        const rawContent = contentLines.join('\n');
        const textContent = extractTextFromJSX(rawContent);

        articles.push({
          id: articleId,
          chapter_id: currentChapterId,
          code: articleCode,
          title: articleTitle,
          content: textContent,
          content_type: 'text',
          sort_order: sortOrder,
        });

        inArticle = false;
    }
  }

  return articles;
}

async function insertArticles(articles) {
  // Batch insert in chunks of 20
  const chunkSize = 20;
  let total = 0;

  for (let i = 0; i < articles.length; i += chunkSize) {
    const chunk = articles.slice(i, i + chunkSize);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/regulation_articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Error inserting chunk ${i}:`, err);
    } else {
      total += chunk.length;
      console.log(`Inserted ${total}/${articles.length} articles`);
    }
  }
}

async function main() {
  console.log('Parsing regulationsData.tsx...');
  const qclvArticles = parseArticlesFromTSX(
    path.join(__dirname, '..', 'features', 'regulations', 'data', 'regulationsData.tsx'),
    QCLV_CHAPTER_MAP
  );
  console.log(`Found ${qclvArticles.length} articles in QCLV`);

  console.log('Parsing assessmentRegulationData.tsx...');
  const qcdgxlArticles = parseArticlesFromTSX(
    path.join(__dirname, '..', 'features', 'regulations', 'data', 'assessmentRegulationData.tsx'),
    QCDGXL_CHAPTER_MAP
  );
  console.log(`Found ${qcdgxlArticles.length} articles in QCDGXL`);

  const allArticles = [...qclvArticles, ...qcdgxlArticles];
  console.log(`\nTotal: ${allArticles.length} articles to insert`);

  if (allArticles.length === 0) {
    console.error('No articles found! Check parsing logic.');
    process.exit(1);
  }

  // Preview first 3
  console.log('\nPreview:');
  allArticles.slice(0, 3).forEach(a => {
    console.log(`  [${a.chapter_id}] ${a.code}: ${a.title}`);
    console.log(`    Content (first 80): ${a.content.substring(0, 80)}...`);
  });

  console.log('\nInserting into DB...');
  await insertArticles(allArticles);
  console.log('Done!');
}

main().catch(console.error);
