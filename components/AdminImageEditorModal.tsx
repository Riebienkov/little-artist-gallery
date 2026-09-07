'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  Check, 
  Crop, 
  Sparkles, 
  Sliders, 
  Layers,
  ZoomIn,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Drawing } from '@/lib/db';
import GildedFrame, { FrameStyle } from './GildedFrame';

interface AdminImageEditorModalProps {
  drawing: Drawing | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedDrawing: Drawing) => void;
  adminPin: string;
}

type AspectRatioMode = 'free' | 'original' | '1:1' | '4:3' | '3:4' | '16:9';

export default function AdminImageEditorModal({
  drawing,
  isOpen,
  onClose,
  onSaved,
  adminPin,
}: AdminImageEditorModalProps) {
  const [rotation, setRotation] = useState<number>(0);
  const [fineTilt, setFineTilt] = useState<number>(0);
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>('free');
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('gold-museum');
  const [bakeFrame, setBakeFrame] = useState<boolean>(true);
  const [showPlate, setShowPlate] = useState<boolean>(true);

  // Crop normalized rect (0 to 1 relative to the container view)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.05,
    y: 0.05,
    w: 0.9,
    h: 0.9,
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rect: typeof cropRect }>({
    x: 0,
    y: 0,
    rect: { x: 0, y: 0, w: 1, h: 1 },
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset or load initial drawing state
  useEffect(() => {
    if (drawing) {
      setRotation(drawing.rotation || 0);
      setFineTilt(0);
      setIsFlippedH(false);
      setAspectMode('free');
      setFrameStyle(drawing.frameStyle || 'gold-museum');
      setBakeFrame(true);
      setShowPlate(true);
      setCropRect({ x: 0.04, y: 0.04, w: 0.92, h: 0.92 });
      setSaveSuccess(false);
      setSaveError('');
    }
  }, [drawing, isOpen]);

  // Adjust crop for aspect ratio presets
  const applyAspectRatio = useCallback((mode: AspectRatioMode) => {
    setAspectMode(mode);
    if (!imgRef.current) return;

    let targetRatio: number | null = null;
    const imgNaturalRatio = (imgRef.current.naturalWidth || 4) / (imgRef.current.naturalHeight || 3);
    const effectiveNaturalRatio = (rotation % 180 === 0) ? imgNaturalRatio : (1 / imgNaturalRatio);

    if (mode === '1:1') targetRatio = 1;
    else if (mode === '4:3') targetRatio = 4 / 3;
    else if (mode === '3:4') targetRatio = 3 / 4;
    else if (mode === '16:9') targetRatio = 16 / 9;
    else if (mode === 'original') targetRatio = effectiveNaturalRatio;

    if (targetRatio) {
      let w = 0.85;
      let h = w / targetRatio;
      if (h > 0.85) {
        h = 0.85;
        w = h * targetRatio;
      }
      setCropRect({
        x: Math.max(0.02, (1 - w) / 2),
        y: Math.max(0.02, (1 - h) / 2),
        w,
        h,
      });
    }
  }, [rotation]);

  // Handle Dragging Crop Handles & Crop Box
  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      rect: { ...cropRect },
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !imageContainerRef.current) return;

    const bounds = imageContainerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / bounds.width;
    const dy = (e.clientY - dragStart.y) / bounds.height;
    const orig = dragStart.rect;

    let { x, y, w, h } = orig;
    const minSize = 0.15;

    if (dragHandle === 'move') {
      x = Math.max(0, Math.min(1 - w, orig.x + dx));
      y = Math.max(0, Math.min(1 - h, orig.y + dy));
    } else if (dragHandle === 'nw') {
      const newX = Math.min(orig.x + orig.w - minSize, Math.max(0, orig.x + dx));
      const newY = Math.min(orig.y + orig.h - minSize, Math.max(0, orig.y + dy));
      w = orig.w + (orig.x - newX);
      h = orig.h + (orig.y - newY);
      x = newX;
      y = newY;
    } else if (dragHandle === 'ne') {
      const newY = Math.min(orig.y + orig.h - minSize, Math.max(0, orig.y + dy));
      w = Math.max(minSize, Math.min(1 - orig.x, orig.w + dx));
      h = orig.h + (orig.y - newY);
      y = newY;
    } else if (dragHandle === 'se') {
      w = Math.max(minSize, Math.min(1 - orig.x, orig.w + dx));
      h = Math.max(minSize, Math.min(1 - orig.y, orig.h + dy));
    } else if (dragHandle === 'sw') {
      const newX = Math.min(orig.x + orig.w - minSize, Math.max(0, orig.x + dx));
      w = orig.w + (orig.x - newX);
      h = Math.max(minSize, Math.min(1 - orig.y, orig.h + dy));
      x = newX;
    } else if (dragHandle === 'n') {
      const newY = Math.min(orig.y + orig.h - minSize, Math.max(0, orig.y + dy));
      h = orig.h + (orig.y - newY);
      y = newY;
    } else if (dragHandle === 's') {
      h = Math.max(minSize, Math.min(1 - orig.y, orig.h + dy));
    } else if (dragHandle === 'w') {
      const newX = Math.min(orig.x + orig.w - minSize, Math.max(0, orig.x + dx));
      w = orig.w + (orig.x - newX);
      x = newX;
    } else if (dragHandle === 'e') {
      w = Math.max(minSize, Math.min(1 - orig.x, orig.w + dx));
    }

    setCropRect({ x, y, w, h });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  // High-Resolution Rendering and Saving
  const handleSave = async () => {
    if (!drawing || !imgRef.current) return;
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = drawing.imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const totalAngle = (rotation + fineTilt) * (Math.PI / 180);
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      // 1. Create source transformed canvas to extract cropped pixels accurately
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Cannot get canvas context');

      // Bounding box for rotation
      const absCos = Math.abs(Math.cos(totalAngle));
      const absSin = Math.abs(Math.sin(totalAngle));
      const rotW = Math.round(nw * absCos + nh * absSin);
      const rotH = Math.round(nw * absSin + nh * absCos);

      tempCanvas.width = rotW;
      tempCanvas.height = rotH;

      tempCtx.translate(rotW / 2, rotH / 2);
      tempCtx.rotate(totalAngle);
      if (isFlippedH) tempCtx.scale(-1, 1);
      tempCtx.drawImage(img, -nw / 2, -nh / 2);

      // Crop coordinates in rotated canvas space
      const cropX = Math.round(cropRect.x * rotW);
      const cropY = Math.round(cropRect.y * rotH);
      const cropW = Math.max(10, Math.round(cropRect.w * rotW));
      const cropH = Math.max(10, Math.round(cropRect.h * rotH));

      // 2. Final canvas
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');

      if (!bakeFrame || frameStyle === 'none') {
        // Pure cropped artwork
        finalCanvas.width = cropW;
        finalCanvas.height = cropH;
        ctx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      } else {
        // Render rich Gilded Gold Museum Frame around artwork
        const baseFrameSize = Math.round(Math.min(cropW, cropH) * 0.08); // 8% frame width
        const frameW = Math.max(32, Math.min(90, baseFrameSize));
        const matW = frameStyle === 'gold-museum' ? Math.max(24, Math.round(frameW * 0.8)) : 0;
        const totalBorder = frameW + matW;

        finalCanvas.width = cropW + totalBorder * 2;
        finalCanvas.height = cropH + totalBorder * 2;

        const cw = finalCanvas.width;
        const ch = finalCanvas.height;

        // A. Outer Gilded Gold Frame
        const outerGrad = ctx.createLinearGradient(0, 0, cw, ch);
        outerGrad.addColorStop(0, '#f8e092');
        outerGrad.addColorStop(0.2, '#aa771c');
        outerGrad.addColorStop(0.45, '#fff0a6');
        outerGrad.addColorStop(0.7, '#6b4507');
        outerGrad.addColorStop(0.85, '#d4af37');
        outerGrad.addColorStop(1, '#fde69c');

        ctx.fillStyle = outerGrad;
        ctx.fillRect(0, 0, cw, ch);

        // Frame Outer Bevel Shadow
        ctx.strokeStyle = '#3d2503';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, cw - 4, ch - 4);

        // Frame Carved Inner Groove
        ctx.strokeStyle = '#613e05';
        ctx.lineWidth = 2;
        ctx.strokeRect(frameW * 0.4, frameW * 0.4, cw - frameW * 0.8, ch - frameW * 0.8);

        // Inner frame edge highlight
        ctx.strokeStyle = '#ffebb3';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(frameW * 0.4 + 1, frameW * 0.4 + 1, cw - frameW * 0.8 - 2, ch - frameW * 0.8 - 2);

        // B. Passepartout (Mat)
        if (matW > 0) {
          ctx.fillStyle = '#faf8f2';
          ctx.fillRect(frameW, frameW, cw - frameW * 2, ch - frameW * 2);

          // Mat inner bevel shadow
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(frameW, frameW, cw - frameW * 2, 4);
          ctx.fillRect(frameW, frameW, 4, ch - frameW * 2);

          // Inner Gold Fillet (between mat and art)
          const filletGrad = ctx.createLinearGradient(frameW + matW, frameW + matW, cw - (frameW + matW), ch - (frameW + matW));
          filletGrad.addColorStop(0, '#d4af37');
          filletGrad.addColorStop(0.5, '#fff1b8');
          filletGrad.addColorStop(1, '#8b6009');
          ctx.strokeStyle = filletGrad;
          ctx.lineWidth = 3;
          ctx.strokeRect(totalBorder - 2, totalBorder - 2, cropW + 4, cropH + 4);
        }

        // C. Draw the Cropped Artwork
        ctx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, totalBorder, totalBorder, cropW, cropH);

        // Canvas Inset Shadow (realistic depth)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(totalBorder, totalBorder, cropW, cropH);

        // D. Optional Brass Nameplate
        if (showPlate && matW > 0) {
          const plateW = Math.min(260, Math.round(cropW * 0.5));
          const plateH = 26;
          const plateX = Math.round((cw - plateW) / 2);
          const plateY = Math.round(totalBorder + cropH + (matW - plateH) / 2);

          const brassGrad = ctx.createLinearGradient(plateX, plateY, plateX, plateY + plateH);
          brassGrad.addColorStop(0, '#ffe28a');
          brassGrad.addColorStop(0.5, '#d4af37');
          brassGrad.addColorStop(1, '#9e6d0a');

          ctx.fillStyle = brassGrad;
          ctx.fillRect(plateX, plateY, plateW, plateH);
          ctx.strokeStyle = '#5a3b04';
          ctx.lineWidth = 1;
          ctx.strokeRect(plateX, plateY, plateW, plateH);

          // Text
          ctx.fillStyle = '#3a2302';
          ctx.font = 'bold 12px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const plateText = `Таня • ${drawing.title.substring(0, 26)}`;
          ctx.fillText(plateText, cw / 2, plateY + plateH / 2);
        }
      }

      // Convert to Blob and send to server
      finalCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            setSaveError('Не вдалося створити файл зображення');
            setIsSaving(false);
            return;
          }

          const formData = new FormData();
          formData.append('image', blob, 'edited-art.jpg');
          formData.append('frameStyle', frameStyle);
          formData.append('rotation', '0'); // Rotation is already physically rendered!

          const res = await fetch(`/api/drawings/${drawing.id}/edit-image`, {
            method: 'POST',
            headers: {
              'x-admin-pin': adminPin,
            },
            body: formData,
          });

          const data = await res.json();
          if (data.success && data.drawing) {
            setSaveSuccess(true);
            onSaved(data.drawing);
            setTimeout(() => {
              onClose();
            }, 1200);
          } else {
            setSaveError(data.error || 'Помилка при збереженні малюнка');
          }
          setIsSaving(false);
        },
        'image/jpeg',
        0.92
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError(`Помилка: ${msg}`);
      setIsSaving(false);
    }
  };

  if (!isOpen || !drawing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl w-full max-w-5xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-500/20 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white leading-tight">
                Майстерня оформлення: Обрізка та золота рама
              </h3>
              <p className="text-xs text-purple-300">
                {drawing.title} • автоматичний підгін рами під розмір малюнка
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto">
          
          {/* Canvas Viewport (7 Cols) */}
          <div className="lg:col-span-7 bg-[#070512] rounded-2xl p-3 border border-purple-500/20 flex flex-col items-center justify-center min-h-[380px] relative select-none">
            
            <div 
              ref={imageContainerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative max-w-full max-h-[60vh] flex items-center justify-center overflow-hidden rounded-lg cursor-crosshair"
            >
              {/* Image Preview with Transformations */}
              <img
                ref={imgRef}
                src={drawing.imageUrl}
                alt={drawing.title}
                style={{
                  transform: `rotate(${rotation + fineTilt}deg) scaleX(${isFlippedH ? -1 : 1})`,
                  maxHeight: '52vh',
                }}
                className="w-auto h-auto max-w-full object-contain pointer-events-none transition-transform duration-100"
              />

              {/* Dimmed Overlay outside Crop Area */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  clipPath: `polygon(
                    0% 0%, 0% 100%, 
                    ${cropRect.x * 100}% 100%, 
                    ${cropRect.x * 100}% ${cropRect.y * 100}%, 
                    ${(cropRect.x + cropRect.w) * 100}% ${cropRect.y * 100}%, 
                    ${(cropRect.x + cropRect.w) * 100}% ${(cropRect.y + cropRect.h) * 100}%, 
                    ${cropRect.x * 100}% ${(cropRect.y + cropRect.h) * 100}%, 
                    ${cropRect.x * 100}% 100%, 
                    100% 100%, 100% 0%
                  )`,
                }}
              />

              {/* Interactive Crop Box Overlay */}
              <div
                style={{
                  left: `${cropRect.x * 100}%`,
                  top: `${cropRect.y * 100}%`,
                  width: `${cropRect.w * 100}%`,
                  height: `${cropRect.h * 100}%`,
                }}
                onPointerDown={(e) => handlePointerDown(e, 'move')}
                className="absolute border-2 border-dashed border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)] cursor-move"
              >
                {/* Rule of Thirds 3x3 Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/50" />
                  <div className="border-r border-b border-white/50" />
                  <div className="border-b border-white/50" />
                  <div className="border-r border-b border-white/50" />
                  <div className="border-r border-b border-white/50" />
                  <div className="border-b border-white/50" />
                  <div className="border-r border-white/50" />
                  <div className="border-r border-white/50" />
                  <div />
                </div>

                {/* 8 Drag Handles */}
                <div onPointerDown={(e) => handlePointerDown(e, 'nw')} className="absolute -top-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-full cursor-nwse-resize shadow-md" />
                <div onPointerDown={(e) => handlePointerDown(e, 'ne')} className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-full cursor-nesw-resize shadow-md" />
                <div onPointerDown={(e) => handlePointerDown(e, 'se')} className="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-full cursor-nwse-resize shadow-md" />
                <div onPointerDown={(e) => handlePointerDown(e, 'sw')} className="absolute -bottom-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-full cursor-nesw-resize shadow-md" />
                <div onPointerDown={(e) => handlePointerDown(e, 'n')} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-amber-300 border border-slate-900 rounded-sm cursor-ns-resize" />
                <div onPointerDown={(e) => handlePointerDown(e, 's')} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-amber-300 border border-slate-900 rounded-sm cursor-ns-resize" />
                <div onPointerDown={(e) => handlePointerDown(e, 'w')} className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-4 bg-amber-300 border border-slate-900 rounded-sm cursor-ew-resize" />
                <div onPointerDown={(e) => handlePointerDown(e, 'e')} className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-4 bg-amber-300 border border-slate-900 rounded-sm cursor-ew-resize" />
              </div>
            </div>

            <div className="text-[11px] text-purple-300/70 mt-2 flex items-center gap-2">
              <span>💡 Тягніть за кути рамки для обрізки або за середину для переміщення</span>
            </div>
          </div>

          {/* Tools & Frame Options Panel (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 text-xs">
            
            {/* 1. Rotation & Alignment */}
            <div className="bg-slate-800/80 border border-purple-500/20 rounded-2xl p-3.5 space-y-3">
              <h4 className="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
                <RotateCw className="w-4 h-4" />
                <span>Орієнтація та вирівнювання</span>
              </h4>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (((prev - 90) % 360) + 360) % 360)}
                  className="py-2 px-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 rounded-xl text-purple-100 font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  title="Повернути проти годинникової (-90°)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px]">-90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="py-2 px-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 rounded-xl text-purple-100 font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  title="Повернути за годинниковою (+90°)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[10px]">+90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 180) % 360)}
                  className="py-2 px-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 rounded-xl text-purple-100 font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  title="Перевернути на 180°"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="text-[10px]">180°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFlippedH((prev) => !prev)}
                  className={`py-2 px-1 border rounded-xl font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    isFlippedH
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-purple-950/60 hover:bg-purple-900 border-purple-500/30 text-purple-100'
                  }`}
                  title="Дзеркальне відображення"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Дзеркало</span>
                </button>
              </div>

              {/* Fine tilt slider */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] text-purple-200 mb-1 font-bold">
                  <span>Мікровирівнювання кута:</span>
                  <span className="text-amber-300">{fineTilt}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={fineTilt}
                    onChange={(e) => setFineTilt(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  {fineTilt !== 0 && (
                    <button
                      type="button"
                      onClick={() => setFineTilt(0)}
                      className="text-[10px] bg-white/10 hover:bg-white/20 text-purple-200 px-1.5 py-0.5 rounded-sm"
                    >
                      0°
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Aspect Ratio Presets */}
            <div className="bg-slate-800/80 border border-purple-500/20 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-pink-300 flex items-center gap-1.5">
                  <Crop className="w-4 h-4" />
                  <span>Пропорції обрізки</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setCropRect({ x: 0.02, y: 0.02, w: 0.96, h: 0.96 })}
                  className="text-[10px] text-purple-300 hover:text-white underline cursor-pointer"
                >
                  На весь малюнок
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { mode: 'free', label: 'Вільна' },
                  { mode: 'original', label: 'Оригінал' },
                  { mode: '1:1', label: '1:1 Квадрат' },
                  { mode: '4:3', label: '4:3 Альбом' },
                  { mode: '3:4', label: '3:4 Книжка' },
                  { mode: '16:9', label: '16:9 Широка' },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => applyAspectRatio(mode as AspectRatioMode)}
                    className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                      aspectMode === mode
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Gold Museum Frame Fitting */}
            <div className="bg-slate-800/80 border border-purple-500/20 rounded-2xl p-3.5 space-y-3">
              <h4 className="font-extrabold text-sm text-yellow-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Добротна золота рама картини</span>
              </h4>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'gold-museum', label: '🏛️ Музейний багет' },
                  { id: 'gold-royal', label: '👑 Королівське золото' },
                  { id: 'gold-classic', label: '✨ Шляхетне золото' },
                  { id: 'none', label: '🚫 Без рами' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFrameStyle(s.id as FrameStyle)}
                    className={`py-2 px-2.5 rounded-xl font-bold text-left transition-all cursor-pointer border ${
                      frameStyle === s.id
                        ? 'bg-amber-400/20 text-amber-200 border-amber-400 shadow-sm'
                        : 'bg-slate-900/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {frameStyle !== 'none' && (
                <div className="space-y-2 pt-1 border-t border-slate-700/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bakeFrame}
                      onChange={(e) => setBakeFrame(e.target.checked)}
                      className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-purple-100 font-bold text-[11px]">
                      Вбудувати раму у зображення картини (рекомендовано)
                    </span>
                  </label>

                  {frameStyle === 'gold-museum' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPlate}
                        onChange={(e) => setShowPlate(e.target.checked)}
                        className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="text-purple-200 text-[11px]">
                        Додати латунну табличку «Таня • Назва»
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Error or Success alerts */}
            {saveError && (
              <div className="bg-rose-900/60 border border-rose-500/50 rounded-xl p-2.5 text-rose-200 text-xs font-bold">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="bg-emerald-900/60 border border-emerald-500/50 rounded-xl p-2.5 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Картину успішно оформлено та збережено на Mac!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 font-bold transition-colors cursor-pointer"
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Зберігаю шедевр...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>💾 Зафіксувати та зберегти</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
