import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AgencyEventWithAttendees, AgencyEventType } from '@/types/calendar.types';
import { useDeleteEvent, useUpdateEvent } from '@/hooks/useCalendar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, FileText, CheckCircle, Save, UserCheck, Eye, Image, FileSpreadsheet, File, X, Download, Car } from 'lucide-react';
import { DocumentAttachments } from '@/components/common/DocumentAttachments';
import { useQuery } from '@tanstack/react-query';
import { DocumentService } from '@/services/DocumentService';

interface EventSlidePanelProps {
  event: AgencyEventWithAttendees;
  onEdit: (event: AgencyEventWithAttendees) => void;
  onClose: () => void;
}

const getEventTypeColor = (type: AgencyEventType) => {
  switch (type) {
    case 'meeting': return 'blue';
    case 'business_trip': return 'orange';
    case 'internal_event': return 'purple';
    default: return 'gray';
  }
};

const getEventTypeName = (type: AgencyEventType) => {
  switch (type) {
    case 'meeting': return 'Họp nội bộ';
    case 'business_trip': return 'Đi công tác';
    case 'internal_event': return 'Sự kiện nội bộ';
    default: return 'Khác';
  }
};

const getRoomName = (room: string) => {
  switch (room) {
    case 'Phòng họp 1': return 'Phòng họp 1';
    case 'Phòng họp 2': return 'Phòng họp 2';
    case 'Phòng họp 3': return 'Phòng họp 3';
    default: return 'Không rõ';
  }
};

