import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

async function query(table, select = '*') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY,
        }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function upsert(table, rows) {
    if (rows.length === 0) return 0;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(rows),
    });
    if (!res.ok) {
        throw new Error(`${table}: HTTP ${res.status} — ${await res.text()}`);
    }
    return rows.length;
}

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function parseDocument(content, filename) {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    
    let docType = 'nghi-dinh';
    if (filename.toLowerCase().includes('luat')) docType = 'luat';
    else if (filename.toLowerCase().includes('thong-tu')) docType = 'thong-tu';

    let code = 'Dự thảo ' + filename.replace(/\.(md|txt|doc)$/i, '');
    let title = filename;
    let status = 'sap-hieu-luc';

    if (filename === '02. Du thao Nghị định - HĐXD.md') {
        code = 'Dự thảo NĐ HĐXD 2026';
        title = 'Dự thảo Nghị định quy định chi tiết về hợp đồng xây dựng';
    } else if (filename === '02. Dự thảo NGHỊ ĐỊNH về HĐXD 04.3.2026.md') {
        code = 'Dự thảo NĐ QLHĐXD 2026';
        title = 'Dự thảo Nghị định quy định chi tiết một số điều của Luật Xây dựng về quản lý hoạt động xây dựng';
    } else if (filename === '20260310-Du Thao Nghi dinh ve QLCP.md') {
        code = 'Dự thảo NĐ QLCP 2026';
        title = 'Dự thảo Nghị định về quản lý chi phí đầu tư xây dựng';
    } else if (filename === 'dt-nghi-dinh-quanly-chat-luong-xd.md') {
        code = 'Dự thảo NĐ QLCL 2026';
        title = 'Dự thảo Nghị định quy định về quản lý chất lượng công trình xây dựng';
    } else if (filename === '85_2025_ND-CP.txt') {
        code = 'NĐ 85/2025/NĐ-CP';
        title = 'Nghị định quy định chi tiết một số điều của Luật Đấu thầu về lựa chọn nhà thầu';
        status = 'hieu-luc';
    } else if (filename === '135_2025_QH15_675213.md') {
        code = 'Luật số 135/2025/QH15';
        title = 'Luật Xây dựng';
        status = 'hieu-luc';
        docType = 'luat';
    } else if (filename === 'luat58-full-text.txt') {
        code = 'Luật số 58/2024/QH15';
        title = 'Luật Đầu tư công';
        status = 'hieu-luc';
        docType = 'luat';
    }

    const doc = {
        id: generateId(),
        code,
        title,
        type: docType,
        status,
    };

    const chapters = [];
    let currentChapter = null;
    let currentArticle = null;
    let currentContent = [];

    const articleRegex = /^(?:#+\s*)?(?:\*\*)*(?:Điều|ĐIỀU)\s+(\d+)(?:\\*\.|:|\.)\s*(.+)/i;
    const chapterRegex = /^(?:#+\s*)?(?:\*\*)*(?:Chương|CHƯƠNG)\s+([IVXLCDM]+)(?:\\*\.|:|\.)?\s*(.*)/i;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Replace markdown bold
        const plainLine = line.replace(/\*\*/g, '').trim();

        const chMatch = plainLine.match(chapterRegex);
        if (chMatch && plainLine.length < 200) {
            // New Chapter
            if (currentArticle) {
                currentArticle.content = currentContent.join('\n');
                currentArticle.full_content = currentContent.join('\n');
            }
            
            currentChapter = {
                id: generateId(),
                document_id: doc.id,
                code: `Chương ${chMatch[1]}`,
                title: chMatch[2] || `Chương ${chMatch[1]}`,
                sort_order: chapters.length,
                articles: []
            };
            chapters.push(currentChapter);
            currentArticle = null;
            continue;
        }

        const artMatch = plainLine.match(articleRegex);
        if (artMatch && plainLine.length < 200) {
            if (currentArticle) {
                currentArticle.content = currentContent.join('\n');
                currentArticle.full_content = currentContent.join('\n');
            }

            if (!currentChapter) {
                currentChapter = {
                    id: generateId(),
                    document_id: doc.id,
                    code: 'Chương I',
                    title: 'Quy định chung',
                    sort_order: 0,
                    articles: []
                };
                chapters.push(currentChapter);
            }

            currentArticle = {
                id: generateId(),
                chapter_id: currentChapter.id,
                document_id: doc.id,
                code: `Điều ${artMatch[1]}`,
                title: artMatch[2],
                sort_order: currentChapter.articles.length,
            };
            currentChapter.articles.push(currentArticle);
            currentContent = [];
            continue;
        }

        if (currentArticle) {
            currentContent.push(line);
        }
    }

    if (currentArticle) {
        currentArticle.content = currentContent.join('\n');
        currentArticle.full_content = currentContent.join('\n');
    }

    return { doc, chapters };
}

async function run() {
    const existingDocs = await query('legal_documents', 'code');
    const existingCodes = new Set(existingDocs.map(d => d.code));

    const dir = 'Doccument/VanBanPhapLuat.md';
    const files = readdirSync(dir);

    for (const file of files) {
        if (!file.endsWith('.md') && !file.endsWith('.txt')) continue;

        const content = readFileSync(join(dir, file), 'utf-8');
        const parsed = parseDocument(content, file);

        if (existingCodes.has(parsed.doc.code)) {
            console.log(`⏩ Bỏ qua (Đã có trong hệ thống): ${parsed.doc.code}`);
            continue;
        }

        console.log(`\n⏳ Đang import: ${parsed.doc.code} - ${parsed.doc.title}`);
        try {
            await upsert('legal_documents', [parsed.doc]);
            
            for (const ch of parsed.chapters) {
                const chapterRow = {
                    id: ch.id,
                    document_id: ch.document_id,
                    code: ch.code,
                    title: ch.title,
                    sort_order: ch.sort_order
                };
                await upsert('legal_chapters', [chapterRow]);

                const articles = ch.articles.map(art => ({
                    id: art.id,
                    chapter_id: art.chapter_id,
                    document_id: art.document_id,
                    code: art.code,
                    title: art.title,
                    content: art.content,
                    full_content: art.full_content,
                    sort_order: art.sort_order
                }));

                for (let i = 0; i < articles.length; i += 50) {
                    await upsert('legal_articles', articles.slice(i, i + 50));
                }
            }
            console.log(`✅ Import thành công: ${parsed.chapters.length} chương, ${parsed.chapters.reduce((a, c) => a + c.articles.length, 0)} điều.`);
        } catch (e) {
            console.error(`❌ Lỗi khi import ${file}:`, e.message);
        }
    }
}

run().catch(console.error);
