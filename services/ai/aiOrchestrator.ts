// AI Orchestrator — Gemini function calling loop
// Flow: User → Gemini Chat Session → Tool calls → Execute → Loop → Response

import { getGenerativeModel, generateContent } from './geminiProxy';
import { AI_TOOLS_GEMINI } from './aiTools';
import { buildSystemPrompt } from './prompts';
import { ProjectService } from '../ProjectService';
import { ContractService } from '../ContractService';
import { PaymentService } from '../PaymentService';
import { DashboardService } from '../DashboardService';
import { TaskService } from '../TaskService';
import { LegalDocumentService } from '../LegalDocumentService';
import { supabase } from '../../lib/supabase';
import type { ChatMessage } from '../aiService';
import { FunctionCall, FunctionResponse, Part } from '@google/generative-ai';

// Từ khóa gợi ý câu hỏi cần dữ liệu thực
const DATA_KEYWORDS = [
    'dự án', 'hợp đồng', 'thanh toán', 'giải ngân', 'tiến độ', 'vốn',
    'rủi ro', 'deadline', 'hết hạn', 'gói thầu', 'nhà thầu', 'kế hoạch',
    'số liệu', 'thống kê', 'tổng quan', 'bao nhiêu', 'danh sách', 'liệt kê',
    'project', 'contract', 'payment', 'risk', 'budget', 'tổng mức',
    'luật', 'quy định', 'nghị định', 'thông tư', 'điều khoản', 'tờ trình',
    'tạo việc', 'thêm việc', 'giao việc', 'công việc', 'task', 'phân công',
];

