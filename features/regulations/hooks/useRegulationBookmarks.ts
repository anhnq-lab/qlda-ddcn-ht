import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseExt } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

const QUERY_KEY = 'regulation_bookmarks';

export function useRegulationBookmarks(documentId: string | null) {
  const { supabaseUser } = useAuth();
  const userId = supabaseUser?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, userId, documentId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];
      const q = supabaseExt
        .from('regulation_bookmarks')
        .select('article_id')
        .eq('user_id', userId);
      if (documentId) q.eq('document_id', documentId);

      const { data, error } = await q;
      if (error) throw error;
      return (data as { article_id: string }[]).map((r) => r.article_id);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (articleId: string) => {
      if (!userId || !documentId) throw new Error('Missing context');
      const existing = query.data ?? [];
      if (existing.includes(articleId)) {
        const { error } = await supabaseExt
          .from('regulation_bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', articleId);
        if (error) throw error;
      } else {
        const { error } = await supabaseExt
          .from('regulation_bookmarks')
          .insert({ user_id: userId, document_id: documentId, article_id: articleId });
        if (error) throw error;
      }
    },
    onMutate: async (articleId: string) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, userId, documentId] });
      const prev = queryClient.getQueryData<string[]>([QUERY_KEY, userId, documentId]) ?? [];
      const next = prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId];
      queryClient.setQueryData([QUERY_KEY, userId, documentId], next);
      return { prev };
    },
    onError: (_err, _articleId, context) => {
      if (context?.prev) {
        queryClient.setQueryData([QUERY_KEY, userId, documentId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId, documentId] });
    },
  });

  return {
    bookmarkedIds: query.data ?? [],
    isLoading: query.isLoading,
    toggle: (articleId: string) => toggleMutation.mutate(articleId),
  };
}
