import React from 'react';

interface TrackHiveLogoProps {
  className?: string;
  iconOnly?: boolean;
  isDarkBg?: boolean;
}

export default function TrackHiveLogo({ className = 'h-12 w-auto', iconOnly = false, isDarkBg = false }: TrackHiveLogoProps) {
  if (iconOnly) {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="trackhive-logo-svg-icon"
      >
        <g>
          {/* Left light transparent hexagon */}
          <path
            d="M 15 42 L 35 30 L 55 42 L 55 66 L 35 78 L 15 66 Z"
            fill="#10B981"
            fillOpacity="0.25"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Right light transparent hexagon */}
          <path
            d="M 45 42 L 65 30 L 85 42 L 85 66 L 65 78 L 45 66 Z"
            fill="#10B981"
            fillOpacity="0.25"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Deep solid central hexagon */}
          <path
            d="M 30 32 L 50 20 L 70 32 L 70 56 L 50 68 L 30 56 Z"
            fill="#059669"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Keyhole indicator inside central hexagon */}
          <circle cx="50" cy="41" r="5" fill="white" />
          <path
            d="M 48.5 45 L 51.5 45 L 52.5 54 L 47.5 54 Z"
            fill="white"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* SVG Hexagram Logo Icon */}
      <svg
        viewBox="0 0 100 100"
        className="h-12 w-12 shrink-0 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="trackhive-logo-svg-main"
      >
        <g>
          {/* Left light transparent hexagon */}
          <path
            d="M 15 42 L 35 30 L 55 42 L 55 66 L 35 78 L 15 66 Z"
            fill="#10B981"
            fillOpacity="0.25"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Right light transparent hexagon */}
          <path
            d="M 45 42 L 65 30 L 85 42 L 85 66 L 65 78 L 45 66 Z"
            fill="#10B981"
            fillOpacity="0.25"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Deep solid central hexagon */}
          <path
            d="M 30 32 L 50 20 L 70 32 L 70 56 L 50 68 L 30 56 Z"
            fill="#059669"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Keyhole indicator inside central hexagon */}
          <circle cx="50" cy="41" r="5" fill="white" />
          <path
            d="M 48.5 45 L 51.5 45 L 52.5 54 L 47.5 54 Z"
            fill="white"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Typography Label */}
      <div className="flex flex-col items-start leading-none justify-center select-none">
        <span className={`text-3xl font-black font-sans tracking-tight leading-tight ${isDarkBg ? 'text-white' : 'text-emerald-800'}`}>
          TrackHive
        </span>
        <span className={`text-[9px] font-bold tracking-[0.25em] font-sans mt-0.5 leading-none uppercase ${isDarkBg ? 'text-emerald-400' : 'text-emerald-700'}`}>
          Field Force Management
        </span>
        <div className={`w-full h-[1.5px] mt-1 ${isDarkBg ? 'bg-emerald-500/50' : 'bg-emerald-600/60'}`} />
      </div>
    </div>
  );
}
