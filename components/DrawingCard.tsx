'use client';

import Link from 'next/link';
import { Calendar, MessageCircle, Puzzle, Video, Sparkles, RotateCw } from 'lucide-react';
import StarButton from './StarButton';
import { Drawing } from '@/lib/db';
import { useLanguage } from './LanguageContext';

import GildedFrame from './GildedFrame';

interface DrawingCardProps {
  drawing: Drawing;
  onOpenModal: (drawing: Drawing) => void;
  onStarUpdate?: (drawingId: string, newLikes: number, newTotalStars?: number) => void;
  onRotate?: (drawingId: string) => void;
}

export default function DrawingCard({ drawing, onOpenModal, onStarUpdate, onRotate }: DrawingCardProps) {
  const { t, lang } = useLanguage();

  const localeMap = { uk: 'uk-UA', de: 'de-DE', en: 'en-US' };
  const formattedDate = drawing.date
    ? new Date(drawing.date).toLocaleDateString(localeMap[lang], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const categoryEmojis: Record<string, string> = {
    'Тваринки': '🐱',
    'Казки': '🏰',
    'Космос': '🚀',
    'Родина': '👨‍👩‍👧',
    'Природа': '🌸',
  };

  const emoji = categoryEmojis[drawing.category] || '🎨';
  const hasDerivatives = (drawing.derivedImages && drawing.derivedImages.length > 0) || Boolean(drawing.videoUrl);

  const rotation = drawing.rotation || 0;
  const hasFrame = drawing.frameStyle && drawing.frameStyle !== 'none';

  return (
    <div className="group bg-[#110e28]/85 backdrop-blur-md rounded-3xl overflow-hidden border border-purple-500/25 hover:border-pink-400/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_40px_rgba(236,72,153,0.25)] transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Image Preview Area: Deep dark stage where drawing glows */}
      <div
        className="relative aspect-[4/3] w-full bg-[#0a081a]/90 cursor-pointer overflow-hidden flex items-center justify-center p-2.5"
        onClick={() => onOpenModal(drawing)}
      >
        {hasFrame ? (
          <GildedFrame styleName={drawing.frameStyle} title={drawing.title} className="max-w-[94%] max-h-[94%]">
            <img
              src={drawing.imageUrl}
              alt={drawing.title}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease',
              }}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-103 drop-shadow-md rounded-xs"
              loading="lazy"
            />
          </GildedFrame>
        ) : (
          <img
            src={drawing.imageUrl}
            alt={drawing.title}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease',
            }}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-103 drop-shadow-md rounded-xl"
            loading="lazy"
          />
        )}

        {/* Category Pill */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold text-purple-200 shadow-sm flex items-center gap-1.5">
          <span>{emoji}</span>
          <span>{drawing.category}</span>
        </div>

        {/* Derivative Media Badges (AI Art / Video) */}
        {hasDerivatives && (
          <div className="absolute top-3 right-3 flex items-center gap-1">
            {drawing.videoUrl && (
              <span className="bg-purple-600/90 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm border border-purple-300/40 animate-pulse">
                <Video className="w-3 h-3" />
                <span>Відео</span>
              </span>
            )}
            {drawing.derivedImages && drawing.derivedImages.length > 0 && (
              <span className="bg-pink-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm border border-pink-300/40">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI</span>
              </span>
            )}
          </div>
        )}

        {/* Hover zoom badge */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none backdrop-blur-[2px]">
          <div className="bg-slate-900/90 border border-purple-400/40 text-purple-100 font-bold px-3.5 py-1.5 rounded-full text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.zoomIn}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-purple-300/60 font-medium mb-1 min-h-[20px]">
            {formattedDate ? (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400/80" />
                <span>{formattedDate}</span>
              </div>
            ) : (
              <span />
            )}

            {/* Quick rotate button */}
            {onRotate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRotate(drawing.id);
                }}
                className="text-purple-400/70 hover:text-amber-300 p-1 rounded-md transition-colors"
                title={t.btnRotate}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <h3
            className="text-lg font-extrabold text-white leading-snug cursor-pointer hover:text-pink-300 transition-colors"
            onClick={() => onOpenModal(drawing)}
          >
            {drawing.title}
          </h3>

          {/* Child's Quote Bubble */}
          {drawing.description && (
            <div className="mt-2.5 bg-purple-950/40 border border-purple-500/25 rounded-2xl p-3 text-xs sm:text-sm text-purple-200 leading-relaxed relative">
              <span className="font-bold text-pink-400 block text-[11px] uppercase tracking-wider mb-0.5">
                {t.childStoryLabel}
              </span>
              <p className="italic text-purple-100/90">«{drawing.description}»</p>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between gap-2">
          <StarButton
            drawingId={drawing.id}
            initialLikes={drawing.likesCount || 0}
            onLikeAdded={(newLikes, newTotal) => {
              if (onStarUpdate) onStarUpdate(drawing.id, newLikes, newTotal);
            }}
          />

          <div className="flex items-center gap-1.5">
            <Link
              href={`/play?drawingId=${drawing.id}`}
              className="p-2 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
              title={t.btnAssemblePuzzle}
            >
              <Puzzle className="w-4 h-4 text-purple-300" />
              <span className="hidden sm:inline">{t.btnPuzzle}</span>
            </Link>

            <button
              onClick={() => onOpenModal(drawing)}
              className="p-2 bg-pink-900/40 hover:bg-pink-800/60 text-pink-200 border border-pink-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              title={t.warmWordsTitle}
            >
              <MessageCircle className="w-4 h-4 text-pink-300" />
              <span className="hidden sm:inline">{t.btnWords}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
