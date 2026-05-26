// Trọng số theo quy chế
export const NON_DISBURSEMENT_DEPTS = ['HCTH', 'KHDT'] as const;

export interface ScoringWeights {
  a_max: number;  // Nhóm A tổng
  b_max: number;  // Nhóm B tổng
  c_max: number;  // Nhóm C tổng
}

export const DEPT_WEIGHTS: Record<'disbursement' | 'non_disbursement', ScoringWeights> = {
  disbursement:     { a_max: 40, b_max: 40, c_max: 20 },
  non_disbursement: { a_max: 65, b_max: 0,  c_max: 35 },
};

export const INDIV_WEIGHTS: Record<'disbursement' | 'non_disbursement', ScoringWeights> = {
  disbursement:     { a_max: 40, b_max: 30, c_max: 30 },
  non_disbursement: { a_max: 55, b_max: 0,  c_max: 45 },
};

// Auto-score formulas (Điều 17)
export function calcA1Score(completionRate: number): number {
  if (completionRate >= 95) return 20;
  if (completionRate >= 80) return 16;
  if (completionRate >= 60) return 12;
  if (completionRate >= 40) return 8;
  return 4;
}

export function calcA3Score(onTimeRate: number): number {
  if (onTimeRate >= 90) return 10;
  if (onTimeRate >= 70) return 7;
  if (onTimeRate >= 50) return 5;
  return 3;
}

export function calcB1DeptScore(disbRate: number): number {
  if (disbRate >= 95) return 25;
  if (disbRate >= 80) return 20;
  if (disbRate >= 60) return 15;
  if (disbRate >= 40) return 10;
  return 5;
}

export function calcB2DeptScore(targetRate: number): number {
  if (targetRate >= 100) return 15;
  if (targetRate >= 80) return 10;
  if (targetRate >= 60) return 7;
  return 3;
}

// Xếp loại (Điều 18)
export type ClassificationLevel = 'xuat_sac' | 'tot' | 'hoan_thanh' | 'khong_hoan_thanh';

export interface ClassificationCondition {
  label: string;
  met: boolean;
}

export interface ClassificationResult {
  level: ClassificationLevel;
  label: string;
  score: number;
  conditions: ClassificationCondition[];
}

export function classifyScore(
  score: number,
  extras: { onTimeRate: number; exceedRate: number; disbRate: number }
): ClassificationResult {
  // Xuất sắc: >=90 + 100% đúng hạn + >=30% vượt yêu cầu + GN >=95%
  const conditions = [
    { label: 'Điểm tổng >= 90', met: score >= 90 },
    { label: '100% đúng hạn', met: extras.onTimeRate >= 100 },
    { label: '>=30% vượt yêu cầu', met: extras.exceedRate >= 30 },
    { label: 'Giải ngân >= 95%', met: extras.disbRate >= 95 },
  ];

  if (score >= 90) {
    const allMet = conditions.every(c => c.met);
    if (allMet) return { level: 'xuat_sac', label: 'Hoàn thành xuất sắc', score, conditions };
    return { level: 'tot', label: 'Hoàn thành tốt', score, conditions };
  }
  if (score >= 70) return { level: 'tot', label: 'Hoàn thành tốt', score, conditions };
  if (score >= 50) return { level: 'hoan_thanh', label: 'Hoàn thành nhiệm vụ', score, conditions };
  return { level: 'khong_hoan_thanh', label: 'Không hoàn thành', score, conditions };
}

// Quota validation (Điều 18.3)
export function validateExcellentQuota(
  excellentCount: number,
  goodCount: number,
  directorApproval: boolean
): { valid: boolean; message: string } {
  const total = excellentCount + goodCount;
  const ratio = total > 0 ? excellentCount / total : 0;
  const limit = directorApproval ? 0.25 : 0.20;
  return {
    valid: ratio <= limit,
    message: ratio > limit
      ? `Vượt hạn ngạch Xuất sắc: ${(ratio * 100).toFixed(0)}% (tối đa ${limit * 100}%)`
      : 'Trong hạn ngạch',
  };
}
