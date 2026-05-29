import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Bot, User, Loader2, X, Maximize2, Minimize2, Paperclip } from 'lucide-react';
import { bimAgentService } from '../../services/bimAgentService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    results?: Array<{ type: string; content: any }>;
}

interface BIMAgentChatProps {
    onClose?: () => void;
    isDark?: boolean;
    embedded?: boolean;
    selectedElement?: any;
}

export const BIMAgentChat: React.FC<BIMAgentChatProps> = ({ onClose, isDark = false, embedded = false, selectedElement }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: 'Xin chào! Tôi là trợ lý AI phân tích BIM. Bạn có thể hỏi tôi các câu hỏi về mô hình, yêu cầu thống kê khối lượng, hoặc tạo các bảng dữ liệu từ mô hình IFC.'
            }]);
        }
    }, [messages.length]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendQuery = async () => {
        if (!input.trim() || loading) return;

        let contextualInput = input;
        if (selectedElement) {
            // Include context about the currently selected element
            contextualInput = `[Context: The user has selected a 3D element in the viewer. 
Element Name: ${selectedElement.name}
IFC Type: ${selectedElement.type}
ExpressID: ${selectedElement.id}
Properties: ${JSON.stringify(selectedElement.propertySets)}]\n\nQuestion: ${input}`;
        }

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const data = await bimAgentService.query(contextualInput);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.success ? (data.results?.length > 0 ? '' : 'Đã thực hiện xong yêu cầu.') : (data.error || 'Đã xảy ra lỗi khi xử lý yêu cầu.'),
                results: data.results,
            }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Lỗi kết nối tới BIM Agent API: ${err.message}`,
            }]);
        }
        setLoading(false);
    };

    const uploadFile = async (file: File) => {
        try {
            setMessages(prev => [...prev, { role: 'user', content: `[Đã tải lên tệp: ${file.name}]` }]);
            setLoading(true);
            await bimAgentService.upload(file);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Đã đưa tệp "${file.name}" vào cơ sở dữ liệu tri thức của AI. Bạn có thể đặt câu hỏi về nội dung tệp này.`,
            }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Tải lên thất bại: ${err.message}`,
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex flex-col h-full transition-all duration-300 ${isExpanded && embedded ? 'fixed inset-4 z-50 rounded-xl shadow-2xl' : 'w-full h-full'}`}
             style={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', border: embedded ? `1px solid ${isDark ? '#334155' : '#e2e8f0'}` : 'none' }}>
            
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-slate-800 bg-slate-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>BIM AI Agent</h3>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Hỏi đáp & Phân tích mô hình</p>
                    </div>
                </div>
                {embedded && (
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsExpanded(!isExpanded)} className={`p-1.5 rounded-md hover:bg-slate-50 text-slate-400 transition-colors`}>
                            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        {onClose && (
                            <button onClick={onClose} className={`p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors`}>
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Bot className="w-4 h-4 text-blue-500" />
                            </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' 
                                : isDark 
                                    ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50' 
                                    : 'bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-200/50'
                        }`}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            
                            {/* Render Results (Tables, HTML, etc) */}
                            {msg.results && msg.results.length > 0 && (
                                <div className="mt-3 space-y-3">
                                    {msg.results.map((r, j) => {
                                        // Detect if content has script tags or is a full HTML page (like Plotly output)
                                        const isInteractive = r.type === 'html' && (r.content.includes('<script') || r.content.includes('plotly.js'));
                                        
                                        return (
                                            <div key={j} className={`rounded-lg overflow-hidden ${isDark ? 'bg-slate-50' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                                {r.type === 'html' && isInteractive && (
                                                    <div className="w-full h-[400px]">
                                                        <iframe 
                                                            srcDoc={r.content} 
                                                            className="w-full h-full border-0" 
                                                            sandbox="allow-scripts"
                                                            title={`AI Result ${j}`}
                                                        />
                                                    </div>
                                                )}
                                                {r.type === 'html' && !isInteractive && (
                                                    <div className="p-3 prose prose-sm dark:prose-invert max-w-none overflow-x-auto" dangerouslySetInnerHTML={{ __html: r.content }} />
                                                )}
                                                {r.type === 'table' && (
                                                    <div className="overflow-x-auto">
                                                        <pre className="text-xs p-3">{JSON.stringify(r.content, null, 2)}</pre>
                                                    </div>
                                                )}
                                                {r.type === 'text' && <p className="p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap">{r.content}</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-txt-muted" />
                            </div>
                        )}
                    </div>
                ))}
                
                {loading && (
                    <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Bot className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className={`rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Đang phân tích...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-3 border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                <div className={`flex items-end gap-2 rounded-xl border p-1 transition-colors ${isDark ? 'bg-slate-950 border-slate-700 focus-within:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus-within:border-blue-400'}`}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden"
                        accept=".ifc,.pdf,.json,.txt,.csv"
                        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`shrink-0 p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-200'}`}
                        title="Tải lên tài liệu tham khảo (IFC/PDF/TXT)"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    
                    <textarea 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendQuery();
                            }
                        }}
                        placeholder="Hỏi AI về mô hình BIM (vd: Thống kê số lượng cửa sổ...)"
                        className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent py-2.5 px-2 text-sm focus:outline-none outline-none"
                        style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
                        rows={1}
                    />
                    
                    <button 
                        onClick={sendQuery} 
                        disabled={loading || !input.trim()}
                        className={`shrink-0 p-2 mb-0.5 rounded-lg transition-all ${
                            loading || !input.trim() 
                                ? (isDark ? 'bg-slate-800 text-slate-600' : 'bg-gray-200 text-gray-400') 
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm hover:-translate-y-0.5'
                        }`}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};
