// services/ConstructionService.ts
import { supabase } from '../lib/supabase';
import { 
  ConstructionLog, 
  ConstructionLogDetail, 
  ConstructionManpower, 
  ConstructionEquipment, 
  ConstructionSitePhoto, 
  ConstructionProgress,
  DailyLogCombinedData 
} from '../types/construction.types';

export class ConstructionService {
  // ============================================================
  // DAILY LOGS CRUD
  // ============================================================

  static async getDailyLogs(projectId: string): Promise<ConstructionLog[]> {
    const { data, error } = await (supabase as any)
      .from('construction_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('log_date', { ascending: false });

    if (error) throw new Error(`Lỗi tải danh sách nhật ký: ${error.message}`);
    return (data as any[]) || [];
  }

  static async getDailyLogCombined(projectId: string, date: string): Promise<DailyLogCombinedData | null> {
    // 1. Get Log row
    const { data: log, error: logError } = await (supabase as any)
      .from('construction_logs')
      .select('*')
      .eq('project_id', projectId)
      .eq('log_date', date)
      .maybeSingle();

    if (logError) throw new Error(`Lỗi tải thông tin nhật ký ngày: ${logError.message}`);
    if (!log) return null;

    // 2. Fetch related details, manpower and equipment in parallel
    const [detailsResult, manpowerResult, equipmentResult] = await Promise.all([
      (supabase as any).from('construction_log_details').select('*').eq('log_id', log.log_id),
      (supabase as any).from('construction_manpower').select('*').eq('log_id', log.log_id),
      (supabase as any).from('construction_equipment').select('*').eq('log_id', log.log_id)
    ]);

    if (detailsResult.error) throw new Error(`Lỗi tải chi tiết hạng mục: ${detailsResult.error.message}`);
    if (manpowerResult.error) throw new Error(`Lỗi tải nhân lực: ${manpowerResult.error.message}`);
    if (equipmentResult.error) throw new Error(`Lỗi tải thiết bị: ${equipmentResult.error.message}`);

    return {
      log: log as ConstructionLog,
      details: (detailsResult.data as any[]) || [],
      manpower: (manpowerResult.data as any[]) || [],
      equipment: (equipmentResult.data as any[]) || []
    };
  }

  static async saveDailyLogCombined(projectId: string, data: DailyLogCombinedData): Promise<string> {
    // Start by upserting the main Log row
    const { data: savedLog, error: logError } = await (supabase as any)
      .from('construction_logs')
      .upsert({
        log_id: data.log.log_id || undefined,
        project_id: projectId,
        log_date: data.log.log_date,
        weather_temp: data.log.weather_temp,
        weather_desc: data.log.weather_desc,
        weather_wind: data.log.weather_wind,
        construction_status: data.log.construction_status,
        notes: data.log.notes,
        created_by: data.log.created_by || undefined
      })
      .select()
      .single();

    if (logError) throw new Error(`Lỗi lưu thông tin nhật ký chính: ${logError.message}`);
    const logId = savedLog.log_id;

    // Remove existing details, manpower, and equipment for this log (re-insert pattern for simplified state management)
    await Promise.all([
      (supabase as any).from('construction_log_details').delete().eq('log_id', logId),
      (supabase as any).from('construction_manpower').delete().eq('log_id', logId),
      (supabase as any).from('construction_equipment').delete().eq('log_id', logId)
    ]);

    // Insert new details, manpower and equipment
    const detailsInsert = data.details.map(d => ({
      log_id: logId,
      contract_id: d.contract_id || null,
      work_item: d.work_item,
      location: d.location || null,
      work_volume: d.work_volume || null,
      status: d.status,
      safety_status: d.safety_status,
      safety_notes: d.safety_notes || null,
      issues: d.issues || null
    }));

    const manpowerInsert = data.manpower.map(m => ({
      log_id: logId,
      contractor_id: m.contractor_id || null,
      role_title: m.role_title,
      quantity: m.quantity,
      notes: m.notes || null
    }));

    const equipmentInsert = data.equipment.map(e => ({
      log_id: logId,
      equipment_name: e.equipment_name,
      quantity: e.quantity,
      operating_hours: e.operating_hours || 8,
      status: e.status,
      notes: e.notes || null
    }));

    const promises = [];
    if (detailsInsert.length > 0) {
      promises.push((supabase as any).from('construction_log_details').insert(detailsInsert));
    }
    if (manpowerInsert.length > 0) {
      promises.push((supabase as any).from('construction_manpower').insert(manpowerInsert));
    }
    if (equipmentInsert.length > 0) {
      promises.push((supabase as any).from('construction_equipment').insert(equipmentInsert));
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      const errorResult = results.find(r => r.error);
      if (errorResult) {
        throw new Error(`Lỗi lưu trữ các thông tin chi tiết nhật ký: ${errorResult.error?.message}`);
      }
    }

    return logId;
  }

  // ============================================================
  // SITE GALLERY / PHOTOS
  // ============================================================

  static async getSitePhotos(projectId: string): Promise<ConstructionSitePhoto[]> {
    const { data, error } = await (supabase as any)
      .from('construction_site_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Lỗi tải hình ảnh công trường: ${error.message}`);

    return ((data as any[]) || []).map(p => {
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(p.image_path);
      return {
        ...p,
        publicUrl: urlData?.publicUrl
      } as ConstructionSitePhoto & { publicUrl: string };
    });
  }

  static async uploadSitePhoto(
    projectId: string,
    file: File,
    caption?: string,
    logId?: string
  ): Promise<ConstructionSitePhoto> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `construction/${projectId}/${timestamp}_${safeName}`;

    // Upload to 'documents' bucket
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error(`Lỗi tải ảnh lên Cloud: ${uploadError.message}`);

    // Save record to DB
    const { data, error } = await (supabase as any)
      .from('construction_site_photos')
      .insert({
        project_id: projectId,
        log_id: logId || null,
        image_path: storagePath,
        caption: caption || '',
        uploaded_by: null
      })
      .select()
      .single();

    if (error) throw new Error(`Lỗi lưu trữ cơ sở dữ liệu ảnh: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl((data as any).image_path);

    return {
      ...data,
      publicUrl: urlData?.publicUrl
    } as any as ConstructionSitePhoto;
  }

  // ============================================================
  // CONTRACTOR CONSTRUCTION PROGRESS (WBS)
  // ============================================================

  static async getConstructionProgress(projectId: string): Promise<ConstructionProgress[]> {
    const { data, error } = await (supabase as any)
      .from('construction_progress')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`Lỗi tải tiến độ thi công: ${error.message}`);
    return (data as any[]) || [];
  }

  static async saveConstructionProgress(projectId: string, tasks: ConstructionProgress[]): Promise<void> {
    // We update each item
    const promises = tasks.map(t => 
      (supabase as any)
        .from('construction_progress')
        .upsert({
          progress_id: t.progress_id || undefined,
          project_id: projectId,
          contract_id: t.contract_id || null,
          task_name: t.task_name,
          planned_start_date: t.planned_start_date || null,
          planned_end_date: t.planned_end_date || null,
          actual_start_date: t.actual_start_date || null,
          actual_end_date: t.actual_end_date || null,
          weight_percent: t.weight_percent || 0,
          planned_percent: t.planned_percent || 0,
          actual_percent: t.actual_percent || 0,
          status: t.status,
          notes: t.notes || '',
          sort_order: t.sort_order || 0
        })
    );

    const results = await Promise.all(promises);
    const err = results.find(r => r.error);
    if (err) throw new Error(`Lỗi lưu tiến độ thi công: ${err.error?.message}`);
  }

  static async deleteConstructionProgress(progressId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('construction_progress')
      .delete()
      .eq('progress_id', progressId);

    if (error) throw new Error(`Lỗi xóa đầu việc tiến độ: ${error.message}`);
  }

  static async deleteDailyLog(logId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('construction_logs')
      .delete()
      .eq('log_id', logId);

    if (error) throw new Error(`Lỗi xóa nhật ký thi công: ${error.message}`);
  }

  static async getConstructionKpis(projectId: string): Promise<{
    total_weight: number;
    actual_progress: number;
    planned_progress: number;
    slippage: number;
    has_safety_issue: boolean;
    recent_safety_notes: string;
  }> {
    const { data, error } = await (supabase as any)
      .rpc('get_construction_kpis', { project_uuid: projectId });

    if (error) throw new Error(`Lỗi tính toán KPIs thi công: ${error.message}`);
    if (!data || data.length === 0) {
      return {
        total_weight: 0,
        actual_progress: 0,
        planned_progress: 0,
        slippage: 0,
        has_safety_issue: false,
        recent_safety_notes: ''
      };
    }
    return data[0];
  }

  static async getConstructionResourceStats(projectId: string): Promise<any[]> {
    const { data: logs, error: logsError } = await (supabase as any)
      .from('construction_logs')
      .select('log_id, log_date')
      .eq('project_id', projectId)
      .order('log_date', { ascending: true });

    if (logsError) throw new Error(`Lỗi tải thống kê tài nguyên: ${logsError.message}`);
    if (!logs || logs.length === 0) return [];

    const logIds = logs.map((l: any) => l.log_id);

    const [manpowerRes, equipmentRes] = await Promise.all([
      (supabase as any).from('construction_manpower').select('*').in('log_id', logIds),
      (supabase as any).from('construction_equipment').select('*').in('log_id', logIds)
    ]);

    if (manpowerRes.error) throw new Error(`Lỗi tải nhân sự: ${manpowerRes.error.message}`);
    if (equipmentRes.error) throw new Error(`Lỗi tải thiết bị: ${equipmentRes.error.message}`);

    const manpowerList = manpowerRes.data || [];
    const equipmentList = equipmentRes.data || [];

    const stats = logs.map((l: any) => {
      const dateObj = new Date(l.log_date);
      const dayLabel = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      
      const dayManpower = manpowerList.filter((m: any) => m.log_id === l.log_id);
      const dayEquipment = equipmentList.filter((e: any) => e.log_id === l.log_id);

      const manpowerRoles: Record<string, number> = {};
      let totalManpower = 0;
      dayManpower.forEach((m: any) => {
        const title = m.role_title || 'Khác';
        manpowerRoles[title] = (manpowerRoles[title] || 0) + (m.quantity || 0);
        totalManpower += (m.quantity || 0);
      });

      let totalEquipment = 0;
      dayEquipment.forEach((e: any) => {
        totalEquipment += (e.quantity || 0);
      });

      return {
        log_id: l.log_id,
        date: l.log_date,
        label: dayLabel,
        totalManpower,
        totalEquipment,
        roles: manpowerRoles,
        equipmentCount: totalEquipment
      };
    });

    return stats;
  }

  // ============================================================
  // OPEN-METEO WEATHER INTEGRATION
  // ============================================================

  static getWeatherDescription(code: number): string {
    switch (code) {
      case 0: return 'Trời quang, nắng đẹp';
      case 1: case 2: case 3: return 'Ít mây, trời nắng xen kẽ';
      case 45: case 48: return 'Có sương mù';
      case 51: case 53: case 55: return 'Mưa phùn nhẹ';
      case 61: case 63: case 65: return 'Mưa rào nhẹ';
      case 71: case 73: case 75: return 'Mưa tuyết';
      case 80: case 81: case 82: return 'Mưa rào lớn';
      case 95: return 'Có giông bão nhẹ';
      case 96: case 99: return 'Giông bão kèm mưa đá';
      default: return 'Bình thường';
    }
  }

  static async getAutoWeatherData(
    lat: number,
    lon: number,
    dateString: string
  ): Promise<{ temp: number; desc: string; wind: string }> {
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateString === todayStr;

    try {
      let url = '';
      if (isToday) {
        url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
      } else {
        url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateString}&end_date=${dateString}&daily=temperature_2m_max,weather_code,wind_speed_10m_max&timezone=auto`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('API weather call failed');
      const data = await res.json();

      let temp = 30; // default fallbacks
      let code = 0;
      let windSpeed = 5;

      if (isToday && data.current) {
        temp = Math.round(data.current.temperature_2m);
        code = data.current.weather_code || 0;
        windSpeed = Math.round(data.current.wind_speed_10m || 5);
      } else if (data.daily) {
        temp = Math.round(data.daily.temperature_2m_max?.[0] || 30);
        code = data.daily.weather_code?.[0] || 0;
        windSpeed = Math.round(data.daily.wind_speed_10m_max?.[0] || 5);
      }

      const desc = this.getWeatherDescription(code);
      let wind = 'Gió nhẹ';
      if (windSpeed > 15) wind = 'Gió to';
      else if (windSpeed < 3) wind = 'Lặng gió';

      return { temp, desc, wind };
    } catch (error) {
      console.error('Error fetching automatic weather data:', error);
      // Fallback defaults for HCMC / Vietnam
      return {
        temp: 32,
        desc: 'Nắng nóng nhiệt đới',
        wind: 'Gió nhẹ'
      };
    }
  }
}
