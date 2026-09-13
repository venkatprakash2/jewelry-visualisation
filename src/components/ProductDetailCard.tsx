import React, { useState } from 'react';
import { ShieldCheck, Scale, Sparkles, Store, Check } from 'lucide-react';
import { JewelryItem } from '../types';

interface ProductDetailCardProps {
  ornament: JewelryItem;
  onOpenStylist: () => void;
}

export const ProductDetailCard: React.FC<ProductDetailCardProps> = ({
  ornament,
  onOpenStylist,
}) => {
  const [booked, setBooked] = useState(false);

  return (
    <div className="bg-[#1F0A0E] border border-[#540813] rounded-2xl p-4 shadow-md space-y-4">
      {/* Title & Price with generous spacing */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] font-bold text-[#F5D061] bg-[#3D080E] px-2 py-0.5 rounded border border-[#D4AF37]/30">
            {ornament.code}
          </span>
          <h3 className="font-serif text-base font-bold text-[#FAF6EE] mt-1.5 leading-snug">
            {ornament.name}
          </h3>
        </div>

        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-white">
            ₹{ornament.price.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-stone-400">Showroom Price</div>
        </div>
      </div>

      {/* Hallmark & Weight specs */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-[#140306] p-2.5 rounded-xl border border-[#3E0810] flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <div>
            <span className="text-[10px] text-stone-400 block">Purity</span>
            <span className="text-[#F5D061] font-semibold text-xs block">
              {ornament.purity}
            </span>
          </div>
        </div>

        <div className="bg-[#140306] p-2.5 rounded-xl border border-[#3E0810] flex items-center gap-2.5">
          <Scale className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <div>
            <span className="text-[10px] text-stone-400 block">Gross Weight</span>
            <span className="text-white font-semibold text-xs block">
              {ornament.grossWeight}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenStylist}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#2C0B10] hover:bg-[#3D1017] text-[#F5D061] border border-[#D4AF37]/40 text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stylist Advice</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setBooked(true);
            setTimeout(() => setBooked(false), 3000);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            booked
              ? 'bg-emerald-700 text-white'
              : 'bg-[#6B0E1D] hover:bg-[#851224] text-white border border-[#D4AF37]/40'
          }`}
        >
          {booked ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Reserved</span>
            </>
          ) : (
            <>
              <Store className="w-4 h-4 text-[#D4AF37]" />
              <span>Reserve in Store</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
