import React, { useRef } from 'react';
import { Camera, Upload, Check } from 'lucide-react';
import { CustomerPhoto, BodyPartTarget } from '../types';
import { SAMPLE_PORTRAITS } from '../data/samplePhotos';

interface PhotoSelectorProps {
  currentPhoto: CustomerPhoto;
  onPhotoSelected: (photo: CustomerPhoto) => void;
  targetCategory: BodyPartTarget;
  onTargetCategoryChange: (target: BodyPartTarget) => void;
  onOpenSelfieModal: (type?: BodyPartTarget) => void;
}

export const PhotoSelector: React.FC<PhotoSelectorProps> = ({
  currentPhoto,
  onPhotoSelected,
  targetCategory,
  onTargetCategoryChange,
  onOpenSelfieModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onPhotoSelected({
          id: `upload-${Date.now()}`,
          name: targetCategory === 'face' ? 'Customer Face' : 'Customer Hand',
          url: result,
          targetCategory,
          aspectRatio: '3:4',
          isSample: false,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#1F0A0E] border border-[#540813] rounded-2xl p-4 shadow-md space-y-3.5">
      {/* 2 Selfie Input Options: Face & Hand */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-stone-300">
          <span className="font-semibold text-[#F5D061]">Customer Selfie Mode</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] text-stone-400 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span>Upload file</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="selfie-face-btn"
            type="button"
            onClick={() => {
              onTargetCategoryChange('face');
              onOpenSelfieModal('face');
            }}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
              targetCategory === 'face'
                ? 'bg-[#3A0A10] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                : 'bg-[#140306] border-[#3D080E] hover:border-[#D4AF37]/50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#540813] flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#F5D061]" />
            </div>
            <span className="text-xs font-bold text-[#FAF6EE]">Face Selfie</span>
            <span className="text-[10px] text-stone-400">Necklace, Jhumkas, Tikka</span>
          </button>

          <button
            id="selfie-hand-btn"
            type="button"
            onClick={() => {
              onTargetCategoryChange('hand');
              onOpenSelfieModal('hand');
            }}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
              targetCategory === 'hand'
                ? 'bg-[#3A0A10] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                : 'bg-[#140306] border-[#3D080E] hover:border-[#D4AF37]/50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#540813] flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#F5D061]" />
            </div>
            <span className="text-xs font-bold text-[#FAF6EE]">Hand Selfie</span>
            <span className="text-[10px] text-stone-400">Kada Bangles, Rings</span>
          </button>
        </div>
      </div>

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

      {/* Demo Models (Face & Hand only) */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-[11px] text-stone-400">Or use demo photo:</span>
        <div className="flex gap-2">
          {SAMPLE_PORTRAITS.map((p) => {
            const isCurrent = currentPhoto.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPhotoSelected(p);
                  onTargetCategoryChange(p.targetCategory);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                  isCurrent
                    ? 'bg-[#2E0B11] border-[#D4AF37] text-[#F5D061]'
                    : 'bg-[#140306] border-[#3D080E] text-stone-300 hover:text-white'
                }`}
              >
                <img src={p.url} alt={p.name} className="w-4 h-4 rounded-full object-cover" />
                <span>{p.name}</span>
                {isCurrent && <Check className="w-3 h-3 text-[#D4AF37]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
