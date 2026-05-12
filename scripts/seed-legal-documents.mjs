/**
 * Seed legal documents into Supabase via Management API (PAT)
 * No pg/psql needed — pure REST API
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));

import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

// ---- Import legalData ----
const { legalDocuments } = await import('../features/legal-documents/legalData.ts');
console.log(`📚 Loaded ${legalDocuments.length} documents from legalData.ts\n`);

// ---- Supabase REST insert via service_role (bypass RLS) ----
async function upsert(table, rows) {
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
        const txt = await res.text();
        throw new Error(`${table}: HTTP ${res.status} — ${txt.slice(0, 200)}`);
    }
    return rows.length;
}

// ---- Main seed ----
let docCount = 0, chapterCount = 0, articleCount = 0;
const errors = [];

for (const doc of legalDocuments) {
    try {
        // 1. Upsert document
        await upsert('legal_documents', [{
            id: doc.id,
            code: doc.code,
            title: doc.title,
            short_title: doc.shortTitle ?? null,
            type: doc.type,
            issued_date: doc.issuedDate ?? null,
            effective_date: doc.effectiveDate ?? null,
            issued_by: doc.issuedBy ?? null,
            status: doc.status,
            summary: doc.summary ?? null,
            file_name: doc.fileName ?? null,
            file_path: doc.filePath ?? null,
            file_size: doc.fileSize ?? null,
            tags: doc.tags ?? [],
            related_doc_ids: doc.relatedDocIds ?? [],
        }]);
        docCount++;

        // 2. Upsert chapters
        const chapters = doc.chapters ?? [];
        if (chapters.length > 0) {
            await upsert('legal_chapters', chapters.map((ch, ci) => ({
                id: ch.id,
                document_id: doc.id,
                code: ch.code,
                title: ch.title,
                sort_order: ci,
            })));
            chapterCount += chapters.length;
        }

        // 3. Upsert articles in batches of 50
        let allArticles = chapters.flatMap((ch, ci) =>
            (ch.articles ?? []).map((art, ai) => ({
                id: art.id,
                chapter_id: ch.id,
                document_id: doc.id,
                code: art.code,
                title: art.title,
                summary: art.summary ?? null,
                content: art.content ?? null,
                full_content: art.fullContent ?? null,
                sort_order: ai,
            }))
        );

        // Deduplicate articles by ID
        const seenIds = new Set();
        allArticles = allArticles.filter(art => {
            if (seenIds.has(art.id)) return false;
            seenIds.add(art.id);
            return true;
        });


        for (let i = 0; i < allArticles.length; i += 50) {
            await upsert('legal_articles', allArticles.slice(i, i + 50));
        }
        articleCount += allArticles.length;

    } catch (err) {
        errors.push(`[${doc.id}] ${err.message}`);
    }

    process.stdout.write(`\r📥 ${docCount}/${legalDocuments.length} docs | ${chapterCount} chapters | ${articleCount} articles`);
}

console.log('\n\n========================================');
console.log(`✅ Documents : ${docCount}`);
console.log(`✅ Chapters  : ${chapterCount}`);
console.log(`✅ Articles  : ${articleCount}`);
if (errors.length > 0) {
    console.log(`\n⚠️  Errors (${errors.length}):`);
    errors.slice(0, 10).forEach(e => console.log(`   ${e}`));
} else {
    console.log('✅ No errors!');
}
console.log('========================================');
console.log('\n💡 Next: delete features/legal-documents/legalData.ts');

