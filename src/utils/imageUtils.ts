// Cache for processed transparent image cutouts
const cutoutCache = new Map<string, HTMLCanvasElement>();
const singleEarringCache = new Map<string, HTMLCanvasElement>();

/**
 * Extracts a single isolated earring piece from a studio pair photo (which displays 2 jhumkas side-by-side).
 * This ensures that placing an earring on one earlobe shows exactly 1 earring, not a duplicated pair.
 */
export async function getSingleEarringCanvas(src: string): Promise<HTMLCanvasElement> {
  if (singleEarringCache.has(src)) {
    return singleEarringCache.get(src)!;
  }

  const fullCutout = await getJewelryCutoutCanvas(src);
  const w = fullCutout.width;
  const h = fullCutout.height;

  // Studio earring photos typically have 2 earrings side-by-side (left half has one earring, right half has the other)
  // We extract the left individual earring with tight bounding box cropping:
  const halfCanvas = document.createElement('canvas');
  halfCanvas.width = Math.floor(w / 2);
  halfCanvas.height = h;
  const hctx = halfCanvas.getContext('2d', { willReadFrequently: true });
  if (!hctx) {
    singleEarringCache.set(src, fullCutout);
    return fullCutout;
  }

  hctx.drawImage(fullCutout, 0, 0, w / 2, h, 0, 0, w / 2, h);

  // Compute tight bounding box of the non-transparent pixels in this single earring
  const imgData = hctx.getImageData(0, 0, halfCanvas.width, halfCanvas.height);
  const d = imgData.data;
  let minX = halfCanvas.width;
  let maxX = 0;
  let minY = halfCanvas.height;
  let maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < halfCanvas.height; y++) {
    for (let x = 0; x < halfCanvas.width; x++) {
      const idx = (y * halfCanvas.width + x) * 4;
      if (d[idx + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasPixels = true;
      }
    }
  }

  if (!hasPixels || maxX <= minX || maxY <= minY) {
    singleEarringCache.set(src, fullCutout);
    return fullCutout;
  }

  // Pad slightly
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(halfCanvas.width - 1, maxX + pad);
  maxY = Math.min(halfCanvas.height - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const cctx = croppedCanvas.getContext('2d');
  if (!cctx) {
    singleEarringCache.set(src, fullCutout);
    return fullCutout;
  }

  cctx.drawImage(halfCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  singleEarringCache.set(src, croppedCanvas);
  return croppedCanvas;
}

/**
 * Automatically creates an alpha cutout from a jewelry studio photograph
 * by isolating dark/black studio background pixels and smoothly feathering the edges.
 */
export async function getJewelryCutoutCanvas(src: string): Promise<HTMLCanvasElement> {
  if (cutoutCache.has(src)) {
    return cutoutCache.get(src)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || 600;
      const h = img.naturalHeight || 600;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(canvas);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample corner color to determine background brightness
      const cornerR = (data[0] + data[(w - 1) * 4] + data[(w * (h - 1)) * 4]) / 3;
      const cornerG = (data[1] + data[(w - 1) * 4 + 1] + data[(w * (h - 1)) * 4 + 1]) / 3;
      const cornerB = (data[2] + data[(w - 1) * 4 + 2] + data[(w * (h - 1)) * 4 + 2]) / 3;
      const isDarkBg = (cornerR + cornerG + cornerB) / 3 < 50;

      if (isDarkBg) {
        // Luminance threshold cutout
        const threshold = 28;
        const ramp = 26; // soft feathering range

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Perceived luminance
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (lum <= threshold) {
            data[i + 3] = 0; // completely transparent
          } else if (lum < threshold + ramp) {
            // Smooth alpha falloff
            const alphaFactor = (lum - threshold) / ramp;
            data[i + 3] = Math.round(data[i + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }

      cutoutCache.set(src, canvas);
      resolve(canvas);
    };

    img.onerror = () => {
      // Fallback empty canvas
      const canvas = document.createElement('canvas');
      resolve(canvas);
    };

    img.src = src;
  });
}
