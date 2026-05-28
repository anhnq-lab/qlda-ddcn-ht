import React from 'react';

export const LogoDDCN = ({ className = "w-16 h-16" }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 249 347"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Left building (shorter, behind) */}
      <rect x="48" y="48" width="32" height="155" className="fill-[#2B6EA0] dark:fill-[#60a5fa] transition-colors duration-200" />
      <rect x="48" y="48" width="32" height="155" fill="none" className="stroke-[#1E5A88] dark:stroke-[#3b82f6] transition-colors duration-200" strokeWidth="1.5" />
      {/* Gold accents on left building */}
      <rect x="58" y="48" width="5" height="155" className="fill-[#BDA558] dark:fill-[#fbbf24] transition-colors duration-200" />
      <rect x="67" y="48" width="5" height="155" className="fill-[#BDA558] dark:fill-[#fbbf24] transition-colors duration-200" />

      {/* Right building (taller, overlapping) */}
      <rect x="72" y="14" width="44" height="189" className="fill-[#2568A0] dark:fill-[#3b82f6] transition-colors duration-200" />
      <rect x="72" y="14" width="44" height="189" fill="none" className="stroke-[#1B5590] dark:stroke-[#2563eb] transition-colors duration-200" strokeWidth="2" />
      {/* Gold accents on right building */}
      <rect x="84" y="14" width="5.5" height="189" className="fill-[#BDA558] dark:fill-[#fbbf24] transition-colors duration-200" />
      <rect x="96" y="14" width="5.5" height="55" className="fill-[#BDA558] dark:fill-[#fbbf24] transition-colors duration-200" />

      {/* Building edge highlights (subtle lighter tones) */}
      <rect x="48" y="48" width="2" height="155" className="fill-[#3B82B8] dark:fill-[#93c5fd] transition-colors duration-200" opacity="0.4" />
      <rect x="72" y="14" width="2" height="189" className="fill-[#3B82B8] dark:fill-[#93c5fd] transition-colors duration-200" opacity="0.4" />

      {/* Three green horizontal bars */}
      <rect x="114" y="58" width="88" height="22" rx="1.5" className="fill-[#8BC63E] dark:fill-[#34d399] transition-colors duration-200" />
      <rect x="114" y="78" width="88" height="5" rx="1" className="fill-[#6A9F45] dark:fill-[#059669] transition-colors duration-200" opacity="0.7" />

      <rect x="114" y="94" width="88" height="22" rx="1.5" className="fill-[#6AAB4A] dark:fill-[#34d399] transition-colors duration-200" />
      <rect x="114" y="114" width="88" height="5" rx="1" className="fill-[#4A8F3A] dark:fill-[#059669] transition-colors duration-200" opacity="0.7" />

      <rect x="114" y="130" width="88" height="22" rx="1.5" className="fill-[#4A9540] dark:fill-[#10b981] transition-colors duration-200" />
      <rect x="114" y="150" width="88" height="5" rx="1" className="fill-[#3A7530] dark:fill-[#047857] transition-colors duration-200" opacity="0.7" />

      {/* Curved road */}
      <path d="M 58 190 C 85 160, 150 165, 230 230 L 226 255 C 145 195, 80 190, 64 215 Z" className="fill-[#1E5A8F] dark:fill-[#2563eb] transition-colors duration-200" />
      <path d="M 64 215 C 80 190, 145 195, 226 255 L 230 265 C 150 205, 85 198, 68 225 Z" className="fill-[#BDA558] dark:fill-[#fbbf24] transition-colors duration-200" />
      <path d="M 65 200 C 88 175, 148 180, 225 240" className="stroke-[#C4A44A] dark:stroke-[#fbbf24] transition-colors duration-200" strokeWidth="3.5" strokeDasharray="10 8" fill="none" />

      {/* Text DD&HT */}
      <g transform="translate(0,347) scale(0.1,-0.1)" stroke="none">
        {/* D (first) */}
        <path className="fill-[#1B3F6E] dark:fill-amber-300 transition-colors duration-200" d="M190 415 l0 -195 111 0 c62 0 129 5 150 12 101 30 156 154 114 256 -40 94 -97 121 -257 122 l-118 0 0 -195z m247 95 c67 -40 65 -152 -2 -191 -17 -10 -57 -19 -90 -21 l-60 -3 -3 118 -3 117 63 0 c45 0 72 -6 95 -20z" />
        {/* D (second) */}
        <path className="fill-[#1B3F6E] dark:fill-amber-300 transition-colors duration-200" d="M635 598 c-3 -7 -4 -94 -2 -193 l2 -180 122 -3 c106 -2 128 0 162 17 77 40 119 122 106 205 -13 76 -49 121 -124 152 -44 19 -259 20 -266 2z m244 -82 c32 -17 51 -54 51 -101 0 -80 -42 -115 -140 -115 l-60 0 0 115 0 115 60 0 c34 0 73 -6 89 -14z" />
        {/* & */}
        <path className="fill-[#2D6A2E] dark:fill-emerald-400 transition-colors duration-200" d="M1174 606 c-60 -26 -83 -95 -47 -145 16 -23 15 -25 -14 -50 -41 -35 -56 -67 -49 -104 17 -85 134 -123 235 -77 l44 20 22 -20 21 -20 22 23 c27 29 27 34 2 55 -19 17 -19 18 -3 64 19 52 19 54 -19 63 -24 6 -29 3 -40 -21 -7 -16 -13 -31 -14 -33 -2 -2 -20 12 -40 32 l-37 34 31 18 c76 45 67 142 -16 165 -47 13 -60 12 -98 -4z m86 -65 c12 -24 6 -42 -21 -59 -26 -16 -49 0 -49 34 0 40 52 58 70 25z m-22 -192 c46 -44 50 -54 26 -63 -51 -20 -114 4 -114 42 0 20 27 62 39 62 4 0 27 -18 49 -41z" />
        {/* H */}
        <path className="fill-[#1B3F6E] dark:fill-amber-300 transition-colors duration-200" d="M1490 415 l0 -195 45 0 45 0 0 80 0 80 89 0 89 0 -5 -80 -5 -80 46 0 46 0 1 150 c0 83 1 169 1 193 l1 42 -43 0 -42 0 -1 -72 0 -73 -89 0 -88 0 0 75 0 75 -45 0 -45 0 0 -195z" />
        {/* T */}
        <path className="fill-[#1B3F6E] dark:fill-amber-300 transition-colors duration-200" d="M1890 569 l0 -40 61 2 62 3 -2 -157 -2 -157 45 0 c42 0 45 2 51 32 4 17 6 88 4 157 l-4 126 63 -1 62 -1 0 39 0 38 -170 0 -170 0 0 -41z" />
      </g>
    </svg>
  );
};