export const EventSlidePanel: React.FC<EventSlidePanelProps> = ({ event, onEdit, onClose }) => {
  const { currentUser: user, supabaseUser } = useAuth();
  const deleteMutation = useDeleteEvent();
  const updateMutation = useUpdateEvent();
  const { showToast } = useToast();
  
  const { data: attachments = [], isLoading: isLoadingAttachments } = useQuery({
    queryKey: ['documents', 'agency_event', event.id],
    queryFn: () => DocumentService.getByRelated('agency_event', event.id),
    enabled: !!event.id,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const imageAttachments = attachments.filter(doc => doc.fileType.startsWith('image/'));
  const fileAttachments = attachments.filter(doc => !doc.fileType.startsWith('image/'));

  const getFileIconInfo = (fileType: string) => {
    const type = DocumentService.getFileIcon(fileType);
    const icons: Record<string, { icon: React.ElementType; color: string }> = {
      pdf: { icon: FileText, color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
      image: { icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
      excel: { icon: FileSpreadsheet, color: 'text-green-500 bg-green-50 dark:bg-green-900/30' },
      word: { icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
      other: { icon: File, color: 'text-gray-500 bg-bg-subtle' },
    };
    return icons[type] || icons.other;
  };

  const [activeTab, setActiveTab] = useState<'info' | 'report'>('info');
  const [reportContent, setReportContent] = useState(event.report_content || '');
  const [description, setDescription] = useState(event.description || '');

  useEffect(() => {
    setDescription(event.description || '');
    setReportContent(event.report_content || '');
  }, [event.description, event.report_content]);

  const handleSaveDescription = async () => {
    try {
      await updateMutation.mutateAsync({
        id: event.id,
        description: description,
      });
      showToast('Lưu nội dung chương trình thành công', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi lưu nội dung', 'error');
    }
  };

  // RLS check for Edit/Delete UI buttons
  // Only Admin or the creator can edit/delete
  const canEditOrDelete = user?.Role === 'Admin' || user?.SystemRole === 'super_admin' || supabaseUser?.id === event.created_by;
  // Báo cáo kết quả: Có thể cho phép người tạo hoặc người tham dự đều được điền (ở đây cho đơn giản là editOrDelete hoặc attendees)
  const canEditReport = canEditOrDelete || event.attendees?.some(a => a.EmployeeID === user?.EmployeeID);

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      try {
        await deleteMutation.mutateAsync(event.id);
        showToast('Xóa sự kiện thành công', 'success');
        onClose();
      } catch (error) {
        showToast('Có lỗi xảy ra khi xóa', 'error');
      }
    }
  };

  const handleSaveReport = async () => {
    try {
      await updateMutation.mutateAsync({
        id: event.id,
        report_content: reportContent,
      });
      showToast('Lưu báo cáo/kết quả thành công', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi lưu báo cáo', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-app">
      {/* Header Info Banner */}
      <div className="bg-bg-surface border-b border-border px-6 py-5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-txt-primary mb-2 leading-tight">
              {event.title}
            </h2>
            <div className="flex items-center gap-3">
              <Badge {...{ color: getEventTypeColor(event.event_type) } as any}>
                {getEventTypeName(event.event_type)}
              </Badge>
              <div className="flex items-center text-sm text-txt-muted">
                <Calendar className="w-4 h-4 mr-1.5" />
                {format(new Date(event.start_time), 'EEEE, dd/MM/yyyy • HH:mm', { locale: vi })}
                {' - '}
                {format(new Date(event.end_time), 'HH:mm', { locale: vi })}
              </div>
            </div>
          </div>
          {canEditOrDelete && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                <Edit className="w-4 h-4 mr-1.5" /> Sửa
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50/50 border-red-200 dark:border-red-900/30" onClick={handleDelete} loading={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 px-6 border-b border-border bg-bg-surface shrink-0">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-txt-muted hover:text-txt-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          Thông tin chi tiết
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'report'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-txt-muted hover:text-txt-primary'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Báo cáo / Kết quả
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-6 space-y-6">
            <div className="bg-bg-surface rounded-xl p-5 border border-border shadow-sm space-y-5">
              {(event.room || event.location) && (
                <div className="flex items-start text-sm text-txt-secondary">
                  <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center mr-3 shrink-0">
                    <MapPin className="w-4 h-4 text-txt-muted" />
                  </div>
                  <div className="pt-1.5">
                    <p className="font-semibold text-txt-primary mb-1">Địa điểm</p>
                    <p>{event.room ? getRoomName(event.room as string) : event.location}</p>
                  </div>
                </div>
              )}

              {event.vehicle && (
                <div className="flex items-start text-sm text-txt-secondary">
                  <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center mr-3 shrink-0">
                    <Car className="w-4 h-4 text-txt-muted" />
                  </div>
                  <div className="pt-1.5">
                    <p className="font-semibold text-txt-primary mb-1">Phương tiện di chuyển</p>
                    <p className="font-semibold text-primary-600 dark:text-primary-400">{event.vehicle}</p>
                  </div>
                </div>
              )}

              {(event.description || canEditOrDelete) && (
                <div className="flex items-start text-sm text-txt-secondary">
                  <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center mr-3 shrink-0">
                    <Clock className="w-4 h-4 text-txt-muted" />
                  </div>
                  <div className="pt-1.5 w-full">
                    <p className="font-semibold text-txt-primary mb-1">Nội dung / Chương trình</p>
                    {canEditOrDelete ? (
                      <div className="space-y-2 mt-1 w-full">
                        <textarea
                          className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-border bg-bg-app text-txt-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none focus:outline-none"
                          placeholder="Nhập nội dung/chương trình sự kiện..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={handleSaveDescription}
                            loading={updateMutation.isPending}
                            leftIcon={<Save className="w-3.5 h-3.5" />}
                          >
                            Lưu Nội Dung
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap mt-1">{description || 'Chưa có nội dung'}</p>
                    )}
                  </div>
                </div>
              )}

              {event.leader && (
                <div className="flex items-start text-sm text-txt-secondary border-b border-border/50 pb-4">
                  <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center mr-3 shrink-0">
                    <UserCheck className="w-4 h-4 text-txt-muted" />
                  </div>
                  <div className="pt-1.5 w-full">
                    <p className="font-semibold text-txt-primary mb-1">Người chủ trì</p>
                    <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-bg-muted/40 w-fit min-w-[200px]">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-400 shrink-0">
                        {event.leader.FullName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-txt-primary leading-tight">
                          {event.leader.FullName}
                        </span>
                        {event.leader.Position && (
                          <span className="text-[11px] text-txt-muted">
                            {event.leader.Position}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start text-sm text-txt-secondary">
                <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center mr-3 shrink-0">
                  <Users className="w-4 h-4 text-txt-muted" />
                </div>
                <div className="pt-1.5 w-full">
                  <p className="font-semibold text-txt-primary mb-2">Thành phần tham dự ({event.attendees?.length || 0})</p>
                  {event.attendees && event.attendees.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {event.attendees.map((emp, idx) => (
                        <div key={emp.EmployeeID || (emp as any).id || idx} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-bg-muted/40">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                            {(emp.FullName || (emp as any).full_name || 'NV').charAt(0)}
                          </div>
                          <span className="font-semibold text-txt-primary">
                            {emp.FullName || (emp as any).full_name || 'Nhân viên'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-txt-muted italic mt-1 text-sm">Chưa có thông tin</p>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments & Gallery Section */}
            {attachments.length > 0 && (
              <div className="bg-bg-surface rounded-xl p-5 border border-border shadow-sm space-y-5">
                <h3 className="text-sm font-semibold text-txt-primary flex items-center gap-2 border-b border-border pb-3">
                  <FileText className="w-4 h-4 text-primary-500" />
                  Tài liệu & Hình ảnh đính kèm ({attachments.length})
                </h3>

                {/* Inline Images Grid */}
                {imageAttachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-txt-muted uppercase tracking-wider">Hình ảnh hiện trường / sự kiện</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageAttachments.map(img => (
                        <div
                          key={img.id}
                          onClick={() => setPreviewUrl(img.publicUrl || null)}
                          className="relative aspect-video rounded-lg overflow-hidden border border-border bg-bg-muted cursor-zoom-in group hover:border-primary-500 transition-colors"
                        >
                          <img
                            src={img.publicUrl}
                            alt={img.fileName}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other files list */}
                {fileAttachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-txt-muted uppercase tracking-wider">Tài liệu, văn bản đính kèm</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fileAttachments.map(file => {
                        const { icon: Icon, color } = getFileIconInfo(file.fileType);
                        return (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-muted/30 hover:bg-bg-muted/60 transition-colors"
                          >
                            <a
                              href={file.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer ${color} hover:scale-105 transition-transform`}
                              title="Click để xem tài liệu"
                            >
                              <Icon className="w-5 h-5" />
                            </a>
                            <div className="flex-1 min-w-0">
                              <a
                                href={file.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-txt-primary hover:text-primary-500 truncate block cursor-pointer"
                                title={file.fileName}
                              >
                                {file.fileName}
                              </a>
                              <span className="text-xs text-txt-muted block">
                                {DocumentService.formatSize(file.fileSize)}
                              </span>
                            </div>
                            {file.publicUrl && (
                              <a
                                href={file.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-txt-muted hover:text-primary-500 hover:bg-bg-muted rounded transition-colors"
                                title="Mở trong tab mới"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="p-6 space-y-6">
            <div className="bg-bg-surface rounded-xl p-5 border border-border shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-semibold text-txt-primary mb-2">
                  Nội dung kết quả / Báo cáo
                </label>
                <textarea
                  className="w-full min-h-[150px] p-3 text-sm rounded-lg border border-border bg-bg-app text-txt-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none focus:outline-none"
                  placeholder={canEditReport ? "Nhập nội dung báo cáo hoặc kết quả cuộc họp..." : "Chưa có báo cáo"}
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  disabled={!canEditReport}
                />
              </div>

              {canEditReport && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveReport} 
                    loading={updateMutation.isPending}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Lưu Báo Cáo
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-bg-surface rounded-xl p-5 border border-border shadow-sm">
              <DocumentAttachments
                relatedType="agency_event"
                relatedId={event.id}
              />
            </div>
          </div>
        )}
      {/* Lightbox / Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col justify-center items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              crossOrigin="anonymous"
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain border border-white/10"
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
