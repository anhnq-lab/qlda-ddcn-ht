// Compliance Checker — Kiểm tra tuân thủ pháp lý dự án
// Rule-based + AI analysis

import { Project, ProjectGroup, ProjectStatus } from '../../types';
import { checkCompliance, ComplianceResult, ComplianceCheck } from '../aiService';
import { ProjectService } from '../ProjectService';
import { LegalDocumentService } from '../LegalDocumentService';
import { PROJECT_THRESHOLDS_2024 } from '../../types/project.types';

export interface EnrichedComplianceCheck extends ComplianceCheck {
    source: 'rule' | 'ai';
}

export interface FullComplianceReport {
    checks: EnrichedComplianceCheck[];
    complianceScore: number;
    summary: string;
    analyzedAt: Date;
}

/**
 * Rule-based compliance checks — nhanh, không cần AI
 */
function runRuleBasedChecks(project: Project): EnrichedComplianceCheck[] {
    const checks: EnrichedComplianceCheck[] = [];

    // 1. QĐ phê duyệt dự án
    checks.push({
        id: 'approval_decision',
        regulation: 'Luật Đầu tư công 58/2024/QH15',
        article: 'Điều 27-32',
        requirement: 'Phải có QĐ phê duyệt chủ trương đầu tư',
        status: project.DecisionNumber ? 'passed' : 'pending',
        detail: project.DecisionNumber
            ? `QĐ số ${project.DecisionNumber} ngày ${project.DecisionDate || 'N/A'}`
            : 'Chưa ghi nhận QĐ phê duyệt',
        recommendation: !project.DecisionNumber ? 'Bổ sung QĐ phê duyệt vào hệ thống' : undefined,
        source: 'rule',
    });

    // 2. BIM (NĐ 175/2024)
    const requiresBIM = project.RequiresBIM ||
        (['QN', 'A'].includes(project.GroupCode)) ||
        (project.GroupCode === 'B' && project.TotalInvestment >= 500_000_000_000);

    checks.push({
        id: 'bim_requirement',
        regulation: 'NĐ 175/2024/NĐ-CP',
        article: 'Điều 3, 4',
        requirement: 'BIM bắt buộc với dự án nhóm QN, A, B (≥500 tỷ)',
        status: !requiresBIM ? 'passed'
            : project.BIMStatus === 'Active' ? 'passed'
                : project.BIMStatus === 'EIRApproved' || project.BIMStatus === 'BEPApproved' ? 'warning'
                    : 'violation',
        detail: !requiresBIM
            ? `Dự án nhóm ${project.GroupCode} — không bắt buộc BIM`
            : `BIM: ${project.BIMStatus || 'Chưa triển khai'}`,
        recommendation: requiresBIM && (!project.BIMStatus || project.BIMStatus === 'Pending')
            ? 'Lập EIR và BEP theo quy định NĐ 175/2024' : undefined,
        source: 'rule',
    });

    // 3. Thời hạn bố trí vốn
    if (project.ApprovalDate) {
        const yearsSince = (Date.now() - new Date(project.ApprovalDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const maxYears = PROJECT_THRESHOLDS_2024.CAPITAL_DURATION[
            project.GroupCode === 'QN' ? 'GROUP_QN'
                : project.GroupCode === 'A' ? 'GROUP_A'
                    : project.GroupCode === 'B' ? 'GROUP_B'
                        : 'GROUP_C'
        ];

        checks.push({
            id: 'capital_duration',
            regulation: 'Luật Đầu tư công 58/2024/QH15',
            article: 'Điều 62',
            requirement: `Thời hạn bố trí vốn nhóm ${project.GroupCode}: ≤ ${maxYears} năm`,
            status: yearsSince <= maxYears ? 'passed'
                : yearsSince <= maxYears + 1 ? 'warning'
                    : 'violation',
            detail: `Đã ${yearsSince.toFixed(1)} năm kể từ QĐ phê duyệt (tối đa ${maxYears} năm)`,
            recommendation: yearsSince > maxYears ? 'Xin gia hạn thời gian bố trí vốn hoặc điều chỉnh dự án' : undefined,
            source: 'rule',
        });
    }

    // 4. PCCC
    const pcccApproval = (project as any).Approvals?.find((a: any) => a.ApprovalType === 'pccc');
    checks.push({
        id: 'pccc',
        regulation: 'QCVN 06:2022/BXD',
        article: 'Phòng cháy chữa cháy',
        requirement: 'Phải có thẩm duyệt PCCC',
        status: pcccApproval?.DocumentNumber ? 'passed' : 'pending',
        detail: pcccApproval?.DocumentNumber
            ? `Số ${pcccApproval.DocumentNumber} ngày ${pcccApproval.DocumentDate || 'N/A'}`
            : 'Chưa có thẩm duyệt PCCC',
        recommendation: !pcccApproval?.DocumentNumber ? 'Lập hồ sơ thẩm duyệt PCCC' : undefined,
        source: 'rule',
    });

    // 5. Đánh giá tác động môi trường
    const envApproval = (project as any).Approvals?.find((a: any) => a.ApprovalType === 'environment');
    checks.push({
        id: 'environmental',
        regulation: 'Luật BVMT 2020',
        article: 'Điều 30-34',
        requirement: 'Phải có ĐTM hoặc Cam kết BVMT',
        status: envApproval?.DocumentNumber ? 'passed' : 'warning',
        detail: envApproval?.DocumentNumber
            ? `Số ${envApproval.DocumentNumber} (${envApproval.ExtraInfo || 'ĐTM'})`
            : 'Chưa có ĐTM / Cam kết BVMT',
        recommendation: !envApproval?.DocumentNumber ? 'Lập báo cáo ĐTM theo Luật BVMT 2020' : undefined,
        source: 'rule',
    });

    // 6. Giấy phép xây dựng
    if (project.Status === ProjectStatus.Execution) {
        const permitApproval = (project as any).Approvals?.find((a: any) => a.ApprovalType === 'construction_permit');
        checks.push({
            id: 'construction_permit',
            regulation: 'TT 24/2025/TT-BXD',
            article: 'Giấy phép xây dựng',
            requirement: 'Phải có GPXD trước khi khởi công',
            status: permitApproval?.DocumentNumber ? 'passed' : 'warning',
            detail: permitApproval?.DocumentNumber
                ? `Số ${permitApproval.DocumentNumber} ngày ${permitApproval.DocumentDate || 'N/A'}`
                : 'Chưa ghi nhận GPXD',
            recommendation: !permitApproval?.DocumentNumber ? 'Bổ sung GPXD vào hồ sơ' : undefined,
            source: 'rule',
        });
    }

    // 7. Thẩm định thiết kế
    const designAppraisal = (project as any).Approvals?.find((a: any) => a.ApprovalType === 'design_appraisal');
    checks.push({
        id: 'design_appraisal',
        regulation: 'Luật Xây dựng',
        article: 'Điều 82-83',
        requirement: 'Phải có kết quả thẩm định thiết kế',
        status: designAppraisal?.DocumentNumber ? 'passed' : 'pending',
        detail: designAppraisal?.DocumentNumber
            ? `Số ${designAppraisal.DocumentNumber} ngày ${designAppraisal.DocumentDate || 'N/A'}`
            : 'Chưa có kết quả thẩm định',
        source: 'rule',
    });

    return checks;
}

/**
 * Trích xuất điều luật từ cơ sở dữ liệu để làm bằng chứng pháp lý (RAG)
 */
async function enrichCheckWithDBLegalText(check: EnrichedComplianceCheck): Promise<void> {
    try {
        let searchQuery = '';
        if (check.regulation.includes('Đầu tư công') || check.regulation.includes('58/2024')) {
            searchQuery = `Điều ${check.article.replace('Điều ', '').split('-')[0]} đầu tư công`;
        } else if (check.regulation.includes('175/2024')) {
            searchQuery = `Điều ${check.article.replace('Điều ', '').split('-')[0]} BIM`;
        } else if (check.regulation.includes('BVMT') || check.regulation.includes('môi trường')) {
            searchQuery = `Điều ${check.article.replace('Điều ', '').split('-')[0]} đánh giá tác động môi trường`;
        } else if (check.regulation.includes('Xây dựng')) {
            searchQuery = `Điều ${check.article.replace('Điều ', '').split('-')[0]} thẩm định thiết kế`;
        } else {
            searchQuery = `${check.regulation} ${check.article}`;
        }

        if (searchQuery) {
            const articles = await LegalDocumentService.searchArticles(searchQuery);
            if (articles && articles.length > 0) {
                const match = articles[0];
                const cleanContent = match.content || match.full_content || match.summary || '';
                if (cleanContent) {
                    // Loại bỏ thẻ HTML (nếu có)
                    const textOnly = cleanContent.replace(/<[^>]*>/g, '').trim();
                    const snippet = textOnly.length > 350 ? textOnly.slice(0, 350) + '...' : textOnly;
                    
                    check.detail += `\n\n[Trích dẫn CSDL Pháp luật - ${match.document?.code || 'CSDL'}] ${match.title}:\n"${snippet}"`;
                }
            }
        }
    } catch (e) {
        console.warn(`Failed to enrich check ${check.id} with DB legal text:`, e);
    }
}

/**
 * Kiểm tra tuân thủ đầy đủ (rule-based + AI)
 */
export async function checkProjectCompliance(projectId: string): Promise<FullComplianceReport> {
    const project = await ProjectService.getById(projectId);
    if (!project) {
        return { checks: [], complianceScore: 0, summary: 'Không tìm thấy dự án', analyzedAt: new Date() };
    }

    // 1. Rule-based checks
    const ruleChecks = runRuleBasedChecks(project);

    // 2. AI analysis (try, but don't fail if unavailable)
    let aiResult: ComplianceResult = { checks: [], complianceScore: 100, summary: '' };
    try {
        aiResult = await checkCompliance(project);
    } catch (e) {
        console.warn('AI compliance check failed, using rule-based only:', e);
    }

    const aiChecks: EnrichedComplianceCheck[] = aiResult.checks.map(c => ({ ...c, source: 'ai' as const }));

    // Merge: rule checks first, then AI checks that don't overlap
    const ruleIds = new Set(ruleChecks.map(c => c.id));
    const uniqueAiChecks = aiChecks.filter(c => !ruleIds.has(c.id));
    const allChecks = [...ruleChecks, ...uniqueAiChecks];

    // Làm giàu dữ liệu kiểm tra với trích dẫn thực tế từ cơ sở dữ liệu pháp luật
    await Promise.all(allChecks.map(enrichCheckWithDBLegalText));

    // Calculate score
    const violations = allChecks.filter(c => c.status === 'violation').length;
    const warnings = allChecks.filter(c => c.status === 'warning').length;
    const score = Math.max(0, 100 - violations * 15 - warnings * 5);

    return {
        checks: allChecks,
        complianceScore: aiResult.complianceScore || score,
        summary: aiResult.summary || `${allChecks.length} điều kiện kiểm tra: ${violations} vi phạm, ${warnings} cảnh báo`,
        analyzedAt: new Date(),
    };
}

/**
 * Quick compliance check (rule-based only, fast)
 */
export function checkProjectComplianceQuick(project: Project): EnrichedComplianceCheck[] {
    return runRuleBasedChecks(project);
}
