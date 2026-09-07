'use client';

import React, { useMemo } from 'react';

export default function CosmicBackground() {
  // Generate deterministic stars so server & client hydration match
  const stars = useMemo(() => {
    const starList = [];
    const count = 75;
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random distribution
      const seed = (i * 9301 + 49297) % 233280;
      const top = (seed % 1000) / 10;
      const left = ((seed * 7) % 1000) / 10;
      const size = (i % 3 === 0 ? 3 : i % 5 === 0 ? 4 : 2);
      const delay = (i % 7) * 0.7;
      const duration = 2.5 + (i % 5) * 0.8;
      const opacity = 0.3 + ((i % 10) / 15);
      const isSparkle = i % 8 === 0;

      starList.push({ id: i, top, left, size, delay, duration, opacity, isSparkle });
    }
    return starList;
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* 1. Deep Cosmic Void Background Base */}
      <div className="absolute inset-0 bg-[#070512]" />

      {/* 2. Mystical Aurora Rainbow Ribbons (Ethereal Cosmic Glow) */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[120%] h-[70vh] opacity-35 blur-[95px] mix-blend-screen"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(236, 72, 153, 0.45) 0%, rgba(168, 85, 247, 0.4) 35%, rgba(59, 130, 246, 0.3) 65%, transparent 80%)',
          animation: 'cosmic-float 18s ease-in-out infinite alternate',
        }}
      />
      <div 
        className="absolute top-[35%] -right-[15%] w-[100%] h-[80vh] opacity-30 blur-[110px] mix-blend-screen"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(147, 51, 234, 0.35) 0%, rgba(59, 130, 246, 0.3) 30%, rgba(16, 185, 129, 0.2) 60%, transparent 80%)',
          animation: 'cosmic-float-reverse 22s ease-in-out infinite alternate',
        }}
      />
      <div 
        className="absolute bottom-[-15%] left-[10%] w-[90%] h-[60vh] opacity-25 blur-[100px] mix-blend-screen"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(244, 63, 94, 0.3) 0%, rgba(245, 158, 11, 0.25) 40%, rgba(139, 92, 246, 0.2) 70%, transparent 85%)',
          animation: 'cosmic-float 26s ease-in-out infinite alternate',
        }}
      />

      {/* 3. Ethereal Celestial Rainbow Arch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] opacity-25 pointer-events-none">
        <svg 
          viewBox="0 0 1200 400" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="celestialRainbow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
              <stop offset="15%" stopColor="#f43f5e" stopOpacity="0.6" />
              <stop offset="30%" stopColor="#fb923c" stopOpacity="0.7" />
              <stop offset="45%" stopColor="#facc15" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#34d399" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="90%" stopColor="#c084fc" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
            </linearGradient>
            <filter id="rainbowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 50 380 Q 600 -40 1150 380"
            stroke="url(#celestialRainbow)"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#rainbowGlow)"
            className="animate-pulse-gentle"
          />
          <path
            d="M 70 390 Q 600 -10 1130 390"
            stroke="url(#celestialRainbow)"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* 4. Twinkling Stars Field */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full transition-opacity ${
            star.isSparkle ? 'text-amber-200' : 'bg-white'
          }`}
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite alternate`,
            boxShadow: star.size > 2 ? '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(236, 72, 153, 0.4)' : undefined,
          }}
        >
          {star.isSparkle && (
            <svg 
              viewBox="0 0 24 24" 
              className="w-full h-full -translate-x-1/2 -translate-y-1/2 fill-current text-pink-200"
            >
              <polygon points="12,0 14,9 23,12 14,15 12,24 10,15 1,12 10,9" />
            </svg>
          )}
        </div>
      ))}

      {/* 5. Celestial Unicorn Constellation (Top Right Sky) */}
      <div className="absolute top-12 right-6 lg:right-20 w-80 h-72 opacity-45 hover:opacity-85 transition-opacity duration-700 hidden sm:block">
        <svg viewBox="0 0 300 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="hornBeam" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Constellation Lines */}
          <g stroke="rgba(216, 180, 254, 0.4)" strokeWidth="1.2" strokeDasharray="3,3">
            {/* Horn */}
            <line x1="160" y1="20" x2="148" y2="65" stroke="url(#hornBeam)" strokeWidth="2" strokeDasharray="none" />
            {/* Head & Face */}
            <line x1="148" y1="65" x2="115" y2="82" />
            <line x1="115" y1="82" x2="130" y2="105" />
            <line x1="130" y1="105" x2="155" y2="100" />
            <line x1="155" y1="100" x2="148" y2="65" />
            {/* Ears */}
            <line x1="148" y1="65" x2="162" y2="52" />
            <line x1="162" y1="52" x2="168" y2="70" />
            {/* Mane & Crest */}
            <line x1="168" y1="70" x2="190" y2="92" />
            <line x1="190" y1="92" x2="210" y2="120" />
            <line x1="210" y1="120" x2="225" y2="150" />
            {/* Neck to Body */}
            <line x1="155" y1="100" x2="175" y2="135" />
            <line x1="175" y1="135" x2="170" y2="185" />
            <line x1="225" y1="150" x2="260" y2="170" />
            <line x1="170" y1="185" x2="220" y2="195" />
            <line x1="220" y1="195" x2="260" y2="170" />
            {/* Tail Sparkle */}
            <line x1="260" y1="170" x2="285" y2="195" />
            <line x1="285" y1="195" x2="275" y2="225" />
          </g>

          {/* Constellation Star Nodes */}
          {/* Radiant Horn Star (Magical Sparkle) */}
          <g filter="url(#starGlow)">
            <circle cx="160" cy="20" r="4" fill="#ffffff" />
            <polygon points="160,10 163,18 171,20 163,22 160,30 157,22 149,20 157,18" fill="#fef08a" />
          </g>
          {/* Head & Body Stars */}
          <circle cx="148" cy="65" r="2.5" fill="#f472b6" filter="url(#starGlow)" />
          <circle cx="115" cy="82" r="2.2" fill="#c084fc" />
          <circle cx="130" cy="105" r="2" fill="#93c5fd" />
          <circle cx="155" cy="100" r="2.5" fill="#fbcfe8" />
          <circle cx="162" cy="52" r="2" fill="#fde047" />
          <circle cx="168" cy="70" r="2" fill="#e879f9" />
          <circle cx="190" cy="92" r="2.5" fill="#67e8f9" filter="url(#starGlow)" />
          <circle cx="210" cy="120" r="2.5" fill="#f472b6" />
          <circle cx="225" cy="150" r="3" fill="#ffffff" filter="url(#starGlow)" />
          <circle cx="175" cy="135" r="2.2" fill="#d8b4fe" />
          <circle cx="170" cy="185" r="2.5" fill="#a7f3d0" />
          <circle cx="220" cy="195" r="2" fill="#fbcfe8" />
          <circle cx="260" cy="170" r="3" fill="#fde047" filter="url(#starGlow)" />
          <circle cx="285" cy="195" r="2" fill="#e879f9" />
          <circle cx="275" cy="225" r="2.5" fill="#67e8f9" filter="url(#starGlow)" />
        </svg>
      </div>

      {/* 6. Shooting Stars */}
      <div className="shooting-star-container absolute top-12 left-1/4 w-48 h-1 opacity-70">
        <div className="shooting-star" />
      </div>
      <div className="shooting-star-container absolute top-56 right-1/3 w-48 h-1 opacity-50" style={{ animationDelay: '7s' }}>
        <div className="shooting-star" style={{ animationDelay: '7s' }} />
      </div>

      {/* 7. Subtle Magical Starlight Dust (Noise / Sparkles Grid) */}
      <div 
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}
