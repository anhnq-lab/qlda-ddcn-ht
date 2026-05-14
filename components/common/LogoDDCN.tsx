import React from 'react';

export const LogoDDCN = ({ className = "w-16 h-16" }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 120" 
      className={className}
      fill="none"
    >
      <g transform="translate(0, -5)">
        {/* Mái vòm vàng phía sau */}
        <path d="M50 10 L35 25 L65 25 Z" className="fill-warning-500" />
        
        {/* --- KHỐI BÊN TRÁI (Far Left) --- */}
        <path d="M20 60 L35 45 V90 H20 Z" className="fill-primary-800 dark:fill-primary-500" />
        {/* Cắt trắng tạo cửa sổ dọc */}
        <path d="M24 64 L31 57 V90 H24 Z" className="fill-[#FCF9F2] dark:fill-[#060A14]" />

        {/* --- KHỐI BÊN PHẢI (Far Right) --- */}
        <path d="M80 60 L65 45 V90 H80 Z" className="fill-primary-800 dark:fill-primary-500" />
        {/* Cắt trắng tạo cửa sổ dọc */}
        <path d="M76 64 L69 57 V90 H76 Z" className="fill-[#FCF9F2] dark:fill-[#060A14]" />

        {/* --- TÒA NHÀ TRUNG TÂM --- */}
        {/* Nửa trái trung tâm */}
        <path d="M50 15 L35 30 V90 H50 Z" className="fill-primary-700 dark:fill-primary-400" />
        {/* Lỗ hổng (Cutout) chéo ở nửa trái */}
        <path d="M47 28 L38 37 V55 L47 46 Z" className="fill-[#FCF9F2] dark:fill-[#060A14]" />
        
        {/* Nửa phải trung tâm (Đậm hơn tạo bóng 3D) */}
        <path d="M50 15 L65 30 V90 H50 Z" className="fill-primary-900 dark:fill-primary-600" />
        {/* 3 dải trắng vát chéo ở nửa phải */}
        <path d="M50 32 L62 44 V52 L50 40 Z" className="fill-[#FCF9F2] dark:fill-[#060A14]" />
        <path d="M50 50 L62 62 V70 L50 58 Z" className="fill-[#FCF9F2] dark:fill-[#060A14]" />
        <path d="M50 68 L62 80 V90 H50 Z" className="fill-[#FCF9F2] dark:fill-[#060A14]" />

        {/* --- KHỐI NHỎ PHÍA TRƯỚC (Front Middle) --- */}
        <path d="M50 58 L32 72 V90 H68 V72 Z" className="fill-primary-600 dark:fill-primary-500" />
        {/* Trụ cắt dọc ở giữa khối trước */}
        <rect x="46" y="66" width="8" height="24" className="fill-[#FCF9F2] dark:fill-[#060A14]" />
        {/* Cắt vát chéo hai bên khối trước */}
        <path d="M42 72 L36 77 V90 H42 Z" className="fill-[#FCF9F2] dark:fill-[#060A14]" />
        <path d="M58 72 L64 77 V90 H58 Z" className="fill-[#FCF9F2] dark:fill-[#060A14]" />

        {/* --- ĐƯỜNG ĐẾ CHÂN (Base Line) --- */}
        <rect x="15" y="90" width="70" height="4" className="fill-primary-800 dark:fill-primary-600" />
      </g>

      {/* Chữ DD&HT */}
      <text 
        x="50" 
        y="112" 
        textAnchor="middle" 
        className="fill-primary-800 dark:fill-primary-300 font-black text-[16px] tracking-[0.15em]"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        DD&HT
      </text>
    </svg>
  );
};
