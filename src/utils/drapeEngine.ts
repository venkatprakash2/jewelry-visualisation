import { JewelryItem, TryOnSettings } from '../types';

/**
 * High-accuracy 3D anatomical drape engine for necklaces and chokers.
 * The choker/necklace must sit below the chin, fitted smoothly across the neck and chest.
 */
export function renderNecklace3DDrape(
  ctx: CanvasRenderingContext2D,
  ornCanvas: HTMLCanvasElement,
  baseImg: HTMLImageElement,
  baseX: number,
  baseY: number,
  ornWidth: number,
  ornHeight: number,
  rotDeg: number,
  conf: TryOnSettings
) {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate((rotDeg * Math.PI) / 180);

  ctx.globalAlpha = conf.opacity;
  ctx.globalCompositeOperation = conf.blendMode;

  const brightness = Math.round(conf.goldLuster * 100);
  ctx.filter = `brightness(${brightness}%) contrast(106%)`;

  const effectiveRatio = conf.sizeRatio || 1.0;
  const renderW = ornWidth * effectiveRatio;
  const renderH = ornHeight * effectiveRatio;

  if (!conf.wrapOcclusionEnabled || conf.drapeCurvature <= 0) {
    if (conf.shadowIntensity > 0) {
      ctx.shadowColor = `rgba(0, 0, 0, ${conf.shadowIntensity * 0.75})`;
      ctx.shadowBlur = 8 * conf.scale;
      ctx.shadowOffsetY = 4 * conf.scale;
    }
    ctx.drawImage(ornCanvas, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();
    return;
  }

  // 3D Anatomical Catenary Drape Rendering with gentle contouring
  const numSlices = 40;
  const sliceWidthSource = ornCanvas.width / numSlices;
  const sliceWidthDest = renderW / numSlices;
  // Natural gentle sag curve (subtle, not distorting)
  const drapeDepth = (conf.drapeCurvature || 10) * 0.8 * (conf.scale || 1.0);

  // 1. Soft skin drop shadow
  if (conf.shadowIntensity > 0) {
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${conf.shadowIntensity * 0.75})`;
    ctx.shadowBlur = 10 * conf.scale;
    ctx.shadowOffsetY = 5 * conf.scale;

    for (let i = 0; i < numSlices; i++) {
      const xNorm = (i + 0.5) / numSlices;
      const sag = Math.sin(xNorm * Math.PI) * drapeDepth;
      const dx = -renderW / 2 + i * sliceWidthDest;
      const dy = -renderH / 2 + sag;

      ctx.drawImage(
        ornCanvas,
        i * sliceWidthSource,
        ornCanvas.height * 0.3,
        sliceWidthSource,
        ornCanvas.height * 0.7,
        dx,
        dy + renderH * 0.3,
        sliceWidthDest + 0.5,
        renderH * 0.7
      );
    }
    ctx.restore();
  }

  // 2. Draw slices with subtle depth compression on outer neck edges
  for (let i = 0; i < numSlices; i++) {
    const xNorm = (i + 0.5) / numSlices;
    const distFromCenter = Math.abs(xNorm - 0.5) * 2; // 0 at center, 1 at wings

    // Gentle catenary sag: center hangs naturally, wings rise towards collarbone
    const sag = Math.sin(xNorm * Math.PI) * drapeDepth;

    // Slight 3D cylindrical compression at the neck boundaries
    const zDepthScale = 1.0 - Math.pow(distFromCenter, 2) * 0.05;

    const dx = -renderW / 2 + i * sliceWidthDest;
    const dy = -renderH / 2 + sag;
    const sh = renderH * zDepthScale;

    // Smooth subtle fade at the very back tips (under hair)
    let sliceAlpha = 1.0;
    if (distFromCenter > 0.88) {
      sliceAlpha = Math.max(0.3, 1.0 - (distFromCenter - 0.88) * 5);
    }

    ctx.save();
    ctx.globalAlpha = conf.opacity * sliceAlpha;
    ctx.drawImage(
      ornCanvas,
      i * sliceWidthSource,
      0,
      sliceWidthSource,
      ornCanvas.height,
      dx,
      dy,
      sliceWidthDest + 0.5,
      sh
    );
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Ring going realistically AROUND the finger:
 * The rear band is drawn first, the customer's actual finger passes through,
 * and the front solitaire/crown is drawn on top.
 */
export function renderRingFingerWrap(
  ctx: CanvasRenderingContext2D,
  ornCanvas: HTMLCanvasElement,
  baseImg: HTMLImageElement,
  baseX: number,
  baseY: number,
  ornWidth: number,
  ornHeight: number,
  rotDeg: number,
  conf: TryOnSettings,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save();

  const effectiveRatio = conf.sizeRatio || 1.0;
  const renderW = ornWidth * effectiveRatio;
  const renderH = ornHeight * effectiveRatio;

  if (!conf.wrapOcclusionEnabled) {
    ctx.translate(baseX, baseY);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.globalAlpha = conf.opacity;
    ctx.globalCompositeOperation = conf.blendMode;
    const brightness = Math.round(conf.goldLuster * 100);
    ctx.filter = `brightness(${brightness}%) contrast(106%)`;

    if (conf.shadowIntensity > 0) {
      ctx.shadowColor = `rgba(0, 0, 0, ${conf.shadowIntensity * 0.75})`;
      ctx.shadowBlur = 10 * conf.scale;
      ctx.shadowOffsetY = 5 * conf.scale;
    }
    ctx.drawImage(ornCanvas, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();
    return;
  }

  // 1. Draw rear band (behind finger)
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.globalAlpha = conf.opacity * 0.7;

  if (conf.shadowIntensity > 0) {
    ctx.shadowColor = `rgba(0, 0, 0, ${conf.shadowIntensity * 0.8})`;
    ctx.shadowBlur = 6 * conf.scale;
    ctx.shadowOffsetY = 2 * conf.scale;
  }

  const halfH = ornCanvas.height * 0.52;
  ctx.drawImage(
    ornCanvas,
    0,
    halfH,
    ornCanvas.width,
    ornCanvas.height - halfH,
    -renderW / 2,
    0,
    renderW,
    renderH * 0.48
  );
  ctx.restore();

  // 2. Finger pass-through mask:
  // Redraw the customer's actual finger over the inner hole of the ring
  const fingerWidth = (canvasWidth * (conf.fingerOcclusionWidth || 13)) / 100;
  const fingerHeight = renderH * 0.65;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(
    baseX,
    baseY + fingerHeight * 0.1,
    fingerWidth / 2,
    fingerHeight / 2,
    (rotDeg * Math.PI) / 180,
    0,
    Math.PI * 2
  );
  ctx.clip();
  ctx.drawImage(baseImg, 0, 0, canvasWidth, canvasHeight);
  ctx.restore();

  // 3. Front Crown, Solitaire, and Front Shoulders on top of finger
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate((rotDeg * Math.PI) / 180);

  ctx.globalAlpha = conf.opacity;
  ctx.globalCompositeOperation = conf.blendMode;
  const brightness = Math.round(conf.goldLuster * 100);
  ctx.filter = `brightness(${brightness}%) contrast(106%)`;

  const topCutoutH = ornCanvas.height * 0.58;
  ctx.drawImage(
    ornCanvas,
    0,
    0,
    ornCanvas.width,
    topCutoutH,
    -renderW / 2,
    -renderH / 2,
    renderW,
    renderH * 0.58
  );
  ctx.restore();

  ctx.restore();
}

/**
 * Circular Bangle / Kada wrapping around wrist cross-section
 */
export function renderBangleWristWrap(
  ctx: CanvasRenderingContext2D,
  ornCanvas: HTMLCanvasElement,
  baseImg: HTMLImageElement,
  baseX: number,
  baseY: number,
  ornWidth: number,
  ornHeight: number,
  rotDeg: number,
  conf: TryOnSettings,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save();

  const effectiveRatio = conf.sizeRatio || 1.0;
  const renderW = ornWidth * effectiveRatio;
  const renderH = ornHeight * effectiveRatio;

  if (!conf.wrapOcclusionEnabled) {
    ctx.translate(baseX, baseY);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.globalAlpha = conf.opacity;
    ctx.globalCompositeOperation = conf.blendMode;
    const brightness = Math.round(conf.goldLuster * 100);
    ctx.filter = `brightness(${brightness}%) contrast(106%)`;

    if (conf.shadowIntensity > 0) {
      ctx.shadowColor = `rgba(0, 0, 0, ${conf.shadowIntensity * 0.75})`;
      ctx.shadowBlur = 10 * conf.scale;
      ctx.shadowOffsetY = 5 * conf.scale;
    }
    ctx.drawImage(ornCanvas, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();
    return;
  }

  // 1. Rear Rim (behind wrist)
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.globalAlpha = conf.opacity * 0.65;
  const halfH = ornCanvas.height * 0.5;
  ctx.drawImage(
    ornCanvas,
    0,
    0,
    ornCanvas.width,
    halfH,
    -renderW / 2,
    -renderH / 2,
    renderW,
    renderH * 0.5
  );
  ctx.restore();

  // 2. Wrist pass-through mask
  const wristWidth = canvasWidth * 0.28;
  const wristHeight = renderH * 0.65;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(baseX, baseY, wristWidth / 2, wristHeight / 2, (rotDeg * Math.PI) / 180, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(baseImg, 0, 0, canvasWidth, canvasHeight);
  ctx.restore();

  // 3. Front Rim (across front of wrist)
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.globalAlpha = conf.opacity;
  ctx.globalCompositeOperation = conf.blendMode;
  const brightness = Math.round(conf.goldLuster * 100);
  ctx.filter = `brightness(${brightness}%) contrast(106%)`;

  if (conf.shadowIntensity > 0) {
    ctx.shadowColor = `rgba(0, 0, 0, ${conf.shadowIntensity * 0.7})`;
    ctx.shadowBlur = 8 * conf.scale;
    ctx.shadowOffsetY = 4 * conf.scale;
  }

  ctx.drawImage(
    ornCanvas,
    0,
    halfH * 0.85,
    ornCanvas.width,
    ornCanvas.height - halfH * 0.85,
    -renderW / 2,
    -renderH / 2 + renderH * 0.42,
    renderW,
    renderH * 0.58
  );
  ctx.restore();

  ctx.restore();
}
