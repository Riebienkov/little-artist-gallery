'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import DrawingCard from '@/components/DrawingCard';
import DrawingModal from '@/components/DrawingModal';
import { Drawing } from '@/lib/db';
import { Sparkles, Puzzle, Palette, Heart, Layers } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [totalStars, setTotalStars] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeDrawing, setActiveDrawing] = useState<Drawing | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch drawings and stats
  useEffect(() => {
    fetch('/api/drawings')
      .then((res) => res.json())
      .then((data) => {
        setDrawings(data.drawings || []);
        if (data.stats) {
          setTotalStars(data.stats.totalStars || 0);
        }
      })
      .catch((err) => console.error('Failed to load gallery:', err))
      .finally(() => setLoading(false));
  }, []);

  const categoryKeys = [
    { key: 'all', label: t.categories.all, original: 'Всі' },
    { key: 'animals', label: t.categories.animals, original: 'Тваринки' },
    { key: 'fairytales', label: t.categories.fairytales, original: 'Казки' },
    { key: 'space', label: t.categories.space, original: 'Космос' },
    { key: 'family', label: t.categories.family, original: 'Родина' },
    { key: 'nature', label: t.categories.nature, original: 'Природа' },
  ];

  const currentCategoryObj = categoryKeys.find((c) => c.key === selectedCategory);
  const filterOriginalName = currentCategoryObj ? currentCategoryObj.original : 'Всі';

  const filteredDrawings =
    selectedCategory === 'all'
      ? drawings
      : drawings.filter((d) => d.category === filterOriginalName || d.category === currentCategoryObj?.label);

  const handleStarUpdate = (drawingId: string, newLikes: number, newTotalStars?: number) => {
    setDrawings((prev) =>
      prev.map((d) => (d.id === drawingId ? { ...d, likesCount: newLikes } : d))
    );
    if (newTotalStars !== undefined) {
      setTotalStars(newTotalStars);
    } else {
      setTotalStars((prev) => prev + 1);
    }
  };

  const handleRotateCard = (drawingId: string) => {
    setDrawings((prev) =>
      prev.map((d) =>
        d.id === drawingId ? { ...d, rotation: ((d.rotation || 0) + 90) % 360 } : d
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Navbar totalStars={totalStars} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* HERO BANNER: Mysterious Cosmic Observatory with Unicorn & Rainbow Glow */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b143e]/90 via-[#231548]/85 to-[#120d2c]/95 p-6 sm:p-12 border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] text-center backdrop-blur-xl">
          {/* Subtle glowing rainbow beam inside banner */}
          <div 
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-48 opacity-35 blur-[50px] pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, #ec4899, #f43f5e, #fb923c, #facc15, #34d399, #38bdf8, #a855f7)',
            }}
          />

          {/* Floating magical unicorn companion */}
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-pink-500/40 px-4 py-1.5 rounded-full text-xs font-black text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)] mb-4">
            <span className="text-sm">🦄</span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{t.badgeDaily}</span>
            <span className="text-amber-300">✨</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-purple-100 to-cyan-200 tracking-tight leading-tight max-w-3xl mx-auto drop-shadow-sm">
            {t.heroTitle}
          </h1>

          <p className="mt-3 text-sm sm:text-lg text-purple-200/80 max-w-2xl mx-auto font-medium leading-relaxed">
            {t.heroDesc}
          </p>

          {/* Action CTAs */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#gallery"
              className="px-6 py-3 rounded-full font-black text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-[0_0_25px_rgba(236,72,153,0.4)] hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              <span>{t.btnViewDrawings}</span>
            </a>

            <Link
              href="/play"
              className="px-6 py-3 rounded-full font-black text-sm bg-slate-900/80 hover:bg-slate-800 text-purple-200 border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all active:scale-95 flex items-center gap-2 hover:text-white"
            >
              <Puzzle className="w-4 h-4 text-pink-400" />
              <span>{t.btnPlayPuzzle}</span>
            </Link>
          </div>

          {/* Floating stats pills */}
          <div className="mt-8 pt-6 border-t border-purple-500/20 flex flex-wrap justify-center gap-6 text-xs sm:text-sm font-extrabold text-purple-200">
            <div className="flex items-center gap-2 bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-purple-500/30">
              <span className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-sm">
                🖼️
              </span>
              <span>{drawings.length} {t.statArtworks}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-amber-500/30">
              <span className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center text-sm">
                🌟
              </span>
              <span className="text-amber-300">{totalStars} {t.statStarsGiven}</span>
            </div>
          </div>
        </section>

        {/* GALLERY SECTION */}
        <section id="gallery" className="space-y-6 scroll-mt-20">
          {/* Header & Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-pink-400" />
                <span>{t.vernissageTitle}</span>
              </h2>
              <p className="text-xs sm:text-sm text-purple-300/70 font-medium">
                {t.vernissageSubtitle}
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categoryKeys.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] border border-pink-400/50 scale-105'
                      : 'bg-slate-900/80 text-purple-200/80 border border-purple-500/30 hover:bg-purple-950/40 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drawings Grid */}
          {loading ? (
            <div className="text-center py-20 bg-slate-900/60 rounded-3xl border border-purple-500/20 p-8 backdrop-blur-md">
              <p className="text-purple-300/70 font-medium animate-pulse">
                {t.sending} ✨
              </p>
            </div>
          ) : filteredDrawings.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-purple-500/20 p-8 backdrop-blur-md">
              <p className="text-purple-300/70 font-medium text-sm">
                {t.emptyCategory}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrawings.map((drawing) => (
                <DrawingCard
                  key={drawing.id}
                  drawing={drawing}
                  onOpenModal={(d) => setActiveDrawing(d)}
                  onStarUpdate={handleStarUpdate}
                  onRotate={handleRotateCard}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 bg-[#090717]/90 border-t border-purple-500/20 py-8 px-4 text-center text-xs text-purple-300/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1.5 font-medium">
            <span>{t.gallerySubtitle}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          </p>
          <div className="flex items-center gap-4">
            <Link href="/play" className="hover:text-pink-400 font-bold transition-colors">
              {t.navPuzzle}
            </Link>
            <span>•</span>
            <Link href="/admin" className="hover:text-amber-400 font-bold transition-colors">
              {t.navParents} 🔑
            </Link>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      <DrawingModal
        drawing={activeDrawing}
        onClose={() => setActiveDrawing(null)}
        onStarUpdate={handleStarUpdate}
        onDrawingUpdate={(updated) => {
          setDrawings((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setActiveDrawing(updated);
        }}
      />
    </div>
  );
}
