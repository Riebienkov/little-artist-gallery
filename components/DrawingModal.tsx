'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  Calendar, 
  MessageCircle, 
  Send, 
  Sparkles, 
  Puzzle, 
  CheckCircle2, 
  RotateCw,
  Video,
  Image as ImageIcon,
  Pencil,
  Check,
  AlertCircle
} from 'lucide-react';
import { Drawing, Comment } from '@/lib/db';
import StarButton from './StarButton';
import { useLanguage } from './LanguageContext';

interface DrawingModalProps {
  drawing: Drawing | null;
  onClose: () => void;
  onStarUpdate?: (drawingId: string, newLikes: number, newTotalStars?: number) => void;
  onDrawingUpdate?: (drawing: Drawing) => void;
}

export default function DrawingModal({ drawing, onClose, onStarUpdate, onDrawingUpdate }: DrawingModalProps) {
  const { t, lang } = useLanguage();

  const [activeMediaTab, setActiveMediaTab] = useState<'original' | 'ai' | 'video'>('original');
  const [currentRotation, setCurrentRotation] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Comment Form State
  const [author, setAuthor] = useState('');
  const [selectedSticker, setSelectedSticker] = useState('🎨');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Admin In-Modal Edit State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Тваринки');
  const [editDate, setEditDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!drawing) return;

    setCurrentRotation(drawing.rotation || 0);
    setActiveMediaTab('original');
    setSubmitSuccess(false);
    setIsEditing(false);
    setEditTitle(drawing.title || '');
    setEditDescription(drawing.description || '');
    setEditCategory(drawing.category || 'Малюнки');
    setEditDate(drawing.date ? drawing.date.substring(0, 10) : '');
    setEditSuccess(false);
    setEditError('');

    if (typeof window !== 'undefined') {
      const pin = sessionStorage.getItem('admin_pin');
      setIsAdmin(Boolean(pin));
    }

    setLoadingComments(true);
    fetch(`/api/comments?drawingId=${drawing.id}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments || []);
      })
      .catch((err) => console.error('Error loading comments:', err))
      .finally(() => setLoadingComments(false));
  }, [drawing]);

  const handleSaveDrawingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawing) return;
    if (!editTitle.trim()) {
      setEditError('Будь ласка, вкажіть назву');
      return;
    }

    setIsSavingEdit(true);
    setEditError('');
    setEditSuccess(false);

    try {
      const pin = typeof window !== 'undefined' ? sessionStorage.getItem('admin_pin') || '' : '';
      const res = await fetch(`/api/drawings/${drawing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          category: editCategory,
          date: editDate ? editDate : null,
        }),
      });

      const data = await res.json();
      if (data.success && data.drawing) {
        setEditSuccess(true);
        if (onDrawingUpdate) {
          onDrawingUpdate(data.drawing);
        }
        setTimeout(() => {
          setIsEditing(false);
          setEditSuccess(false);
        }, 700);
      } else {
        setEditError(data.error || 'Не вдалося зберегти');
      }
    } catch {
      setEditError('Помилка мережі при збереженні');
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (!drawing) return null;

  const localeMap = { uk: 'uk-UA', de: 'de-DE', en: 'en-US' };
  const formattedDate = drawing.date
    ? new Date(drawing.date).toLocaleDateString(localeMap[lang], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const hasAi = drawing.derivedImages && drawing.derivedImages.length > 0;
  const hasVideo = Boolean(drawing.videoUrl);
  const hasMultipleMedia = hasAi || hasVideo;

  const handleRotate = () => {
    setCurrentRotation((prev) => (prev + 90) % 360);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || (!text.trim() && !selectedSticker)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingId: drawing.id,
          author: author.trim(),
          sticker: selectedSticker,
          text: text.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        setText('');
        setAuthor('');
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickStickers = [
    { emoji: '🎨', label: t.stickers.masterpiece },
    { emoji: '🌟', label: t.stickers.magical },
    { emoji: '🦄', label: t.stickers.fairytale },
    { emoji: '💖', label: t.stickers.withLove },
    { emoji: '🚀', label: t.stickers.cosmic },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-[#130f2e] w-full max-w-4xl rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.3)] border-2 border-purple-500/40 text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-purple-200 hover:text-white border border-purple-500/30 flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* MEDIA SWITCHER TABS (Original / AI variations / Video) */}
          {hasMultipleMedia && (
            <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-900/80 border border-purple-500/30 rounded-2xl max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setActiveMediaTab('original')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMediaTab === 'original'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm scale-102'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>{t.mediaTabs.original}</span>
              </button>

              {hasAi && (
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('ai')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaTab === 'ai'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm scale-102'
                      : 'text-purple-300 hover:text-pink-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t.mediaTabs.aiVariations}</span>
                </button>
              )}

              {hasVideo && (
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaTab === 'video'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm scale-102'
                      : 'text-purple-300 hover:text-cyan-300'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{t.mediaTabs.video}</span>
                </button>
              )}
            </div>
          )}

          {/* MAIN MEDIA DISPLAY CONTAINER */}
          <div className="relative rounded-2xl overflow-hidden bg-[#090717]/90 border border-purple-500/30 shadow-inner flex items-center justify-center min-h-[300px] max-h-[55vh] p-3">
            {/* ROTATE TOOL BUTTON for original drawing */}
            {activeMediaTab === 'original' && (
              <button
                onClick={handleRotate}
                className="absolute top-3 left-3 z-10 bg-slate-900/90 hover:bg-slate-800 text-purple-200 hover:text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md border border-purple-500/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title={t.btnRotate}
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-300" />
                <span>{t.btnRotate} ({currentRotation}°)</span>
              </button>
            )}

            {/* TAB 1: ORIGINAL DRAWING */}
            {activeMediaTab === 'original' && (
              <div className="flex items-center justify-center w-full h-full">
                <img
                  src={drawing.imageUrl}
                  alt={drawing.title}
                  style={{
                    transform: `rotate(${currentRotation}deg)`,
                    transition: 'transform 0.3s ease',
                  }}
                  className="max-h-[50vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>
            )}

            {/* TAB 2: AI VARIATION / REIMAGINED ART */}
            {activeMediaTab === 'ai' && drawing.derivedImages && drawing.derivedImages[0] && (
              <div className="flex flex-col items-center justify-center w-full h-full relative">
                <img
                  src={drawing.derivedImages[0]}
                  alt="AI Reimagined"
                  className="max-h-[50vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                />
                <div className="absolute bottom-3 bg-slate-900/90 border border-pink-500/40 text-pink-200 font-bold px-3.5 py-1 rounded-full text-xs shadow-[0_0_15px_rgba(236,72,153,0.3)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI-оживлення за мотивами малюнка Тані</span>
                </div>
              </div>
            )}

            {/* TAB 3: ANIMATED VIDEO / LOOP */}
            {activeMediaTab === 'video' && drawing.videoUrl && (
              <div className="flex flex-col items-center justify-center w-full h-full relative">
                {drawing.videoUrl.endsWith('.mp4') || drawing.videoUrl.endsWith('.webm') ? (
                  <video
                    src={drawing.videoUrl}
                    autoPlay
                    loop
                    muted
                    controls
                    className="max-h-[50vh] w-auto max-w-full rounded-xl shadow-lg"
                  />
                ) : (
                  /* Animated SVG */
                  <img
                    src={drawing.videoUrl}
                    alt="Animated drawing"
                    className="max-h-[50vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                  />
                )}
                <div className="absolute bottom-3 bg-slate-900/90 border border-purple-500/40 text-purple-200 font-bold px-3.5 py-1 rounded-full text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Анімація персонажів малюнка</span>
                </div>
              </div>
            )}
          </div>

          {/* Details & Child's Story OR Inline Editor */}
          {isEditing ? (
            <form
              onSubmit={handleSaveDrawingInfo}
              className="bg-purple-950/40 border border-purple-500/40 rounded-3xl p-5 sm:p-6 space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
                <div className="flex items-center gap-2 text-pink-300 font-extrabold text-xs uppercase tracking-wider">
                  <Pencil className="w-3.5 h-3.5 text-pink-400" />
                  <span>Редагування малюнка (Режим батьків)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-purple-300/70 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  ✕ Скасувати
                </button>
              </div>

              {editSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✓ Зміни успішно збережено!</span>
                </div>
              )}

              {editError && (
                <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Назва малюнка *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-purple-500/40 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Що розповіла Таня про цей малюнок? (Дитяча історія / опис)
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="«Ця зірочка світить уночі маленьким котикам...»"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-purple-500/40 rounded-xl text-sm text-purple-100 italic focus:outline-none focus:border-pink-400 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Категорія
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 focus:outline-none focus:border-pink-400 cursor-pointer"
                  >
                    <option value="Тваринки">🐱 Тваринки</option>
                    <option value="Казки">🏰 Казки</option>
                    <option value="Космос">🚀 Космос</option>
                    <option value="Родина">👨‍👩‍👧 Родина</option>
                    <option value="Природа">🌸 Природа</option>
                    <option value="Малюнки">🎨 Малюнки</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Дата створення (необов'язково)
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 hover:text-white bg-slate-900/70 border border-purple-500/30 transition-colors cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Зберігаю...' : 'Зберегти зміни 💾'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Header: Category, Date, Title and Edit button */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-purple-500/20 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-extrabold px-3 py-1 rounded-full">
                      {drawing.category}
                    </span>
                    {formattedDate && (
                      <span className="text-xs text-purple-300/60 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        {formattedDate}
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditTitle(drawing.title || '');
                          setEditDescription(drawing.description || '');
                          setEditCategory(drawing.category || 'Малюнки');
                          setEditDate(drawing.date ? drawing.date.substring(0, 10) : '');
                          setIsEditing(true);
                        }}
                        className="text-[11px] font-bold text-pink-300 hover:text-pink-200 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                        title="Змінити назву та опис"
                      >
                        <Pencil className="w-3 h-3 text-pink-400" />
                        <span>Змінити</span>
                      </button>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {drawing.title}
                  </h2>
                </div>

                {/* Actions: Star button + Puzzle link */}
                <div className="flex items-center gap-3 shrink-0">
                  <StarButton
                    drawingId={drawing.id}
                    initialLikes={drawing.likesCount || 0}
                    size="lg"
                    onLikeAdded={(newLikes, newTotal) => {
                      if (onStarUpdate) onStarUpdate(drawing.id, newLikes, newTotal);
                    }}
                  />
                  <Link
                    href={`/play?drawingId=${drawing.id}`}
                    className="px-4 py-2.5 rounded-full font-bold text-sm bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-400/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-transform active:scale-95"
                  >
                    <Puzzle className="w-4 h-4 text-pink-400" />
                    <span>{t.btnAssemblePuzzle}</span>
                  </Link>
                </div>
              </div>

              {/* Daughter's Story */}
              {drawing.description ? (
                <div className="bg-gradient-to-r from-purple-950/50 via-pink-950/40 to-indigo-950/50 rounded-2xl p-4 sm:p-5 border-2 border-purple-500/30 relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-pink-400 font-extrabold text-sm">
                      <span className="text-base">🦄</span>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{t.childStoryLabel}</span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditTitle(drawing.title || '');
                          setEditDescription(drawing.description || '');
                          setEditCategory(drawing.category || 'Малюнки');
                          setEditDate(drawing.date ? drawing.date.substring(0, 10) : '');
                          setIsEditing(true);
                        }}
                        className="text-[11px] text-pink-300 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Редагувати історію</span>
                      </button>
                    )}
                  </div>
                  <p className="text-purple-100 text-base sm:text-lg italic font-medium leading-relaxed">
                    «{drawing.description}»
                  </p>
                </div>
              ) : (
                isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTitle(drawing.title || '');
                      setEditDescription('');
                      setEditCategory(drawing.category || 'Малюнки');
                      setEditDate(drawing.date ? drawing.date.substring(0, 10) : '');
                      setIsEditing(true);
                    }}
                    className="w-full text-left p-3.5 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-pink-500/50 bg-purple-950/20 hover:bg-purple-950/40 transition-colors text-purple-300/80 hover:text-pink-300 flex items-center gap-2 text-xs font-bold cursor-pointer"
                  >
                    <span className="text-sm">🦄</span>
                    <Pencil className="w-3.5 h-3.5" />
                    <span>+ Додати розповідь Тані про цей малюнок</span>
                  </button>
                )
              )}
            </>
          )}

          {/* Comments Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-pink-400" />
              <span>{t.warmWordsTitle}</span>
            </h3>

            {/* Comment Submission Form */}
            <form
              onSubmit={handleSubmitComment}
              className="bg-slate-900/70 border border-purple-500/30 rounded-2xl p-4 space-y-3"
            >
              {submitSuccess ? (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-200 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{t.commentSuccess}</span>
                </div>
              ) : (
                <>
                  {/* Quick Sticker selector */}
                  <div>
                    <span className="text-xs font-bold text-purple-300/70 block mb-1.5">
                      {t.chooseSticker}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {quickStickers.map((stk) => (
                        <button
                          key={stk.emoji}
                          type="button"
                          onClick={() => setSelectedSticker(stk.emoji)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            selectedSticker === stk.emoji
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.4)] font-black'
                              : 'bg-slate-800/80 text-purple-200 border border-purple-500/30 hover:bg-slate-700'
                          }`}
                        >
                          <span className="text-base">{stk.emoji}</span>
                          <span>{stk.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder={t.namePlaceholder}
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      required
                      maxLength={50}
                      className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-purple-500/30 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder:text-purple-300/40"
                    />

                    <div className="sm:col-span-2 flex gap-2">
                      <input
                        type="text"
                        placeholder={t.commentPlaceholder}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={300}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/90 border border-purple-500/30 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder:text-purple-300/40"
                      />

                      <button
                        type="submit"
                        disabled={isSubmitting || !author.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(236,72,153,0.3)] disabled:opacity-50 transition-all cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? t.sending : t.btnSend}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>

            {/* Comments List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {loadingComments ? (
                <p className="text-xs text-purple-300/70 text-center py-4">{t.sending}</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-purple-300/50 italic text-center py-4 bg-slate-900/50 rounded-xl border border-purple-500/20">
                  {t.noCommentsYet}
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-slate-900/80 border border-purple-500/25 rounded-2xl p-3.5 shadow-xs flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-purple-950/80 flex items-center justify-center text-xl shrink-0 border border-purple-500/30">
                      {c.sticker || '💖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-extrabold text-sm text-white">
                          {c.author}
                        </span>
                        <span className="text-[11px] text-purple-300/60">
                          {new Date(c.createdAt).toLocaleDateString(localeMap[lang])}
                        </span>
                      </div>
                      {c.text && (
                        <p className="text-sm text-purple-200/90 leading-snug break-words">
                          {c.text}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
