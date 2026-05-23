import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '../services/DocumentService';
import { Document, Folder } from '../types';
import { supabase } from '../lib/supabase';

export const useFolders = (projectId: string) => {
    return useQuery({
        queryKey: ['folders', projectId],
        queryFn: async () => {
            const { data } = await supabase.from('cde_folders').select('*').eq('project_id', projectId);
            return data || [];
        },
        enabled: !!projectId
    });
};

export const useDocuments = (folderId: string) => {
    return useQuery({
        queryKey: ['documents', folderId],
        queryFn: async () => {
            const { data } = await supabase.from('documents').select('*').eq('folder_id', folderId);
            return data || [];
        },
        enabled: !!folderId
    });
};

export const useProcessStep = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            // Placeholder - processStep needs proper implementation if actually used
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });
};
