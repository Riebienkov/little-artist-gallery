'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Drawing } from '@/lib/db';
import confetti from 'canvas-confetti';
import { RotateCcw, Eye, Trophy, ArrowLeft, Check, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';

interface PuzzleGameProps {
  drawings: Drawing[];
}

type Difficulty = 4 | 6 | 9;

export default function PuzzleGame({ drawings }: PuzzleGameProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('drawingId');

  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(4);
  const [pieces, setPieces] = useState<number[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [moves, setMoves] = useState(0);
  const [rotation, setRotation] = useState(0);

  const getGrid = (diff: Difficulty) => {
    switch (diff) {
      case 4:
        return { cols: 2, rows: 2 };
      case 6:
        return { cols: 3, rows: 2 };
      case 9:
        return { cols: 3, rows: 3 };
    }
  };

  const { cols, rows } = getGrid(difficulty);

  useEffect(() => {
    if (drawings.length === 0) return;
    if (initialId) {
      const found = drawings.find((d) => d.id === initialId);
      if (found) {
        setSelectedDrawing(found);
        setRotation(found.rotation || 0);
        return;
      }
    }
    setSelectedDrawing(drawings[0]);
    setRotation(drawings[0].rotation || 0);
  }, [drawings, initialId]);

  const initGame = useCallback(() => {
    const count = difficulty;
    const initial = Array.from({ length: count }, (_, i) => i);
    
    // Shuffle ensuring not already solved
    let shuffled = [...initial].sort(() => Math.random() - 0.5);
    let attempts = 0;
    while (shuffled.every((val, idx) => val === idx) && attempts < 10) {
      shuffled = [...initial].sort(() => Math.random() - 0.5);
      attempts++;
    }

    setPieces(shuffled);
    setSelectedPieceIndex(null);
    setIsSolved(false);
    setMoves(0);
  }, [difficulty]);

  useEffect(() => {
    if (selectedDrawing) {
      initGame();
    }
  }, [selectedDrawing, difficulty, initGame]);

  const checkWin = (currentPieces: number[]) => {
    const won = currentPieces.every((val, idx) => val === idx);
    if (won) {
      setIsSolved(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FBBF24', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6'],
      });
    }
  };

  const handlePieceClick = (index: number) => {
    if (isSolved) return;

    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(index);
    } else {
      if (selectedPieceIndex === index) {
        setSelectedPieceIndex(null);
        return;
      }

      const newPieces = [...pieces];
      const temp = newPieces[selectedPieceIndex];
      newPieces[selectedPieceIndex] = newPieces[index];
      newPieces[index] = temp;

      setPieces(newPieces);
      setSelectedPieceIndex(null);
      setMoves((m) => m + 1);

      checkWin(newPieces);
    }
  };

  if (!selectedDrawing) {
    return (
      <div className="text-center py-20">
        <p className="text-purple-300 font-medium">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-200 hover:text-white bg-slate-900/80 px-3.5 py-2 rounded-xl border border-purple-500/30 shadow-xs backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToGallery}</span>
        </Link>

        {/* Drawing Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-purple-300/70 hidden sm:inline">{t.selectDrawing}</span>
          <select
            value={selectedDrawing.id}
            onChange={(e) => {
              const d = drawings.find((x) => x.id === e.target.value);
              if (d) {
                setSelectedDrawing(d);
                setRotation(d.rotation || 0);
              }
            }}
            className="bg-slate-900/90 border-2 border-purple-500/40 text-purple-100 font-bold text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer shadow-xs backdrop-blur-md"
          >
            {drawings.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900 text-purple-100">
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Game Card */}
      <div className="bg-[#120e29]/90 backdrop-blur-xl rounded-3xl p-4 sm:p-7 shadow-[0_0_50px_rgba(168,85,247,0.2)] border-2 border-purple-500/30 space-y-6">
        {/* Controls: Difficulty & Helpers */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
          {/* Difficulty Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-purple-300/60 mr-1">{t.difficultyLabel}</span>
            {[
              { val: 4 as Difficulty, label: t.diffEasy },
              { val: 6 as Difficulty, label: t.diffMedium },
              { val: 9 as Difficulty, label: t.diffHard },
            ].map((d) => (
              <button
                key={d.val}
                type="button"
                onClick={() => setDifficulty(d.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  difficulty === d.val
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] scale-105'
                    : 'bg-slate-800/80 text-purple-200/80 hover:bg-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Action buttons: Rotate, Hint & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-500/30"
              title={t.btnRotate}
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.btnRotate} ({rotation}°)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showHint 
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-[0_0_10px_rgba(251,191,36,0.4)]' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showHint ? t.btnHideHint : t.btnHint}</span>
            </button>

            <button
              type="button"
              onClick={initGame}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-500/30"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.btnShuffle}</span>
            </button>
          </div>
        </div>

        {/* Moves & Guide Text */}
        <div className="flex items-center justify-between text-xs text-purple-300/70 px-1">
          <p className="font-medium">{t.puzzleGuide}</p>
          <span className="font-bold bg-slate-900/80 border border-purple-500/30 px-2.5 py-1 rounded-full text-purple-200">
            {t.movesLabel}: {moves}
          </span>
        </div>

        {/* Puzzle Board Container */}
        <div 
          className="relative max-w-lg mx-auto aspect-[4/3] rounded-2xl overflow-hidden border-4 border-dashed border-purple-500/40 bg-[#090717] shadow-inner"
        >
          {/* Hint ghost image */}
          {showHint && !isSolved && (
            <div className="absolute inset-0 z-10 pointer-events-none opacity-40 flex items-center justify-center p-2">
              <img
                src={selectedDrawing.imageUrl}
                alt="hint"
                style={{ transform: `rotate(${rotation}deg)` }}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Solved state view */}
          {isSolved ? (
            <div className="w-full h-full relative flex items-center justify-center animate-in zoom-in-95 duration-300 p-2">
              <img
                src={selectedDrawing.imageUrl}
                alt="solved"
                style={{ transform: `rotate(${rotation}deg)` }}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-bounce">
                  <Trophy className="w-9 h-9" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-1">
                  {t.congratsTitle}
                </h3>
                <p className="text-sm font-medium text-amber-300 mb-4">
                  {t.congratsDesc} ({moves} {t.movesLabel.toLowerCase()})
                </p>
                <div className="flex gap-2.5">
                  <button
                    onClick={initGame}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    {t.btnPlayAgain}
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 bg-slate-800 text-purple-200 border border-purple-500/30 hover:bg-slate-700 text-xs font-bold rounded-xl shadow-md transition-transform active:scale-95"
                  >
                    {t.btnAllDrawings}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Grid of Pieces */
            <div
              className="w-full h-full grid gap-1.5 p-1.5"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}
            >
              {pieces.map((pieceVal, currentPos) => {
                const srcCol = pieceVal % cols;
                const srcRow = Math.floor(pieceVal / cols);

                const posX = cols > 1 ? (srcCol / (cols - 1)) * 100 : 0;
                const posY = rows > 1 ? (srcRow / (rows - 1)) * 100 : 0;

                const isSelected = selectedPieceIndex === currentPos;
                const isCorrect = pieceVal === currentPos;

                return (
                  <button
                    key={currentPos}
                    type="button"
                    onClick={() => handlePieceClick(currentPos)}
                    className={`relative w-full h-full rounded-xl overflow-hidden shadow-xs transition-all duration-200 cursor-pointer active:scale-95 border ${
                      isSelected
                        ? 'ring-4 ring-amber-400 border-amber-300 scale-98 z-20 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                        : 'border-purple-500/30 hover:border-pink-400/60'
                    }`}
                    style={{
                      backgroundImage: `url(${selectedDrawing.imageUrl})`,
                      backgroundSize: `${cols * 100}% ${rows * 100}%`,
                      backgroundPosition: `${posX}% ${posY}%`,
                    }}
                  >
                    {isCorrect && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
