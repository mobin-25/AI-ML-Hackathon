import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* 3D Colorful Isometric Cube Icon with upward trend */}
      <svg className="w-9 h-9 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cubeTop" x1="14" y1="8" x2="34" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="cubeLeft" x1="10" y1="20" x2="24" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="cubeRight" x1="24" y1="20" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC4899" />
            <stop offset="1" stopColor="#FF642D" />
          </linearGradient>
          <filter id="glow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Isometric Cube Faces */}
        <path d="M24 7L38 15V27L24 19V7Z" fill="url(#cubeTop)" opacity="0.9" />
        <path d="M10 15L24 7V19L10 27V15Z" fill="url(#cubeTop)" opacity="0.95" />
        <path d="M10 19L24 27V41L10 33V19Z" fill="url(#cubeLeft)" />
        <path d="M24 27L38 19V33L24 41V27Z" fill="url(#cubeRight)" />

        {/* Nodes / Spheres */}
        <circle cx="10" cy="19" r="3.2" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="1.2" />
        <circle cx="24" cy="7" r="3.2" fill="#A78BFA" stroke="#FFFFFF" strokeWidth="1.2" />
        <circle cx="38" cy="19" r="3.2" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1.2" />
        <circle cx="24" cy="27" r="3.2" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.2" />

        {/* Trend Arrow rising from bottom-left to top-right */}
        <path d="M14 31L23 21L28 25L37 13" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M31 13H37V19" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="text-[20px] font-extrabold tracking-tight leading-none text-[#191919] flex items-center">
          SmartStock<span className="text-[#FF3366] font-extrabold">AI</span>
        </div>
        <div className="text-[8px] font-bold tracking-[0.16em] uppercase text-[#6366F1] mt-0.5 leading-none">
          PREDICT <span className="text-[#94A3B8]">•</span> OPTIMIZE <span className="text-[#94A3B8]">•</span> AUTOMATE
        </div>
      </div>
    </div>
  );
};
