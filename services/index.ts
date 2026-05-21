// Export all services
export { api } from './api';
export { ServiceError, toServiceError, type PaginatedResponse, type ServiceQueryParams } from './ServiceError';
export { ProjectService } from './ProjectService';
export { ContractService } from './ContractService';
export { EmployeeService } from './EmployeeService';
export { ContractorService } from './ContractorService';
export { DocumentService } from './DocumentService';
export { PaymentService } from './PaymentService';
export { AuthService } from './AuthService';
export { TaskService } from './TaskService';
export { WorkflowTemplateService } from './WorkflowTemplateService';
export { DashboardService } from './DashboardService';
export { CDEService } from './CDEService';
export { CapitalService } from './CapitalService';
export { NationalGatewayService } from './NationalGatewayService';
export { SiteClearanceService } from './SiteClearanceService';
export { PublicAssetService } from './PublicAssetService';

// AI Services
export {
    sendMessageToGemini,
    analyzeRisks,
    draftDocument,
    generateSummary,
    generateProjectSummary,
    checkCompliance,
    forecastProgress,
    isAIAvailable,
} from './aiService';
export type {
    ChatMessage,
    RiskItem,
    RiskAnalysisResult,
    ComplianceCheck,
    ComplianceResult,
    ForecastResult,
} from './aiService';
