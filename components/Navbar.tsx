'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Sparkles, Puzzle, Lock, Star } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from './LanguageContext';

interface NavbarProps {
  totalStars?: number;
}

export default function Navbar({ totalStars = 0 }: NavbarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-[#0d0a21]/80 backdrop-blur-xl border-b border-purple-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-[1.5px] shadow-[0_0_20px_rgba(236,72,153,0.35)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#120e29] rounded-[14px] flex items-center justify-center text-white">
              <span className="text-xl">🦄</span>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight block leading-tight group-hover:text-pink-200 transition-colors">
              {t.siteTitle}
            </span>
            <span className="text-xs font-semibold text-pink-400/90 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> {t.gallerySubtitle}
            </span>
          </div>
        </Link>

        {/* Center/Right items: Stars, Language Switcher, Nav Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Total Stars Counter */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 border border-amber-400/30 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.15)]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400 animate-bounce" />
            <span className="font-bold text-amber-300 text-xs sm:text-sm">
              {totalStars} <span className="font-medium text-amber-200/70 text-xs">{t.starsCount}</span>
            </span>
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                pathname === '/'
                  ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-purple-200 border border-purple-400/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">{t.navGallery}</span>
            </Link>

            <Link
              href="/play"
              className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                pathname.startsWith('/play')
                  ? 'bg-gradient-to-r from-pink-600/40 to-rose-600/40 text-pink-200 border border-pink-400/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Puzzle className="w-4 h-4 text-pink-400" />
              <span>{t.navPuzzle}</span>
            </Link>

            <Link
              href="/admin"
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                pathname.startsWith('/admin')
                  ? 'bg-gradient-to-r from-amber-600/40 to-orange-600/40 text-amber-200 border border-amber-400/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={t.navParents}
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{t.navParents}</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
