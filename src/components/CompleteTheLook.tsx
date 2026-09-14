import React, { useMemo } from 'react';
import { Sparkles, Plus, Check } from 'lucide-react';
import { JewelryItem } from '../types';

interface CompleteTheLookProps {
  currentOrnament: JewelryItem;
  catalog: JewelryItem[];
  onSelectOrnament: (item: JewelryItem) => void;
  layeredOrnaments: JewelryItem[];
  onToggleLayer: (item: JewelryItem) => void;
}

export const CompleteTheLook: React.FC<CompleteTheLookProps> = ({
  currentOrnament,
  catalog,
  onSelectOrnament,
  layeredOrnaments,
  onToggleLayer,
}) => {
  const { recommendations } = useMemo(() => {
    let matches: JewelryItem[] = [];
    if (currentOrnament.matchingCodes && currentOrnament.matchingCodes.length > 0) {
      matches = catalog.filter((i) => currentOrnament.matchingCodes?.includes(i.code));
    }

    if (matches.length < 2) {
      const complementary = catalog.filter(
        (i) =>
          i.id !== currentOrnament.id &&
          i.category !== currentOrnament.category &&
          (i.collection === currentOrnament.collection || i.purity === currentOrnament.purity)
      );
      matches = Array.from(new Set([...matches, ...complementary])).slice(0, 3);
    }

    return { recommendations: matches };
  }, [currentOrnament, catalog]);

  if (recommendations.length === 0) return null;

  return (
    <section className="bg-[#1F0A0E] border border-[#540813] rounded-2xl p-4 shadow-lg space-y-3">
      {/* Header with breathing room */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F5D061]" />
          <h3 className="font-serif font-bold text-sm text-[#FAF6EE]">Complete The Look</h3>
        </div>
        <span className="text-[11px] text-stone-400">Coordinated Suite</span>
      </div>

      {/* Recommendations Cards spaced out */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {recommendations.map((item) => {
          const isLayered = layeredOrnaments.some((lo) => lo.id === item.id);
          return (
            <div
              key={item.id}
              className={`bg-[#140406] border rounded-xl p-2.5 flex flex-col justify-between transition-all ${
                isLayered
                  ? 'border-[#D4AF37] ring-1 ring-[#D4AF37] bg-[#2E0B11]'
                  : 'border-[#3D080E] hover:border-[#D4AF37]/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center p-1 shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="font-mono text-[10px] font-bold text-[#D4AF37] block truncate">
                    {item.code}
                  </span>
                  <span className="text-xs font-semibold text-white block">
                    ₹{(item.price / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => onSelectOrnament(item)}
                  className="py-1 px-2 rounded-lg text-[11px] font-medium bg-[#25080E] hover:bg-[#380E16] text-stone-300 text-center"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => onToggleLayer(item)}
                  className={`py-1 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                    isLayered
                      ? 'bg-[#D4AF37] text-[#3D040C]'
                      : 'bg-[#540813] hover:bg-[#6E0B1A] text-[#F5D061]'
                  }`}
                >
                  {isLayered ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>On</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Layer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
