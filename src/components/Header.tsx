import React from 'react';
import { Camera, Sparkles, Store } from 'lucide-react';

interface HeaderProps {
  onOpenSelfie?: () => void;
  onOpenStylist?: () => void;
  onOpenCatalog?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSelfie, onOpenStylist, onOpenCatalog }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#42060D] text-[#FAF6EE] shadow-md border-b border-[#D4AF37]/30">
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        {/* GRT Brand Crest */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5D061] via-[#D4AF37] to-[#8C6207] p-[1.5px] shadow-sm flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#540813] flex items-center justify-center">
              <span className="font-serif font-extrabold text-[#F5D061] text-sm tracking-tighter">
                GRT
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-serif text-base font-bold tracking-wider text-[#FAF6EE]">
                GRT JEWELLERS
              </h1>
              <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F5D061] text-[9px] px-1 py-0.2 rounded font-semibold uppercase">
                Try-On
              </span>
            </div>
            <p className="text-[9px] text-[#E5C06E]/90 tracking-widest uppercase font-medium">
              Since 1964 • 22KT 916 BIS Hallmark
            </p>
          </div>
        </div>

        {/* Top Direct Action Bar */}
        <div className="flex items-center gap-1.5">
          {onOpenSelfie && (
            <button
              id="header-take-selfie-btn"
              onClick={onOpenSelfie}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#6B0E1D] hover:bg-[#851224] border border-[#D4AF37]/50 text-[#F5D061] text-xs font-bold shadow-xs transition-colors"
              title="Click Customer Selfie"
            >
              <Camera className="w-3.5 h-3.5 text-[#F5D061]" />
              <span>Click Selfie</span>
            </button>
          )}

          {onOpenStylist && (
            <button
              id="header-ai-stylist-btn"
              onClick={onOpenStylist}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-[#F5D061] transition-colors"
              title="AI Stylist Advice"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
