import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, User, Sparkles, Database, RefreshCw, FileText, Presentation, FileSpreadsheet, Download } from 'lucide-react';
import { sendMessageToGemini, ChatMessage, isAIAvailable, checkCompliance } from '../../services/aiService';
import { QUICK_SUGGESTIONS } from '../../services/ai/aiTools';
import { docxGenerator } from '../../services/ai/docxGenerator';
import { ProjectService } from '../../services/ProjectService';
import { TaskService } from '../../services/TaskService';

const CHAT_STORAGE_KEY = 'qlda_ai_chat_history';
const MAX_STORED_MESSAGES = 50;

function loadChatHistory(): ChatMessage[] {
    try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored) as ChatMessage[];
        return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
        return [];
    }
}

function saveChatHistory(messages: ChatMessage[]) {
    try {
        const toStore = messages.slice(-MAX_STORED_MESSAGES);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch { /* ignore quota errors */ }
}

// Simple markdown-ish renderer for AI responses
function renderMessageText(text: string, onActionClick?: (action: string) => void) {
    // Split by lines and process
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listKey = 0;

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-0.5 my-1">
                    {listItems.map((item, i) => (
                        <li key={i} className="text-sm">{formatInline(item, onActionClick)}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Bullet list
        if (/^[\-\*•]\s+/.test(line)) {
            listItems.push(line.replace(/^[\-\*•]\s+/, ''));
            continue;
        }

        // Numbered list
        if (/^\d+[\.\)]\s+/.test(line)) {
            listItems.push(line.replace(/^\d+[\.\)]\s+/, ''));
            continue;
        }

        flushList();

        // Headers
        if (line.startsWith('### ')) {
            elements.push(<h4 key={i} className="font-bold text-xs mt-2 mb-1">{line.replace('### ', '')}</h4>);
        } else if (line.startsWith('## ')) {
            elements.push(<h3 key={i} className="font-bold text-sm mt-2 mb-1">{line.replace('## ', '')}</h3>);
        } else if (line.startsWith('# ')) {
            elements.push(<h2 key={i} className="font-bold text-sm mt-2 mb-1">{line.replace('# ', '')}</h2>);
        } else if (line.trim() === '') {
            elements.push(<div key={i} className="h-1" />);
        } else {
            elements.push(<p key={i} className="text-sm my-0.5">{formatInline(line, onActionClick)}</p>);
        }
    }
    flushList();

    return <div className="space-y-0.5">{elements}</div>;
}

// Format inline markdown: **bold**, *italic*, `code`, [label](action:name)
function formatInline(text: string, onActionClick?: (action: string) => void): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Code
        const codeMatch = remaining.match(/`(.+?)`/);
        // Action link
        const actionMatch = remaining.match(/\[([^\]]+)\]\(action:([a-zA-Z0-9_\?=&]+)\)/);

        // Find the one that occurs first
        let firstMatch: { index: number; length: number; render: () => React.ReactNode } | null = null;

        if (boldMatch && boldMatch.index !== undefined) {
            firstMatch = {
                index: boldMatch.index,
                length: boldMatch[0].length,
                render: () => <strong key={key++} className="font-semibold">{boldMatch[1]}</strong>
            };
        }

        if (codeMatch && codeMatch.index !== undefined && (firstMatch === null || codeMatch.index < firstMatch.index)) {
            firstMatch = {
                index: codeMatch.index,
                length: codeMatch[0].length,
                render: () => (
                    <code key={key++} className="bg-slate-200 dark:bg-slate-600 px-1 rounded text-xs font-mono">
                        {codeMatch[1]}
                    </code>
                )
            };
        }

        if (actionMatch && actionMatch.index !== undefined && (firstMatch === null || actionMatch.index < firstMatch.index)) {
            firstMatch = {
                index: actionMatch.index,
                length: actionMatch[0].length,
                render: () => {
                    const label = actionMatch[1];
                    const action = actionMatch[2];
                    const isWord = action.startsWith('download_word');
                    const isPptx = action.startsWith('download_pptx');
                    
                    const icon = isWord 
                        ? <FileText size={12} className="inline mr-1" /> 
                        : <Presentation size={12} className="inline mr-1" />;
                    
                    const bgClass = isWord 
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800' 
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800';

                    return (
                        <button
                            key={key++}
                            onClick={() => onActionClick?.(action)}
                            className={`inline-flex items-center justify-center px-2 py-0.5 mx-1 rounded border font-semibold text-xs transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer align-middle ${bgClass}`}
                        >
                            {icon}
                            {label}
                        </button>
                    );
                }
            };
        }

        if (firstMatch) {
            if (firstMatch.index > 0) parts.push(remaining.slice(0, firstMatch.index));
            parts.push(firstMatch.render());
            remaining = remaining.slice(firstMatch.index + firstMatch.length);
        } else {
            parts.push(remaining);
            break;
        }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export const AIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const match = window.location.pathname.match(/\/projects\/([^\/]+)/);
    const currentProjectId = match ? decodeURIComponent(match[1]) : null;

    const handleActionClick = async (action: string) => {
        const parts = action.split('?');
        const actionType = parts[0];
        const params = new URLSearchParams(parts[1] || '');
        const projectId = params.get('projectId') || currentProjectId;

        if (!projectId) {
            alert('Không tìm thấy mã dự án để thực hiện hành động này.');
            return;
        }

        setIsLoading(true);
        setActionMessage('Đang lấy dữ liệu chi tiết dự án...');
        try {
            const project = await ProjectService.getById(projectId);
            if (!project) {
                alert('Không thể tìm thấy thông tin dự án trong cơ sở dữ liệu.');
                return;
            }

            setActionMessage('Đang lấy danh sách công việc và kiểm tra tuân thủ...');
            const [tasks, compliance] = await Promise.all([
                TaskService.getProjectTasks(projectId),
                checkCompliance(project)
            ]);

            const payload = {
                ...project,
                projectCode: project.ProjectNumber || project.ProjectID,
                investor: project.InvestorName,
                totalInvestment: project.TotalInvestment,
                disbursedAmount: project.DisbursedAmount || 0,
                tasks,
                compliance
            };

            if (actionType === 'download_word') {
                setActionMessage('Đang sinh báo cáo Word (NĐ 30/2020)...');
                await docxGenerator.generateWordReport(project.ProjectName, payload);
            } else if (actionType === 'download_pptx') {
                setActionMessage('Đang thiết kế slide trình chiếu (Midnight Gold)...');
                await docxGenerator.generatePowerPoint(project.ProjectName, payload);
            }
        } catch (err: any) {
            console.error('Document generation failed:', err);
            alert(`Lỗi xuất tài liệu: ${err.message || err}`);
        } finally {
            setIsLoading(false);
            setActionMessage(null);
        }
    };

    const WELCOME_MSG: ChatMessage = {
        id: 'welcome',
        text: 'Xin chào! Tôi là trợ lý ảo QLDA, được tích hợp AI thông minh. Tôi có thể:\n\n- 📊 Tra cứu dữ liệu dự án, hợp đồng, thanh toán **trực tiếp từ hệ thống**\n- ⚠️ Phân tích rủi ro và cảnh báo\n- 📅 Nhắc deadline, HĐ sắp hết hạn\n- 📋 Tư vấn quy trình, quy định pháp luật\n- 📝 Hỗ trợ soạn thảo văn bản\n\nHãy thử hỏi tôi!',
        sender: 'ai',
        timestamp: new Date(),
    };

    const storedHistory = loadChatHistory();
    const [messages, setMessages] = useState<ChatMessage[]>(
        storedHistory.length > 0 ? storedHistory : [WELCOME_MSG]
    );
    const [showSuggestions, setShowSuggestions] = useState(storedHistory.length === 0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Persist chat history to localStorage (skip welcome-only state)
    useEffect(() => {
        if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome')) {
            saveChatHistory(messages);
        }
    }, [messages]);

    const handleSend = async (text?: string) => {
        const msgText = text || input.trim();
        if (!msgText) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: msgText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setIsQuerying(true);
        setShowSuggestions(false);

        try {
            const TIMEOUT_MS = 30_000;
            const responseText = await Promise.race([
                sendMessageToGemini(messages, msgText, currentProjectId),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Hết thời gian chờ (30s). Vui lòng thử lại.')), TIMEOUT_MS)
                ),
            ]);
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chatbot Error:', error);
            let errorMessage = 'Xin lỗi, tôi đang gặp sự cố.';
            if (error instanceof Error) {
                if (error.message.includes('API_KEY')) {
                    errorMessage = 'Lỗi kết nối AI. Vui lòng kiểm tra cấu hình Edge Function hoặc thử lại sau.';
                } else {
                    errorMessage += ` (${error.message})`;
                }
            }

            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: errorMessage,
                sender: 'ai',
                timestamp: new Date(),
                isError: true,
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            setIsQuerying(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        setMessages([{ ...WELCOME_MSG, id: Date.now().toString(), timestamp: new Date() }]);
        setShowSuggestions(true);
    };

    const aiAvailable = isAIAvailable();

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center gap-2 group hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #1c456c 0%, #4a90e2 100%)', boxShadow: '0 4px 20px rgba(74, 144, 226, 0.4)' }}
            >
                <div className="relative">
                    <Sparkles size={24} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-400"></span>
                    </span>
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
                    Trợ lý AI
                </span>
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 transition-all duration-300 flex flex-col border border-slate-200 dark:border-slate-700
            ${isExpanded ? 'w-[640px] h-[80vh]' : 'w-[400px] h-[540px]'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 text-white rounded-t-xl" style={{ background: 'linear-gradient(135deg, #1c456c 0%, #4a90e2 100%)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <span className="font-semibold text-sm">Trợ lý AI QLDA</span>
                        <div className="flex items-center gap-1 text-[10px] text-blue-100">
                            <Database size={10} />
                            <span>Kết nối dữ liệu thực</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClearChat}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Xóa lịch sử chat"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Đóng"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {currentProjectId && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] transition-all duration-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-blue-500 animate-pulse" />
                        Xuất nhanh:
                    </span>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => handleActionClick('download_word')}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 dark:bg-slate-750 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded font-semibold shadow-sm hover:border-blue-350 transition-all duration-205 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileText size={11} />
                            Word
                        </button>
                        <button
                            onClick={() => handleActionClick('download_pptx')}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-amber-50 dark:bg-slate-750 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 rounded font-semibold shadow-sm hover:border-amber-350 transition-all duration-205 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Presentation size={11} />
                            Slide
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-800 dark:bg-slate-900">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 
                                ${msg.sender === 'user' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-emerald-100 dark:bg-emerald-900'}`}
                            >
                                {msg.sender === 'user' ? (
                                    <User size={14} className="text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <Bot size={14} className="text-emerald-600 dark:text-emerald-400" />
                                )}
                            </div>
                            <div
                                className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-primary-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                                    } ${msg.isError ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : ''}`}
                            >
                                {msg.sender === 'ai' ? renderMessageText(msg.text, handleActionClick) : msg.text}
                                <div className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                                <Bot size={14} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                                    </div>
                                    {isQuerying && (
                                        <span className="text-[10px] text-blue-500 dark:text-blue-400 flex items-center gap-1">
                                            <Database size={10} className="animate-pulse" />
                                            Đang truy vấn dữ liệu...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick suggestions */}
                {showSuggestions && !isLoading && messages.length <= 2 && (
                    <div className="space-y-2 pt-2">
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">💡 Gợi ý câu hỏi:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(s.prompt)}
                                    className="text-[11px] px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
                {actionMessage && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl mb-2 border border-blue-100 dark:border-blue-800 animate-pulse font-medium">
                        <RefreshCw size={12} className="animate-spin text-blue-500" />
                        {actionMessage}
                    </div>
                )}
                {!aiAvailable && (
                    <div className="text-[11px] text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg mb-2">
                        ⚠️ Chưa cấu hình Gemini API Key
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Hỏi về dự án, hợp đồng, giải ngân..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-slate-50 dark:bg-slate-800 dark:disabled:bg-slate-700 bg-white dark:bg-slate-800 dark:text-white placeholder-slate-400"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #357abd 0%, #4a90e2 100%)' }}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400">
                        Powered by Google Gemini AI — Kết nối dữ liệu thực
                    </span>
                </div>
            </div>
        </div>
    );
};

