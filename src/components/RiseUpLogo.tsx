import React from 'react';

interface RiseUpLogoProps {
  className?: string;
  showText?: boolean;
}

export const RiseUpLogo: React.FC<RiseUpLogoProps> = ({ className = 'h-8 w-auto', showText = true }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* RiseUp Pure Monochrome Geometric Ascent Icon */}
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 ring-1 ring-white/30 shadow-sm">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-black stroke-[3] stroke-linecap-round stroke-linejoin-round" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-black tracking-widest text-white uppercase font-mono">
            RISEUP
          </span>
          <span className="text-[9px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
            STUDIO
          </span>
        </div>
      )}
    </div>
  );
};
