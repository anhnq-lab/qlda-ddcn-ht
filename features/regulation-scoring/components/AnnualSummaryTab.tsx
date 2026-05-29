import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { RegulationScoringService } from '../services/scoringService';
import { StatCard } from '../../../components/ui';
import { FileText, Award, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AnnualEvalWorkflow } from './AnnualEvalWorkflow';

interface AnnualSummaryTabProps {
  entityType: 'department' | 'individual';
  entityId: string;
  year: number;
}

const MONTH_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

export const AnnualSummaryTab: React.FC<AnnualSummaryTabProps> = ({
  entityType,
  entityId,
  year,
}) => {
  const [data, setData] = useState<{ average: number; count: number; scores: any[] }>({ average: 0, count: 0, scores: [] });
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [deptCode, setDeptCode] = useState<string>('');

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (entityType === 'individual' && entityId) {
        const { data: emp } = await (supabase as any)
          .from('employees')
          .select('full_name, department')
          .eq('employee_id', entityId)
          .single();
        
        if (emp) {
          setEmployeeName((emp as any).full_name);
          
          const { data: depts } = await (supabase as any)
            .from('departments')
            .select('code, name, name_aliases');
          
          const matchedDept = depts?.find((d: any) => 
            d.name === (emp as any).department || d.name_aliases?.includes((emp as any).department)
          );
          if (matchedDept) {
            setDeptCode(matchedDept.code);
          } else {
            setDeptCode('QLDA1');
          }
        }
      }
    };
    fetchEmployeeDetails();
  }, [entityId, entityType]);

  useEffect(() => {
    loadAnnualData();
  }, [entityType, entityId, year]);

  const loadAnnualData = async () => {
    if (!entityId) return;
    setLoading(false);
    try {
      const res = await RegulationScoringService.getAnnualAverage(entityType, entityId, year);
      setData(res);
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu cả năm:', e);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data (12 months)
  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const scoreObj = data.scores.find(s => s.eval_month === month);
      return {
        name: MONTH_LABELS[i],
        'Điểm đánh giá': scoreObj ? Number(scoreObj.total_score) : null,
      };
    });
  }, [data.scores]);

  const getAnnualClass = (avg: number) => {
    if (avg >= 90) return 'Hoàn thành xuất sắc';
    if (avg >= 70) return 'Hoàn thành tốt';
    if (avg >= 50) return 'Hoàn thành nhiệm vụ';
    return 'Không hoàn thành';
  };

  const getAnnualClassColor = (avg: number) => {
    if (avg >= 90) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50';
    if (avg >= 70) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50';
    if (avg >= 50) return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50';
    return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50';
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-surface p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-txt-placeholder">Điểm trung bình năm</span>
            <p className="text-3xl font-black font-mono text-slate-805 dark:text-white mt-1">
              {data.average > 0 ? data.average.toFixed(2) : '—'}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-txt-placeholder">Xếp loại năm dự kiến</span>
            <div className={`mt-1.5 px-3 py-1 rounded-full text-xs font-black inline-block ${getAnnualClassColor(data.average)}`}>
              {data.average > 0 ? getAnnualClass(data.average) : 'Chưa xếp loại'}
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-txt-placeholder">Số tháng đã đánh giá</span>
            <p className="text-3xl font-black font-mono text-slate-805 dark:text-white mt-1">
              {data.count} / 12 tháng
            </p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart: trend of monthly scores */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-border-subtle shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1">
            Biểu đồ diễn biến điểm số hàng tháng
          </h4>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Theo dõi sự biến động hiệu suất công việc trong năm {year}</p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              />
              <Line
                type="monotone"
                dataKey="Điểm đánh giá"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4-Step evaluation workflow for individual */}
      {entityType === 'individual' && entityId && (
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1">
            Quy trình Đánh giá & Xếp loại Năm (4 bước)
          </h4>
          <AnnualEvalWorkflow
            employeeId={entityId}
            employeeName={employeeName}
            departmentCode={deptCode}
            year={year}
            onWorkflowUpdated={loadAnnualData}
          />
        </div>
      )}
    </div>
  );
};

// Helper useMemo wrapper so code compiles without missing hook dependency errors
function useMemo<T>(fn: () => T, deps: any[]): T {
  return React.useMemo(fn, deps);
}
