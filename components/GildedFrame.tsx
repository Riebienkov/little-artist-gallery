'use client';

import React from 'react';

export type FrameStyle = 'gold-museum' | 'gold-royal' | 'gold-classic' | 'none';

interface GildedFrameProps {
  children: React.ReactNode;
  styleName?: FrameStyle;
  title?: string;
  artistName?: string;
  showPlate?: boolean;
  className?: string;
  aspectRatio?: string;
}

export default function GildedFrame({
  children,
  styleName = 'gold-museum',
  title,
  artistName = 'Таня',
  showPlate = false,
  className = '',
}: GildedFrameProps) {
  if (styleName === 'none') {
    return <div className={`relative w-full h-full ${className}`}>{children}</div>;
  }

  if (styleName === 'gold-classic') {
    // Sleek, minimal gold gallery border
    return (
      <div
        className={`relative p-2 sm:p-2.5 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.6)] ${className}`}
        style={{
          background:
            'linear-gradient(135deg, #ecd38c 0%, #c49a37 25%, #ffd700 50%, #8f6516 75%, #fbe8a6 100%)',
          border: '2px solid #573a0a',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 3px rgba(0,0,0,0.5)',
        }}
      >
        <div className="relative w-full h-full overflow-hidden rounded-xs bg-[#0b0819] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
          {children}
        </div>
      </div>
    );
  }

  if (styleName === 'gold-royal') {
    // Heavy ornate carved baroque gold frame
    return (
      <div
        className={`relative p-3 sm:p-4 rounded-xl shadow-[0_18px_45px_rgba(0,0,0,0.7)] ${className}`}
        style={{
          background:
            'linear-gradient(135deg, #fceda2 0%, #b8860b 20%, #ffdf6b 40%, #7d5308 60%, #ffd700 80%, #9e6f14 100%)',
          border: '3px solid #4a2e04',
          boxShadow:
            '0 20px 40px rgba(0,0,0,0.65), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 6px rgba(0,0,0,0.7), inset 0 0 12px rgba(97,63,6,0.6)',
        }}
      >
        {/* Inner gold beading relief */}
        <div
          className="p-1 sm:p-1.5 rounded-lg"
          style={{
            background: 'linear-gradient(180deg, #aa771c 0%, #e6c875 50%, #7a5009 100%)',
            border: '1.5px solid #ffea9f',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          <div className="relative w-full h-full overflow-hidden rounded-xs bg-[#080614] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Default: 'gold-museum' (Classical museum gilded gold frame with ivory linen passepartout)
  return (
    <div
      className={`relative p-2.5 sm:p-3.5 rounded-xl transition-all duration-300 ${className}`}
      style={{
        background:
          'linear-gradient(135deg, #f5d77f 0%, #aa771c 20%, #ffe58f 45%, #6e4708 70%, #d4af37 85%, #fce59c 100%)',
        border: '3px solid #472b03',
        boxShadow:
          '0 16px 36px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -2px 5px rgba(0,0,0,0.65)',
      }}
    >
      {/* Inner fine gold lip */}
      <div
        className="p-1 sm:p-1.5 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, #875a0c 0%, #ffd700 50%, #684205 100%)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {/* Museum Linen Passepartout (Ivory / Cream Mat) */}
        <div
          className="p-2 sm:p-3 rounded-md relative"
          style={{
            backgroundColor: '#fbf9f4',
            backgroundImage:
              'radial-gradient(#ebe5d8 0.75px, transparent 0.75px), radial-gradient(#ebe5d8 0.75px, #fbf9f4 0.75px)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 6px 6px',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {/* Inner Golden Fillet bevel around artwork */}
          <div
            className="p-0.5 rounded-xs"
            style={{
              background: 'linear-gradient(135deg, #aa771c 0%, #ffd700 50%, #6d4607 100%)',
              border: '1px solid #ffea9f',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          >
            {/* Artwork Canvas Container */}
            <div className="relative w-full h-full overflow-hidden rounded-xs bg-[#0b0819] shadow-[inset_0_3px_10px_rgba(0,0,0,0.45)]">
              {children}
            </div>
          </div>

          {/* Authentic Brass Museum Placard */}
          {showPlate && title && (
            <div className="mt-2 flex justify-center">
              <div
                className="px-3 py-0.5 rounded-xs text-[10px] sm:text-xs font-serif font-bold tracking-wider text-[#3d2703] flex items-center gap-1.5 shadow-sm border border-[#7d5308]"
                style={{
                  background: 'linear-gradient(180deg, #ffe082 0%, #d4af37 60%, #b8860b 100%)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.5)',
                }}
              >
                <span className="w-1 h-1 rounded-full bg-[#523303]" />
                <span className="truncate max-w-[180px] sm:max-w-[240px]">
                  {artistName} • {title}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#523303]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
