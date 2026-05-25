import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, X, Building2, Users, FileText, Briefcase, ArrowRight, Clock, TrendingUp,
    CheckSquare, Package, BookOpen, GitBranch, Scale
} from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useContractors } from '../../hooks/useContractors';
import { useContracts } from '../../hooks/useContracts';
import { useEmployees } from '../../hooks/useEmployees';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { useAllTasks } from '../../hooks/useWorkflowTasks';
import { usePublicAssets } from '../../hooks/usePublicAssets';
import { regulationsData } from '../../features/regulations/data/regulationsData';
import { supabase } from '../../lib/supabase';
import { ProjectStatus } from '../../types';

// Helper to remove Vietnamese accents for insensitive search
const removeAccents = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

const getWorkflowCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
        project: 'Dự án',
        implementation: 'Thực hiện DA',
        investment: 'Đầu tư', 
        procurement: 'Đấu thầu',
        finance: 'Tài chính',
        hr: 'Nhân sự',
        document: 'Văn bản',
        asset: 'Tài sản',
        other: 'Nghiệp vụ'
    };
    return map[cat] || cat;
};

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: 'project' | 'contractor' | 'contract' | 'employee' | 'package' | 'task' | 'asset' | 'legal_doc' | 'regulation' | 'regulation_article' | 'workflow';
    url: string;
    icon: React.ElementType;
    meta?: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const [activeIndex, setActiveIndex] = useState(0);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
    const [legalDocs, setLegalDocs] = useState<any[]>([]);
    const [legalArticlesResults, setLegalArticlesResults] = useState<any[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const { projects } = useProjects();
    const { contractors } = useContractors();
    const { contracts } = useContracts();
    const { data: employees } = useEmployees();
    const { biddingPackages } = useAllBiddingPackages();
    const { data: allTasks } = useAllTasks();
    const { data: publicAssets } = usePublicAssets();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery(initialQuery);
        }
    }, [isOpen, initialQuery]);

    // Fetch workflows, workflow nodes and legal documents when opened
    useEffect(() => {
        if (isOpen) {
            // Fetch workflows
            supabase.from('workflows').select('id, name, code, description, category')
                .then(({ data }) => {
                    if (data) setWorkflows(data);
                });
            // Fetch workflow nodes
            supabase.from('workflow_nodes').select('id, workflow_id, name, type')
                .then(({ data }) => {
                    if (data) setWorkflowNodes(data);
                });
            // Fetch legal documents
            supabase.from('legal_documents').select('id, code, title, short_title, type, status')
                .then(({ data }) => {
                    if (data) setLegalDocs(data);
                });
        }
    }, [isOpen]);

    // Server-side search for legal articles (deep legal search with debounce)
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setLegalArticlesResults([]);
            return;
        }

        const timer = setTimeout(() => {
            const cleanQ = trimmed.toLowerCase();
            supabase.from('legal_articles')
                .select('id, code, title, content, document_id, document:legal_documents(code, short_title)')
                .or(`title.ilike.%${cleanQ}%,code.ilike.%${cleanQ}%,content.ilike.%${cleanQ}%`)
                .limit(5)
                .then(({ data, error }) => {
                    if (error) {
                        // Fallback to full text search if ilike or fails
                        supabase.from('legal_articles')
                            .select('id, code, title, content, document_id, document:legal_documents(code, short_title)')
                            .textSearch('fts', cleanQ, { type: 'websearch', config: 'simple' })
                            .limit(5)
                            .then(({ data: ftsData }) => {
                                if (ftsData) setLegalArticlesResults(ftsData);
                            });
                    } else if (data) {
                        setLegalArticlesResults(data);
                    }
                });
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && results[activeIndex]) {
                handleSelect(results[activeIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex, query, workflows, workflowNodes, legalDocs, legalArticlesResults, projects, contractors, contracts, employees, biddingPackages, allTasks, publicAssets]);

    const results = useMemo<SearchResult[]>(() => {
        if (!query.trim()) return [];

        const qClean = removeAccents(query.toLowerCase().trim());
        const matches: SearchResult[] = [];

        // 1. Search Projects
        (projects || [])
            .filter(p => removeAccents(p.ProjectName.toLowerCase()).includes(qClean) || removeAccents(p.ProjectID.toLowerCase()).includes(qClean))
            .slice(0, 3)
            .forEach(p => {
                matches.push({
                    id: p.ProjectID,
                    title: p.ProjectName,
                    subtitle: `Mã: ${p.ProjectID} • Nhóm ${p.GroupCode}`,
                    type: 'project',
                    url: `/projects/${p.ProjectID}`,
                    icon: Building2,
                    meta: p.Status === ProjectStatus.Execution ? 'Đang triển khai' :
                        p.Status === ProjectStatus.Completion ? 'Kết thúc XD' : 'Chuẩn bị DA'
                });
            });

        // 2. Search Contractors
        (contractors || [])
            .filter(c => removeAccents(c.FullName.toLowerCase()).includes(qClean) || removeAccents(c.ContractorID.toLowerCase()).includes(qClean))
            .slice(0, 3)
            .forEach(c => {
                matches.push({
                    id: c.ContractorID,
                    title: c.FullName,
                    subtitle: `MST: ${c.ContractorID}`,
                    type: 'contractor',
                    url: `/contractors/${c.ContractorID}`,
                    icon: Briefcase,
                    meta: c.IsForeign ? 'Nhà thầu nước ngoài' : 'Nhà thầu trong nước'
                });
            });

        // 3. Search Employees
        (employees || [])
            .filter(e => removeAccents(e.FullName.toLowerCase()).includes(qClean) || removeAccents(e.Position.toLowerCase()).includes(qClean))
            .slice(0, 3)
            .forEach(e => {
                matches.push({
                    id: e.EmployeeID,
                    title: e.FullName,
                    subtitle: `${e.Position} • ${e.Department}`,
                    type: 'employee',
                    url: `/employees/${e.EmployeeID}`,
                    icon: Users
                });
            });

        // 4. Search Contracts
        (contracts || [])
            .filter(c => removeAccents(c.ContractID.toLowerCase()).includes(qClean))
            .slice(0, 3)
            .forEach(c => {
                const ct = (contractors || []).find(ct => ct.ContractorID === c.ContractorID);
                matches.push({
                    id: c.ContractID,
                    title: `Hợp đồng ${c.ContractID}`,
                    subtitle: ct?.FullName || 'Nhà thầu',
                    type: 'contract',
                    url: `/contracts/${c.ContractID}`,
                    icon: FileText
                });
            });

        // 5. Search Packages
        (biddingPackages || [])
            .filter(p => removeAccents(p.PackageName.toLowerCase()).includes(qClean) || removeAccents(p.PackageNumber.toLowerCase()).includes(qClean))
            .slice(0, 3)
            .forEach(p => {
                matches.push({
                    id: p.PackageID,
                    title: p.PackageName,
                    subtitle: `Số hiệu: ${p.PackageNumber}`,
                    type: 'package',
                    url: `/projects/${p.ProjectID}/packages/${p.PackageID}`,
                    icon: TrendingUp
                });
            });

        // 6. Search Tasks (Công việc)
        (allTasks || [])
            .filter(t => removeAccents(t.Title.toLowerCase()).includes(qClean) || (t.Description && removeAccents(t.Description.toLowerCase()).includes(qClean)))
            .slice(0, 3)
            .forEach(t => {
                matches.push({
                    id: t.TaskID,
                    title: t.Title,
                    subtitle: `Dự án: ${t.ProjectID} • Hạn: ${t.DueDate || 'Không có'}`,
                    type: 'task',
                    url: `/work-plan?tab=tasks&taskId=${t.TaskID}`,
                    icon: CheckSquare,
                    meta: 'Công việc'
                });
            });

        // 7. Search Public Assets (Tài sản công)
        (publicAssets || [])
            .filter(a => removeAccents(a.asset_name.toLowerCase()).includes(qClean) || removeAccents(a.asset_code.toLowerCase()).includes(qClean) || (a.location && removeAccents(a.location.toLowerCase()).includes(qClean)))
            .slice(0, 3)
            .forEach(a => {
                matches.push({
                    id: a.id,
                    title: a.asset_name,
                    subtitle: `Mã: ${a.asset_code} • Vị trí: ${a.location || 'Chưa rõ'}`,
                    type: 'asset',
                    url: `/tai-san-cong?assetId=${a.id}`,
                    icon: Package,
                    meta: 'Tài sản'
                });
            });

        // 8. Search Legal Documents (Văn bản pháp luật - Cấp văn bản)
        (legalDocs || [])
            .filter(d => removeAccents(d.title.toLowerCase()).includes(qClean) || removeAccents(d.code.toLowerCase()).includes(qClean) || (d.short_title && removeAccents(d.short_title.toLowerCase()).includes(qClean)))
            .slice(0, 3)
            .forEach(d => {
                matches.push({
                    id: d.id,
                    title: d.title,
                    subtitle: `Số hiệu: ${d.code} • Trạng thái: ${d.status === 'hieu-luc' ? 'Còn hiệu lực' : 'Hết hiệu lực'}`,
                    type: 'legal_doc',
                    url: `/legal-documents?docId=${d.id}`,
                    icon: Scale,
                    meta: 'Văn bản PL'
                });
            });

        // 8b. Search Legal Articles (Điều khoản pháp luật - Cấp điều luật từ kết quả fetch server)
        (legalArticlesResults || [])
            .forEach(art => {
                const doc = art.document || {};
                matches.push({
                    id: art.id,
                    title: `${art.code}: ${art.title}`,
                    subtitle: `Văn bản: ${doc.short_title || doc.code || 'Pháp luật'}`,
                    type: 'legal_doc',
                    url: `/legal-documents?docId=${art.document_id}&articleId=${art.id}`,
                    icon: Scale,
                    meta: 'Điều luật'
                });
            });

        // 9. Search Regulations & Articles (Quy chế & Điều khoản quy chế)
        (regulationsData || []).forEach(doc => {
            // Khớp tên quy chế
            if (removeAccents(doc.title.toLowerCase()).includes(qClean) || removeAccents(doc.code.toLowerCase()).includes(qClean)) {
                matches.push({
                    id: doc.id,
                    title: doc.title,
                    subtitle: `Mã: ${doc.code} • Quy chế nội bộ`,
                    type: 'regulation',
                    url: `/regulations?docId=${doc.id}`,
                    icon: BookOpen,
                    meta: 'Quy chế'
                });
            }
            // Khớp các Điều khoản bên trong quy chế
            if (doc.chapters) {
                doc.chapters.forEach(chap => {
                    if (chap.articles) {
                        chap.articles.forEach(art => {
                            const rawContentString = typeof art.content === 'string' ? art.content : '';
                            if (removeAccents(art.title.toLowerCase()).includes(qClean) || removeAccents(art.code.toLowerCase()).includes(qClean) || removeAccents(rawContentString.toLowerCase()).includes(qClean)) {
                                matches.push({
                                    id: art.id,
                                    title: `${art.code}: ${art.title}`,
                                    subtitle: `Thuộc quy chế: ${doc.title}`,
                                    type: 'regulation_article',
                                    url: `/regulations?docId=${doc.id}&chapterId=${chap.id}&articleId=${art.id}`,
                                    icon: BookOpen,
                                    meta: 'Quy chế (Điều)'
                                });
                            }
                        });
                    }
                });
            }
        });

        // 10. Search Workflows & Nodes (Quy trình nghiệp vụ)
        const matchedWorkflows = new Set<string>();

        // A. Khớp trực tiếp trên Workflow
        (workflows || [])
            .filter(w => removeAccents(w.name.toLowerCase()).includes(qClean) || removeAccents(w.code.toLowerCase()).includes(qClean) || (w.description && removeAccents(w.description.toLowerCase()).includes(qClean)))
            .slice(0, 3)
            .forEach(w => {
                matchedWorkflows.add(w.id);
                matches.push({
                    id: w.id,
                    title: w.name,
                    subtitle: `Mã: ${w.code} • Phân loại: ${getWorkflowCategoryLabel(w.category)}`,
                    type: 'workflow',
                    url: `/quy-trinh?workflowId=${w.id}`,
                    icon: GitBranch,
                    meta: 'Quy trình'
                });
            });

        // B. Khớp trên các bước của quy trình (workflow_nodes)
        (workflowNodes || [])
            .filter(node => removeAccents(node.name.toLowerCase()).includes(qClean))
            .forEach(node => {
                if (!matchedWorkflows.has(node.workflow_id)) {
                    const w = (workflows || []).find(work => work.id === node.workflow_id);
                    if (w) {
                        matchedWorkflows.add(w.id);
                        matches.push({
                            id: w.id,
                            title: `${w.name} (Có bước: ${node.name})`,
                            subtitle: `Mã: ${w.code} • Bước: ${node.name} • Phân loại: ${getWorkflowCategoryLabel(w.category)}`,
                            type: 'workflow',
                            url: `/quy-trinh?workflowId=${w.id}`,
                            icon: GitBranch,
                            meta: 'Quy trình'
                        });
                    }
                }
            });

        return matches.slice(0, 10);
    }, [query, projects, contractors, contracts, employees, biddingPackages, allTasks, publicAssets, legalDocs, workflows, workflowNodes, legalArticlesResults]);

    const handleSelect = (result: SearchResult) => {
        navigate(result.url);
        onClose();
        setQuery('');
    };

    const typeLabels: Record<string, string> = {
        project: 'Dự án',
        contractor: 'Nhà thầu',
        contract: 'Hợp đồng',
        employee: 'Nhân sự',
        package: 'Gói thầu',
        task: 'Công việc',
        asset: 'Tài sản',
        legal_doc: 'Văn bản PL',
        regulation: 'Quy chế',
        regulation_article: 'Quy chế (Điều)',
        workflow: 'Quy trình'
    };

    const typeColors: Record<string, string> = {
        project: 'bg-blue-100 text-blue-700',
        contractor: 'bg-purple-100 text-purple-700',
        contract: 'bg-emerald-100 text-emerald-700',
        employee: 'bg-warning-100 text-warning-700',
        package: 'bg-cyan-100 text-cyan-700',
        task: 'bg-orange-100 text-orange-700',
        asset: 'bg-indigo-100 text-indigo-700',
        legal_doc: 'bg-rose-100 text-rose-700',
        regulation: 'bg-teal-100 text-teal-700',
        regulation_article: 'bg-teal-50 text-teal-600',
        workflow: 'bg-sky-100 text-sky-700'
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-slate-700">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                        placeholder="Tìm kiếm dự án, nhân sự, công việc, văn bản pháp luật, quy chế..."
                        className="flex-1 text-gray-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none text-base bg-transparent"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600"
                    >
                        ESC
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {query && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Không tìm thấy kết quả</p>
                            <p className="text-sm mt-1">Thử tìm với từ khóa khác</p>
                        </div>
                    )}

                    {!query && (
                        <div className="p-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Gợi ý tìm kiếm</p>
                            <div className="flex flex-wrap gap-2">
                                {['Trường Chính trị', 'Cầu Đông', 'QĐ số 188', 'Quyết toán vốn', 'Quy chế làm việc'].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setQuery(suggestion)}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 text-sm rounded-full transition-colors flex items-center gap-1"
                                    >
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="py-2">
                            {results.map((result, idx) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    className={`w-full px-5 py-3 flex items-center gap-4 text-left transition-colors ${activeIndex === idx ? 'bg-blue-50 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[result.type]}`}>
                                        <result.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{result.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{result.subtitle}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {result.meta && (
                                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                                {result.meta}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${typeColors[result.type]}`}>
                                            {typeLabels[result.type]}
                                        </span>
                                        <ArrowRight className={`w-4 h-4 transition-opacity ${activeIndex === idx ? 'opacity-100 text-blue-600' : 'opacity-0'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded text-[10px] font-mono">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded text-[10px] font-mono">↓</kbd>
                            để di chuyển
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded text-[10px] font-mono">Enter</kbd>
                            để chọn
                        </span>
                    </div>
                    <span>{results.length} kết quả</span>
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default GlobalSearch;

