import { Database as GeneratedDatabase } from './database';

type TableNamesToOverride = 
  | 'cde_permissions' 
  | 'dashboard_widget_config' 
  | 'cde_folders' 
  | 'cde_comments' 
  | 'cde_transmittals' 
  | 'cde_audit_log'
  | 'document_attachments'
  | 'sidebar_module_config'
  | 'regulation_bookmarks'
  | 'regulation_documents'
  | 'regulation_chapters'
  | 'regulation_articles';

export interface ExtendedDatabase extends Omit<GeneratedDatabase, 'public'> {
    public: Omit<GeneratedDatabase['public'], 'Tables'> & {
        Tables: Omit<GeneratedDatabase['public']['Tables'], TableNamesToOverride> & {
            document_attachments: {
                Row: {
                    id: string;
                    related_type: string;
                    related_id: string;
                    file_name: string;
                    file_size: number;
                    file_type: string;
                    storage_path: string;
                    description: string;
                    uploaded_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    related_type: string;
                    related_id: string;
                    file_name: string;
                    file_size: number;
                    file_type: string;
                    storage_path: string;
                    description?: string;
                    uploaded_by?: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    related_type?: string;
                    related_id?: string;
                    file_name?: string;
                    file_size?: number;
                    file_type?: string;
                    storage_path?: string;
                    description?: string;
                    uploaded_by?: string;
                    created_at?: string;
                };
                Relationships: [];
            };
            cde_folders: {
                Row: {
                    FolderID: string;
                    ParentID: string | null;
                    Name: string;
                    Type: 'Container' | 'Folder';
                    Path: string;
                    project_id: string;
                };
                Insert: {
                    FolderID: string;
                    ParentID?: string | null;
                    Name: string;
                    Type: 'Container' | 'Folder';
                    Path: string;
                    project_id: string;
                };
                Update: {
                    FolderID?: string;
                    ParentID?: string | null;
                    Name?: string;
                    Type?: 'Container' | 'Folder';
                    Path?: string;
                    project_id?: string;
                };
                Relationships: [];
            };
            cde_comments: {
                Row: {
                    id: string;
                    doc_id: number;
                    author_id: string;
                    author_name: string;
                    author_role: string;
                    content: string;
                    reply_to: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    doc_id: number;
                    author_id: string;
                    author_name: string;
                    author_role: string;
                    content: string;
                    reply_to?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    doc_id?: number;
                    author_id?: string;
                    author_name?: string;
                    author_role?: string;
                    content?: string;
                    reply_to?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            cde_transmittals: {
                Row: {
                    id: string;
                    project_id: string;
                    transmittal_no: string;
                    subject: string;
                    from_org: string;
                    from_person: string;
                    to_org: string;
                    to_person: string;
                    cc_list: string[];
                    doc_ids: number[];
                    purpose: string;
                    notes: string;
                    status: string;
                    sent_at: string;
                    created_by: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    transmittal_no: string;
                    subject: string;
                    from_org: string;
                    from_person: string;
                    to_org: string;
                    to_person: string;
                    cc_list?: string[];
                    doc_ids?: number[];
                    purpose?: string;
                    notes?: string;
                    status?: string;
                    sent_at?: string;
                    created_by?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    transmittal_no?: string;
                    subject?: string;
                    from_org?: string;
                    from_person?: string;
                    to_org?: string;
                    to_person?: string;
                    cc_list?: string[];
                    doc_ids?: number[];
                    purpose?: string;
                    notes?: string;
                    status?: string;
                    sent_at?: string;
                    created_by?: string;
                };
                Relationships: [];
            };
            cde_audit_log: {
                Row: {
                    id: string;
                    project_id: string;
                    action: string;
                    actor_name: string;
                    actor_id: string;
                    entity_type: string;
                    entity_id: string;
                    details: any;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    action: string;
                    actor_name: string;
                    actor_id: string;
                    entity_type: string;
                    entity_id: string;
                    details?: any;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    action?: string;
                    actor_name?: string;
                    actor_id?: string;
                    entity_type?: string;
                    entity_id?: string;
                    details?: any;
                    created_at?: string;
                };
                Relationships: [];
            };
            cde_permissions: {
                Row: {
                    id: string;
                    project_id: string;
                    user_id: string;
                    user_name: string;
                    user_role: string;
                    container_access: string[];
                    can_upload: boolean;
                    can_approve: boolean;
                    can_delete: boolean;
                    can_manage: boolean;
                    granted_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_id: string;
                    user_name: string;
                    user_role: string;
                    container_access?: string[];
                    can_upload?: boolean;
                    can_approve?: boolean;
                    can_delete?: boolean;
                    can_manage?: boolean;
                    granted_by?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    user_id?: string;
                    user_name?: string;
                    user_role?: string;
                    container_access?: string[];
                    can_upload?: boolean;
                    can_approve?: boolean;
                    can_delete?: boolean;
                    can_manage?: boolean;
                    granted_by?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            dashboard_widget_config: {
                Row: {
                    id: string;
                    role: string;
                    widget_id: string;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    role: string;
                    widget_id: string;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    role?: string;
                    widget_id?: string;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            sidebar_module_config: {
                Row: {
                    id: string;
                    module_key: string;
                    is_visible: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    module_key: string;
                    is_visible?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    module_key?: string;
                    is_visible?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            regulation_bookmarks: {
                Row: {
                    id: string;
                    user_id: string;
                    document_id: string;
                    article_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    document_id: string;
                    article_id: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    document_id?: string;
                    article_id?: string;
                    created_at?: string;
                };
                Relationships: [];
            };
            regulation_documents: {
                Row: {
                    id: string;
                    code: string;
                    title: string;
                    description: string;
                    date: string;
                    effective_date: string | null;
                    status: 'active' | 'draft' | 'archived';
                    pdf_url: string | null;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    code: string;
                    title: string;
                    description?: string;
                    date?: string;
                    effective_date?: string | null;
                    status?: 'active' | 'draft' | 'archived';
                    pdf_url?: string | null;
                    sort_order?: number;
                };
                Update: {
                    id?: string;
                    code?: string;
                    title?: string;
                    description?: string;
                    date?: string;
                    effective_date?: string | null;
                    status?: 'active' | 'draft' | 'archived';
                    pdf_url?: string | null;
                    sort_order?: number;
                };
                Relationships: [];
            };
            regulation_chapters: {
                Row: {
                    id: string;
                    document_id: string;
                    code: string;
                    title: string;
                    icon: string | null;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    document_id: string;
                    code: string;
                    title: string;
                    icon?: string | null;
                    sort_order?: number;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    code?: string;
                    title?: string;
                    icon?: string | null;
                    sort_order?: number;
                };
                Relationships: [];
            };
            regulation_articles: {
                Row: {
                    id: string;
                    chapter_id: string;
                    code: string;
                    title: string;
                    content: string;
                    content_type: 'text' | 'markdown' | 'component';
                    component_key: string | null;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    chapter_id: string;
                    code: string;
                    title: string;
                    content?: string;
                    content_type?: 'text' | 'markdown' | 'component';
                    component_key?: string | null;
                    sort_order?: number;
                };
                Update: {
                    id?: string;
                    chapter_id?: string;
                    code?: string;
                    title?: string;
                    content?: string;
                    content_type?: 'text' | 'markdown' | 'component';
                    component_key?: string | null;
                    sort_order?: number;
                };
                Relationships: [];
            };
        };
    };
}
