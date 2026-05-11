import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskService } from '../../../services/TaskService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MessageSquare, Clock, Send, Paperclip } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface TaskCollaborationProps {
    taskId: string;
    type: 'comments' | 'history';
}

export const TaskCollaboration: React.FC<TaskCollaborationProps> = ({ taskId, type }) => {
    const [commentContent, setCommentContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Queries
    const { data: comments = [], refetch: refetchComments } = useQuery<any[]>({
        queryKey: ['task_comments', taskId],
        queryFn: () => TaskService.getTaskComments(taskId),
        enabled: type === 'comments'
    });

    const { data: activities = [] } = useQuery<any[]>({
        queryKey: ['task_activities', taskId],
        queryFn: () => TaskService.getTaskActivities(taskId),
        enabled: type === 'history'
    });

    const handleSubmitComment = async () => {
        if (!commentContent.trim() || commentContent === '<p><br></p>') return;
        setIsSubmitting(true);
        try {
            await TaskService.addComment(taskId, commentContent);
            setCommentContent('');
            refetchComments();
        } catch (error) {
            console.error('Error adding comment', error);
            alert('Lỗi thêm bình luận!');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (type === 'comments') {
        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 relative">
                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!</p>
                        </div>
                    ) : (
                        comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shrink-0 flex items-center justify-center text-white font-bold shadow-sm">
                                    {comment.user?.raw_user_meta_data?.full_name?.charAt(0) || comment.user?.email?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                {comment.user?.raw_user_meta_data?.full_name || comment.user?.email || 'Unknown User'}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>
                                        {/* Render HTML content safely since it comes from our editor */}
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: comment.content }} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Comment Input */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 transition-all bg-white dark:bg-slate-900">
                        <ReactQuill
                            theme="snow"
                            value={commentContent}
                            onChange={setCommentContent}
                            placeholder="Nhập nội dung thảo luận..."
                            modules={{
                                toolbar: [
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['link', 'clean']
                                ],
                            }}
                            className="bg-transparent [&_.ql-editor]:min-h-[100px] [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none"
                        />
                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleSubmitComment}
                                disabled={isSubmitting || !commentContent.trim() || commentContent === '<p><br></p>'}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all"
                            >
                                {isSubmitting ? 'Đang gửi...' : (
                                    <>Gửi <Send className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'history') {
        return (
            <div className="p-4 md:p-6 h-full bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Nhật ký hoạt động
                </h3>
                
                {activities.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <p>Chưa có thay đổi nào được ghi lại.</p>
                    </div>
                ) : (
                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
                        {activities.map((activity: any) => (
                            <div key={activity.id} className="relative flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 z-10 text-xs font-bold text-slate-500">
                                    {activity.user?.raw_user_meta_data?.full_name?.charAt(0) || activity.user?.email?.charAt(0) || 'S'}
                                </div>
                                <div className="flex-1 pt-1">
                                    <p className="text-sm text-slate-800 dark:text-slate-200">
                                        <span className="font-bold">{activity.user?.raw_user_meta_data?.full_name || activity.user?.email || 'Hệ thống'}</span>{' '}
                                        {formatActionType(activity.action_type)}{' '}
                                        <span className="font-medium text-slate-600 dark:text-slate-400">
                                            {formatActionValue(activity.action_type, activity.new_value)}
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: vi })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
};

// Helpers for Activity formatting
const formatActionType = (type: string) => {
    switch (type) {
        case 'status_changed': return 'đã chuyển trạng thái thành';
        case 'assignee_changed': return 'đã đổi người thực hiện thành';
        case 'task_created': return 'đã tạo công việc';
        default: return 'đã thay đổi';
    }
};

const formatActionValue = (type: string, value: any) => {
    if (!value) return '';
    if (type === 'status_changed') {
        switch (value) {
            case 'todo': return 'Cần làm';
            case 'in_progress': return 'Đang thực hiện';
            case 'review': return 'Chờ duyệt';
            case 'done': return 'Hoàn thành';
            default: return value;
        }
    }
    return value;
};
