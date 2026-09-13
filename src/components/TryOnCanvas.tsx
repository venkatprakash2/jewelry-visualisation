import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  JewelryItem,
  CustomerPhoto,
  TryOnSettings,
  BodyPartTarget,
} from '../types';
import { getJewelryCutoutCanvas, getSingleEarringCanvas } from '../utils/imageUtils';
import {
  renderNecklace3DDrape,
  renderRingFingerWrap,
  renderBangleWristWrap,
} from '../utils/drapeEngine';
import {
  ZoomIn,
  ZoomOut,
  RefreshCcw,
  Sparkles,
  Download,
  SplitSquareVertical,
  Camera,
  Layers,
  Sliders,
  Check,
} from 'lucide-react';

interface TryOnCanvasProps {
  photo: CustomerPhoto;
  ornament: JewelryItem;
  layeredOrnaments?: JewelryItem[];
  targetCategory: BodyPartTarget;
  onOpenSelfieModal: () => void;
}

export const TryOnCanvas: React.FC<TryOnCanvasProps> = ({
  photo,
  ornament,
  layeredOrnaments = [],
  targetCategory,
  onOpenSelfieModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Try-on positioning with self-aware 3D draping & anatomical size ratio
  const [settings, setSettings] = useState<TryOnSettings>({
    xOffset: 0,
    yOffset: 0,
    scale: 1.0,
    rotation: 0,
    opacity: 1.0,
    blendMode: 'source-over',
    goldLuster: 1.05,
    shadowIntensity: 0.45,
    earringSeparation: 140,
    visibleEar: 'left',
    landmarkDetected: undefined,
    // 3D Draping & Size Ratio Parameters
    wrapOcclusionEnabled: true,
    sizeRatio: 1.0,
    drapeCurvature: ornament.category === 'necklace' ? 12 : ornament.category === 'choker' ? 6 : 0,
    fingerOcclusionWidth: 14,
    neckContourWidth: 32,
  });

  const [isComparingSplit, setIsComparingSplit] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDraggingOrnament, setIsDraggingOrnament] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAiPositioning, setIsAiPositioning] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);
  const [showTuningDrawer, setShowTuningDrawer] = useState(false);

  // Trigger AI Auto-Placement with Computer Vision Biometric Calibration
  const triggerAiAutoPlacement = useCallback(async (itemToPlace: JewelryItem) => {
    setIsAiPositioning(true);
    try {
      const res = await fetch('/api/tryon/auto-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerImageBase64: photo.url,
          category: itemToPlace.category,
          selfieType: targetCategory,
          ornamentCode: itemToPlace.code,
          ornamentName: itemToPlace.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Save detected biometric coordinates and scale directly into settings
        const targetXPercent = typeof data.xPercent === 'number' ? data.xPercent : itemToPlace.defaultPlacement.xPercent;
        const targetYPercent = typeof data.yPercent === 'number' ? data.yPercent : itemToPlace.defaultPlacement.yPercent;
        const targetWidthRatio = typeof data.widthRatio === 'number' ? data.widthRatio : undefined;

        setSettings((prev) => ({
          ...prev,
          xOffset: 0,
          yOffset: 0,
          overrideXPercent: targetXPercent,
          overrideYPercent: targetYPercent,
          overrideWidthRatio: targetWidthRatio,
          scale: 1.0,
          rotation: typeof data.rotation === 'number' ? data.rotation : itemToPlace.defaultPlacement.rotation,
          sizeRatio: typeof data.sizeRatio === 'number' ? data.sizeRatio : 1.0,
          drapeCurvature: typeof data.drapeCurvature === 'number' ? data.drapeCurvature : prev.drapeCurvature,
          neckContourWidth: typeof data.neckContourWidth === 'number' ? data.neckContourWidth : prev.neckContourWidth,
          fingerOcclusionWidth: typeof data.fingerOcclusionWidth === 'number' ? data.fingerOcclusionWidth : prev.fingerOcclusionWidth,
          visibleEar: data.visibleEar || prev.visibleEar || 'left',
          landmarkDetected: data.landmarkFound,
          wrapOcclusionEnabled: true,
        }));

        setAiStatusMsg(`AI Biometric Fit: ${data.landmarkFound || 'Suprasternal notch & collarbone contour'}`);
        setTimeout(() => setAiStatusMsg(null), 3500);
      }
    } catch {
      // Fallback to calibrated default
      setSettings((prev) => ({
        ...prev,
        xOffset: 0,
        yOffset: 0,
        overrideXPercent: itemToPlace.defaultPlacement.xPercent,
        overrideYPercent: itemToPlace.defaultPlacement.yPercent,
        overrideWidthRatio: undefined,
        scale: itemToPlace.defaultPlacement.scale,
        rotation: itemToPlace.defaultPlacement.rotation,
      }));
    } finally {
      setIsAiPositioning(false);
    }
  }, [photo.url, targetCategory]);

  // Reset or re-fit on ornament or photo change
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      xOffset: 0,
      yOffset: 0,
      overrideXPercent: ornament.defaultPlacement.xPercent,
      overrideYPercent: ornament.defaultPlacement.yPercent,
      overrideWidthRatio: undefined,
      scale: ornament.defaultPlacement.scale,
      rotation: ornament.defaultPlacement.rotation,
      visibleEar: 'left',
      landmarkDetected: undefined,
      drapeCurvature: ornament.category === 'necklace' ? 12 : ornament.category === 'choker' ? 6 : 0,
      wrapOcclusionEnabled: true,
      sizeRatio: 1.0,
    }));
  }, [ornament.id, photo.id, targetCategory]);

  // Main rendering engine
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = photo.url;

    baseImg.onload = async () => {
      const targetWidth = baseImg.naturalWidth || 600;
      const targetHeight = baseImg.naturalHeight || 800;
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isComparingSplit) {
        // Draw Original on left side
        ctx.save();
        ctx.beginPath();
        const splitX = (canvas.width * splitPosition) / 100;
        ctx.rect(0, 0, splitX, canvas.height);
        ctx.clip();
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw Try-On on right side
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
        ctx.clip();
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

        // Draw primary ornament
        await drawOrnamentItem(ctx, baseImg, canvas.width, canvas.height, ornament, settings, true);

        // Draw layered ornaments
        for (const item of layeredOrnaments) {
          let customY = 0;
          if (ornament.category === 'necklace' && item.category === 'choker') {
            customY = -canvas.height * 0.12;
          } else if (ornament.category === 'choker' && item.category === 'necklace') {
            customY = canvas.height * 0.14;
          }
          await drawOrnamentItem(ctx, baseImg, canvas.width, canvas.height, item, {
            ...settings,
            scale: item.defaultPlacement.scale,
            xOffset: 0,
            yOffset: customY,
          }, false);
        }
        ctx.restore();

        // Split Divider line
        ctx.save();
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, canvas.height);
        ctx.stroke();

        const cy = canvas.height / 2;
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(splitX, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3D040C';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⬌', splitX, cy);
        ctx.restore();
        return;
      }

      // Normal mode: Draw customer base photo
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // Draw primary ornament with 3D wrap & drape
      await drawOrnamentItem(ctx, baseImg, canvas.width, canvas.height, ornament, settings, true);

      // Draw layered ornaments
      for (const item of layeredOrnaments) {
        let customY = 0;
        if (ornament.category === 'necklace' && item.category === 'choker') {
          customY = -canvas.height * 0.12;
        } else if (ornament.category === 'choker' && item.category === 'necklace') {
          customY = canvas.height * 0.14;
        }
        await drawOrnamentItem(ctx, baseImg, canvas.width, canvas.height, item, {
          ...settings,
          scale: item.defaultPlacement.scale,
          xOffset: 0,
          yOffset: customY,
        }, false);
      }
    };
  }, [photo.url, ornament, layeredOrnaments, settings, isComparingSplit, splitPosition]);

  // Draw ornament item with 3D Anatomical Draping and Occlusion
  const drawOrnamentItem = async (
    ctx: CanvasRenderingContext2D,
    baseImg: HTMLImageElement,
    width: number,
    height: number,
    item: JewelryItem,
    itemSettings: TryOnSettings,
    isPrimary: boolean
  ) => {
    const ornCanvas = await getJewelryCutoutCanvas(item.imageUrl);
    if (!ornCanvas || ornCanvas.width === 0) return;

    ctx.save();

    // Anatomical base anchor taking into account AI auto-fit or catalog defaults
    const activeXPercent = isPrimary && typeof itemSettings.overrideXPercent === 'number'
      ? itemSettings.overrideXPercent
      : item.defaultPlacement.xPercent;
    const activeYPercent = isPrimary && typeof itemSettings.overrideYPercent === 'number'
      ? itemSettings.overrideYPercent
      : item.defaultPlacement.yPercent;

    const baseX = (width * activeXPercent) / 100 + (isPrimary ? itemSettings.xOffset : 0);
    const baseY = (height * activeYPercent) / 100 + (isPrimary ? itemSettings.yOffset : 0);

    // Anatomically calibrated width multipliers based on ornament type
    let naturalWidthRatio = 0.52;
    if (isPrimary && typeof itemSettings.overrideWidthRatio === 'number') {
      naturalWidthRatio = itemSettings.overrideWidthRatio;
    } else if (item.category === 'necklace') naturalWidthRatio = 0.52;
    else if (item.category === 'choker') naturalWidthRatio = 0.40;
    else if (item.category === 'earrings') naturalWidthRatio = 0.13;
    else if (item.category === 'ring') naturalWidthRatio = 0.16;
    else if (item.category === 'bangles') naturalWidthRatio = 0.34;
    else if (item.category === 'maang_tikka') naturalWidthRatio = 0.15;

    const ornWidth = width * naturalWidthRatio * itemSettings.scale;
    const aspectRatio = ornCanvas.height / (ornCanvas.width || 1);
    const ornHeight = ornWidth * aspectRatio;

    if (item.category === 'necklace' || item.category === 'choker') {
      // 3D Catenary Neck Drape: curves gracefully below chin over clavicles
      renderNecklace3DDrape(
        ctx,
        ornCanvas,
        baseImg,
        baseX,
        baseY,
        ornWidth,
        ornHeight,
        itemSettings.rotation,
        itemSettings
      );
    } else if (item.category === 'ring') {
      // Ring going AROUND the finger
      renderRingFingerWrap(
        ctx,
        ornCanvas,
        baseImg,
        baseX,
        baseY,
        ornWidth,
        ornHeight,
        itemSettings.rotation,
        itemSettings,
        width,
        height
      );
    } else if (item.category === 'bangles') {
      // Bangle wrapping around wrist cross-section
      renderBangleWristWrap(
        ctx,
        ornCanvas,
        baseImg,
        baseX,
        baseY,
        ornWidth,
        ornHeight,
        itemSettings.rotation,
        itemSettings,
        width,
        height
      );
    } else if (item.category === 'earrings') {
      // Single isolated earring canvas to prevent duplicating pairs
      const singleEarringCanvas = await getSingleEarringCanvas(item.imageUrl);
      const earAspect = singleEarringCanvas.height / (singleEarringCanvas.width || 1);
      const earSize = ornWidth * (itemSettings.sizeRatio || 1.0);
      const earHeight = earSize * earAspect;
      const earPOV = itemSettings.visibleEar || 'left';

      // Use AI detected earlobe coordinates if available, otherwise anchor defaults
      const leftEarlobeX = (width * (activeXPercent || 27)) / 100 + (isPrimary ? itemSettings.xOffset : 0);
      const earlobeY = (height * (activeYPercent || 47)) / 100 + (isPrimary ? itemSettings.yOffset : 0);
      const rightEarlobeX = width - leftEarlobeX; // Symmetrical projection for right earlobe

      if (earPOV === 'left') {
        renderSingleOrnament(ctx, singleEarringCanvas, leftEarlobeX, earlobeY, earSize, earHeight, itemSettings.rotation, itemSettings);
      } else if (earPOV === 'right') {
        renderSingleOrnament(ctx, singleEarringCanvas, rightEarlobeX, earlobeY, earSize, earHeight, -itemSettings.rotation, itemSettings);
      } else {
        renderSingleOrnament(ctx, singleEarringCanvas, leftEarlobeX, earlobeY, earSize, earHeight, itemSettings.rotation, itemSettings);
        renderSingleOrnament(ctx, singleEarringCanvas, rightEarlobeX, earlobeY, earSize, earHeight, -itemSettings.rotation, itemSettings);
      }
    } else {
      // Maang Tikka: forehead nethi chutti
      const tikkaW = ornWidth * (itemSettings.sizeRatio || 1.0);
      const tikkaH = tikkaW * aspectRatio;
      renderSingleOrnament(ctx, ornCanvas, baseX, baseY, tikkaW, tikkaH, itemSettings.rotation, itemSettings);
    }

    ctx.restore();
  };

  const renderSingleOrnament = (
    ctx: CanvasRenderingContext2D,
    drawable: CanvasImageSource,
    x: number,
    y: number,
    w: number,
    h: number,
    rotDeg: number,
    conf: TryOnSettings
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotDeg * Math.PI) / 180);

    ctx.globalAlpha = conf.opacity;
    ctx.globalCompositeOperation = conf.blendMode;

    if (conf.shadowIntensity > 0) {
      ctx.shadowColor = `rgba(0, 0, 0, ${conf.shadowIntensity * 0.75})`;
      ctx.shadowBlur = 8 * conf.scale;
      ctx.shadowOffsetY = 4 * conf.scale;
    }

    const brightness = Math.round(conf.goldLuster * 100);
    ctx.filter = `brightness(${brightness}%) contrast(106%)`;

    ctx.drawImage(drawable, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isComparingSplit) return;
    setIsDraggingOrnament(true);
    setDragStart({ x: e.clientX - settings.xOffset, y: e.clientY - settings.yOffset });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingOrnament) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setSettings((prev) => ({
      ...prev,
      xOffset: Math.max(-250, Math.min(250, newX)),
      yOffset: Math.max(-250, Math.min(250, newY)),
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDraggingOrnament(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height + 80;
    const expCtx = exportCanvas.getContext('2d');
    if (!expCtx) return;

    expCtx.drawImage(canvas, 0, 0);

    expCtx.fillStyle = '#3A060C';
    expCtx.fillRect(0, canvas.height, canvas.width, 80);
    expCtx.fillStyle = '#D4AF37';
    expCtx.fillRect(0, canvas.height, canvas.width, 3);

    expCtx.fillStyle = '#F5D061';
    expCtx.font = 'bold 18px Cinzel, serif';
    expCtx.fillText('GRT JEWELLERS', 20, canvas.height + 32);

    expCtx.fillStyle = '#FAF6EE';
    expCtx.font = '12px sans-serif';
    expCtx.fillText(`${ornament.name} • ${ornament.code}`, 20, canvas.height + 54);

    expCtx.textAlign = 'right';
    expCtx.fillStyle = '#FFFFFF';
    expCtx.font = 'bold 18px sans-serif';
    expCtx.fillText(`₹${ornament.price.toLocaleString('en-IN')}`, canvas.width - 20, canvas.height + 42);

    const link = document.createElement('a');
    link.download = `GRT-${ornament.code}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-[#190609] border border-[#540813] rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top Bar with AI Auto-Fit & 3D Drape Toggle */}
      <div className="bg-[#2E070C] px-3 py-2 border-b border-[#540813] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#F5D061] text-xs">{ornament.code}</span>
          <span className="text-stone-300 text-[11px] truncate max-w-[120px]">{ornament.name}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* AI Auto-Placement button */}
          <button
            id="ai-auto-place-btn"
            type="button"
            onClick={() => triggerAiAutoPlacement(ornament)}
            disabled={isAiPositioning}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#540813] hover:bg-[#6E0B1A] border border-[#D4AF37]/40 text-[#F5D061] text-[11px] font-semibold transition-all shadow-xs"
            title="AI Accurately Calculates Size Ratio & 3D Draping"
          >
            <Sparkles className="w-3 h-3 text-[#F5D061]" />
            <span>{isAiPositioning ? 'Fitting...' : 'AI Auto-Fit'}</span>
          </button>

          {/* 3D Drape / Wrap Toggle */}
          <button
            id="3d-wrap-toggle-btn"
            type="button"
            onClick={() => setSettings((s) => ({ ...s, wrapOcclusionEnabled: !s.wrapOcclusionEnabled }))}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              settings.wrapOcclusionEnabled
                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5D061]'
                : 'bg-[#150508] border-[#540813] text-stone-300'
            }`}
            title="Toggle 3D anatomical draping and finger/neck occlusion wrapping"
          >
            <Layers className="w-3 h-3" />
            <span>{settings.wrapOcclusionEnabled ? '3D Wrap ON' : '3D Wrap OFF'}</span>
          </button>

          {/* Click Selfie button */}
          <button
            id="canvas-selfie-btn"
            type="button"
            onClick={onOpenSelfieModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#E5C06E] text-[#3D040C] font-bold text-[11px] transition-all"
          >
            <Camera className="w-3 h-3" />
            <span>Selfie</span>
          </button>

          {/* Compare */}
          <button
            type="button"
            onClick={() => setIsComparingSplit(!isComparingSplit)}
            className={`p-1.5 rounded-lg border text-stone-300 ${
              isComparingSplit ? 'bg-[#D4AF37] text-[#3D040C] border-[#D4AF37]' : 'bg-[#150508] border-[#540813]'
            }`}
            title="Split Compare"
          >
            <SplitSquareVertical className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative bg-black aspect-[3/4] max-h-[500px] w-full flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-contain touch-none"
        />

        {/* 3D Anatomical Mode Notification Badge */}
        {settings.wrapOcclusionEnabled && (
          <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs border border-[#D4AF37]/40 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-[10px] text-[#F5D061] pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {ornament.category === 'ring'
                ? '3D Finger Wrap • Rear band behind finger, crown on top'
                : ornament.category === 'necklace' || ornament.category === 'choker'
                ? '3D Collarbone Drape • Curved below chin over clavicles'
                : ornament.category === 'bangles'
                ? '3D Bangle Wrap • Wrist inside kada circle'
                : '3D Anatomical Fit Active'}
            </span>
          </div>
        )}

        {/* POV Notice when Earring is selected */}
        {ornament.category === 'earrings' && (
          <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-xs border border-[#D4AF37]/40 rounded-xl p-1 flex items-center gap-1 text-[10px]">
            <span className="text-stone-300 px-1 font-medium">POV:</span>
            {(['left', 'right', 'both'] as const).map((pov) => (
              <button
                key={pov}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, visibleEar: pov }))}
                className={`px-2 py-0.5 rounded-md uppercase font-semibold transition-all ${
                  (settings.visibleEar || 'left') === pov
                    ? 'bg-[#D4AF37] text-[#3D040C]'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {pov === 'left' ? 'Left Ear' : pov === 'right' ? 'Right Ear' : 'Both'}
              </button>
            ))}
          </div>
        )}

        {/* AI Status Badge */}
        {aiStatusMsg && (
          <div className="absolute bottom-3 left-3 bg-[#24080D]/95 border border-[#D4AF37]/60 text-[#F5D061] text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>{aiStatusMsg}</span>
          </div>
        )}

        {/* Split slider */}
        {isComparingSplit && (
          <div className="absolute bottom-3 inset-x-6 z-20 bg-[#1F0A0E]/90 border border-[#D4AF37]/40 p-2 rounded-xl flex items-center gap-2">
            <span className="text-[10px] text-stone-300 font-medium">Original</span>
            <input
              type="range"
              min="0"
              max="100"
              value={splitPosition}
              onChange={(e) => setSplitPosition(Number(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-ew-resize"
            />
            <span className="text-[10px] text-[#F5D061] font-bold">Try-On</span>
          </div>
        )}
      </div>

      {/* Biometric Fit & 3D Drape Fine-Tuning Drawer */}
      {showTuningDrawer && (
        <div className="bg-[#1D0609] border-t border-[#540813] px-3.5 py-2.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-[#E5C06E] font-semibold border-b border-[#540813]/60 pb-1">
            <span>Biometric Fit & 3D Draping Controls</span>
            <span className="text-stone-400 font-normal">
              {Math.round((settings.sizeRatio || 1.0) * 100)}% Person:Ornament Ratio
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {/* Size Ratio Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-stone-300 text-[10px]">
                <span>Person Size Ratio (Anatomy : Ornament)</span>
                <span className="text-[#F5D061] font-mono">{Math.round((settings.sizeRatio || 1.0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="135"
                value={Math.round((settings.sizeRatio || 1.0) * 100)}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, sizeRatio: Number(e.target.value) / 100 }))
                }
                className="w-full accent-[#D4AF37] h-1.5 bg-[#3A0A10] rounded-lg cursor-pointer"
              />
            </div>

            {/* Category-Specific Draping Slider */}
            {ornament.category === 'necklace' || ornament.category === 'choker' ? (
              <div className="space-y-1">
                <div className="flex justify-between text-stone-300 text-[10px]">
                  <span>Neck Catenary Drape Sag</span>
                  <span className="text-[#F5D061] font-mono">{settings.drapeCurvature}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={settings.drapeCurvature}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, drapeCurvature: Number(e.target.value) }))
                  }
                  className="w-full accent-[#D4AF37] h-1.5 bg-[#3A0A10] rounded-lg cursor-pointer"
                />
              </div>
            ) : ornament.category === 'ring' ? (
              <div className="space-y-1">
                <div className="flex justify-between text-stone-300 text-[10px]">
                  <span>Finger Occlusion Width</span>
                  <span className="text-[#F5D061] font-mono">{settings.fingerOcclusionWidth}%</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="24"
                  value={settings.fingerOcclusionWidth}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, fingerOcclusionWidth: Number(e.target.value) }))
                  }
                  className="w-full accent-[#D4AF37] h-1.5 bg-[#3A0A10] rounded-lg cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-stone-300 text-[10px]">
                  <span>Gold Surface Luster</span>
                  <span className="text-[#F5D061] font-mono">{Math.round(settings.goldLuster * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="130"
                  value={Math.round(settings.goldLuster * 100)}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, goldLuster: Number(e.target.value) / 100 }))
                  }
                  className="w-full accent-[#D4AF37] h-1.5 bg-[#3A0A10] rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Streamlined Controls */}
      <div className="bg-[#24080D] p-2.5 border-t border-[#540813] flex items-center justify-between">
        {/* Scale */}
        <div className="flex items-center bg-[#150508] rounded-xl border border-[#540813] p-0.5">
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, scale: Math.max(0.3, s.scale - 0.08) }))}
            className="p-1.5 text-stone-300 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-2 text-[#E5C06E]">
            {Math.round(settings.scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, scale: Math.min(2.5, s.scale + 0.08) }))}
            className="p-1.5 text-stone-300 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Drape & Fit Tuner Toggle Button */}
          <button
            type="button"
            onClick={() => setShowTuningDrawer(!showTuningDrawer)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showTuningDrawer
                ? 'bg-[#D4AF37] text-[#3D040C] border-[#D4AF37]'
                : 'bg-[#150508] border-[#540813] text-stone-300 hover:text-white'
            }`}
            title="Adjust Biometric Proportion & Drape Curve"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Drape & Fit</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={() => {
              setSettings((s) => ({
                ...s,
                xOffset: 0,
                yOffset: 0,
                overrideXPercent: ornament.defaultPlacement.xPercent,
                overrideYPercent: ornament.defaultPlacement.yPercent,
                overrideWidthRatio: undefined,
                scale: ornament.defaultPlacement.scale,
                rotation: ornament.defaultPlacement.rotation,
                sizeRatio: 1.0,
                drapeCurvature: ornament.category === 'necklace' ? 12 : ornament.category === 'choker' ? 6 : 0,
                wrapOcclusionEnabled: true,
              }));
            }}
            className="p-2 rounded-xl bg-[#150508] border border-[#540813] text-stone-300 hover:text-white"
            title="Reset"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
          </button>

          {/* Download Snapshot */}
          <button
            type="button"
            onClick={handleDownloadSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6B0E1D] hover:bg-[#851224] border border-[#D4AF37]/40 text-white text-xs font-semibold"
            title="Download Look"
          >
            <Download className="w-3.5 h-3.5 text-[#F5D061]" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
