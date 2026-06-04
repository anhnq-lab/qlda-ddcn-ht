import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RegulationService, type RegDocRow, type RegDocWithChapters, type RegChapterRow, type RegArticleRow } from '../../../services/RegulationService';

const DOCS_KEY = ['regulation_documents'] as const;
const docKey = (id: string) => ['regulation_document', id] as const;

export function useRegulationDocuments() {
  return useQuery({
    queryKey: DOCS_KEY,
    queryFn: RegulationService.getAllDocuments,
    staleTime: 5 * 60_000,
  });
}

export function useRegulationDocument(docId: string | null) {
  return useQuery({
    queryKey: docKey(docId || ''),
    queryFn: () => RegulationService.getDocumentWithContent(docId!),
    enabled: !!docId,
    staleTime: 5 * 60_000,
  });
}

export function useUpsertDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: RegulationService.upsertDocument,
    onSuccess: () => { qc.invalidateQueries({ queryKey: DOCS_KEY }); },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: RegulationService.deleteDocument,
    onSuccess: () => { qc.invalidateQueries({ queryKey: DOCS_KEY }); },
  });
}

export function useUpsertChapter(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: RegulationService.upsertChapter,
    onSuccess: () => { qc.invalidateQueries({ queryKey: docKey(docId) }); },
  });
}

export function useDeleteChapter(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: RegulationService.deleteChapter,
    onSuccess: () => { qc.invalidateQueries({ queryKey: docKey(docId) }); },
  });
}

export function useUpsertArticle(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: RegulationService.upsertArticle,
    onSuccess: () => { qc.invalidateQueries({ queryKey: docKey(docId) }); },
  });
}

export function useDeleteArticle(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: RegulationService.deleteArticle,
    onSuccess: () => { qc.invalidateQueries({ queryKey: docKey(docId) }); },
  });
}

export type { RegDocRow, RegDocWithChapters, RegChapterRow, RegArticleRow };
