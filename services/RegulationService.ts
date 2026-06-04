import { supabaseExt } from '../lib/supabase';

export interface RegDocRow {
  id: string;
  code: string;
  title: string;
  description: string;
  date: string;
  effective_date: string | null;
  status: 'active' | 'draft' | 'archived';
  pdf_url: string | null;
  sort_order: number;
}

export interface RegChapterRow {
  id: string;
  document_id: string;
  code: string;
  title: string;
  icon: string | null;
  sort_order: number;
}

export interface RegArticleRow {
  id: string;
  chapter_id: string;
  code: string;
  title: string;
  content: string;
  content_type: 'text' | 'markdown' | 'component';
  component_key: string | null;
  sort_order: number;
}

export interface RegDocWithChapters extends RegDocRow {
  chapters: (RegChapterRow & { articles: RegArticleRow[] })[];
}

export const RegulationService = {
  async getAllDocuments(): Promise<RegDocRow[]> {
    const { data, error } = await supabaseExt
      .from('regulation_documents')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data as RegDocRow[];
  },

  async getDocumentWithContent(docId: string): Promise<RegDocWithChapters | null> {
    const { data: doc, error: docErr } = await supabaseExt
      .from('regulation_documents')
      .select('*')
      .eq('id', docId)
      .single();
    if (docErr) throw docErr;
    if (!doc) return null;

    const { data: chapters, error: chapErr } = await supabaseExt
      .from('regulation_chapters')
      .select('*')
      .eq('document_id', docId)
      .order('sort_order');
    if (chapErr) throw chapErr;

    const chapterIds = (chapters as RegChapterRow[]).map(c => c.id);
    const { data: articles, error: artErr } = await supabaseExt
      .from('regulation_articles')
      .select('*')
      .in('chapter_id', chapterIds)
      .order('sort_order');
    if (artErr) throw artErr;

    const articleMap = new Map<string, RegArticleRow[]>();
    for (const art of (articles as RegArticleRow[])) {
      const list = articleMap.get(art.chapter_id) || [];
      list.push(art);
      articleMap.set(art.chapter_id, list);
    }

    return {
      ...(doc as RegDocRow),
      chapters: (chapters as RegChapterRow[]).map(ch => ({
        ...ch,
        articles: articleMap.get(ch.id) || [],
      })),
    };
  },

  // --- Admin CRUD ---

  async upsertDocument(doc: Partial<RegDocRow> & { id: string; code: string; title: string }) {
    const { error } = await supabaseExt
      .from('regulation_documents')
      .upsert(doc, { onConflict: 'id' });
    if (error) throw error;
  },

  async deleteDocument(id: string) {
    const { error } = await supabaseExt
      .from('regulation_documents')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async upsertChapter(ch: Partial<RegChapterRow> & { id: string; document_id: string; code: string; title: string }) {
    const { error } = await supabaseExt
      .from('regulation_chapters')
      .upsert(ch, { onConflict: 'id' });
    if (error) throw error;
  },

  async deleteChapter(id: string) {
    const { error } = await supabaseExt
      .from('regulation_chapters')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async upsertArticle(art: Partial<RegArticleRow> & { id: string; chapter_id: string; code: string; title: string }) {
    const { error } = await supabaseExt
      .from('regulation_articles')
      .upsert(art, { onConflict: 'id' });
    if (error) throw error;
  },

  async deleteArticle(id: string) {
    const { error } = await supabaseExt
      .from('regulation_articles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
