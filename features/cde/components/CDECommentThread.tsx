import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Reply, CornerDownRight, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Comment {
    id: string;
    doc_id: number;
    author_id: string;
    author_name: string;
    author_role: string;
    content: string;
    reply_to: string | null;
    created_at: string;
}

interface CDECommentThreadProps {
    docId: number;
    docName: string;
}

const CDECommentThread: React.FC<CDECommentThreadProps> = ({ docId, docName }) => {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch comments
    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from('cde_comments')
                .select('*')
                .eq('doc_id', docId)
                .order('created_at', { ascending: true });
            if (data) setComments(data);
        })();
    }, [docId]);

    const handleSubmit = async () => {
        if (!newComment.trim() || !currentUser) return;
        setIsLoading(true);
        const { data, error } = await supabase.from('cde_comments').insert({
            doc_id: docId,
            author_id: currentUser.EmployeeID,
            author_name: currentUser.FullName,
            author_role: currentUser.Position || currentUser.Role,
            content: newComment.trim(),
            reply_to: replyTo?.id || null,
        }).select('*').single();

        if (data) {
            setComments(prev => [...prev, data]);
            setNewComment('');
            setReplyTo(null);
        }
        setIsLoading(false);
    };

    // Group into threads
    const topLevel = comments.filter(c => !c.reply_to);
    const repliesOf = (parentId: string) => comments.filter(c => c.reply_to === parentId);

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / 1000;
        if (diff < 60) return 'vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)}p trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const CommentBubble = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
        <div className={`flex gap-2.5 ${isReply ? 'ml-10' : ''} group`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-white ${isReply ? 'bg-gray-400' : 'bg-primary-600'}`}>
                {comment.author_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-100">{comment.author_name}</span>
                    {comment.author_role && (
                        <span className="text-[9px] font-semibold text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{comment.author_role}</span>
                    )}
                    <span className="text-[9px] text-gray-400 dark:text-slate-400">{formatTime(comment.created_at)}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                {!isReply && (
                    <button
                        onClick={() => { setReplyTo(comment); inputRef.current?.focus(); }}
                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mt-1.5 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Reply className="w-3 h-3" /> Trả lời
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Thảo luận
                </h4>
                {comments.length > 0 && (
                    <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{comments.length}</span>
                )}
            </div>

            {/* Comment List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-400 text-center py-4 italic">Chưa có thảo luận</p>
                ) : topLevel.map(comment => (
                    <div key={comment.id} className="space-y-2">
                        <CommentBubble comment={comment} />
                        {repliesOf(comment.id).map(reply => (
                            <div key={reply.id}>
                                <CommentBubble comment={reply} isReply />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Reply indicator */}
            {replyTo && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 text-[10px]">
                    <CornerDownRight className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-500 dark:text-slate-400">Trả lời <span className="font-bold text-gray-700 dark:text-slate-200">{replyTo.author_name}</span></span>
                    <button onClick={() => setReplyTo(null)} className="ml-auto text-gray-400 hover:text-red-500 text-xs font-bold">✕</button>
                </div>
            )}

            {/* Input */}
            <div className="flex gap-2 items-end">
                <textarea
                    ref={inputRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                    placeholder="Viết nhận xét..."
                    rows={1}
                    className="flex-1 resize-none text-xs bg-bg-subtle dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 dark:text-slate-200 dark:placeholder-slate-400 transition-all"
                />
                <button
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || isLoading}
                    className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-sm"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default CDECommentThread;
