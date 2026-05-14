import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Info, FileText, Gavel, CheckSquare, Zap, 
  Users, Clock, Layers, AlertCircle, 
  Play, Send, CheckCircle, XCircle, FolderOpen, Upload, UserPlus,
  ThumbsUp, ThumbsDown, History, File, Trash2, Download
} from 'lucide-react';
import { WorkflowTemplateService as WorkflowService } from '@/services/WorkflowTemplateService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface WorkflowStepDetailPanelProps {
  nodeId: string;
  instanceId?: string;
  projectId: string;
  staticNode?: any;
}

export const WorkflowStepDetailPanel: React.FC<WorkflowStepDetailPanelProps> = ({
  nodeId,
  instanceId,
  projectId,
  staticNode
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'cde' | 'history'>('overview');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Node & Task details
  const { data: dbDetails, isLoading } = useQuery({
    queryKey: ['workflow-task-detail', instanceId, nodeId],
    queryFn: async () => {
      if (!instanceId) return null;
      const { instance, nodes, tasks } = await (WorkflowService as any).getInstanceDetails(instanceId);
      const node = nodes.find(n => n.id === nodeId);
      const task = tasks.find(t => t.node_id === nodeId);
      return { instance, node, task };
    },
    enabled: !!instanceId && !!nodeId
  });

  const details = dbDetails || { node: staticNode, task: undefined, instance: undefined };

  // 2. Fetch Project Members (Chỉ khi có projectId)
  const { data: members } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await (supabase as any)
        .from('project_members')
        .select(`
          employee_id,
          employee:employees(id, full_name, email, department)
        `)
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  });

  // 3. Fetch CDE Documents
  const { data: cdeDocuments } = useQuery({
    queryKey: ['workflow-task-cde', details?.task?.cde_folder_id],
    queryFn: async () => {
      if (!details?.task?.cde_folder_id) return [];
      const { data, error } = await (supabase as any)
        .from('documents')
        .select('*')
        .eq('folder_id', details.task.cde_folder_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!details?.task?.cde_folder_id
  });

  // 4. Fetch Audit Timeline
  const { data: timeline } = useQuery({
    queryKey: ['workflow-timeline', instanceId],
    queryFn: () => instanceId ? (WorkflowService as any).getInstanceTimeline(instanceId) : Promise.resolve([]),
    enabled: activeTab === 'history' && !!instanceId
  });

  // ─── Mutations ─────────────────────────────────────────

  const startTaskMutation = useMutation({
    mutationFn: async () => {
      if (!details?.node || !details?.instance) return;
      const taskTitle = details.node.name || 'Nhiệm vụ';
      const currentUser = selectedAssignee || user?.id || 'system';
      const folderId = await (WorkflowService as any).getOrCreateTaskFolder(
        instanceId!, nodeId, taskTitle, currentUser
      );
      if (details?.task?.id) {
        await (WorkflowService as any).startTask(details.task.id, currentUser, folderId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-task-detail'] });
      addToast({ title: 'Thành công', message: 'Đã bắt đầu thực hiện', type: 'success' });
    }
  });

  const submitTaskMutation = useMutation({
    mutationFn: async () => {
      if (details?.task?.id) {
        await (WorkflowService as any).submitTask(details.task.id, notes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-task-detail'] });
      addToast({ title: 'Thành công', message: 'Đã nộp hồ sơ thành công', type: 'success' });
    }
  });

  const approvalMutation = useMutation({
    mutationFn: async (action: 'approve' | 'reject') => {
      if (!details?.task?.id) return;
      await (WorkflowService as any).processApproval(
        details.task.id, action, approvalComment, user?.id
      );
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-task-detail'] });
      addToast({ title: 'Thành công', message: action === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối' });
    }
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !details?.task?.cde_folder_id) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const filePath = `cde/${projectId}/${details.task.cde_folder_id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('documents').upload(filePath, file);
        if (uploadErr) throw uploadErr;
        await (supabase as any).from('documents').insert({
          folder_id: details.task.cde_folder_id,
          doc_name: file.name,
          url: filePath,
          size: file.size.toString(),
          uploaded_by: user?.id
        });
      }
      queryClient.invalidateQueries({ queryKey: ['workflow-task-cde'] });
    } catch (err: any) {
      addToast({ title: 'Lỗi', message: err.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────

  if (instanceId && isLoading) return <div className="p-4">Loading...</div>;
  if (!details?.node) return <div className="p-4">Không tìm thấy thông tin bước</div>;

  const { node, task, instance } = details;
  const isApprovalNode = node.type === 'approval';
  const meta = (node.metadata as any) || {};

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-800">
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isApprovalNode ? 'bg-violet-600' : 'bg-primary-600'
          }`}>
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold dark:text-slate-100">{node.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-gray-500">{(instance as any)?.workflow?.name || 'Workflow Template'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">{task?.status || 'Active'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6">
          {[
            { id: 'overview', label: 'Thông tin', icon: Info },
            { id: 'actions', label: 'Thực hiện', icon: Zap },
            { id: 'cde', label: 'Hồ sơ CDE', icon: FolderOpen },
            { id: 'history', label: 'Lịch sử', icon: History },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-all font-bold text-sm ${
                activeTab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
              }`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <Section title="Mô tả công việc & SOP" icon={FileText}>
              {meta.guidelines || meta.description ? (
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none 
                  prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-slate-100
                  prose-p:text-slate-600 dark:prose-p:text-slate-300
                  prose-a:text-primary-600 prose-li:my-0.5">
                  {(meta.guidelines || meta.description).split('\n').map((line: string, idx: number) => {
                      let htmlLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      htmlLine = htmlLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
                      if (htmlLine.startsWith('- ')) return <li key={idx} className="ml-4 list-disc marker:text-primary-400" dangerouslySetInnerHTML={{ __html: htmlLine.substring(2) }} />;
                      if (htmlLine.startsWith('  - ')) return <li key={idx} className="ml-8 list-[circle] marker:text-slate-400" dangerouslySetInnerHTML={{ __html: htmlLine.substring(4) }} />;
                      return <p key={idx} className="mb-2 text-sm" dangerouslySetInnerHTML={{ __html: htmlLine }} />;
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-slate-300">Chưa có mô tả.</p>
              )}
            </Section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Căn cứ pháp lý & Quy định" icon={Gavel} color="amber">
                <p className="text-sm font-medium text-warning-900 dark:text-warning-200">{meta.legal_basis || 'Thực hiện theo quy định hiện hành'}</p>
              </Section>
              <Section title="Cam kết thời gian (SLA)" icon={Clock} color="blue">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-blue-700 dark:text-blue-400">{node.sla_formula || 'N/A'}</span>
                  <span className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">ngày làm việc</span>
                </div>
              </Section>
            </div>
            
            {meta.sub_tasks && meta.sub_tasks.length > 0 && (
              <Section title="Chi tiết các công việc thành phần" icon={CheckSquare} color="emerald">
                <ul className="space-y-3">
                  {meta.sub_tasks.map((st: any) => (
                    <li key={st.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate- rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div className="mt-0.5"><CheckCircle size={16} className="text-slate-300 dark:text-slate-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">{st.name}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Users size={12} className="text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{st.assignee_role || node.assignee_role}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Sản phẩm đầu ra (Deliverables)" icon={FileText} color="purple">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300">{meta.output || 'Chưa định nghĩa'}</p>
            </Section>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="p-4 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100">
             <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="font-bold mb-2">Thông tin Nghiệp vụ</h3>
             <p className="text-sm text-slate-500">Mục thực hiện này chỉ khả dụng khi quy trình được khởi chạy trong dự án cụ thể.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; color?: string }> = ({ 
  title, icon: Icon, children, color = 'gray' 
}) => {
  const colorMap: any = {
    gray: 'bg-gray-100 text-gray-500',
    amber: 'bg-warning-100 text-warning-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600'
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${colorMap[color]}`}><Icon size={14} /></div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">{children}</div>
    </div>
  );
};

export default WorkflowStepDetailPanel;
