import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Tag, Sparkles } from 'lucide-react';
import { JewelryItem, JewelryCategory, BodyPartTarget } from '../types';

interface CustomOrnamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomOrnament: (item: JewelryItem) => void;
}

export const CustomOrnamentModal: React.FC<CustomOrnamentModalProps> = ({
  isOpen,
  onClose,
  onAddCustomOrnament,
}) => {
  const [code, setCode] = useState(`GRT-CUST-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<JewelryCategory>('necklace');
  const [purity, setPurity] = useState('22KT 916 Hallmarked Gold');
  const [weight, setWeight] = useState('32.400 g');
  const [price, setPrice] = useState('245000');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      alert('Please upload a photo of the ornament.');
      return;
    }

    const bodyPart: BodyPartTarget =
      category === 'bangles' || category === 'ring' ? 'hand' : 'face';

    const newItem: JewelryItem = {
      id: `custom-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim() || `Custom ${category.toUpperCase()}`,
      category,
      collection: 'Showroom Tray Piece',
      purity,
      grossWeight: weight,
      price: Number(price) || 200000,
      description: 'Custom tray piece digitized for instant virtual try-on.',
      imageUrl: imagePreview,
      defaultPlacement: {
        xPercent: 50,
        yPercent: category === 'necklace' ? 62 : category === 'choker' ? 52 : 45,
        scale: 1.0,
        rotation: 0,
      },
      bodyPartTarget: bodyPart,
    };

    onAddCustomOrnament(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1C0609] border border-[#D4AF37]/50 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#540813] to-[#3D040C] p-3.5 border-b border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="font-serif font-bold text-sm text-[#FAF6EE]">
              Add Showroom Tray Ornament
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3 text-xs">
          {/* Photo input */}
          <div>
            <label className="text-stone-300 font-medium block mb-1.5">
              Ornament Photo (White Background / Showroom Tray):
            </label>
            {imagePreview ? (
              <div className="relative aspect-video rounded-xl bg-[#0D0305] border border-[#D4AF37]/40 flex items-center justify-center p-2 overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Ornament Preview"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-[#540813] hover:border-[#D4AF37]/60 rounded-xl p-5 flex flex-col items-center justify-center gap-2 bg-[#120406] transition-colors"
              >
                <Upload className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-stone-300 font-medium text-xs">
                  Tap to capture or upload ornament photo
                </span>
                <span className="text-stone-500 text-[10px]">
                  Supports PNG with transparency or JPG
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Code & Name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-stone-400 text-[11px] block mb-1">
                Product Code / SKU:
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-[#120406] border border-[#3E0810] focus:border-[#D4AF37] rounded-lg px-2.5 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-stone-400 text-[11px] block mb-1">
                Ornament Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as JewelryCategory)}
                className="w-full bg-[#120406] border border-[#3E0810] focus:border-[#D4AF37] rounded-lg px-2.5 py-2 text-white"
              >
                <option value="necklace">Necklace / Haram</option>
                <option value="choker">Choker</option>
                <option value="earrings">Jhumkas / Earrings</option>
                <option value="bangles">Kada Bangles</option>
                <option value="ring">Diamond Ring</option>
                <option value="maang_tikka">Maang Tikka</option>
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-stone-400 text-[11px] block mb-1">
              Design Name:
            </label>
            <input
              type="text"
              placeholder="e.g. Swarna Nakshi Bridal Choker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#120406] border border-[#3E0810] focus:border-[#D4AF37] rounded-lg px-2.5 py-2 text-white"
            />
          </div>

          {/* Price & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-stone-400 text-[11px] block mb-1">
                Gross Weight:
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-[#120406] border border-[#3E0810] focus:border-[#D4AF37] rounded-lg px-2.5 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-stone-400 text-[11px] block mb-1">
                Showroom Price (₹):
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#120406] border border-[#3E0810] focus:border-[#D4AF37] rounded-lg px-2.5 py-2 text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-[#120406] text-stone-400 hover:text-white border border-[#3E0810]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#6B0E1D] hover:bg-[#851224] text-[#FAF6EE] font-semibold border border-[#D4AF37]/40"
            >
              Add &amp; Try On
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
