import React from 'react';

export const LogoDDCN = ({ className = "w-16 h-16" }: { className?: string }) => {
  return (
    <img
      src="/logo-ddcn.svg"
      alt="DD&HT Logo"
      className={className}
      draggable={false}
    />
  );
};