function needsDataQuery(message: string): boolean {
    const lower = message.toLowerCase();
    return DATA_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Function executor ─────────────────────────────────────────────

async function executeFunctionCall(
    name: string,
    args: Record<string, unknown>
): Promise<unknown> {
    try {
        switch (name) {
            case 'get_all_projects': {
                const params: { search?: string; filters?: Record<string, unknown> } = {};
                if (args.search) params.search = args.search as string;
                const filters: Record<string, unknown> = {};
                if (args.status) filters.status = Number(args.status);
                if (args.board) filters.board = Number(args.board);
                if (Object.keys(filters).length > 0) params.filters = filters;
                const projects = await ProjectService.getAll(params);
                return projects.map(p => ({
                    ProjectID: p.ProjectID,
                    ProjectName: p.ProjectName,
                    GroupCode: p.GroupCode,
                    Status: p.Status,
                    TotalInvestment: p.TotalInvestment,
                    Progress: p.Progress,
                    PaymentProgress: p.PaymentProgress,
                    InvestorName: p.InvestorName,
                    ManagementBoard: p.ManagementBoard,
                    CurrentStatusCode: p.CurrentStatusCode,
                }));
            }

            case 'get_project_by_id': {
                const project = await ProjectService.getById(args.projectId as string);
                return project || { error: 'Không tìm thấy dự án' };
            }

            case 'get_project_statistics': {
                return await ProjectService.getStatistics();
            }

            case 'get_all_contracts': {
                const params: { filters?: Record<string, unknown> } = {};
                if (args.status) params.filters = { status: Number(args.status) };
                const contracts = await ContractService.getAll(params);
                return contracts.map(c => ({
                    ContractID: c.ContractID,
                    ContractName: c.ContractName,
                    Value: c.Value,
                    Status: c.Status,
                    SignDate: c.SignDate,
                    EndDate: c.EndDate,
                    AdvanceRate: c.AdvanceRate,
                }));
            }

            case 'get_all_payments': {
                const params: { filters?: Record<string, unknown> } = {};
                if (args.contractId) params.filters = { contractId: args.contractId as string };
                const payments = await PaymentService.getAll(params);
                return payments.map(p => ({
                    PaymentID: p.PaymentID,
                    ContractID: p.ContractID,
                    BatchNo: p.BatchNo,
                    Type: p.Type,
                    Amount: p.Amount,
                    Status: p.Status,
                }));
            }

            case 'get_dashboard_metrics': {
                const year = (args.year as number) || new Date().getFullYear();
                return await DashboardService.getOverviewMetrics(year);
            }

            case 'get_capital_info': {
                return await ProjectService.getCapitalInfo(args.projectId as string);
            }

            case 'get_dashboard_risks': {
                return await DashboardService.getRisks();
            }

            case 'get_upcoming_deadlines': {
                const days = (args.days as number) || 30;
                const today = new Date().toISOString().split('T')[0];
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + days);
                const futureDateStr = futureDate.toISOString().split('T')[0];

                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('id, title, project_id, due_date, status, priority')
                    .not('due_date', 'is', null)
                    .not('status', 'in', '("done","completed")')
                    .lte('due_date', futureDateStr)
                    .gte('due_date', today)
                    .order('due_date', { ascending: true })
                    .limit(20);

                const projects = await ProjectService.getAll();
                const projectNameMap: Record<string, string> = {};
                projects.forEach(p => { projectNameMap[p.ProjectID] = p.ProjectName; });

                return (tasks || []).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    projectName: projectNameMap[t.project_id] || t.project_id,
                    dueDate: t.due_date,
                    daysLeft: Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 86400000),
                    status: t.status,
                    priority: t.priority,
                }));
            }

            case 'get_project_tasks': {
                const projectId = args.projectId as string;
                if (!projectId) return { error: 'projectId là bắt buộc' };

                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('id, title, status, priority, progress, due_date, phase, step_code')
                    .eq('project_id', projectId)
                    .is('parent_id', null)
                    .order('sort_order', { ascending: true })
                    .limit(50);

                const statusMap: Record<string, string> = {
                    todo: 'Chưa làm', in_progress: 'Đang làm',
                    review: 'Đang duyệt', done: 'Hoàn thành', completed: 'Hoàn thành',
                };
                return (tasks || []).map((t: any) => ({
                    ...t,
                    statusLabel: statusMap[t.status] || t.status,
                }));
            }

            case 'get_contract_expiry': {
                const withinDays = (args.days as number) || 60;
                const today = new Date().toISOString().split('T')[0];
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + withinDays);
                const futureDateStr = futureDate.toISOString().split('T')[0];

                const contracts = await ContractService.getAll();
                const expiring = contracts.filter(c => {
                    if (!c.EndDate || c.Status === 3) return false;
                    const end = c.EndDate.split('T')[0];
                    return end >= today && end <= futureDateStr;
                });

                return expiring.map(c => ({
                    ContractID: c.ContractID,
                    ContractName: c.ContractName,
                    Value: c.Value,
                    EndDate: c.EndDate,
                    daysLeft: Math.ceil((new Date(c.EndDate ?? '').getTime() - Date.now()) / 86400000),
                }));
            }

            case 'get_bidding_packages': {
                if (args.projectId) {
                    return await ProjectService.getPackagesByProject(args.projectId as string);
                }
                return await ProjectService.getAllBiddingPackages();
            }

            case 'search_regulations': {
                const query = args.query as string;
                const documentId = args.documentId as string | undefined;
                if (!query) return { error: 'query là bắt buộc' };
                const results = await LegalDocumentService.searchArticles(query, documentId);
                return results.map(r => ({
                    id: r.id,
                    articleCode: r.code,
                    articleTitle: r.title,
                    summary: r.summary,
                    content: r.content || r.full_content,
                    documentCode: r.document?.code,
                    documentTitle: r.document?.short_title || r.document?.title,
                }));
            }

            case 'create_project_task': {
                const projectId = args.projectId as string;
                const title = args.title as string;
                if (!projectId || !title) return { error: 'projectId và title là bắt buộc' };

                const taskPayload: any = {
                    project_id: projectId,
                    title: title,
                    task_type: 'project',
                    status: 'todo',
                    priority: (args.priority as string) || 'medium',
                };
                if (args.dueDate) {
                    taskPayload.due_date = args.dueDate as string;
                }

                const createdTask = await TaskService.createTask(taskPayload);
                return {
                    success: true,
                    message: `Đã tạo công việc thành công: "${createdTask.title}"`,
                    action: 'create_task_success',
                    task: {
                        id: createdTask.id,
                        title: createdTask.title,
                        status: createdTask.status,
                        priority: createdTask.priority,
                        dueDate: createdTask.due_date,
                    }
                };
            }

            default:
                return { error: `Unknown function: ${name}` };
        }
    } catch (error) {
        console.error(`Error executing function ${name}:`, error);
        return { error: `Lỗi truy vấn dữ liệu: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
}

export async function sendContextAwareMessage(
    history: ChatMessage[],
    newMessage: string,
    currentProjectId?: string | null
): Promise<string> {
    const useTools = needsDataQuery(newMessage);

    // Initialize Generative Model with tools and system instruction
    const model = getGenerativeModel({
        tools: useTools ? AI_TOOLS_GEMINI : undefined,
        systemInstruction: buildSystemPrompt(currentProjectId),
    });

    const validHistory = history.filter(msg => !msg.isError);
    const firstUserIdx = validHistory.findIndex(m => m.sender === 'user');
    const geminiHistory: { role: string; parts: { text: string }[] }[] = [];
    
    if (firstUserIdx !== -1) {
        let currentRole = 'user';
        let currentText = '';

        for (let i = firstUserIdx; i < validHistory.length; i++) {
            const msg = validHistory[i];
            const role = msg.sender === 'user' ? 'user' : 'model';
            
            if (role === currentRole) {
                currentText += (currentText ? '\n' : '') + msg.text;
            } else {
                geminiHistory.push({
                    role: currentRole,
                    parts: [{ text: currentText }]
                });
                currentRole = role;
                currentText = msg.text;
            }
        }
        
        if (currentText) {
            geminiHistory.push({
                role: currentRole,
                parts: [{ text: currentText }]
            });
        }
        
        // Ensure history ends with 'model' (chat.sendMessage will append 'user')
        if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
            geminiHistory.pop();
        }
    }

    // Create Chat Session
    const chat = model.startChat({
        history: geminiHistory,
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
        }
    });

    // Send the user's message
    let result = await chat.sendMessage(newMessage);
    let calls = result.response.functionCalls();
    let iterations = 0;

    // Function calling loop (with parallel calls support)
    while (calls && calls.length > 0 && iterations < 5) {
        console.log(`[AI] Parallel Function Calls: ${calls.map(c => c.name).join(', ')}`);
        
        // Execute all function calls in parallel
        const functionResponseParts = await Promise.all(
            calls.map(async (call) => {
                const fnResult = await executeFunctionCall(call.name, call.args as Record<string, unknown>);
                
                // Prepare the response part
                // Gemini's protobuf Struct requires the top level to be an Object, not an Array.
                const responseData = Array.isArray(fnResult) 
                    ? { data: fnResult } 
                    : (typeof fnResult === 'object' && fnResult !== null ? fnResult : { result: fnResult });

                return {
                    functionResponse: {
                        name: call.name,
                        response: responseData as object,
                    }
                } as Part;
            })
        );

        // Send the function results back to Gemini
        result = await chat.sendMessage(functionResponseParts);
        calls = result.response.functionCalls();
        iterations++;
    }

    return result.response.text();
}

// ── Simple analysis (no function calling) ────────────────────────

export async function generateAIAnalysis(
    prompt: string,
    data: unknown,
    responseMimeType?: string
): Promise<string> {
    const fullPrompt = `${prompt}\n\nDữ liệu:\n${JSON.stringify(data, null, 2)}`;
    return generateContent(fullPrompt, {
        temperature: 0.2,
        responseMimeType: responseMimeType,
    });
}

