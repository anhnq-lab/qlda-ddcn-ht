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

    const generateReport = useCallback(async () => {
        setPhase('generating');
        setError('');
        try {
            const [overviewRes, projectsRes, disbursedYearRes] = await Promise.allSettled([
                DashboardService.getOverviewMetrics(year),
                ProjectService.getAll(),
                supabase.from('disbursements')
                    .select('amount')
                    .gte('date', `${year}-01-01`)
                    .lte('date', `${year}-12-31`)
                    .then(r => (r.data || []).reduce((s: number, d: { amount: unknown }) => s + Number(d.amount), 0)),
            ]);

            const overview = overviewRes.status === 'fulfilled' ? overviewRes.value : null;
            const projects = projectsRes.status === 'fulfilled' ? projectsRes.value : [];
            const disbursedYear = disbursedYearRes.status === 'fulfilled' ? disbursedYearRes.value : 0;

            // Compact report data — keep payload small to avoid edge function timeout
            const reportData = {
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
                // Top 8 projects by investment — keep compact
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
            };

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
            setError('Không thể tạo báo cáo. Vui lòng thử lại.');
            setPhase('idle');
        }
    }, [month, year, stats]);

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
                                    AI Soạn Báo cáo Giao ban
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                                    AI sẽ tổng hợp dữ liệu thực tế từ hệ thống và soạn thảo báo cáo
                                    đúng chuẩn văn bản hành chính nhà nước, sẵn sàng xuất DOCX.
                                </p>
                            </div>
                            <button
                                onClick={generateReport}
                                className="btn btn-primary flex items-center gap-2 px-7 py-2.5 text-sm"
                            >
                                <Sparkles className="w-4 h-4" />
                                Tạo báo cáo với AI
                            </button>
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
                                <div className="bg-gray-50 dark:bg-slate- border border-gray-200 dark:border-slate-700 rounded-xl p-6 max-h-[480px] overflow-y-auto">
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate- rounded-b-2xl">
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
                                disabled={phase === 'generating' as unknown as boolean}
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
