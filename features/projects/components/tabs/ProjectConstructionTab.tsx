import React, { useState, useEffect, useMemo } from 'react';
import { 
  Hammer, Calendar, Users, Wrench, Camera, Plus, CloudSun, 
  ChevronRight, AlertTriangle, CheckCircle2, Info, ArrowRight,
  TrendingUp, Activity, FileText, Trash2, Edit2, ShieldAlert,
  Loader2, Sun, CloudRain, CloudLightning, Cloud, Wind, Upload, Eye, Download,
  Copy
} from 'lucide-react';
import { exportConstructionLogToDocx, exportProgressReportToDocx } from '../../../../utils/exportConstructionLog';
import { 
  useConstructionLogs, 
  useConstructionLogCombined, 
  useSaveConstructionLog, 
  useConstructionPhotos, 
  useUploadConstructionPhoto, 
  useConstructionProgress, 
  useSaveConstructionProgress, 
  useDeleteProgressItem,
  useDeleteConstructionLog,
  useConstructionResourceStats,
  useConstructionKpis
} from '../../../../hooks/useConstruction';
import { ConstructionService } from '../../../../services/ConstructionService';
import { 
  ConstructionLog, 
  ConstructionLogDetail, 
  ConstructionManpower, 
  ConstructionEquipment, 
  ConstructionProgress,
  DailyLogCombinedData,
  ConstructionSitePhoto
} from '../../../../types/construction.types';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../components/ui/Toast';
import { formatCurrency, formatNumber } from '../../../../utils/format';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';

interface Props {
  projectID: string;
  project: any;
}

type SubTab = 'overview' | 'logs' | 'progress' | 'gallery';

