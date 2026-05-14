import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, EmptyState } from '../../../../components/ui';
import { Column } from '../../../../components/ui/DataTable';
import { useAllTasks } from '../../../../hooks/useTasks';
import { TaskStatus, Task } from '../../../../types';

export interface TaskSlideTableProps {
    statusName: string;
}

const TaskSlideTable: React.FC<TaskSlideTableProps> = ({ statusName }) => {
    const navigate = useNavigate();
    const { data: allTasks, isLoading } = useAllTasks();
    const tasks = allTasks || [];

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (statusName === 'Hoàn thành') return t.Status === TaskStatus.Done;
            if (statusName === 'Đang xử lý') return t.Status === TaskStatus.InProgress;
            if (statusName === 'Chờ xử lý') return t.Status === TaskStatus.Todo;
            if (statusName === 'Quá hạn') {
                const due = new Date(t.DueDate);
                return t.Status !== TaskStatus.Done && due < new Date();
            }
            return true;
        });
    }, [tasks, statusName]);

    const columns: Column<Task>[] = [
        {
            key: 'Title',
            header: 'Tên công việc',
            width: '40%',
            render: (value, row) => (
                <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2" title={value}>{value}</p>
                    {row.ProjectName && <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest truncate">{row.ProjectName}</p>}
                </div>
            )
        },
        {
            key: 'Status',
            header: 'Trạng thái',
            width: '20%',
            render: (value) => {
                let color = 'bg-slate-100 text-slate-700 border-slate-200';
                let label = value;
                if (value === TaskStatus.Done) { color = 'bg-emerald-50 text-emerald-700 border-emerald-200'; label = 'Hoàn thành'; }
                else if (value === TaskStatus.InProgress) { color = 'bg-blue-50 text-blue-700 border-blue-200'; label = 'Đang xử lý'; }
                else if (value === TaskStatus.Todo) { color = 'bg-warning-50 text-warning-700 border-warning-200'; label = 'Chờ xử lý'; }
                
                return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${color}`}>
                        {label}
                    </span>
                );
            }
        },
        {
            key: 'DueDate',
            header: 'Hạn chót',
            width: '20%',
            render: (value) => {
                if (!value) return '—';
                const date = new Date(value);
                const isOverdue = date < new Date() && statusName === 'Quá hạn';
                return (
                    <span className={`text-xs ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {date.toLocaleDateString('vi-VN')}
                    </span>
                );
            }
        },
        {
            key: 'AssigneeID',
            header: 'Người PT',
            width: '20%',
            render: (value) => <span className="text-xs text-slate-600 dark:text-slate-400">{value || '—'}</span>
        }
    ];

    if (isLoading) {
        return (
            <div className="p-4 h-full flex flex-col justify-center items-center bg-slate-50/50 dark:bg-slate-">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 h-full flex flex-col bg-slate-50/50 dark:bg-slate-">
            <DataTable
                data={filteredTasks}
                columns={columns}
                keyExtractor={(row) => row.TaskID}
                emptyMessage="Không có công việc nào thỏa mãn bộ lọc"
                onRowClick={(row) => navigate(`/tasks/${row.TaskID}`)}
                compact
                className="flex-1"
                wrapperClassName="h-full flex flex-col"
                maxHeight="calc(100vh - 120px)"
            />
        </div>
    );
};

export default TaskSlideTable;
