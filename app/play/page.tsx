'use client';

import { useEffect, useState, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import PuzzleGame from '@/components/PuzzleGame';
import { Drawing } from '@/lib/db';

function PlayContent() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [totalStars, setTotalStars] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/drawings')
      .then((res) => res.json())
      .then((data) => {
        setDrawings(data.drawings || []);
        if (data.stats) setTotalStars(data.stats.totalStars || 0);
      })
      .catch((err) => console.error('Failed to load drawings:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Navbar totalStars={totalStars} />

      <main className="flex-1">
        {loading ? (
          <div className="text-center py-24">
            <p className="text-purple-300 font-medium animate-pulse">Готуємо чарівні пазли... ✨</p>
          </div>
        ) : (
          <PuzzleGame drawings={drawings} />
        )}
      </main>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-purple-300">Завантаження...</div>}>
      <PlayContent />
    </Suspense>
  );
}
