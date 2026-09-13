import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Crown,
  HeartHandshake,
  Sun,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { JewelryItem, BodyPartTarget, AIStylingFeedback } from '../types';

interface AIStylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  ornament: JewelryItem;
  targetCategory: BodyPartTarget;
}

const OCCASIONS = [
  'Bridal Muhurtham',
  'Grand Reception',
  'Temple Puja & Festival',
  'Engagement & Sangeet',
  'Anniversary Milestone',
];

export const AIStylistModal: React.FC<AIStylistModalProps> = ({
  isOpen,
  onClose,
  ornament,
  targetCategory,
}) => {
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<AIStylingFeedback | null>(null);

  const fetchAdvice = async (selectedOccasion: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/tryon/style-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: ornament.code,
          productName: ornament.name,
          category: ornament.category,
          purity: ornament.purity,
          customerTarget: targetCategory,
          occasion: selectedOccasion,
        }),
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error('Stylist advice fetch failed:', err);
      // Graceful fallback
      setFeedback({
        recommendation: `The ${ornament.name} is an exquisite heirloom that graces the neckline with regal South Indian poise.`,
        faceNeckHarmony: `Its curvature sits flush along the clavicle line, elongating the silhouette and highlighting the face.`,
        skinToneMatch: `The pure 22KT gold luster and kemp stone rubies reflect warm, luminous highlights on Indian skin tones.`,
        idealOccasion: selectedOccasion,
        stylingTips: [
          'Style with rich crimson, peacock blue, or bottle green Kanjeevaram silk.',
          'Pair with matching GRT antique jhumkas to complete the bridal regalia.',
          'Choose sweetheart or traditional round neckline blouses for maximum ornament exposure.',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdvice(occasion);
    }
  }, [isOpen, ornament.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1C0609] border border-[#D4AF37]/50 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#540813] to-[#3D040C] p-4 border-b border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm sm:text-base text-[#FAF6EE]">
                GRT Master Jewellery Stylist
              </h2>
              <p className="text-[11px] text-[#E5C06E]">
                Personalized Drape, Proportions &amp; Silhouette Guidance
              </p>
            </div>
          </div>
          <button
            id="close-stylist-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Occasion Switcher */}
        <div className="p-3 bg-[#140306] border-b border-[#3D080E] space-y-1.5">
          <label className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Select Event / Occasion for Custom Styling:</span>
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {OCCASIONS.map((occ) => (
              <button
                key={occ}
                type="button"
                onClick={() => {
                  setOccasion(occ);
                  fetchAdvice(occ);
                }}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] transition-all font-medium ${
                  occasion === occ
                    ? 'bg-[#D4AF37] text-[#3D040C] font-bold'
                    : 'bg-[#25080E] text-stone-300 hover:bg-[#380D15] border border-[#540813]'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
              <p className="text-stone-300 text-sm font-medium">
                Consulting GRT Heritage Gemologist &amp; Draping Specialist...
              </p>
            </div>
          ) : feedback ? (
            <>
              {/* Core Recommendation Card */}
              <div className="bg-[#2D0910] border border-[#D4AF37]/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-[#F5D061] font-semibold text-xs font-serif">
                  <Crown className="w-4 h-4 text-[#D4AF37]" />
                  <span>Curator's Verdict for {ornament.code}</span>
                </div>
                <p className="text-stone-200 leading-relaxed text-xs">
                  {feedback.recommendation}
                </p>
              </div>

              {/* Anatomy & Proportions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#160407] border border-[#3E0810] p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#E5C06E] font-semibold text-[11px]">
                    <HeartHandshake className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Neckline &amp; Facial Harmony</span>
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {feedback.faceNeckHarmony}
                  </p>
                </div>

                <div className="bg-[#160407] border border-[#3E0810] p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#E5C06E] font-semibold text-[11px]">
                    <Sun className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Luster &amp; Skin Undertones</span>
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {feedback.skinToneMatch}
                  </p>
                </div>
              </div>

              {/* Styling & Saree Pairing Tips */}
              {feedback.stylingTips && feedback.stylingTips.length > 0 && (
                <div className="bg-[#160407] border border-[#3E0810] p-3.5 rounded-xl space-y-2">
                  <div className="text-[11px] font-semibold text-[#F5D061] tracking-wide uppercase font-serif">
                    Showroom Stylist's Recommendations:
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-stone-300">
                    {feedback.stylingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#140306] border-t border-[#3E0810] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#6B0E1D] hover:bg-[#851224] text-[#FAF6EE] text-xs font-semibold tracking-wide border border-[#D4AF37]/30"
          >
            Apply to Virtual Try-On
          </button>
        </div>
      </div>
    </div>
  );
};
