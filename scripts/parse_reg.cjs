const fs = require('fs');
const md = fs.readFileSync('ks/48.12-Ban-hanh-.Quy-che-lam-viec-Ban-QLDA.md', 'utf-8');

const lines = md.split('\n');
const chapters = [];
let currentChapter = null;
let currentArticle = null;

const chapterRegex = /^\*\*Chương\s+([A-Za-z]+)\*\*/i;
const articleRegex = /^\*\*Điều\s+(\d+)\\\.\s+(.+?)\*\*/;

let i = 0;
while (i < lines.length) {
    let line = lines[i].trim();
    
    const chapterMatch = line.match(chapterRegex);
    if (chapterMatch) {
        let chapterTitle = '';
        if (i + 1 < lines.length && lines[i+1].trim().startsWith('**')) {
            chapterTitle = lines[i+1].replace(/\*\*/g, '').trim();
            i++;
        } else if (i + 2 < lines.length && lines[i+2].trim().startsWith('**')) {
            chapterTitle = lines[i+2].replace(/\*\*/g, '').trim();
            i += 2;
        }
        
        currentChapter = {
            id: 'CH' + chapterMatch[1],
            code: 'Chương ' + chapterMatch[1],
            title: chapterTitle,
            articles: []
        };
        chapters.push(currentChapter);
        currentArticle = null;
        i++;
        continue;
    }
    
    const articleMatch = line.match(articleRegex);
    if (articleMatch) {
        currentArticle = {
            id: currentChapter ? currentChapter.id + '.' + articleMatch[1] : 'ART' + articleMatch[1],
            code: 'Điều ' + articleMatch[1],
            title: articleMatch[2].replace(/\*\*/g, '').trim(),
            contentLines: []
        };
        if (currentChapter) {
            currentChapter.articles.push(currentArticle);
        }
        i++;
        continue;
    }
    
    if (currentArticle && line !== '' && !line.startsWith('|')) {
        currentArticle.contentLines.push(line);
    }
    
    i++;
}

// Format as TSX
let tsxContent = '';
chapters.forEach(ch => {
    tsxContent += `    {\n`;
    tsxContent += `        id: "${ch.id}",\n`;
    tsxContent += `        code: "${ch.code}",\n`;
    tsxContent += `        title: "${ch.title}",\n`;
    tsxContent += `        icon: FileText,\n`;
    tsxContent += `        articles: [\n`;
    ch.articles.forEach(art => {
        tsxContent += `            {\n`;
        tsxContent += `                id: "${art.id}",\n`;
        tsxContent += `                code: "${art.code}",\n`;
        tsxContent += `                title: "${art.title}",\n`;
        tsxContent += `                content: (\n`;
        tsxContent += `                    <div className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-slate-300 text-justify">\n`;
        art.contentLines.forEach(cl => {
             // Basic formatting: handle list items or paragraphs
             let text = cl.replace(/\*\*/g, '').replace(/\\-/g, '-');
             text = text.replace(/"/g, '&quot;');
             tsxContent += `                        <p>${text}</p>\n`;
        });
        tsxContent += `                    </div>\n`;
        tsxContent += `                )\n`;
        tsxContent += `            },\n`;
    });
    tsxContent += `        ]\n`;
    tsxContent += `    },\n`;
});

fs.writeFileSync('temp_reg.tsx', tsxContent);
console.log('Done parsing.');
