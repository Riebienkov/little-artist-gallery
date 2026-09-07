'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getLocalLikeCount, saveLocalLike } from '@/lib/likesStorage';

interface StarButtonProps {
  drawingId: string;
  initialLikes: number;
  onLikeAdded?: (newLikes: number, newTotalStars?: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarButton({
  drawingId,
  initialLikes,
  onLikeAdded,
  size = 'md',
}: StarButtonProps) {
  const [likes, setLikes] = useState(() => {
    return Math.max(initialLikes || 0, getLocalLikeCount(drawingId));
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const local = getLocalLikeCount(drawingId);
    setLikes((prev) => Math.max(prev, initialLikes || 0, local));
  }, [initialLikes, drawingId]);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ drawingId: string; userLikes: number }>;
      if (customEvent.detail && customEvent.detail.drawingId === drawingId) {
        setLikes((prev) => Math.max(prev, customEvent.detail.userLikes));
      }
    };
    window.addEventListener('tanja-star-update', handleSync);
    return () => window.removeEventListener('tanja-star-update', handleSync);
  }, [drawingId]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    // Trigger visual confetti explosion from the button location
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      origin: { x, y },
      particleCount: 30,
      spread: 65,
      ticks: 200,
      colors: ['#FBBF24', '#F472B6', '#60A5FA', '#34D399', '#C084FC', '#FDE047'],
      shapes: ['star', 'circle'],
      scalar: 1.2,
    });

    setIsAnimating(true);
    const localUpdated = saveLocalLike(drawingId);
    const updated = Math.max(likes + 1, localUpdated);
    setLikes(updated);
    setClickCount((prev) => prev + 1);

    setTimeout(() => {
      setIsAnimating(false);
    }, 400);

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawingId }),
      });
      const data = await res.json();
      if (data.success) {
        const finalLikes = Math.max(updated, data.likesCount || 0);
        setLikes(finalLikes);
        if (onLikeAdded) {
          onLikeAdded(finalLikes, data.totalStars);
        }
      }
    } catch (err) {
      console.error('Failed to register like on server (saved locally):', err);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3.5 py-1.5 text-sm gap-1.5',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`relative inline-flex items-center rounded-full font-bold transition-all active:scale-95 cursor-pointer select-none bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.35)] ${
        sizeClasses[size]
      } ${isAnimating ? 'scale-115 ring-4 ring-amber-300/60' : ''}`}
      title="Подарувати магічну зірочку!"
    >
      <Star
        className={`fill-slate-950 text-slate-950 transition-transform duration-300 ${
          size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
        } ${isAnimating ? 'rotate-72 scale-125' : ''}`}
      />
      <span className="font-black">{likes}</span>
      {clickCount > 0 && isAnimating && (
        <span className="absolute -top-3 -right-2 bg-pink-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-ping">
          +1
        </span>
      )}
    </button>
  );
}
