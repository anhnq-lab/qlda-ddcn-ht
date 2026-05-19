import React, { useState } from 'react';
import { Search, X, BookOpen, ExternalLink, HelpCircle, FileText, PlayCircle } from 'lucide-react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext?: string; // e.g. 'contracts', 'bidding', 'reports'
}

type Article = {
  id: string;
  title: string;
  excerpt: string;
  type: 'doc' | 'video';
  module: string;
};

// Mock data: Mảng tài liệu hướng dẫn (sẽ fetch API trong thực tế)
const KB_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'Cách khởi tạo một dự án mới theo chuẩn Đầu tư Xây dựng',
    excerpt: 'Hướng dẫn nhập thông tin Tên, Mã dự án, Tổng mức đầu tư và phân công Cán bộ Quản lý dự án.',
    type: 'video',
    module: 'projects',
  },
  {
    id: 'a2',
    title: 'Quy trình quản lý các gói thầu',
    excerpt: 'Các bước thêm gói thầu, phân bổ chi phí dự toán vào gói thầu, cài đặt hình thức LCNT.',
    type: 'doc',
    module: 'bidding',
  },
  {
    id: 'a3',
    title: 'Tạo Hợp đồng từ Kết quả trúng thầu',
    excerpt: 'Quy trình khởi tạo Hợp đồng thi công/tư vấn, ràng buộc điều khoản bảo lãnh và tạm ứng.',
    type: 'doc',
    module: 'contracts',
  },
  {
    id: 'a4',
    title: 'Nghiệm thu thanh toán khối lượng A-B',
    excerpt: 'Nhập bảng khối lượng hoàn thành, trừ lùi chiết khấu, thu hồi tạm ứng.',
    type: 'doc',
    module: 'payments',
  },
];

export const ContextualHelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose, currentContext = 'projects' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc bài viết dựa vào search term, nếu không có search term thì ưu tiên hiển thị bài viết thuộc context hiện tại.
  const filteredArticles = KB_ARTICLES.filter((article) => {
    if (searchTerm) {
      return (
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return article.module === currentContext;
  });

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-slate- backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[420px] bg-white dark:bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <HelpCircle size={22} className="stroke-[2.5]" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trung tâm trợ giúp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu hướng dẫn nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl text-sm focus:bg-white dark:bg-slate-800 dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {!searchTerm && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium">
              <span className="text-slate-500 dark:text-slate-400">Được đề xuất cho trang:</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                {currentContext}
              </span>
            </div>
          )}

          <div className="space-y-4">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="group block p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-slate-800 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                      {article.type === 'video' ? <PlayCircle size={18} /> : <FileText size={18} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1 leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 flex flex-col items-center">
                <BookOpen className="text-slate-300 dark:text-slate-600 mb-3" size={40} />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Không tìm thấy tài liệu phù hợp.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
          <a
            href="https://help.cic.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
              Mở trang Tự học (Knowledge Base)
            </div>
            <ExternalLink size={16} className="text-slate-400" />
          </a>
        </div>
      </div>
    </>
  );
};
