import React, { useState, useCallback } from 'react';
import { X, Sparkles, Download, Loader2, FileText, Edit3, RefreshCw } from 'lucide-react';
import { generateAIAnalysis } from '../../../services/ai/aiOrchestrator';
import { generateNd30Docx } from '../../../services/ai/docxGenerator';
import { buildMonthlyBriefingPrompt } from '../../../services/ai/prompts';
import { DashboardService, type MonthlyBriefingStats } from '../../../services/DashboardService';
import { ProjectService } from '../../../services/ProjectService';
import { supabase } from '../../../lib/supabase';
import { saveAs } from 'file-saver';

interface Props {
    month: number;
    year: number;
    stats: MonthlyBriefingStats;
    onClose: () => void;
}

export const MonthlyReportModal: React.FC<Props> = ({ month, year, stats, onClose }) => {
    const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle');
    const [isExporting, setIsExporting] = useState(false);
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    const fetchReportData = useCallback(async () => {
        const [overviewRes, projectsRes, disbursedYearRes, taskBriefingRes] = await Promise.allSettled([
            DashboardService.getOverviewMetrics(year),
            ProjectService.getAll(),
            (supabase as any).from('disbursements')
                .select('amount')
                .gte('date', `${year}-01-01`)
                .lte('date', `${year}-12-31`)
                .then((r: any) => (r.data || []).reduce((s: number, d: { amount: unknown }) => s + Number(d.amount), 0)),
            DashboardService.getTaskBriefingSummary(month, year),
        ]);

        const overview = overviewRes.status === 'fulfilled' ? overviewRes.value : null;
        const projects = projectsRes.status === 'fulfilled' ? projectsRes.value : [];
        const disbursedYear = disbursedYearRes.status === 'fulfilled' ? disbursedYearRes.value : 0;
        const taskBriefing = taskBriefingRes.status === 'fulfilled' ? taskBriefingRes.value : [];

        return {
            thangBaoCao: `Tháng ${month}/${year}`,
            giaiNganThang: {
                thucHienTyDong: Math.round(stats.disbursedThisMonth / 1e9 * 10) / 10,
                keHoachTyDong: Math.round(stats.disbursedTarget / 1e9 * 10) / 10,
                tyLePhanTram: stats.disbursedTarget > 0
                    ? Math.round((stats.disbursedThisMonth / stats.disbursedTarget) * 100) : 0,
            },
            giaiNganLuyKe: {
                thucHienTyDong: Math.round(disbursedYear / 1e9 * 10) / 10,
                keHoachNamTyDong: Math.round((overview?.yearlyPlanned || 0) / 1e9 * 10) / 10,
                tyLePhanTram: overview?.yearlyDisbursementRate || 0,
            },
            tongQuanDuAn: {
                tongSo: overview?.totalProjects || projects.length,
                tongVonTyDong: Math.round((overview?.totalInvestment || 0) / 1e9 * 10) / 10,
                duAnMoiTrongThang: stats.newProjectsStarted,
                duAnHoanThanh: stats.projectsCompleted,
            },
            duAn: projects.slice(0, 8).map(p => ({
                ten: p.ProjectName,
                tieuDo: p.Progress,
                giaiNgan: p.PaymentProgress,
                vonTyDong: Math.round(Number(p.TotalInvestment) / 1e9 * 10) / 10,
                trangThai: p.Status === 2 ? 'Đang thi công' : p.Status === 3 ? 'Hoàn thành' : 'Chuẩn bị ĐT',
            })),
            ketQuaNoiBat: stats.keyAchievements.map(a => a.content),
            tonTaiVuongMac: stats.roadblocks.map(r => r.content),
            keHoachThangToi: stats.upcomingPlans.map(p => p.content),
            congViecPhongBan: taskBriefing.map(dept => ({
                phong: dept.department_name,
                tongCV: dept.total_tasks,
                hoanThanh: dept.completed,
                dangLam: dept.in_progress,
                chuaHT: dept.incomplete,
                tyLe: `${dept.completion_rate}%`,
                noiBat: dept.by_category
                    .filter(c => c.completed > 0)
                    .slice(0, 3)
                    .map(c => `${c.category_label}: ${c.completed}/${c.total} HT`),
                vuongMac: dept.by_category
                    .flatMap(c => c.items.filter(i => i.status === 'incomplete'))
                    .slice(0, 3)
                    .map(i => i.title + (i.incomplete_reason ? ` (${i.incomplete_reason})` : '')),
            })),
        };
    }, [month, year, stats]);

    const buildDirectReportContent = useCallback((data: any): string => {
        let text = '';
        
        text += `I. KẾT QUẢ THỰC HIỆN CHỈ TIÊU KINH TẾ - KỸ THUẬT\n\n`;
        text += `1. Tình hình giải ngân vốn đầu tư công:\n`;
        text += `- Thực hiện giải ngân trong tháng: ${data.giaiNganThang.thucHienTyDong} tỷ đồng / Kế hoạch tháng: ${data.giaiNganThang.keHoachTyDong} tỷ đồng (đạt ${data.giaiNganThang.tyLePhanTram}%).\n`;
        text += `- Lũy kế giải ngân năm: ${data.giaiNganLuyKe.thucHienTyDong} tỷ đồng / Kế hoạch năm: ${data.giaiNganLuyKe.keHoachNamTyDong} tỷ đồng (đạt ${data.giaiNganLuyKe.tyLePhanTram}%).\n\n`;
        
        text += `2. Tổng quan tình hình dự án:\n`;
        text += `- Tổng số dự án đang quản lý: ${data.tongQuanDuAn.tongSo} dự án, với tổng mức đầu tư ${data.tongQuanDuAn.tongVonTyDong} tỷ đồng.\n`;
        text += `- Số dự án khởi công mới trong tháng: ${data.tongQuanDuAn.duAnMoiTrongThang} dự án.\n`;
        text += `- Số dự án hoàn thành trong tháng: ${data.tongQuanDuAn.duAnHoanThanh} dự án.\n`;
        text += `- Số lượng văn bản, hồ sơ pháp lý được phê duyệt: ${stats.docsApproved} văn bản.\n\n`;

        text += `II. TIẾN ĐỘ THỰC HIỆN CÁC DỰ ÁN TRỌNG ĐIỂM\n\n`;
        if (data.duAn && data.duAn.length > 0) {
            data.duAn.forEach((p: any, idx: number) => {
                text += `${idx + 1}. Dự án: ${p.ten}\n`;
                text += `- Trạng thái: ${p.trangThai}\n`;
                text += `- Tiến độ thực hiện: đạt ${p.tieuDo}%.\n`;
                text += `- Tỷ lệ giải ngân: đạt ${p.giaiNgan}%.\n`;
                text += `- Tổng mức đầu tư: ${p.vonTyDong} tỷ đồng.\n\n`;
            });
        } else {
            text += `Không có dự án trọng điểm nào được ghi nhận trong kỳ báo cáo.\n\n`;
        }

        text += `III. KẾT QUẢ NỔI BẬT TRONG THÁNG\n\n`;
        if (data.ketQuaNoiBat && data.ketQuaNoiBat.length > 0) {
            data.ketQuaNoiBat.forEach((item: string) => {
                text += `- ${item}\n`;
            });
        } else {
            text += `- Hoàn thành tốt các chỉ tiêu nhiệm vụ được giao trong tháng.\n`;
        }
        text += `\n`;

        text += `IV. TỒN TẠI, VƯỚNG MẮC VÀ NGUYÊN NHÂN\n\n`;
        if (data.tonTaiVuongMac && data.tonTaiVuongMac.length > 0) {
            data.tonTaiVuongMac.forEach((item: string) => {
                text += `- Vấn đề: ${item}\n`;
            });
        } else {
            text += `- Không ghi nhận tồn tại, vướng mắc lớn ảnh hưởng đến tiến độ dự án.\n`;
        }
        text += `\n`;

        text += `V. TÌNH HÌNH THỰC HIỆN CÔNG VIỆC CỦA CÁC PHÒNG BAN\n\n`;
        if (data.congViecPhongBan && data.congViecPhongBan.length > 0) {
            data.congViecPhongBan.forEach((dept: any, idx: number) => {
                text += `${idx + 1}. ${dept.phong}:\n`;
                text += `- Tổng số công việc được giao: ${dept.tongCV} công việc.\n`;
                text += `- Kết quả thực hiện: Hoàn thành ${dept.hoanThanh} công việc, Đang triển khai ${dept.dangLam} công việc, Chưa hoàn thành ${dept.chuaHT} công việc. Tỷ lệ hoàn thành đạt ${dept.tyLe}.\n`;
                if (dept.noiBat && dept.noiBat.length > 0) {
                    text += `- Kết quả nổi bật:\n`;
                    dept.noiBat.forEach((nb: string) => {
                        text += `  + ${nb}\n`;
                    });
                }
                if (dept.vuongMac && dept.vuongMac.length > 0) {
                    text += `- Vướng mắc, tồn tại cần lưu ý:\n`;
                    dept.vuongMac.forEach((vm: string) => {
                        text += `  + ${vm}\n`;
                    });
                }
                text += `\n`;
            });
        } else {
            text += `Không có dữ liệu công việc của các phòng ban trong kỳ báo cáo.\n\n`;
        }

        text += `VI. KẾ HOẠCH VÀ NHIỆM VỤ TRỌNG TÂM THÁNG TỚI\n\n`;
        if (data.keHoachThangToi && data.keHoachThangToi.length > 0) {
            data.keHoachThangToi.forEach((item: string) => {
                text += `- ${item}\n`;
            });
        } else {
            text += `- Tiếp tục đôn đốc thực hiện và giải ngân theo đúng tiến độ các công việc được giao.\n`;
        }

        return text;
    }, [stats.docsApproved]);

    const generateReport = useCallback(async () => {
        setPhase('generating');
        setError('');
        try {
            const reportData = await fetchReportData();
            const prompt = buildMonthlyBriefingPrompt(month, year);
            // 45-second timeout to prevent hanging
            const generated = await Promise.race([
                generateAIAnalysis(prompt, reportData),
                new Promise<string>((_, reject) =>
                    setTimeout(() => reject(new Error('Quá thời gian chờ (45s). Vui lòng thử lại.')), 45000)
                ),
            ]);
            setContent(generated);
            setPhase('done');
        } catch (err) {
            setError('Không thể tạo báo cáo với AI. Vui lòng thử lại.');
            setPhase('idle');
        }
    }, [month, year, fetchReportData]);

    const generateReportDirectly = useCallback(async () => {
        setPhase('generating');
        setError('');
        try {
            const reportData = await fetchReportData();
            const directContent = buildDirectReportContent(reportData);
            setContent(directContent);
            setPhase('done');
        } catch (err) {
            console.error(err);
            setError('Không thể tạo báo cáo trực tiếp. Vui lòng thử lại.');
            setPhase('idle');
        }
    }, [fetchReportData, buildDirectReportContent]);

    const exportDocx = async () => {
        if (!content) return;
        setIsExporting(true);
        setError('');
        try {
            const blob = await generateNd30Docx({
                organizationParent: 'ỦY BAN NHÂN DÂN TỈNH HÀ TĨNH',
                organizationName: 'BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG CÔNG TRÌNH DÂN DỤNG VÀ HẠ TẦNG KHU VỰC',
                documentNumber: `${String(month).padStart(2, '0')}`,
                documentSymbol: `${year}/BC-BQLDA`,
                location: 'Hà Tĩnh',
                date: new Date(year, month - 1),
                title: `BÁO CÁO GIAO BAN THÁNG ${month} NĂM ${year}`,
                content,
                signerTitle: 'GIÁM ĐỐC',
                signerName: '',
                recipientList: [
                    '- UBND tỉnh Hà Tĩnh (để báo cáo);',
                    '- Sở Kế hoạch và Đầu tư tỉnh Hà Tĩnh;',
                    '- Kho bạc Nhà nước tỉnh Hà Tĩnh;',
                    '- Các phòng, đơn vị thuộc Ban;',
                    '- Lưu: VT, HC-TH.',
                ],
            });
            saveAs(blob, `BaoCaoGiaoBan_T${String(month).padStart(2, '0')}_${year}.docx`);
        } catch (err) {
            setError('Không thể xuất DOCX. Vui lòng thử lại.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-800 dark:text-slate-100 uppercase tracking-tight">
                                Báo cáo Giao ban — Tháng {month}/{year}
                            </h2>
                            <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium mt-0.5">
                                Chuẩn Nghị định 30/2020/NĐ-CP · Xuất DOCX
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Idle — call to action */}
                    {phase === 'idle' && (
                        <div className="flex flex-col items-center justify-center min-h-[280px] gap-5">
                            <div className="p-5 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                                <Sparkles className="w-12 h-12 text-primary-500" />
                            </div>
                            <div className="text-center max-w-sm">
                                <h3 className="text-base font-black text-gray-700 dark:text-slate-200 mb-2">
                                    Soạn Báo cáo Giao ban
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                                    Tổng hợp dữ liệu thực tế từ hệ thống để lập báo cáo giao ban
                                    đúng chuẩn văn bản hành chính nhà nước. Bạn có thể chọn soạn bằng trí tuệ nhân tạo (AI) hoặc xuất trực tiếp dữ liệu thô.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={generateReport}
                                    className="btn btn-primary flex items-center gap-2 px-7 py-2.5 text-sm"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Tạo báo cáo với AI
                                </button>
                                <button
                                    onClick={generateReportDirectly}
                                    className="btn btn-outline flex items-center gap-2 px-7 py-2.5 text-sm border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 bg-white dark:bg-slate-800"
                                >
                                    <FileText className="w-4 h-4" />
                                    Xuất báo cáo trực tiếp
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Generating */}
                    {phase === 'generating' && (
                        <div className="flex flex-col items-center justify-center min-h-[280px] gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-700 dark:text-slate-200">Đang tổng hợp dữ liệu & soạn báo cáo...</p>
                                <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Thường mất 15–30 giây. Vui lòng chờ.</p>
                            </div>
                            <div className="flex gap-1.5 mt-1">
                                {['Thu thập dữ liệu', 'Phân tích', 'Soạn thảo'].map((step, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[11px] font-bold rounded-full border border-primary-200 dark:border-primary-700">
                                        {step}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Done — show content */}
                    {phase === 'done' && content && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                                        Nội dung báo cáo
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold border border-primary-200 dark:border-primary-700 rounded-lg px-2.5 py-1 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    {isEditing ? 'Xem trước' : 'Chỉnh sửa'}
                                </button>
                            </div>

                            {isEditing ? (
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full h-[480px] p-4 font-mono text-[13px] leading-relaxed border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                                />
                            ) : (
                                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 max-h-[480px] overflow-y-auto">
                                    <div 
                                        className="prose prose-sm max-w-none dark:prose-invert text-[13.5px] leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-slate-200"
                                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                                    >
                                        {content}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="btn btn-outline text-sm"
                    >
                        Đóng
                    </button>

                    <div className="flex items-center gap-2">
                        {phase === 'done' && (
                            <button
                                onClick={generateReport}
                                disabled={(phase as string) === 'generating'}
                                className="btn btn-outline flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Tạo lại
                            </button>
                        )}
                        <button
                            onClick={exportDocx}
                            disabled={!content || isExporting}
                            className="btn btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Download className="w-4 h-4" />
                            }
                            Xuất DOCX
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
