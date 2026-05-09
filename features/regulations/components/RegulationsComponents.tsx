/**
 * RegulationsComponents.tsx - All visual sub-components used within the Regulations viewer.
 * Extracted from the monolithic Regulations.tsx to improve code-splitting.
 */
import React, { useState } from 'react';
import {
    Info, Landmark, HardHat, Briefcase, TrendingUp,
    PenTool, UserCheck, FileCheck, User, Gavel, Layout,
    ArrowDownCircle, Network, Map, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';


const OrgChart = () => {
    const departments = [
        { name: "Phòng Hành chính – Tổng hợp", color: "bg-blue-50 text-blue-700 border-blue-200" },
        { name: "Phòng Kế hoạch – Đấu thầu", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        { name: "Phòng Kỹ thuật – Thẩm định", color: "bg-purple-50 text-purple-700 border-purple-200" },
    ];
    const projectUnits = [
        { name: "Phòng Quản lý dự án 1", color: "bg-blue-50 text-blue-700 border-blue-200" },
        { name: "Phòng Quản lý dự án 2", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        { name: "Phòng Quản lý dự án 3", color: "bg-violet-50 text-violet-700 border-violet-200" },
        { name: "Phòng Phát triển dịch vụ", color: "bg-sky-50 text-sky-700 border-sky-200" },
    ];

    return (
        <div className="py-8 overflow-x-auto flex justify-center">
            <div className="flex flex-col items-center min-w-[800px] max-w-full">
                {/* Level 0: UBND TP.HCM */}
                <div className="relative z-10 mb-4 group">
                    <div className="bg-red-700 text-white px-10 py-2.5 rounded-xl shadow-lg border-2 border-white ring-1 ring-red-200 text-center cursor-default hover:scale-105 transition-transform">
                        <div className="flex items-center gap-2 justify-center">
                            <Landmark className="w-4 h-4" />
                            <h4 className="font-black text-[11px] uppercase tracking-tight">Ủy ban Nhân dân tỉnh Hà Tĩnh</h4>
                        </div>
                    </div>
                    <div className="absolute top-full left-1/2 w-px h-5 bg-gray-300 dark:bg-slate-700 -translate-x-1/2"></div>
                </div>

                {/* Level 1: Giám đốc Ban */}
                <div className="relative z-10 mb-4 group">
                    <div className="text-white px-10 py-3 rounded-xl shadow-lg border-2 border-white ring-1 ring-gray-200 text-center relative cursor-default hover:scale-105 transition-transform bg-gradient-to-br from-amber-500 to-yellow-600">
                        <h4 className="font-black text-sm uppercase tracking-tight">Giám đốc Ban</h4>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                    <div className="absolute top-full left-1/2 w-px h-5 bg-gray-300 dark:bg-slate-700 -translate-x-1/2"></div>
                </div>

                {/* Level 2: Phó GĐ + Kế toán trưởng */}
                <div className="relative z-10 mb-6 flex justify-center gap-5">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-6 py-2 rounded-lg shadow-sm text-center">
                        <h4 className="font-bold text-xs uppercase text-yellow-700 dark:text-amber-500">Phó Giám đốc Ban</h4>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-6 py-2 rounded-lg shadow-sm text-center">
                        <h4 className="font-bold text-xs uppercase text-yellow-700 dark:text-amber-500">Phó Giám đốc Ban</h4>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-6 py-2 rounded-lg shadow-sm text-center">
                        <h4 className="font-bold text-xs uppercase text-blue-700">Kế toán trưởng</h4>
                    </div>
                </div>

                {/* Connector line */}
                <div className="relative w-full flex justify-center mb-3">
                    <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gray-300 dark:bg-slate-700"></div>
                </div>

                {/* Level 3: Phòng chức năng */}
                <div className="w-full mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">Các phòng chức năng</p>
                    <div className="grid grid-cols-5 gap-2">
                        {departments.map((dept, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border ${dept.color} shadow-sm text-center hover:shadow-md transition-all cursor-default`}>
                                <p className="text-[11px] font-bold leading-tight uppercase">{dept.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Level 4: Ban ĐH DA + TT */}
                <div className="w-full">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">Các Phòng Quản lý dự án & Dịch vụ</p>
                    <div className="grid grid-cols-6 gap-2">
                        {projectUnits.map((unit, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border ${unit.color} shadow-sm text-center hover:shadow-md transition-all cursor-default`}>
                                <p className="text-[11px] font-bold leading-tight uppercase">{unit.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-6 flex gap-4">
                    <div className="rounded-lg px-4 py-2 text-center border bg-yellow-50 dark:bg-amber-900/30 border-yellow-200 dark:border-amber-800/50">
                        <p className="text-lg font-black text-yellow-700 dark:text-amber-500">01</p>
                        <p className="text-[9px] font-bold uppercase text-yellow-600 dark:text-amber-600">Giám đốc Ban</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 rounded-lg px-4 py-2 text-center">
                        <p className="text-lg font-black text-blue-700">02</p>
                        <p className="text-[9px] text-blue-600 font-bold uppercase">Phó Giám đốc</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-4 py-2 text-center">
                        <p className="text-lg font-black text-emerald-700">01</p>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase">Kế toán trưởng</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800/50 rounded-lg px-4 py-2 text-center">
                        <p className="text-lg font-black text-purple-700">11</p>
                        <p className="text-[9px] text-purple-600 font-bold uppercase">Phòng/Ban/Đơn vị</p>
                    </div>
                </div>

                <div className="mt-4 text-[10px] text-gray-400 italic text-center max-w-lg">
                    * Theo Quyết định số 571/QĐ-UBND của UBND TP.HCM về thành lập Ban QLDA ĐTXD các công trình Dân dụng & Công nghiệp
                </div>
            </div>
        </div>
    );
};

const SubmissionProcessChart = () => {
    const steps = [
        {
            id: 1,
            title: "Soạn thảo & Đề xuất",
            actor: "Chuyên viên / Phòng CM",
            desc: "Chuẩn bị hồ sơ đầy đủ, dự thảo văn bản, tờ trình.",
            icon: PenTool,
            color: "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700"
        },
        {
            id: 2,
            title: "Kiểm tra & Ký nháy",
            actor: "Lãnh đạo Phòng",
            desc: "Kiểm tra nội dung, ký nháy tờ trình/văn bản.",
            icon: UserCheck,
            color: "bg-blue-50 text-blue-600 border-blue-200"
        },
        {
            id: 3,
            title: "Thẩm định thể thức",
            actor: "Phòng Hành chính - TH",
            desc: "Kiểm tra thể thức văn bản, trình tự thủ tục.",
            icon: FileCheck,
            color: "bg-emerald-50 text-emerald-600 border-emerald-200"
        },
        {
            id: 4,
            title: "Xem xét & Chỉ đạo",
            actor: "Phó Giám đốc phụ trách",
            desc: "Xem xét hồ sơ, ký duyệt hoặc cho ý kiến chỉ đạo.",
            icon: User,
            color: "bg-purple-50 text-purple-600 border-purple-200"
        },
        {
            id: 5,
            title: "Quyết định / Ký ban hành",
            actor: "Giám đốc Ban",
            desc: "Quyết định cuối cùng đối với các vấn đề thuộc thẩm quyền.",
            icon: Gavel,
            color: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50"
        }
    ];

    return (
        <div className="py-6">
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-slate-800 border-l border-dashed border-gray-300 dark:border-slate-700"></div>

                <div className="space-y-6">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="relative flex items-start group">
                            {/* Node Circle */}
                            <div className={`z-10 w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-sm shrink-0 transition-transform group-hover:scale-110 ${step.color}`}>
                                <step.icon className="w-6 h-6" />
                            </div>

                            {/* Arrow Connector (except last) */}
                            {idx < steps.length - 1 && (
                                <div className="absolute left-8 top-16 w-0.5 h-6 bg-gray-300"></div>
                            )}

                            {/* Content Bubble */}
                            <div className="ml-6 flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative">
                                {/* Triangle pointer */}
                                <div className="absolute top-6 -left-2 w-4 h-4 bg-white dark:bg-slate-800 border-l border-b border-gray-200 dark:border-slate-700 transform rotate-45"></div>

                                <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-bold text-gray-800 dark:text-slate-200 text-sm">{step.title}</h5>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded text-gray-500">{step.actor}</span>
                                </div>
                                <p className="text-xs text-gray-500">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-6 italic">Sơ đồ khái quát quy trình trình ký hồ sơ tại Ban QLDA</p>
        </div>
    );
};

const RelationshipMap = () => {
    return (
        <div className="py-8 flex justify-center">
            <div className="relative w-[600px] h-[400px] bg-slate-50 rounded-[40px] border border-slate-200 p-8 flex items-center justify-center overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-blue-200 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-dashed border-gray-200 rounded-full"></div>
                </div>

                {/* Center Node */}
                <div className="relative z-20 w-32 h-32 rounded-full shadow-xl shadow-blue-200 flex flex-col items-center justify-center text-white border-4 border-white ring-4 ring-blue-50 bg-gradient-to-br from-amber-500 to-yellow-600">
                    <Layout className="w-8 h-8 mb-1" />
                    <span className="font-black text-xs text-center uppercase leading-tight">Ban QLDA<br />ĐTXD DDCN</span>
                </div>

                {/* Node: UBND TP.HCM (Top) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 group">
                    <div className="w-14 h-14 bg-red-50 text-red-600 border border-red-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Landmark className="w-6 h-6" />
                    </div>
                    <div className="mt-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-800 dark:text-slate-200 uppercase">UBND TP.HCM</p>
                        <p className="text-[8px] text-gray-500">Chỉ đạo & Giám sát</p>
                    </div>
                    {/* Connector */}
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-red-200"></div>
                    <div className="absolute top-24 left-1/2 -translate-x-1/2"><ArrowDownCircle className="w-4 h-4 text-red-300 bg-slate-50 rounded-full" /></div>
                </div>

                {/* Node: Sở KH-ĐT / Sở TC (Right) */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 group">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 border border-purple-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Network className="w-6 h-6" />
                    </div>
                    <div className="mt-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-800 dark:text-slate-200 uppercase">Sở KH-ĐT / Sở TC</p>
                        <p className="text-[8px] text-gray-500">Thẩm định & Phối hợp</p>
                    </div>
                    {/* Connector */}
                    <div className="absolute right-14 top-5 w-24 h-0.5 bg-purple-200"></div>
                </div>

                {/* Node: Nhà thầu (Bottom) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center z-10 group">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <HardHat className="w-6 h-6" />
                    </div>
                    <div className="mb-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-800 dark:text-slate-200 uppercase">Nhà thầu / Đối tác</p>
                        <p className="text-[8px] text-gray-500">Hợp đồng kinh tế</p>
                    </div>
                    {/* Connector */}
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-emerald-200"></div>
                </div>

                {/* Node: Đơn vị sử dụng (Left) */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 group">
                    <div className="w-14 h-14 bg-orange-50 text-orange-600 border border-orange-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Map className="w-6 h-6" />
                    </div>
                    <div className="mt-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-800 dark:text-slate-200 uppercase">Đơn vị sử dụng</p>
                        <p className="text-[8px] text-gray-500">Bàn giao & Vận hành</p>
                    </div>
                    {/* Connector */}
                    <div className="absolute left-14 top-5 w-24 h-0.5 bg-orange-200"></div>
                </div>

            </div>
        </div>
    );
};

const ResponsibilityList: React.FC<{ items: (string | React.ReactNode)[] }> = ({ items }) => (
    <ul className="space-y-4">
        {items.map((item, idx) => (
            <li key={idx} className="flex gap-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed text-justify group">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-[10px] font-bold mt-0.5 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors shadow-sm">
                    {idx + 1}
                </span>
                <span className="flex-1">{item}</span>
            </li>
        ))}
    </ul>
);

const Article2Visual = () => {
    const points = [
        {
            idx: 1,
            title: "Nguyên tắc tập trung dân chủ & Chế độ thủ trưởng",
            content: "Ban QLDA ĐTXD DDCN làm việc theo nguyên tắc tập trung dân chủ, thực hiện chế độ thủ trưởng, đảm bảo sự chỉ đạo, điều hành thống nhất của Giám đốc Ban đối với các lĩnh vực công tác, pháthuy quyền làm chủ của cán bộ, viên chức, NLĐ gắn với sự lãnh đạo của Đảng và pháthuy vai trò của các tổ chức đoàn thể trong cơ quan. Mọi hoạt động của Ban QLDA ĐTXD DDCN đều phải tuân thủ quy định của pháp luật và Quy chế này."
        },
        {
            idx: 2,
            title: "Chấp hành nghiêm túc sự chỉ đạo",
            content: "Chấp hành nghiêm túc sự chỉ đạo của Giám đốc Ban. Khi giải quyết, xử lý công việc, cán bộ trình trực tiếp Giám đốc Ban. Trường hợp Giám đốc Ban đi vắng thì cán bộ trình người được Giám đốc Ban ủy quyền xem xét xử lý và phải báo cáo kết quả xử lý cho Giám đốc Ban khi Giám đốc Ban có mặt ở cơ quan;"
        },
        {
            idx: 3,
            title: "Phân công công việc & Trách nhiệm cá nhân",
            content: "Trong phân công công việc, mỗi việc chỉ được giao một đơn vị, một cá nhân phụ trách và chịu trách nhiệm chính. Đơn vị, người đứng đầu đơn vị được giao công việc phải chịu trách nhiệm về tiến độ và kết quả công việc được phân công. Cấp trên không làm thay công việc của cấp dưới, tập thể không làm thay công việc của cá nhân và ngược lại;"
        },
        {
            idx: 4,
            title: "Tuân thủ trình tự, thủ tục & Thời hạn",
            content: "Bảo đảm tuân thủ trình tự, thủ tục và thời hạn giải quyết công việc theo đúng quy định của pháp luật, chương trình, kế hoạch, lịch làm việc và Quy chế làm việc, trừ trường hợp đột xuất hoặc có yêu cầu khác của cơ quan cấp trên;"
        },
        {
            idx: 5,
            title: "Pháthuy năng lực & Phối hợp công tác",
            content: "Bảo đảm pháthuy năng lực và sở trường của VC, NLĐ, đề cao sự phối hợp công tác, trách nhiệm làm việc nhóm, pháthuy trí tuệ tập thể và trao đổi thông tin trong giải quyết công việc và trong mọi hoạt động theo chức năng, nhiệm vụ, quyền hạn được pháp luật quy định;"
        },
        {
            idx: 6,
            title: "Dân chủ, minh bạch & Hiệu quả",
            content: "Bảo đảm dân chủ, rõ ràng, minh bạch và hiệu quả trong mọi hoạt động."
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {points.map((p) => (
                <div key={p.idx} className="relative group h-48 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden cursor-default shadow-sm hover:shadow-md transition-all">
                    {/* Default State: Summary */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-90">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl font-black text-blue-600 mb-4 border border-blue-50">{p.idx}</div>
                        <h5 className="font-bold text-gray-800 dark:text-slate-200 text-sm uppercase tracking-tight leading-relaxed px-4">{p.title}</h5>
                        <p className="text-[10px] text-gray-400 mt-4 italic flex items-center gap-1">
                            <Info className="w-3 h-3" /> Rê chuột để xem chi tiết
                        </p>
                    </div>

                    {/* Hover State: Full Content */}
                    <div className="absolute inset-0 bg-blue-600 p-6 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                        <div className="overflow-y-auto custom-scrollbar max-h-full pr-2">
                            <p className="text-xs font-medium leading-relaxed text-justify">
                                {p.content}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- REUSABLE INTERACTIVE LIST COMPONENT ---
const DeptTasksLayout: React.FC<{
    functionContent: string[],
    tasks: { id: string, short: string, title: string, full: string }[],
    baseColor: 'blue' | 'emerald' | 'purple' | 'orange' | 'teal',
    icon: React.ElementType
}> = ({ functionContent, tasks, baseColor, icon: Icon }) => {
    const [hoveredTask, setHoveredTask] = useState('a');

    // Color Maps
    const colors = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-100', active: 'bg-blue-600', activeText: 'text-white' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-100', active: 'bg-emerald-600', activeText: 'text-white' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-100', active: 'bg-purple-600', activeText: 'text-white' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-100', active: 'bg-orange-600', activeText: 'text-white' },
        teal: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-100', active: 'bg-teal-600', activeText: 'text-white' },
    };

    const c = colors[baseColor];

    return (
        <div className="space-y-6">
            {/* Chức năng chung */}
            <div className={`p-5 ${c.bg} rounded-2xl border ${c.border}`}>
                <h4 className={`font-bold ${c.text} text-sm mb-3 flex items-center gap-2`}>
                    <CheckCircle2 className="w-4 h-4" /> 1. Chức năng
                </h4>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-slate-300 list-disc pl-5 leading-relaxed">
                    {functionContent.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>

            {/* Nhiệm vụ chi tiết - Interactive Layout */}
            <div>
                <h4 className="font-bold text-gray-800 dark:text-slate-200 text-sm mb-4 px-1 flex items-center gap-2">
                    2. Nhiệm vụ cụ thể
                    <span className="text-[10px] font-normal text-gray-400 italic bg-gray-50 px-2 py-0.5 rounded">(Rê chuột vào các mục bên dưới để xem chi tiết)</span>
                </h4>

                <div className="flex flex-col md:flex-row gap-6 h-[400px]">
                    {/* Left: Navigation List */}
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                onMouseEnter={() => setHoveredTask(task.id)}
                                className={`p-4 rounded-xl cursor-pointer border-2 transition-all duration-300 flex items-center justify-between group ${hoveredTask === task.id
                                    ? `${c.active} text-white shadow-lg border-transparent scale-105`
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <h5 className="font-bold text-xs uppercase tracking-wide">{task.short}</h5>
                                <ChevronRight className={`w-4 h-4 transition-transform ${hoveredTask === task.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-50'}`} />
                            </div>
                        ))}
                    </div>

                    {/* Right: Content Display */}
                    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden shadow-sm">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                className={`absolute inset-0 p-8 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out bg-white ${hoveredTask === task.id
                                    ? 'opacity-100 translate-y-0 z-10'
                                    : 'opacity-0 translate-y-4 pointer-events-none z-0'
                                    }`}
                            >
                                <h4 className={`font-black ${c.text} text-base mb-6 uppercase border-b ${c.border} pb-3 flex items-center gap-2`}>
                                    <div className={`w-1 h-6 ${c.active.replace('bg-', 'bg-')} rounded-full`}></div>
                                    {task.title}
                                </h4>
                                <div className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-justify font-medium">
                                    {task.full}
                                </div>
                            </div>
                        ))}
                        {/* Background Decoration */}
                        <div className="absolute bottom-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Icon className="w-40 h-40" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDeptDetail = () => {
    const functionContent = [
        "Tham mưu, giúp Giám đốc Ban chỉ đạo, điều hành công việc và duy trì chế độ làm việc tại cơ quan.",
        "Trực tiếp tham mưu Giám đốc Ban về công tác hành chính – quản trị; công tác tổ chức bộ máy, quản lý viên chức và người lao động.",
        "Tham mưu, giúp Giám đốc Ban tổ chức thực hiện công tác quản lý tài chính, tài sản, chế độ kế toán và sử dụng có hiệu quả, đúng mục đích các nguồn tài chính của Ban theo quy định."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Hành chính - Quản trị',
            title: 'Công tác Hành chính - Quản trị',
            full: `Tham mưu xây dựng các quy chế, theo dõi, giám sát quá trình tổ chức thực hiện nội quy, quy chế của cơ quan; theo dõi công tác phòng chống tham nhũng, cải cách hành chính, văn hóa công sở, kỷ luật, kỷ cương hành chính; thi đua khen thưởng.

Tham mưu công tác mua sắm, sửa chữa, quản lý tài sản, phương tiện, thiết bị; điều hành xe ô tô; công tác an ninh trật tự, PCCC; công tác đối nội, đối ngoại, lễ tân; bố trí lịch công tác.

Thực hiện công tác văn thư, lưu trữ, sử dụng con dấu; chuyển đổi số, số hóa tài liệu. Trưởng phòng được ký thừa lệnh Giám đốc các văn bản hành chính theo ủy quyền.`
        },
        {
            id: 'b',
            short: 'B) Tổ chức bộ máy',
            title: 'Công tác tổ chức bộ máy',
            full: `Tham mưu công tác tổ chức bộ máy của Ban QLDA; xây dựng, điều chỉnh Đề án vị trí việc làm, phương án sử dụng viên chức, người lao động.

Chịu trách nhiệm chủ trì thực hiện các thủ tục liên quan đến công tác nhân sự: tuyển dụng, bổ nhiệm, miễn nhiệm, luân chuyển, điều động, thôi việc, nghỉ hưu, quy hoạch, khen thưởng, kỷ luật, đào tạo, nâng lương.

Quản lý hồ sơ viên chức, người lao động theo quy định; thực hiện chế độ chính sách cán bộ, người lao động.`
        },
        {
            id: 'c',
            short: 'C) Quản lý tài chính',
            title: 'Công tác quản lý tài chính',
            full: `Thực hiện nhiệm vụ quản lý tài chính, quản lý tài sản theo đúng theo Quy chế chi tiêu nội bộ của Ban QLDA và các quy định khác của Pháp luật hiện hành; thực hiện công tác kế toán theo Luật kế toán và các quy định hiện hành.

Theo dõi, quản lý các nguồn kinh phí, thực hiện giải ngân các nguồn vốn được giao, quyết toán các công trình, dự án đúng quy định; thực hiện việc trích lập và tham mưu công tác quản lý, sử dụng các Quỹ.

Xây dựng quy chế chi tiêu nội bộ, cơ chế tiền lương, thu nhập tăng thêm và phương án trích lập các quỹ. Lập, trình phê duyệt Dự toán thu – chi, quyết toán chi quản lý hàng năm.`
        },
        {
            id: 'd',
            short: 'D) Nhiệm vụ khác',
            title: 'Các nhiệm vụ khác',
            full: `Thực hiện công tác Văn phòng Đảng ủy và các nhiệm vụ khác do Giám đốc phân công.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="blue" icon={Layout} />;
};

const PlanningDeptDetail = () => {
    const functionContent = [
        "Tham mưu, giúp Giám đốc Ban QLDA thực hiện Công tác Kế hoạch: xây dựng chương trình, kế hoạch tổng thể, kế hoạch đầu tư công trung hạn/hàng năm, kế hoạch vốn đầu tư.",
        "Công tác tổ chức lựa chọn nhà thầu, thương thảo, hoàn thiện, ký kết hợp đồng."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Công tác Kế hoạch',
            title: 'Công tác Kế hoạch',
            full: `Lập, theo dõi, tổng hợp, đánh giá và tham mưu kế hoạch tổng thể, kế hoạch đầu tư công trung hạn, kế hoạch thực hiện hàng năm và quản lý nguồn vốn của các chương trình/dự án/công trình/nguồn vốn được giao.

Tham mưu, đề xuất Giám đốc Ban QLDA phê duyệt kế hoạch giải ngân nguồn vốn, phân khai nguồn vốn giải ngân của từng nhà thầu, từng hạng mục.

Thực hiện công tác lập báo cáo tháng/quý/năm về công tác giải ngân; phối hợp với Bộ, ngành Trungương, Sở, ngành địa phương để quản lý nguồn vốn.

Tổng hợp kết quả thực hiện các kết luận thanh tra, kiểm toán của Ban QLDA.`
        },
        {
            id: 'b',
            short: 'B) Công tác lựa chọn nhà thầu',
            title: 'Công tác lựa chọn nhà thầu',
            full: `Chuẩn bị và tổ chức lựa chọn nhà thầu; đánh giá hồ sơ quan tâm, dự tuyển, dự thầu, đề xuất; yêu cầu làm rõ hồ sơ. Chịu trách nhiệm bảo mật thông tin và cung cấp thông tin chính xác trên Hệ thống mạng đấu thầu quốc gia.

Chủ trì thẩm định, trình Giám đốc phê duyệt Kế hoạch lựa chọn nhà thầu; quyết định chỉ định thầu. Đăng tải thông tin (KHLCNT, TBMT, KQLCNT) đúng quy định.

Chủ trì tham mưu xử lý tình huống trong đấu thầu; giải quyết kiến nghị; hủy thầu; lưu trữ hồ sơ.

Chủ trì, phối hợp soát xét các loại hợp đồng, tham mưu ký kết hợp đồng thi công để phòng tránh rủi ro.`
        },
        {
            id: 'c',
            short: 'C) Nhiệm vụ liên quan khác',
            title: 'Các nhiệm vụ liên quan khác',
            full: `Chủ trì nghiên cứu Quy hoạch, kế hoạch để tìm kiếm cơ hội đầu tư; đề xuất danh mục đầu tư hàng năm và trung hạn.

Chủ trì tham mưu vận động, xúc tiến và quản lý thực hiện các dự án ODA.

Thực hiện công tác phiên dịch, biên dịch Anh-Việt. Phối hợp lập BCNCTKT, BCĐXCTĐT. Giám sát đánh giá đầu tư. Lập báo cáo định kỳ về công tác đấu thầu, thực hiện dự án.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="emerald" icon={BarChart3} />;
};

const TechnicalDeptDetail = () => {
    const functionContent = [
        "Tham mưu, giúp Giám đốc Ban tổ chức thực hiện công tác thẩm định thuộc thẩm quyền Chủ đầu tư.",
        "Chịu trách nhiệm về mặt kỹ thuật các công trình, dự án do Ban QLDA làm chủ đầu tư."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Công tác thẩm định',
            title: 'Công tác thẩm định',
            full: `Thẩm định, trình phê duyệt: Nhiệm vụ và dự toán tư vấn (khảo sát, quy hoạch, BCNCKT/BCKTKT, TKBVTC).

Thẩm định hồ sơ thiết kế, dự toán công trình; dự toán gói thầu; điều chỉnh thiết kế, dự toán thuộc thẩm quyền CĐT.

Thẩm định hồ sơ mời quan tâm/sơ tuyển/mời thầu/yêu cầu và kết quả đánh giá hồ sơ, kết quả lựa chọn nhà thầu theo Luật Đấu thầu.

Tham mưu thành lập Tổ thẩm định đấu thầu khi cần thiết.`
        },
        {
            id: 'b',
            short: 'B) Công tác kỹ thuật',
            title: 'Công tác kỹ thuật',
            full: `Chủ trì rà soát, cập nhật các quy định pháp luật về đầu tư xây dựng, tham mưu tổ chức thực hiện kịp thời.

Kiểm tra, rà soát trình tự thủ tục pháp lý, sự phù hợp của hồ sơ các bước chuẩn bị dự án, TKBVTC và dự toán trước khi trình cơ quan chuyên môn.

Thực hiện chức năng chủ đầu tư: Kiểm tra chất lượng, tiến độ, an toàn thi công; kiểm tra xác nhận các nội dung điều chỉnh bổ sung trong quá trình thi công.`
        },
        {
            id: 'c',
            short: 'C) Nhiệm vụ khác liên quan',
            title: 'Các nhiệm vụ khác liên quan',
            full: `Phối hợp xử lý nội dung liên quan đến thủ tục pháp lý, ý kiến sở ngành giai đoạn chuẩn bị đầu tư.

Phối hợp làm rõ hồ sơ mời thầu/dự thầu, giải quyết kiến nghị trong lựa chọn nhà thầu.

Liên hệ, phối hợp với các đơn vị liên quan để tham mưu vấn đề kỹ thuật. Thực hiện báo cáo định kỳ và trách nhiệm giải trình. Nghiên cứu áp dụng sáng kiến kinh nghiệm.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="purple" icon={PenTool} />;
};

const ProjectMgmtDeptDetail = () => {
    const functionContent = [
        "Thực hiện chức năng quản lý các công trình, dự án đầu tư xây dựng thuộc lĩnh vực dân dụng, công nghiệp, hạ tầng khu vực và các chương trình, dự án khác do Giám đốc Ban QLDA giao, đảm bảo quy định pháp luật.",
        "Thực hiện các chức năng khác do Giám đốc Ban QLDA giao theo đúng quy định của pháp luật."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Công tác chuẩn bị đầu tư',
            title: 'Công tác chuẩn bị đầu tư',
            full: `Chủ trì, phối hợp với các Phòng Kỹ thuật, Kế hoạch tổ chức lập BCNCTKT, BCĐXCTĐT các dự án được giao.

Tổ chức lập và trình cơ quan thẩm quyền thẩm định, phê duyệt các hồ sơ: đề cương tư vấn, BCNCKT/BCKTKT, TKKT, TKBVTC, dự toán.

Tham mưu Ban Giám đốc trong việc thỏa thuận với các đơn vị liên quan và trình cấp phép xây dựng các công trình/dự án.`
        },
        {
            id: 'b',
            short: 'B) Công tác đấu thầu',
            title: 'Công tác đấu thầu',
            full: `Lập hồ sơ kế hoạch lựa chọn nhà thầu; kết quả chỉ định thầu/đấu thầu các gói thầu thuộc dự án trực tiếp quản lý trình phòng chuyên môn thẩm định.

Chủ trì tham mưu thành lập Tổ chuyên gia đấu thầu. Phối hợp với Phòng Kế hoạch - Đấu thầu xử lý tình huống, kiến nghị trong đấu thầu.`
        },
        {
            id: 'c',
            short: 'C) Quản lý, thực hiện dự án',
            title: 'Công tác quản lý, thực hiện dự án',
            full: `Chủ trì thương thảo, dự thảo và quản lý hợp đồng (bao gồm điều chỉnh, bổ sung).

Thực hiện quản lý dự án từ khâu chuẩn bị đến khi bàn giao, quyết toán. Chịu trách nhiệm về tiến độ, khối lượng, chất lượng, an toàn, vệ sinh môi trường.

Rà soát hồ sơ nghiệm thu, thanh toán, quyết toán đúng quy định. Tổ chức lập hồ sơ điều chỉnh, bổ sung phát sinh (nếu có).`
        },
        {
            id: 'd',
            short: 'D) Nhiệm vụ khác',
            title: 'Các nhiệm vụ khác liên quan',
            full: `Lập/cập nhật báo cáo tiến độ định kỳ. Lập hồ sơ ĐTM, rà phá bom mìn, GPMB, tái định cư.

Phối hợp với phòng Kế hoạch thực hiện giám sát đánh giá đầu tư. Phối hợp phòng Phát triển dịch vụ thực hiện tư vấn QLDA cho chủ đầu tư khác.

Thực hiện công tác báo cáo và trách nhiệm giải trình.`
        },
        {
            id: 'e',
            short: 'Đ) Phân công cụ thể',
            title: 'Phân công nhiệm vụ các phòng',
            full: `Ban ĐH dự án 1: Quản lý các dự án đầu tư xây dựng công trình dân dụng (bệnh viện, trường học, trụ sở, nhà ở xã hội) trên địa bàn TP.HCM.

Ban ĐH dự án 2, 3: Quản lý các dự án xây dựng công trình công nghiệp, hạ tầng kỹ thuật theo phân công của Giám đốc Ban.

Ban ĐH dự án 4, 5: Quản lý các dự án sửa chữa, cải tạo, nâng cấp công trình dân dụng và công nghiệp; các dự án theo hình thức PPP.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="orange" icon={Briefcase} />;
};

const ServiceDevDeptDetail = () => {
    const functionContent = [
        "Tìm kiếm vận động các chương trình dự án trong và ngoài nước.",
        "Tìm kiếm và thực hiện các dịch vụ tư vấn quản lý dự án, tư vấn giám sát xây dựng công trình và các dịch vụ tư vấn khác phù hợp năng lực của Ban QLDA."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Xúc tiến & Ký kết',
            title: 'Công tác xúc tiến & ký kết',
            full: `Chủ trì khâu nối, phối hợp, xúc tiến ký kết các hợp đồng Quản lý dự án với các chủ đầu tư khác.

Tìm kiếm các nguồn việc mới thông qua quan hệ đối ngoại và năng lực của Ban.`
        },
        {
            id: 'b',
            short: 'B) Thực hiện dịch vụ tư vấn',
            title: 'Thực hiện dịch vụ tư vấn',
            full: `Chủ trì thực hiện công tác tư vấn quản lý dự án, tư vấn giám sát thi công xây dựng các công trình/dự án cho các Chủ đầu tư khác theo Quy định của pháp luật.

Đảm bảo chất lượng và tiến độ cam kết trong hợp đồng tư vấn.`
        },
        {
            id: 'c',
            short: 'C) Gói thầu tự thực hiện',
            title: 'Các gói thầu tự thực hiện',
            full: `Chủ trì thực hiện các gói thầu áp dụng hình thức "tự thực hiện" do Ban QLDA làm Chủ đầu tư.

Trường hợp cần thiết lập Tổ/Nhóm thực hiện TVGS cho 01 công trình cụ thể: Xây dựng phương án, báo cáo Phó Giám đốc phụ trách xem xét, quyết định. Tổ chịu sự lãnh đạo trực tiếp của Phó GĐ và Trưởng phòng.`
        },
        {
            id: 'd',
            short: 'D) Hồ sơ & Báo cáo',
            title: 'Công tác hồ sơ & báo cáo',
            full: `Cập nhật hồ sơ, tài liệu, số liệu liên quan đến nhiệm vụ của phòng để phối hợp với bộ phận kế toán (Phòng HC-TH) thực hiện việc thanh, quyết toán kịp thời, đúng quy định.

Thực hiện công tác báo cáo và trách nhiệm giải trình khi có yêu cầu của cơ quan chức năng.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="teal" icon={TrendingUp} />;
};

// --- DATA POPULATION FROM PDF ---

export { OrgChart, SubmissionProcessChart, RelationshipMap, Article2Visual, AdminDeptDetail, PlanningDeptDetail, TechnicalDeptDetail, ProjectMgmtDeptDetail, ServiceDevDeptDetail };