export const ProjectConstructionTab: React.FC<Props> = ({ projectID, project }) => {
  const { currentUser: user } = useAuth();
  const { addToast } = useToast();
  const userRole = (user?.Role || (user as any)?.role || '').toLowerCase();
  // Kỹ sư hiện trường, Giám sát, Quản lý, Admin đều có quyền sửa
  const canEdit = ['admin', 'manager', 'director', 'deputy_director', 'super_admin', 'engineer', 'supervisor'].includes(userRole);

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');

  // React Query Hooks
  const { data: logs = [], isLoading: isLogsLoading } = useConstructionLogs(projectID);
  const { data: photos = [], isLoading: isPhotosLoading } = useConstructionPhotos(projectID);
  const { data: progressList = [], isLoading: isProgressLoading } = useConstructionProgress(projectID);

  const saveLogMutation = useSaveConstructionLog(projectID);
  const deleteLogMutation = useDeleteConstructionLog(projectID);
  const uploadPhotoMutation = useUploadConstructionPhoto(projectID);
  const saveProgressMutation = useSaveConstructionProgress(projectID);
  const deleteProgressMutation = useDeleteProgressItem(projectID);

  // New Performance & Resource hooks
  const { data: resourceStats = [], isLoading: isResourceStatsLoading } = useConstructionResourceStats(projectID);
  const { data: dbKpis } = useConstructionKpis(projectID);

  // States
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isEditingLog, setIsEditingLog] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // 7-Day Weather Forecast States
  const [forecastList, setForecastList] = useState<any[]>([]);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  
  // Daily Log Editor Form State
  const [logForm, setLogForm] = useState<DailyLogCombinedData>({
    log: {
      log_id: '',
      project_id: projectID,
      log_date: selectedDate,
      weather_temp: 32,
      weather_desc: 'Nắng nóng',
      weather_wind: 'Gió nhẹ',
      construction_status: 'normal',
      notes: ''
    },
    details: [],
    manpower: [],
    equipment: []
  });

  // Load Combined Log for specific date
  const { data: combinedLog, isLoading: isCombinedLoading } = useConstructionLogCombined(projectID, selectedDate);

  // Autocomplete Suggestions for manpower and equipment
  const historicalManpowerRoles = useMemo(() => {
    const roles = new Set<string>(['Kỹ sư hiện trường', 'Giám sát viên', 'Công nhân xây dựng', 'Thợ cốp pha', 'Thợ cốt thép', 'Thợ điện nước', 'Thợ hàn', 'Thợ sơn']);
    resourceStats.forEach(stat => {
      if (stat.roles) {
        Object.keys(stat.roles).forEach(role => roles.add(role));
      }
    });
    return Array.from(roles);
  }, [resourceStats]);

  // Copy entire previous log's structure to today's log form
  const handleCopyFromYesterday = async () => {
    if (logs.length === 0) {
      addToast({
        title: 'Hủy thao tác',
        message: 'Chưa có nhật ký nào trước đó để sao chép.',
        type: 'warning'
      });
      return;
    }
    
    const sortedLogs = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
    const previousLog = sortedLogs.find(l => l.log_date < selectedDate);
    
    if (!previousLog) {
      addToast({
        title: 'Hủy thao tác',
        message: 'Không tìm thấy nhật ký thi công nào trước ngày được chọn.',
        type: 'warning'
      });
      return;
    }

    setIsFetchingWeather(true);
    try {
      const prevData = await ConstructionService.getDailyLogCombined(projectID, previousLog.log_date);
      if (prevData) {
        setLogForm(prev => ({
          ...prev,
          details: prevData.details.map(d => ({ ...d, detail_id: '', log_id: '' })),
          manpower: prevData.manpower.map(m => ({ ...m, manpower_id: '', log_id: '' })),
          equipment: prevData.equipment.map(e => ({ ...e, equipment_id: '', log_id: '' }))
        }));
        
        addToast({
          title: 'Sao chép thành công',
          message: `Đã điền nhân lực, máy móc và hạng mục từ ngày ${previousLog.log_date}`,
          type: 'success'
        });
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Thất bại',
        message: 'Lỗi khi tải dữ liệu nhật ký cũ.',
        type: 'error'
      });
    } finally {
      setIsFetchingWeather(false);
    }
  };

  // Stacked bar chart keys
  const manpowerKeys = useMemo(() => {
    const keys = new Set<string>();
    resourceStats.forEach(stat => {
      if (stat.roles) {
        Object.keys(stat.roles).forEach(key => keys.add(key));
      }
    });
    return Array.from(keys);
  }, [resourceStats]);

  // Group photos by date
  const groupedPhotos = useMemo(() => {
    const groups: Record<string, ConstructionSitePhoto[]> = {};
    photos.forEach(photo => {
      const dateStr = photo.created_at 
        ? new Date(photo.created_at).toISOString().split('T')[0] 
        : 'Chưa rõ ngày';
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(photo);
    });
    return groups;
  }, [photos]);

  // Trigger when combinedLog changes or is editing
  useEffect(() => {
    if (combinedLog) {
      setLogForm({
        log: { ...combinedLog.log },
        details: [...combinedLog.details],
        manpower: [...combinedLog.manpower],
        equipment: [...combinedLog.equipment]
      });
    } else {
      // Default blank log
      setLogForm({
        log: {
          log_id: '',
          project_id: projectID,
          log_date: selectedDate,
          weather_temp: 32,
          weather_desc: 'Nắng nóng',
          weather_wind: 'Gió nhẹ',
          construction_status: 'normal',
          notes: ''
        },
        details: [
          { detail_id: '', log_id: '', work_item: 'Thi công xây tô cốt thép', status: 'in_progress', safety_status: 'safe' }
        ],
        manpower: [
          { manpower_id: '', log_id: '', role_title: 'Công nhân', quantity: 15 }
        ],
        equipment: [
          { equipment_id: '', log_id: '', equipment_name: 'Xe lu rung', quantity: 1, status: 'active', operating_hours: 8 }
        ]
      });
    }
  }, [combinedLog, selectedDate]);

  // Fetch 7-Day weather forecast based on coordinates
  useEffect(() => {
    const fetchForecast = async () => {
      setIsForecastLoading(true);
      let lat = 18.45; // default Hà Tĩnh
      let lon = 105.25;

      if (project?.coordinates) {
        try {
          const coords = typeof project.coordinates === 'string' 
            ? JSON.parse(project.coordinates) 
            : project.coordinates;
          if (coords.lat || coords.latitude) lat = coords.lat || coords.latitude;
          if (coords.lng || coords.longitude) lon = coords.lng || coords.longitude;
        } catch (e) {
          console.error('Failed to parse coordinates for forecast', e);
        }
      }

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API forecast failed');
        const data = await res.json();
        
        if (data.daily) {
          const days = data.daily.time.map((t: string, idx: number) => {
            const dateObj = new Date(t);
            const weekday = dateObj.toLocaleDateString('vi-VN', { weekday: 'short' });
            const dayLabel = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const code = data.daily.weather_code[idx] || 0;
            const maxTemp = Math.round(data.daily.temperature_2m_max[idx] || 32);
            const minTemp = Math.round(data.daily.temperature_2m_min[idx] || 25);
            
            return {
              dateStr: t,
              weekday,
              dayLabel,
              code,
              maxTemp,
              minTemp
            };
          });
          setForecastList(days);
        }
      } catch (err) {
        console.error('Failed to fetch forecast, using fallbacks', err);
        const today = new Date();
        const fallbackDays = Array.from({ length: 7 }).map((_, idx) => {
          const d = new Date(today);
          d.setDate(today.getDate() + idx + 1);
          const codes = [0, 1, 3, 61, 80, 95, 2];
          
          return {
            dateStr: d.toISOString().split('T')[0],
            weekday: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
            dayLabel: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            code: codes[idx % codes.length],
            maxTemp: 32 + (idx % 3) - (idx % 2),
            minTemp: 25 + (idx % 2)
          };
        });
        setForecastList(fallbackDays);
      } finally {
        setIsForecastLoading(false);
      }
    };

    fetchForecast();
  }, [project?.coordinates]);

  const getForecastRecommendation = (code: number) => {
    switch (code) {
      case 0: case 1: case 2: case 3: 
        return { desc: 'Nắng ráo', rec: 'Thuận lợi', type: 'success' };
      case 45: case 48: 
        return { desc: 'Sương mù', rec: 'Hạn chế', type: 'warning' };
      case 51: case 53: case 55: 
        return { desc: 'Mưa phùn', rec: 'Che chắn', type: 'warning' };
      case 61: case 63: case 65: 
        return { desc: 'Mưa rào', rec: 'Che chắn', type: 'warning' };
      case 80: case 81: case 82: 
        return { desc: 'Mưa lớn', rec: 'Che chắn', type: 'warning' };
      case 95: case 96: case 99: 
        return { desc: 'Giông sét', rec: 'Dừng việc', type: 'danger' };
      default: 
        return { desc: 'Nắng ráo', rec: 'Thuận lợi', type: 'success' };
    }
  };

  // Fetch automatic weather based on project coordinates
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const handleAutoWeather = async () => {
    setIsFetchingWeather(true);
    let lat = 10.762622; // default HCMC
    let lon = 106.660172;

    if (project?.coordinates) {
      try {
        const coords = typeof project.coordinates === 'string' 
          ? JSON.parse(project.coordinates) 
          : project.coordinates;
        if (coords.lat || coords.latitude) lat = coords.lat || coords.latitude;
        if (coords.lng || coords.longitude) lon = coords.lng || coords.longitude;
      } catch (e) {
        console.error('Failed to parse coordinates', e);
      }
    }

    try {
      const weatherData = await ConstructionService.getAutoWeatherData(lat, lon, selectedDate);
      setLogForm(prev => ({
        ...prev,
        log: {
          ...prev.log,
          weather_temp: weatherData.temp,
          weather_desc: weatherData.desc,
          weather_wind: weatherData.wind
        }
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingWeather(false);
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    if (dbKpis) {
      return {
        actualProgress: dbKpis.actual_progress || 0,
        plannedProgress: dbKpis.planned_progress || 0,
        slippage: dbKpis.slippage || 0,
        hasSafetyIssue: dbKpis.has_safety_issue || false,
        recentLogWithIssue: dbKpis.recent_safety_notes ? { safety_notes: dbKpis.recent_safety_notes } : null
      };
    }

    const totalWeight = progressList.reduce((sum, item) => sum + Number(item.weight_percent || 0), 0);
    
    // Weighted Actual Progress
    const actualProgress = progressList.reduce((sum, item) => {
      const weight = Number(item.weight_percent || 0);
      const actual = Number(item.actual_percent || 0);
      return sum + (weight * actual) / 100;
    }, 0);

    // Weighted Planned Progress
    const plannedProgress = progressList.reduce((sum, item) => {
      const weight = Number(item.weight_percent || 0);
      const planned = Number(item.planned_percent || 0);
      return sum + (weight * planned) / 100;
    }, 0);

    const slippage = actualProgress - plannedProgress;

    // Safety and HSE status from recent logs
    let hasSafetyIssue = false;
    let recentLogWithIssue = null;
    if (combinedLog?.details) {
      const issue = combinedLog.details.find(d => d.safety_status !== 'safe');
      if (issue) {
        hasSafetyIssue = true;
        recentLogWithIssue = issue;
      }
    }

    return {
      actualProgress: totalWeight > 0 ? (actualProgress / (totalWeight / 100)) : 0,
      plannedProgress: totalWeight > 0 ? (plannedProgress / (totalWeight / 100)) : 0,
      slippage,
      hasSafetyIssue,
      recentLogWithIssue
    };
  }, [progressList, combinedLog, dbKpis]);

  // Recharts S-Curve Data Generation
  const chartData = useMemo(() => {
    if (progressList.length === 0) return [];
    
    // Mock S-Curve projection by dates
    const dataPoints = [
      { name: 'Khởi công', KeHoach: 0, ThucTe: 0 },
      { name: 'Móng & Hầm', KeHoach: 15, ThucTe: 13 },
      { name: 'Kết cấu sàn T3', KeHoach: 35, ThucTe: 32 },
      { name: 'Cất nóc BT', KeHoach: 60, ThucTe: kpis.actualProgress * 0.8 },
      { name: 'Hiện tại', KeHoach: kpis.plannedProgress, ThucTe: kpis.actualProgress },
      { name: 'Hoàn thiện', KeHoach: 85, ThucTe: null },
      { name: 'Bàn giao', KeHoach: 100, ThucTe: null }
    ];

    return dataPoints;
  }, [progressList, kpis]);

  // Daily Log Handlers
  const handleSaveLog = async () => {
    await saveLogMutation.mutateAsync(logForm);
    setIsEditingLog(false);
  };

  // Site Photo Upload Handler
  const [photoCaption, setPhotoCaption] = useState('');
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadPhotoMutation.mutateAsync({
      file,
      caption: photoCaption || 'Hình ảnh hiện trường thi công',
      logId: combinedLog?.log?.log_id
    });
    setPhotoCaption('');
  };

  // Progress WBS Handlers
  const [isAddingWbs, setIsAddingWbs] = useState(false);
  const [newWbs, setNewWbs] = useState<Partial<ConstructionProgress>>({
    task_name: '',
    planned_start_date: new Date().toISOString().split('T')[0],
    planned_end_date: '',
    weight_percent: 10,
    planned_percent: 0,
    actual_percent: 0,
    status: 'pending',
    notes: ''
  });

  const handleAddWbs = async () => {
    if (!newWbs.task_name) return;
    const item: ConstructionProgress = {
      progress_id: '',
      project_id: projectID,
      task_name: newWbs.task_name,
      planned_start_date: newWbs.planned_start_date,
      planned_end_date: newWbs.planned_end_date,
      weight_percent: Number(newWbs.weight_percent || 0),
      planned_percent: Number(newWbs.planned_percent || 0),
      actual_percent: Number(newWbs.actual_percent || 0),
      status: newWbs.status as any,
      notes: newWbs.notes || '',
      sort_order: progressList.length + 1
    };

    await saveProgressMutation.mutateAsync([...progressList, item]);
    setIsAddingWbs(false);
    setNewWbs({
      task_name: '',
      planned_start_date: new Date().toISOString().split('T')[0],
      planned_end_date: '',
      weight_percent: 10,
      planned_percent: 0,
      actual_percent: 0,
      status: 'pending',
      notes: ''
    });
  };

  const handleProgressChange = (index: number, field: keyof ConstructionProgress, value: any) => {
    const updated = [...progressList];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    // Sync status based on %
    if (field === 'actual_percent') {
      const pct = Number(value);
      if (pct === 100) updated[index].status = 'completed';
      else if (pct > 0) updated[index].status = 'in_progress';
      else updated[index].status = 'pending';
    }
    saveProgressMutation.mutate(updated);
  };

  // ── PROGRESS TEMPLATES & IMPORT WORKFLOW ──
  const PROGRESS_TEMPLATES = {
    infrastructure: {
      name: "Mẫu Gói San lấp & Hạ tầng kỹ thuật (Đường, Đê kè, Nền cốt)",
      tasks: [
        { task_name: "Phát quang mặt bằng & Dọn dẹp chướng ngại vật hữu cơ", durationDays: 10, weight_percent: 10, planned_percent: 100, actual_percent: 100, status: "completed", notes: "Đã hoàn thành nghiệm thu bàn giao" },
        { task_name: "Bóc đất hữu cơ hiện trạng cự ly đổ thải quy hoạch 3km", durationDays: 15, weight_percent: 20, planned_percent: 100, actual_percent: 100, status: "completed", notes: "Sử dụng máy đào 1.25m3 kết hợp xe tự đổ 15 tấn" },
        { task_name: "Thi công đắp đất nền đường K95 mỏ đất đồi cự ly 5km", durationDays: 30, weight_percent: 35, planned_percent: 100, actual_percent: 85, status: "in_progress", notes: "Nhà thầu đang tập trung lu lèn bù tiến độ" },
        { task_name: "Lu lèn hoàn thiện lớp nền đắp K98 đạt dung trọng kỹ thuật", durationDays: 15, weight_percent: 15, planned_percent: 80, actual_percent: 60, status: "in_progress", notes: "Lu lèn cuốn chiếu theo các phân đoạn nghiệm thu" },
        { task_name: "Thi công rải cấp phối đá dăm loại 1 hoàn thiện mặt đường", durationDays: 20, weight_percent: 15, planned_percent: 20, actual_percent: 0, status: "pending", notes: "Chờ nghiệm thu lớp móng lu lèn K98" },
        { task_name: "Hoàn thiện hệ thống an toàn giao thông, sơn vạch kẻ đường", durationDays: 7, weight_percent: 5, planned_percent: 0, actual_percent: 0, status: "pending", notes: "Bàn giao kỹ thuật sau khi thảm nhựa hoàn thành" }
      ]
    },
    building: {
      name: "Mẫu Gói Xây dựng Toà nhà cao tầng & Hoàn thiện cơ bản",
      tasks: [
        { task_name: "Ép cọc thí nghiệm nén tĩnh & Ép cọc đại trà BTCT D350", durationDays: 25, weight_percent: 15, planned_percent: 100, actual_percent: 100, status: "completed", notes: "Hoàn thành ép cọc thử tải đạt lực thiết kế" },
        { task_name: "Đào móng đài giằng, thi công đập đầu cọc & đổ bê tông lót móng", durationDays: 20, weight_percent: 15, planned_percent: 100, actual_percent: 100, status: "completed", notes: "Cao độ đáy móng đạt tiêu chuẩn thiết kế" },
        { task_name: "Gia công lắp dựng thép móng giằng & Đổ bê tông đài giằng móng hầm", durationDays: 30, weight_percent: 20, planned_percent: 100, actual_percent: 90, status: "in_progress", notes: "Đang tiến hành bảo dưỡng bê tông đài móng" },
        { task_name: "Thi công kết cấu dầm sàn và cột bê tông cốt thép tầng trệt", durationDays: 25, weight_percent: 20, planned_percent: 80, actual_percent: 75, status: "in_progress", notes: "Đang lắp dựng cốt thép dầm sàn tầng trệt" },
        { task_name: "Thi công kết cấu dầm sàn và cột bê tông cốt thép Tầng 2", durationDays: 25, weight_percent: 15, planned_percent: 30, actual_percent: 10, status: "in_progress", notes: "Đang dựng cốp pha cột tầng 2" },
        { task_name: "Xây tường bao gạch không nung & Tô trát tường trong ngoài nhà", durationDays: 30, weight_percent: 10, planned_percent: 0, actual_percent: 0, status: "pending", notes: "Chờ tháo cốp pha sàn tầng trệt chịu lực" },
        { task_name: "Sơn bả matit hoàn thiện & Sơn phủ màu nước kiến trúc bề mặt", durationDays: 15, weight_percent: 5, planned_percent: 0, actual_percent: 0, status: "pending", notes: "Triển khai sau khi lớp trát tường đạt độ ẩm < 18%" }
      ]
    },
    technology: {
      name: "Mẫu Gói Cơ điện M&E & Lắp đặt Thiết bị công nghệ chuyên dụng",
      tasks: [
        { task_name: "Gia công bồn công nghệ chuyên dụng tại xưởng, sơn lót epoxy", durationDays: 20, weight_percent: 20, planned_percent: 100, actual_percent: 100, status: "completed", notes: "Đã hoàn thành nghiệm thu tĩnh tại xưởng sản xuất" },
        { task_name: "Vận chuyển bồn công nghệ về công trường, định vị lắp đặt móng đỡ", durationDays: 15, weight_percent: 15, planned_percent: 100, actual_percent: 100, status: "completed", notes: "Đã hoàn thành siết lực bu lông móng bệ" },
        { task_name: "Lắp đặt hệ thống đường ống công nghệ inox SUS 316 trục chính", durationDays: 30, weight_percent: 25, planned_percent: 90, actual_percent: 80, status: "in_progress", notes: "Đang hàn siêu âm các mối nối khớp cong" },
        { task_name: "Lắp đặt thiết bị động lực máy bơm nước sạch, van điều khiển", durationDays: 20, weight_percent: 15, planned_percent: 70, actual_percent: 50, status: "in_progress", notes: "Cân chỉnh đồng tâm trục bơm máy bơm ly tâm chính" },
        { task_name: "Lắp máng cáp điều khiển, rải cáp động lực & đấu nối tủ điện PLC", durationDays: 20, weight_percent: 15, planned_percent: 30, actual_percent: 0, status: "pending", notes: "Đang đo điện trở cách điện của cáp động lực chính" },
        { task_name: "Kiểm tra đơn động không tải, chạy thử nghiệm liên động toàn hệ thống", durationDays: 10, weight_percent: 10, planned_percent: 0, actual_percent: 0, status: "pending", notes: "Phê duyệt kế hoạch nghiệm thu kỹ thuật" }
      ]
    }
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'template' | 'file'>('template');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'infrastructure' | 'building' | 'technology'>('infrastructure');
  const [importPreviewList, setImportPreviewList] = useState<ConstructionProgress[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');

  const handleLoadTemplate = (key: 'infrastructure' | 'building' | 'technology') => {
    setSelectedTemplateKey(key);
    const template = PROGRESS_TEMPLATES[key];
    const today = new Date();
    
    const preparedTasks = template.tasks.map((task, idx) => {
      const start = new Date(today);
      start.setDate(today.getDate() + idx * 5);
      const end = new Date(start);
      end.setDate(start.getDate() + task.durationDays);

      return {
        progress_id: '',
        project_id: projectID,
        contract_id: undefined,
        task_name: task.task_name,
        planned_start_date: start.toISOString().split('T')[0],
        planned_end_date: end.toISOString().split('T')[0],
        actual_start_date: start.toISOString().split('T')[0],
        actual_end_date: undefined,
        weight_percent: task.weight_percent,
        planned_percent: task.planned_percent,
        actual_percent: task.actual_percent,
        status: task.status as any,
        notes: task.notes,
        sort_order: idx + 1
      };
    });

    setImportPreviewList(preparedTasks);
  };

  const handleSimulateCsvUpload = () => {
    const defaultCsv = `Tên hạng mục thi công,Thời gian (ngày),Trọng số (%),Tiến độ KH (%),Tiến độ TT (%),Ghi chú WBS
Gia công lắp dựng cốt thép dầm sàn móng hầm,15,20,100,100,Đã nghiệm thu cốt thép và ván khuôn móng hầm
Đổ bê tông sàn móng hầm chính phân khu A,3,15,100,100,Sử dụng bê tông thương phẩm mác 350 R7
Thi công cột vách tầng hầm lên sàn trệt,12,15,100,80,Đang lắp cốp pha cột và thép vách vây
Lắp dựng đà giáo cốp pha chịu lực sàn trệt,10,20,80,60,Lắp dựng xong 70% diện tích ván khuôn sàn
Đổ bê tông dầm sàn tầng trệt (Tầng 1),5,15,20,0,Chuẩn bị xe bơm cần tự hành trục chính
Thi công xây tường bao gạch ống tầng hầm,20,10,0,0,Chờ tháo cốp pha dầm sàn hầm chịu lực
Lắp đặt đường ống thoát nước kỹ thuật tầng hầm,10,5,0,0,Thi công song song cùng hoàn thiện móng hầm`;

    setCsvContent(defaultCsv);
    const lines = defaultCsv.split('\n').slice(1);
    const today = new Date();
    const parsed = lines.filter(l => l.trim().length > 0).map((line, idx) => {
      const parts = line.split(',');
      const name = parts[0] || 'Công việc mới';
      const duration = Number(parts[1] || 10);
      const weight = Number(parts[2] || 10);
      const planned = Number(parts[3] || 0);
      const actual = Number(parts[4] || 0);
      const notes = parts[5] || '';

      const start = new Date(today);
      start.setDate(today.getDate() + idx * 4);
      const end = new Date(start);
      end.setDate(start.getDate() + duration);

      return {
        progress_id: '',
        project_id: projectID,
        contract_id: undefined,
        task_name: name,
        planned_start_date: start.toISOString().split('T')[0],
        planned_end_date: end.toISOString().split('T')[0],
        actual_start_date: start.toISOString().split('T')[0],
        actual_end_date: undefined,
        weight_percent: weight,
        planned_percent: planned,
        actual_percent: actual,
        status: (actual === 100 ? 'completed' : actual > 0 ? 'in_progress' : 'pending') as any,
        notes: notes,
        sort_order: idx + 1
      };
    });

    setImportPreviewList(parsed);
  };

  const handleConfirmImport = async () => {
    if (importPreviewList.length === 0) return;
    await saveProgressMutation.mutateAsync(importPreviewList);
    setIsImportModalOpen(false);
  };

  // Weather Icons Mapper
  const getWeatherIcon = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('mưa rào') || d.includes('mưa lớn')) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (d.includes('mưa phùn') || d.includes('mưa nhẹ')) return <Cloud className="w-5 h-5 text-blue-400" />;
    if (d.includes('giông') || d.includes('sấm sét')) return <CloudLightning className="w-5 h-5 text-amber-500 animate-bounce" />;
    if (d.includes('quang') || d.includes('nắng')) return <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />;
    return <CloudSun className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-Tab Navigation ── */}
      <div className="flex items-center justify-between border-b border-border bg-bg-surface p-1 rounded-2xl shadow-sm">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'TỔNG QUAN', icon: TrendingUp },
            { id: 'logs', label: 'NHẬT KÝ THI CÔNG', icon: Calendar },
            { id: 'progress', label: 'TIẾN ĐỘ NHÀ THẦU', icon: Activity },
            { id: 'gallery', label: 'ẢNH CÔNG TRƯỜNG', icon: Camera }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as SubTab)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-sm' 
                    : 'text-txt-muted hover:text-txt-primary hover:bg-bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-xs bg-bg-muted/50 text-txt-secondary font-bold">
          <Hammer className="w-3.5 h-3.5 text-primary-500 animate-bounce" />
          Giai đoạn: Thi công xây dựng
        </div>
      </div>

      {/* ── SUB-TAB: OVERVIEW ── */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* KPI Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Actual progress */}
            <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-txt-muted uppercase tracking-wider">Tiến độ thực tế</span>
                <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Activity className="w-5 h-5" /></span>
              </div>
              <h4 className="text-3xl font-black text-emerald-500">{kpis.actualProgress.toFixed(1)}%</h4>
              <p className="text-[10px] text-txt-muted mt-2 font-bold">LŨY KẾ TIẾN ĐỘ VẬT LÝ THI CÔNG</p>
            </div>

            {/* Planned progress */}
            <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-txt-muted uppercase tracking-wider">Tiến độ kế hoạch</span>
                <span className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><TrendingUp className="w-5 h-5" /></span>
              </div>
              <h4 className="text-3xl font-black text-blue-500">{kpis.plannedProgress.toFixed(1)}%</h4>
              <p className="text-[10px] text-txt-muted mt-2 font-bold">THEO HỢP ĐỒNG & WBS PHÊ DUYỆT</p>
            </div>

            {/* Slippage */}
            <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-txt-muted uppercase tracking-wider">Mức độ lệch tiến độ</span>
                <span className={`p-2 rounded-xl ${kpis.slippage >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </span>
              </div>
              <h4 className={`text-3xl font-black ${kpis.slippage >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {kpis.slippage >= 0 ? `+${kpis.slippage.toFixed(1)}%` : `${kpis.slippage.toFixed(1)}%`}
              </h4>
              <p className="text-[10px] text-txt-muted mt-2 font-bold">
                {kpis.slippage >= 0 ? 'ĐANG VƯỢT TIẾN ĐỘ ĐỀ RA' : 'ĐANG CHẬM HƠN SO VỚI KẾ HOẠCH'}
              </p>
            </div>

            {/* HSE & Safety */}
            <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-txt-muted uppercase tracking-wider">An toàn lao động</span>
                <span className={`p-2 rounded-xl ${kpis.hasSafetyIssue ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>
              <h4 className={`text-2xl font-black ${kpis.hasSafetyIssue ? 'text-amber-500' : 'text-emerald-500'}`}>
                {kpis.hasSafetyIssue ? 'Có cảnh báo' : 'An toàn tuyệt đối'}
              </h4>
              <p className="text-[10px] text-txt-muted mt-2 font-bold">
                {kpis.hasSafetyIssue ? `SỰ CỐ: ${kpis.recentLogWithIssue?.safety_notes || 'Ghi nhận sự cố'}` : 'KHÔNG GHI NHẬN SỰ CỐ AN TOÀN'}
              </p>
            </div>
          </div>

          {/* S-Curve Chart */}
          <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-txt-primary mb-4 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              Đường cong Tiến độ Lũy kế S-Curve
            </h3>
            <div className="h-80 w-full">
              {progressList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-txt-muted">
                  <Activity className="w-8 h-8" />
                  <p className="text-xs">Chưa có dữ liệu tiến độ nhà thầu để vẽ biểu đồ.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorKeHoach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorThucTe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-txt-muted)" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <YAxis stroke="var(--color-txt-muted)" style={{ fontSize: '10px', fontWeight: 'bold' }} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Area type="monotone" name="Tiến độ Kế hoạch (%)" dataKey="KeHoach" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorKeHoach)" />
                    <Area type="monotone" name="Tiến độ Thực tế (%)" dataKey="ThucTe" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorThucTe)" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 7-Day Weather Forecast Widget */}
          <div className="bg-bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-txt-primary uppercase tracking-wider flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-primary-500 animate-pulse" />
                Dự báo thời tiết 7 ngày & Khuyến nghị thi công
              </h3>
              <span className="text-[10px] text-txt-muted font-bold">Open-Meteo API</span>
            </div>
            
            {isForecastLoading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-txt-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                Đang nạp dữ liệu dự báo...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {forecastList.slice(0, 7).map((day, idx) => {
                  const info = getForecastRecommendation(day.code);
                  return (
                    <div 
                      key={day.dateStr || idx}
                      className="bg-bg-muted/20 border border-border/30 rounded-xl p-2.5 flex flex-col items-center text-center justify-between min-h-[120px] transition-all hover:bg-bg-muted/40 hover:border-primary-500/20"
                    >
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-txt-muted uppercase tracking-wider leading-none">{day.weekday}</p>
                        <p className="text-[10px] font-black text-txt-primary">{day.dayLabel}</p>
                      </div>
                      
                      <div className="my-1 flex items-center justify-center">
                        {getWeatherIcon(info.desc)}
                      </div>
                      
                      <div className="space-y-1.5 w-full flex flex-col items-center">
                        <p className="text-[10px] font-black text-txt-secondary leading-none">{day.minTemp}° - {day.maxTemp}°C</p>
                        
                        <span className={`inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                          info.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20' :
                          info.type === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20' :
                          'bg-red-500/10 text-red-600 dark:bg-red-500/20 font-bold animate-pulse'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            info.type === 'success' ? 'bg-emerald-500' :
                            info.type === 'warning' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`} />
                          {info.rec}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick summary view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent logs */}
            <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-txt-primary uppercase tracking-wider mb-3 flex items-center justify-between">
                Nhật ký hiện trường gần đây
                <button onClick={() => setActiveSubTab('logs')} className="text-[10px] text-primary-500 hover:underline flex items-center gap-1">Xem tất cả <ChevronRight className="w-3.5 h-3.5" /></button>
              </h3>
              <div className="space-y-3">
                {logs.slice(0, 3).map(l => (
                  <div key={l.log_id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-bg-muted rounded-lg">{getWeatherIcon(l.weather_desc || '')}</div>
                      <div>
                        <p className="text-xs font-bold text-txt-primary">{new Date(l.log_date).toLocaleDateString('vi-VN')}</p>
                        <p className="text-[10px] text-txt-muted">{l.weather_desc} · {l.weather_temp}°C</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      l.construction_status === 'normal' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20' 
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {l.construction_status === 'normal' ? 'Bình thường' : 'Tạm dừng'}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-xs text-txt-muted text-center py-4">Chưa có nhật ký ghi nhận.</p>}
              </div>
            </div>

            {/* Safety & Equipment */}
            <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-txt-primary uppercase tracking-wider mb-3 flex items-center justify-between">
                Máy móc đang hoạt động hôm nay
                <button onClick={() => setActiveSubTab('logs')} className="text-[10px] text-primary-500 hover:underline">Chi tiết nhật ký</button>
              </h3>
              <div className="space-y-2">
                {combinedLog?.equipment?.map(e => (
                  <div key={e.equipment_id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-txt-muted" />
                      <span className="font-bold text-txt-primary">{e.equipment_name}</span>
                    </div>
                    <span className="font-bold text-txt-secondary">{e.quantity} cái ({e.operating_hours}h)</span>
                  </div>
                ))}
                {(!combinedLog?.equipment || combinedLog.equipment.length === 0) && (
                  <p className="text-xs text-txt-muted text-center py-4">Không có thông tin máy móc hôm nay.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB: DAILY LOGS ── */}
      {activeSubTab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Left panel: Logs list Timeline */}
          <div className="lg:col-span-4 bg-bg-surface border border-border rounded-2xl p-4 shadow-sm h-[calc(100vh-340px)] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black text-txt-primary uppercase tracking-wider">Danh sách nhật ký</h3>
              {canEdit && (
                <button 
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedDate(today);
                    setIsEditingLog(true);
                  }}
                  className="p-1 text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors"
                  title="Ghi nhật ký mới hôm nay"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {logs.map(l => {
                const isSelected = selectedDate === l.log_date;
                return (
                  <div
                    key={l.log_id}
                    onClick={() => {
                      setSelectedDate(l.log_date);
                      setIsEditingLog(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-500/5 shadow-sm' 
                        : 'border-border/50 hover:bg-bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-bg-muted rounded-lg">{getWeatherIcon(l.weather_desc || '')}</div>
                      <div>
                        <p className="text-xs font-bold text-txt-primary">{new Date(l.log_date).toLocaleDateString('vi-VN')}</p>
                        <p className="text-[10px] text-txt-muted">{l.weather_desc} · {l.weather_temp}°C</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-txt-muted transition-transform ${isSelected ? 'translate-x-1 text-primary-500' : ''}`} />
                  </div>
                );
              })}
              {logs.length === 0 && <p className="text-xs text-txt-muted text-center py-10">Chưa có nhật ký thi công nào được lập.</p>}
            </div>
          </div>

          {/* Right panel: Log detail / Log Form */}
          <div className="lg:col-span-8 bg-bg-surface border border-border rounded-2xl p-5 shadow-sm h-[calc(100vh-340px)] overflow-y-auto">
            {isEditingLog ? (
              // EDIT LOG FORM
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-black text-txt-primary uppercase tracking-wider">
                      {combinedLog ? 'Chỉnh sửa Nhật ký' : 'Lập Nhật ký Mới'}
                    </h3>
                    <p className="text-[10px] text-txt-muted mt-0.5">Ngày thực hiện: {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleCopyFromYesterday}
                      disabled={isFetchingWeather}
                      className="px-3 py-1.5 border border-primary-500/30 rounded-xl text-xs font-bold bg-primary-500/5 hover:bg-primary-500/10 text-primary-600 transition-all flex items-center gap-1.5"
                      title="Tự động sao chép các tổ đội nhân lực, thiết bị và công việc của ngày trước đó"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Sao chép hôm trước
                    </button>
                    <button 
                      onClick={() => setIsEditingLog(false)}
                      className="px-3 py-1.5 border border-border rounded-xl text-xs font-bold bg-bg-surface hover:bg-bg-muted text-txt-primary transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleSaveLog}
                      disabled={saveLogMutation.isPending}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      {saveLogMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Lưu nhật ký
                    </button>
                  </div>
                </div>

                {/* Weather details row */}
                <div className="bg-bg-muted/40 p-4 rounded-xl border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-txt-secondary flex items-center gap-1.5">
                      <CloudSun className="w-4 h-4 text-primary-500" />
                      Thông tin Thời tiết công trường
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoWeather}
                      disabled={isFetchingWeather}
                      className="px-2.5 py-1 text-[10px] font-black text-primary-500 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {isFetchingWeather ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sun className="w-3 h-3" />}
                      Lấy Thời tiết Tự động (Open-Meteo)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Mô tả thời tiết</label>
                      <input 
                        type="text" 
                        value={logForm.log.weather_desc || ''} 
                        onChange={e => setLogForm({ ...logForm, log: { ...logForm.log, weather_desc: e.target.value } })}
                        className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        placeholder="Nắng ráo, Mưa nhỏ..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Nhiệt độ (°C)</label>
                      <input 
                        type="number" 
                        value={logForm.log.weather_temp || ''} 
                        onChange={e => setLogForm({ ...logForm, log: { ...logForm.log, weather_temp: Number(e.target.value) } })}
                        className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Gió</label>
                      <input 
                        type="text" 
                        value={logForm.log.weather_wind || ''} 
                        onChange={e => setLogForm({ ...logForm, log: { ...logForm.log, weather_wind: e.target.value } })}
                        className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        placeholder="Gió nhẹ..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Trạng thái thi công</label>
                      <select 
                        value={logForm.log.construction_status} 
                        onChange={e => setLogForm({ ...logForm, log: { ...logForm.log, construction_status: e.target.value as any } })}
                        className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl cursor-pointer"
                      >
                        <option value="normal">Bình thường</option>
                        <option value="suspended">Tạm ngừng hoạt động</option>
                        <option value="delayed">Hoạt động gián đoạn/chậm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Chọn ngày nhật ký</label>
                      <input 
                        type="date" 
                        value={logForm.log.log_date} 
                        onChange={e => {
                          setSelectedDate(e.target.value);
                          setLogForm({ ...logForm, log: { ...logForm.log, log_date: e.target.value } });
                        }}
                        className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Construction Work details */}
                <div className="space-y-2 border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-txt-primary">Hạng mục công việc thi công trong ngày</span>
                    <button
                      type="button"
                      onClick={() => setLogForm({
                        ...logForm,
                        details: [...logForm.details, { detail_id: '', log_id: '', work_item: '', status: 'in_progress', safety_status: 'safe' }]
                      })}
                      className="text-[10px] font-bold text-primary-500 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Thêm đầu việc
                    </button>
                  </div>
                  {logForm.details.map((d, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 py-2 border-b border-border/40 last:border-b-0">
                      <div className="md:col-span-2">
                        <input 
                          type="text" 
                          placeholder="Tên công việc (ép cọc, đổ bê tông...)" 
                          value={d.work_item}
                          onChange={e => {
                            const updated = [...logForm.details];
                            updated[idx].work_item = e.target.value;
                            setLogForm({ ...logForm, details: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        />
                      </div>
                      <div>
                        <select 
                          value={d.status}
                          onChange={e => {
                            const updated = [...logForm.details];
                            updated[idx].status = e.target.value as any;
                            setLogForm({ ...logForm, details: updated });
                          }}
                          className="w-full text-xs px-2 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl cursor-pointer"
                        >
                          <option value="in_progress">Đang thi công</option>
                          <option value="completed">Đã hoàn thành</option>
                          <option value="delayed">Bị chậm tiến độ</option>
                        </select>
                      </div>
                      <div className="flex gap-2 items-center">
                        <select 
                          value={d.safety_status}
                          onChange={e => {
                            const updated = [...logForm.details];
                            updated[idx].safety_status = e.target.value as any;
                            setLogForm({ ...logForm, details: updated });
                          }}
                          className="w-full text-xs px-2 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl cursor-pointer"
                        >
                          <option value="safe">An toàn</option>
                          <option value="warning">Nhắc nhở</option>
                          <option value="incident">Sự cố HSE</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...logForm.details];
                            updated.splice(idx, 1);
                            setLogForm({ ...logForm, details: updated });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Manpower Editor (Nhân lực thi công) ── */}
                <div className="space-y-2 border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-txt-primary flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      Tình hình nhân sự / tổ đội nhân lực
                    </span>
                    <button
                      type="button"
                      onClick={() => setLogForm({
                        ...logForm,
                        manpower: [...logForm.manpower, { manpower_id: '', log_id: '', role_title: '', quantity: 1, notes: '' }]
                      })}
                      className="text-[10px] font-bold text-primary-500 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Thêm tổ đội
                    </button>
                  </div>
                  {logForm.manpower.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 py-2 border-b border-border/40 last:border-b-0 items-center">
                      <div className="md:col-span-2">
                        <input 
                          type="text" 
                          list="manpower-roles-list"
                          placeholder="Tổ đội / Vai trò (VD: Tổ thợ sắt, Kỹ sư...)" 
                          value={m.role_title}
                          onChange={e => {
                            const updated = [...logForm.manpower];
                            updated[idx].role_title = e.target.value;
                            setLogForm({ ...logForm, manpower: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          placeholder="Số người" 
                          value={m.quantity}
                          min="1"
                          onChange={e => {
                            const updated = [...logForm.manpower];
                            updated[idx].quantity = Number(e.target.value);
                            setLogForm({ ...logForm, manpower: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Ghi chú..." 
                          value={m.notes || ''}
                          onChange={e => {
                            const updated = [...logForm.manpower];
                            updated[idx].notes = e.target.value;
                            setLogForm({ ...logForm, manpower: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...logForm.manpower];
                            updated.splice(idx, 1);
                            setLogForm({ ...logForm, manpower: updated });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {logForm.manpower.length === 0 && (
                    <p className="text-xs text-txt-muted text-center py-2">Chưa ghi nhận tổ đội nhân sự hằng ngày.</p>
                  )}
                </div>

                {/* ── Equipment Editor (Máy móc thiết bị) ── */}
                <div className="space-y-2 border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-txt-primary flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-500" />
                      Tình hình máy móc thiết bị vận hành
                    </span>
                    <button
                      type="button"
                      onClick={() => setLogForm({
                        ...logForm,
                        equipment: [...logForm.equipment, { equipment_id: '', log_id: '', equipment_name: '', quantity: 1, status: 'active', operating_hours: 8 }]
                      })}
                      className="text-[10px] font-bold text-primary-500 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Thêm thiết bị
                    </button>
                  </div>
                  {logForm.equipment.map((e, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 py-2 border-b border-border/40 last:border-b-0 items-center">
                      <div className="md:col-span-5">
                        <input 
                          type="text" 
                          list="equipment-names-list"
                          placeholder="Tên thiết bị (VD: Xe cẩu tháp, Xe trộn...)" 
                          value={e.equipment_name}
                          onChange={e => {
                            const updated = [...logForm.equipment];
                            updated[idx].equipment_name = e.target.value;
                            setLogForm({ ...logForm, equipment: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input 
                          type="number" 
                          placeholder="Số lượng" 
                          value={e.quantity}
                          min="1"
                          onChange={e => {
                            const updated = [...logForm.equipment];
                            updated[idx].quantity = Number(e.target.value);
                            setLogForm({ ...logForm, equipment: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input 
                          type="number" 
                          placeholder="Số giờ" 
                          value={e.operating_hours || 8}
                          min="1" max="24"
                          onChange={e => {
                            const updated = [...logForm.equipment];
                            updated[idx].operating_hours = Number(e.target.value);
                            setLogForm({ ...logForm, equipment: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                        />
                      </div>
                      <div className="md:col-span-3 flex gap-2 items-center">
                        <select 
                          value={e.status}
                          onChange={e => {
                            const updated = [...logForm.equipment];
                            updated[idx].status = e.target.value as any;
                            setLogForm({ ...logForm, equipment: updated });
                          }}
                          className="w-full text-xs px-2 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl cursor-pointer font-bold"
                        >
                          <option value="active">Hoạt động tốt</option>
                          <option value="broken">Hỏng hóc</option>
                          <option value="idle">Chờ việc</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...logForm.equipment];
                            updated.splice(idx, 1);
                            setLogForm({ ...logForm, equipment: updated });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {logForm.equipment.length === 0 && (
                    <p className="text-xs text-txt-muted text-center py-2">Chưa ghi nhận máy móc thiết bị vận hành.</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Ghi chú chung / Nhận xét hiện trường</label>
                  <textarea 
                    value={logForm.log.notes || ''} 
                    onChange={e => setLogForm({ ...logForm, log: { ...logForm.log, notes: e.target.value } })}
                    className="w-full text-xs px-3 py-2 border border-border bg-bg-surface text-txt-primary rounded-xl h-20 outline-none resize-none"
                    placeholder="Ghi nhận thêm thông tin khác về công trường hôm nay..."
                  />
                </div>

                {/* Autocomplete Datalists */}
                <datalist id="manpower-roles-list">
                  {historicalManpowerRoles.map(role => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
                <datalist id="equipment-names-list">
                  {['Xe cẩu tháp', 'Xe lu rung', 'Xe trộn bê tông', 'Xe xúc đào', 'Máy phát điện công trường', 'Máy đầm cóc', 'Máy hàn điện'].map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            ) : (
              // READ-ONLY LOG VIEW
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-black text-txt-primary uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      Chi tiết Nhật ký Thi công
                    </h3>
                    <p className="text-[10px] text-txt-muted mt-0.5">Ngày: {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-2">
                    {combinedLog && (
                      <button 
                        onClick={() => exportConstructionLogToDocx(project?.ProjectName || 'Sơn Kim 1', combinedLog)}
                        className="px-3 py-1.5 border border-border rounded-xl text-xs font-bold bg-bg-surface hover:bg-bg-muted text-txt-primary flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-500" />
                        Xuất Nhật ký (Word)
                      </button>
                    )}
                    {canEdit && (
                      <div className="flex gap-2">
                        {combinedLog && (
                          <button 
                            onClick={async () => {
                              if (window.confirm(`Bạn có chắc chắn muốn xóa nhật ký thi công ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')} không?`)) {
                                await deleteLogMutation.mutateAsync(combinedLog.log.log_id);
                                setIsEditingLog(false);
                              }
                            }}
                            disabled={deleteLogMutation.isPending}
                            className="px-3 py-1.5 border border-red-500/20 hover:border-red-500/35 rounded-xl text-xs font-bold bg-red-500/5 hover:bg-red-500/10 text-red-500 flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            {deleteLogMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin animate-spin-slow" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Xóa Nhật ký
                          </button>
                        )}
                        <button 
                          onClick={() => setIsEditingLog(true)}
                          className="px-3 py-1.5 border border-border rounded-xl text-xs font-bold bg-bg-surface hover:bg-bg-muted text-txt-primary flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-primary-500" />
                          Chỉnh sửa
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {combinedLog ? (
                  <div className="space-y-6">
                    {/* Weather card */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-bg-muted/40 border border-border rounded-2xl shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-bg-surface rounded-xl shadow-sm border border-border/50">
                          {getWeatherIcon(combinedLog.log.weather_desc || '')}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Thời tiết</p>
                          <p className="text-xs font-black text-txt-primary">{combinedLog.log.weather_desc || 'Nắng ráo'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-bg-surface rounded-xl shadow-sm border border-border/50">
                          <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Nhiệt độ</p>
                          <p className="text-xs font-black text-txt-primary">{combinedLog.log.weather_temp || '32'} °C</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-bg-surface rounded-xl shadow-sm border border-border/50">
                          <Wind className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Tốc độ Gió</p>
                          <p className="text-xs font-black text-txt-primary">{combinedLog.log.weather_wind || 'Gió nhẹ'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-bg-surface rounded-xl shadow-sm border border-border/50">
                          <Activity className="w-5 h-5 text-emerald-500 animate-spin-slow" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Trạng thái thi công</p>
                          <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full border mt-0.5 ${
                            combinedLog.log.construction_status === 'normal' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {combinedLog.log.construction_status === 'normal' ? 'Bình thường' : 'Gián đoạn / Tạm dừng'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Work items list */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-txt-primary uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-txt-muted" />
                        Các hạng mục thi công trong ngày ({combinedLog.details.length})
                      </h4>
                      <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden shadow-sm bg-bg-surface">
                        {combinedLog.details.map((d, index) => (
                          <div key={d.detail_id || index} className="flex justify-between items-start p-4 hover:bg-bg-muted/30 transition-colors">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-txt-primary flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                {d.work_item}
                              </p>
                              {d.location && <p className="text-[10px] text-txt-muted">Vị trí: {d.location}</p>}
                            </div>
                            <div className="flex gap-2">
                              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                                d.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                              }`}>
                                {d.status === 'completed' ? 'Xong trong ngày' : 'Đang thi công'}
                              </span>

                              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                                d.safety_status === 'safe' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                  : d.safety_status === 'warning'
                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                    : 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                              }`}>
                                {d.safety_status === 'safe' ? 'An toàn HSE' : d.safety_status === 'warning' ? 'Nhắc nhở HSE' : 'Sự cố HSE'}
                              </span>
                            </div>
                          </div>
                        ))}
                        {combinedLog.details.length === 0 && (
                          <p className="text-xs text-txt-muted text-center py-6">Không ghi nhận chi tiết hạng mục thi công cụ thể.</p>
                        )}
                      </div>
                    </div>

                    {/* ── Manpower & Equipment Sections ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Manpower Card */}
                      <div className="bg-bg-muted/10 border border-border rounded-2xl p-4 shadow-sm space-y-3">
                        <h4 className="text-xs font-black text-txt-primary uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-500" />
                            Nhân lực thi công ({combinedLog.manpower.reduce((sum, m) => sum + m.quantity, 0)} người)
                          </span>
                        </h4>
                        <div className="divide-y divide-border/50 max-h-48 overflow-y-auto pr-1">
                          {combinedLog.manpower.map((m, index) => (
                            <div key={m.manpower_id || index} className="flex justify-between items-center py-2 text-xs">
                              <span className="font-bold text-txt-primary">{m.role_title}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-lg">{m.quantity} người</span>
                                {m.notes && <span className="text-[10px] text-txt-muted max-w-[120px] truncate" title={m.notes}>{m.notes}</span>}
                              </div>
                            </div>
                          ))}
                          {combinedLog.manpower.length === 0 && (
                            <p className="text-xs text-txt-muted text-center py-4">Không ghi nhận nhân lực thi công hằng ngày.</p>
                          )}
                        </div>
                      </div>

                      {/* Equipment Card */}
                      <div className="bg-bg-muted/10 border border-border rounded-2xl p-4 shadow-sm space-y-3">
                        <h4 className="text-xs font-black text-txt-primary uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Wrench className="w-4 h-4 text-amber-500 animate-pulse" />
                            Máy móc thiết bị ({combinedLog.equipment.reduce((sum, e) => sum + e.quantity, 0)} chiếc)
                          </span>
                        </h4>
                        <div className="divide-y divide-border/50 max-h-48 overflow-y-auto pr-1">
                          {combinedLog.equipment.map((e, index) => {
                            const statusColor = e.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : e.status === 'broken'
                                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                : 'bg-bg-muted text-txt-muted border-border';
                            const statusLabel = e.status === 'active' ? 'Hoạt động' : e.status === 'broken' ? 'Hỏng' : 'Chờ việc';
                            
                            return (
                              <div key={e.equipment_id || index} className="flex justify-between items-center py-2 text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-txt-primary">{e.equipment_name}</span>
                                  <p className="text-[9px] text-txt-muted">Thời gian chạy: {e.operating_hours || 8}h</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-txt-secondary">{e.quantity} cái</span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${statusColor}`}>{statusLabel}</span>
                                </div>
                              </div>
                            );
                          })}
                          {combinedLog.equipment.length === 0 && (
                            <p className="text-xs text-txt-muted text-center py-4">Không ghi nhận máy móc thiết bị vận hành.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {combinedLog.log.notes && (
                      <div className="p-4 bg-bg-muted/30 rounded-2xl border border-border">
                        <p className="text-[10px] font-black text-txt-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-500" /> Ghi chú giám sát / Nhận xét hiện trường
                        </p>
                        <p className="text-xs text-txt-secondary leading-relaxed font-medium">{combinedLog.log.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-border rounded-2xl">
                    <CloudSun className="w-10 h-10 text-txt-muted" />
                    <h4 className="text-xs font-bold text-txt-primary">Chưa lập nhật ký thi công cho ngày này</h4>
                    <p className="text-[10px] text-txt-muted max-w-xs text-center">Các thông số như thời tiết, thiết bị, nhân công và hình ảnh sẽ hiển thị tại đây sau khi được chỉ huy trưởng nhà thầu hoặc giám sát thiết lập.</p>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditingLog(true)}
                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Lập Nhật ký Ngay
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB: PHYSICAL PROGRESS ── */}
      {activeSubTab === 'progress' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-txt-primary uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Tiến độ Thi công của Nhà thầu lập
                </h3>
                <p className="text-[10px] text-txt-muted mt-0.5">Danh sách WBS tiến độ thực tế do nhà thầu thiết lập và cập nhật.</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => exportProgressReportToDocx(project?.ProjectName || 'Sơn Kim 1', progressList)} 
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất Báo cáo (Word)
                </button>

                {canEdit && (
                  <>
                    <button 
                      onClick={() => {
                        setIsImportModalOpen(true);
                        handleLoadTemplate('infrastructure');
                      }} 
                      className="px-3 py-1.5 border border-border text-txt-primary hover:bg-bg-muted font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:bg-bg-muted/70"
                      title="Import tiến độ thi công từ tệp mẫu hoặc Excel"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary-500 animate-pulse" /> Import Tiến độ
                    </button>

                    <button 
                      onClick={() => setIsAddingWbs(!isAddingWbs)} 
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Thêm đầu việc
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Form thêm WBS mới */}
            {isAddingWbs && (
              <div className="p-4 bg-bg-muted/40 border border-border rounded-2xl mb-4 space-y-3">
                <h4 className="text-xs font-black text-txt-primary uppercase tracking-wider">Khai báo đầu việc tiến độ mới</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Tên công việc</label>
                    <input 
                      type="text" 
                      placeholder="VD: Thi công kết cấu dầm sàn tầng 1"
                      value={newWbs.task_name}
                      onChange={e => setNewWbs({...newWbs, task_name: e.target.value})}
                      className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Ngày bắt đầu KH</label>
                    <input 
                      type="date"
                      value={newWbs.planned_start_date}
                      onChange={e => setNewWbs({...newWbs, planned_start_date: e.target.value})}
                      className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Ngày hoàn thành KH</label>
                    <input 
                      type="date"
                      value={newWbs.planned_end_date}
                      onChange={e => setNewWbs({...newWbs, planned_end_date: e.target.value})}
                      className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Trọng số đóng góp (%)</label>
                    <input 
                      type="number"
                      value={newWbs.weight_percent}
                      onChange={e => setNewWbs({...newWbs, weight_percent: Number(e.target.value)})}
                      className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Tiến độ KH lũy kế (%)</label>
                    <input 
                      type="number"
                      value={newWbs.planned_percent}
                      onChange={e => setNewWbs({...newWbs, planned_percent: Number(e.target.value)})}
                      className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1">Tiến độ Thực tế đạt (%)</label>
                    <input 
                      type="number"
                      value={newWbs.actual_percent}
                      onChange={e => setNewWbs({...newWbs, actual_percent: Number(e.target.value)})}
                      className="w-full text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingWbs(false)}
                      className="w-full py-1.5 border border-border font-bold text-xs bg-bg-surface hover:bg-bg-muted rounded-xl text-txt-primary"
                    >
                      Hủy
                    </button>
                    <button 
                      type="button"
                      onClick={handleAddWbs}
                      className="w-full py-1.5 bg-primary-600 hover:bg-primary-700 font-bold text-xs text-white rounded-xl shadow-sm"
                    >
                      Lưu lại
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WBS Table */}
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-bg-muted text-[10px] font-black uppercase tracking-widest border-b border-border shadow-inner text-txt-muted">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">#</th>
                    <th className="px-4 py-3 text-left min-w-[240px]">Hạng mục công việc / Đầu việc</th>
                    <th className="px-4 py-3 text-center w-28">Trọng số (%)</th>
                    <th className="px-4 py-3 text-center w-36">Kế hoạch (%)</th>
                    <th className="px-4 py-3 text-center w-36">Thực tế (%)</th>
                    <th className="px-4 py-3 text-left w-48">Tiến trình & So sánh</th>
                    <th className="px-4 py-3 text-center w-32">Ngày KH</th>
                    <th className="px-4 py-3 text-center w-28">Trạng thái</th>
                    {canEdit && <th className="px-4 py-3 text-center w-16">Xóa</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {progressList.map((p, idx) => (
                    <tr key={p.progress_id || idx} className="hover:bg-bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-txt-muted font-bold">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-txt-primary">
                        {p.task_name}
                        {p.notes && <p className="text-[10px] text-txt-muted font-normal mt-0.5">{p.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-txt-secondary">{p.weight_percent}%</td>
                      <td className="px-4 py-3 text-center">
                        {canEdit ? (
                          <input 
                            type="number"
                            value={p.planned_percent}
                            onChange={e => handleProgressChange(idx, 'planned_percent', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-center border border-border bg-bg-surface text-txt-primary rounded-lg text-xs"
                            min="0" max="100"
                          />
                        ) : (
                          <span className="font-bold text-txt-primary">{p.planned_percent}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canEdit ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input 
                              type="number"
                              value={p.actual_percent}
                              onChange={e => handleProgressChange(idx, 'actual_percent', Number(e.target.value))}
                              className="w-16 px-2 py-1 text-center border border-border bg-bg-surface text-txt-primary rounded-lg text-xs font-bold"
                              min="0" max="100"
                            />
                            <span className="text-[10px] text-txt-muted">%</span>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-500">{p.actual_percent}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 w-48">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black text-txt-muted leading-none">
                            <span>KH: {p.planned_percent}%</span>
                            <span className={p.actual_percent >= p.planned_percent ? 'text-emerald-500 font-black' : 'text-red-500 font-bold'}>
                              TT: {p.actual_percent}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-bg-muted rounded-full overflow-hidden border border-border/40 relative">
                            {/* Kế hoạch (Xanh lam nhạt) */}
                            <div 
                              className="absolute top-0 left-0 h-full bg-blue-500/20 transition-all duration-300"
                              style={{ width: `${p.planned_percent}%` }}
                            />
                            {/* Thực tế đạt được */}
                            <div 
                              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                                p.actual_percent >= p.planned_percent 
                                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-500/30' 
                                  : 'bg-gradient-to-r from-red-400 to-red-500 shadow-sm shadow-red-500/30'
                              }`}
                              style={{ width: `${p.actual_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-txt-muted font-medium">
                        {p.planned_start_date ? new Date(p.planned_start_date).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }) : '—'} 
                        <ArrowRight className="w-3 h-3 inline mx-1" />
                        {p.planned_end_date ? new Date(p.planned_end_date).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          p.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20' 
                            : p.status === 'in_progress' 
                              ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20'
                              : p.status === 'delayed'
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-bg-muted text-txt-muted border-border'
                        }`}>
                          {p.status === 'completed' ? 'Hoàn thành' : p.status === 'in_progress' ? 'Đang thi công' : p.status === 'delayed' ? 'Bị trễ' : 'Chờ làm'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteProgressMutation.mutate(p.progress_id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Xóa đầu việc này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {progressList.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-txt-muted">
                        <Hammer className="w-8 h-8 mx-auto mb-2 text-txt-muted opacity-50" />
                        Chưa thiết lập danh mục đầu việc tiến độ thi công của nhà thầu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB: SITE GALLERY ── */}
      {activeSubTab === 'gallery' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-txt-primary uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary-500" />
                  Thư viện Hình ảnh Thực tế Hiện trường
                </h3>
                <p className="text-[10px] text-txt-muted mt-0.5">Hình ảnh thực tế cập nhật trạng thái xây dựng và thi công tại công trường.</p>
              </div>

              {canEdit && (
                <div className="flex gap-2 items-center flex-wrap">
                  <input 
                    type="text" 
                    placeholder="Mô tả bức ảnh..." 
                    value={photoCaption}
                    onChange={e => setPhotoCaption(e.target.value)}
                    className="text-xs px-3 py-1.5 border border-border bg-bg-surface text-txt-primary rounded-xl outline-none"
                  />
                  <label className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Tải ảnh lên
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Upload Spinner */}
            {uploadPhotoMutation.isPending && (
              <div className="flex items-center gap-2 p-3 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-xl mb-4 font-bold text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải hình ảnh lên Cloud và lưu trữ, vui lòng chờ...
              </div>
            )}

            {/* Photos Grouped by Date */}
            {photos.length === 0 && !uploadPhotoMutation.isPending ? (
              <div className="py-16 text-center text-txt-muted border border-dashed border-border rounded-2xl">
                <Camera className="w-10 h-10 mx-auto mb-2 text-txt-muted opacity-50 animate-pulse" />
                <h4 className="text-xs font-bold text-txt-primary">Chưa có hình ảnh hiện trường nào</h4>
                <p className="text-[10px] text-txt-muted mt-1">Sử dụng nút tải ảnh lên để cập nhật hình ảnh thực tế thi công.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPhotos)
                  .sort((a, b) => b[0].localeCompare(a[0])) // Ngày mới nhất xếp trên
                  .map(([date, datePhotos]) => {
                    const displayDate = date === 'Chưa rõ ngày' 
                      ? date 
                      : new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    
                    return (
                      <div key={date} className="space-y-2.5">
                        <div className="flex items-center gap-2 border-b border-border/50 pb-1.5">
                          <span className="w-1.5 h-3 bg-primary-500 rounded-full" />
                          <h4 className="text-[11px] font-black text-txt-primary uppercase tracking-wider">
                            {displayDate}
                          </h4>
                          <span className="text-[9px] font-black bg-bg-muted text-txt-secondary border border-border px-2 py-0.5 rounded-full">
                            {datePhotos.length} ảnh
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {datePhotos.map(p => (
                            <div 
                              key={p.photo_id} 
                              className="group relative rounded-2xl border border-border overflow-hidden bg-bg-muted hover:border-primary-500 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md"
                            >
                              <img 
                                src={p.publicUrl || p.image_path} 
                                alt={p.caption || 'Hiện trường công trường'} 
                                className="w-full h-40 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setActivePhoto(p.publicUrl || p.image_path)}
                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                                    title="Xem phóng to ảnh"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <a 
                                    href={p.publicUrl || p.image_path}
                                    download={`photo_${date}.jpg`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors flex items-center justify-center"
                                    title="Tải ảnh gốc"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                              <div className="p-3 bg-bg-surface">
                                <p className="text-xs font-bold text-txt-primary truncate" title={p.caption}>{p.caption || 'Ảnh hiện trường'}</p>
                                <p className="text-[9px] text-txt-muted mt-1">{new Date(p.created_at || '').toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PHOTO VIEW MODAL ── */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <img 
              src={activePhoto} 
              alt="Phóng to ảnh" 
              className="rounded-2xl shadow-2xl max-w-full max-h-[85vh] object-contain border border-white/10" 
            />
            <button 
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white font-bold transition-all shadow-md"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* ── HIGH-END PROGRESS IMPORT MODAL ── */}
      {isImportModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div 
            className="bg-bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-bg-muted/30">
              <div>
                <h3 className="text-sm font-black text-txt-primary uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary-500" />
                  Trình Import WBS Tiến độ Thi công Nhà thầu
                </h3>
                <p className="text-[10px] text-txt-muted mt-0.5 font-bold">Khởi tạo nhanh danh mục đầu việc tiến độ thi công và đồng bộ S-Curve</p>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 border border-border hover:bg-bg-muted rounded-xl text-txt-muted transition-colors"
              >
                Hủy
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Selector for Type */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-bg-muted rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setImportType('template');
                    handleLoadTemplate('infrastructure');
                  }}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    importType === 'template'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-txt-muted hover:text-txt-primary'
                  }`}
                >
                  Sử dụng Mẫu chuẩn (Templates)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportType('file');
                    handleSimulateCsvUpload();
                  }}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    importType === 'file'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-txt-muted hover:text-txt-primary'
                  }`}
                >
                  Import File Excel/CSV (Giả lập)
                </button>
              </div>

              {/* View according to type */}
              {importType === 'template' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'infrastructure', label: 'HẠ TẦNG & SAN NỀN', desc: 'San lấp mặt bằng, lu lèn đường giao thông, thoát nước kỹ thuật', icon: Hammer },
                      { key: 'building', label: 'XÂY DỰNG NHÀ CAO TẦNG', desc: 'Ép cọc, đào móng, dầm sàn cột bê tông các tầng, tô trát xây tô sơn nước', icon: Users },
                      { key: 'technology', label: 'CƠ ĐIỆN & THIẾT BỊ M&E', desc: 'Bồn công nghệ, ống công nghệ inox, thiết bị bơm van động lực, điện PLC', icon: Wrench }
                    ].map(t => {
                      const Icon = t.icon;
                      const isSelected = selectedTemplateKey === t.key;
                      return (
                        <div
                          key={t.key}
                          onClick={() => handleLoadTemplate(t.key as any)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between ${
                            isSelected 
                              ? 'border-primary-500 bg-primary-500/5 shadow-md' 
                              : 'border-border/60 hover:bg-bg-muted/40'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`p-2 rounded-xl ${isSelected ? 'bg-primary-500/10 text-primary-500' : 'bg-bg-muted text-txt-secondary'}`}>
                                <Icon className="w-5 h-5" />
                              </span>
                              {isSelected && <span className="text-[9px] font-black bg-primary-500 text-white px-2 py-0.5 rounded-full">Đang chọn</span>}
                            </div>
                            <h4 className="text-xs font-black text-txt-primary uppercase tracking-wider">{t.label}</h4>
                            <p className="text-[10px] text-txt-muted mt-1 font-semibold leading-relaxed">{t.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // CSV simulate view
                <div className="space-y-4">
                  <div className="p-5 border border-dashed border-border rounded-2xl bg-bg-muted/20 flex flex-col items-center justify-center gap-3">
                    <Upload className="w-8 h-8 text-primary-500 animate-bounce" />
                    <div className="text-center">
                      <h4 className="text-xs font-bold text-txt-primary">Tải tệp tiến độ của bạn lên hệ thống</h4>
                      <p className="text-[10px] text-txt-muted mt-0.5">Chấp nhận tệp định dạng .csv hoặc .xlsx chuẩn WBS Microsoft Project</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateCsvUpload}
                      className="px-3 py-1.5 bg-primary-500/10 text-primary-600 hover:bg-primary-500/20 text-xs font-black rounded-xl transition-all border border-primary-500/20"
                    >
                      Mô phỏng Đọc tệp tin WBS từ Excel/CSV
                    </button>
                  </div>
                  {csvContent && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider">Cấu trúc dữ liệu đọc được từ file</label>
                      <pre className="p-3 bg-bg-muted rounded-xl border border-border text-[9px] font-mono text-txt-secondary overflow-x-auto max-h-32 shadow-inner">
                        {csvContent}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-txt-primary uppercase tracking-wider flex items-center gap-1">
                    Danh sách hạng mục xem trước ({importPreviewList.length} đầu việc)
                  </h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    importPreviewList.reduce((sum, item) => sum + item.weight_percent, 0) === 100
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    Tổng trọng số: {importPreviewList.reduce((sum, item) => sum + item.weight_percent, 0)}%
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-bg-muted text-[9px] font-black uppercase tracking-wider border-b border-border shadow-inner text-txt-muted">
                      <tr>
                        <th className="px-3 py-2 text-left w-10">STT</th>
                        <th className="px-3 py-2 text-left">Đầu việc thi công WBS</th>
                        <th className="px-3 py-2 text-center w-24">Trọng số</th>
                        <th className="px-3 py-2 text-center w-28">Kế hoạch (%)</th>
                        <th className="px-3 py-2 text-center w-28">Thực tế (%)</th>
                        <th className="px-3 py-2 text-center w-36">Thời gian KH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importPreviewList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-bg-muted/20">
                          <td className="px-3 py-2 font-mono font-bold text-txt-muted text-center">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-txt-primary">
                            {item.task_name}
                            {item.notes && <p className="text-[9px] text-txt-muted font-normal mt-0.5">{item.notes}</p>}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-txt-secondary">{item.weight_percent}%</td>
                          <td className="px-3 py-2 text-center font-semibold text-txt-primary">{item.planned_percent}%</td>
                          <td className="px-3 py-2 text-center font-bold text-emerald-500">{item.actual_percent}%</td>
                          <td className="px-3 py-2 text-center text-txt-muted font-medium text-[10px]">
                            {item.planned_start_date ? new Date(item.planned_start_date).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }) : '—'} 
                            <ArrowRight className="w-3 h-3 inline mx-0.5" />
                            {item.planned_end_date ? new Date(item.planned_end_date).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-bg-muted/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold bg-bg-surface hover:bg-bg-muted text-txt-primary transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={saveProgressMutation.isPending || importPreviewList.length === 0}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {saveProgressMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận Import WBS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
