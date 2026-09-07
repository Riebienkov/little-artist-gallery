'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Lock, 
  Upload, 
  MessageCircle, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  RotateCw,
  Video,
  Plus,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { Drawing, Comment } from '@/lib/db';
import { useLanguage } from '@/components/LanguageContext';

export default function AdminPage() {
  const { t } = useLanguage();

  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'comments' | 'manage'>('upload');

  // Data states
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Тваринки');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadRotation, setUploadRotation] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Editing Media for an existing drawing
  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null);
  const [mediaAiFile, setMediaAiFile] = useState<File | null>(null);
  const [mediaAiPreview, setMediaAiPreview] = useState<string | null>(null);
  const [mediaVideoFile, setMediaVideoFile] = useState<File | null>(null);
  const [mediaVideoPreview, setMediaVideoPreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaSavedSuccess, setMediaSavedSuccess] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusText('');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'x-admin-pin': pin },
      });
      const data = await res.json();
      if (data.success) {
        if (data.addedCount > 0) {
          setSyncStatusText(`✓ Успішно додано ${data.addedCount} нових малюнків! Усього в галереї: ${data.totalDrawings}`);
        } else {
          setSyncStatusText(`✓ Усі малюнки (${data.filesFound}) уже синхронізовані.`);
        }
        loadAdminData();
      } else {
        setSyncStatusText(`Помилка: ${data.errors?.join(', ') || 'Не вдалося синхронізувати'}`);
      }
    } catch {
      setSyncStatusText('Помилка зв’язку із сервером синхронізації');
    } finally {
      setIsSyncing(false);
    }
  };

  // Check stored PIN in sessionStorage on mount
  useEffect(() => {
    const savedPin = sessionStorage.getItem('admin_pin');
    if (savedPin) {
      setPin(savedPin);
      verifyPinOnServer(savedPin);
    }
  }, []);

  const verifyPinOnServer = async (pinToTest: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToTest }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_pin', pinToTest);
        loadAdminData(pinToTest);
      } else {
        setAuthError('Невірний PIN-код. Спробуйте ще раз (за замовчуванням 2026).');
      }
    } catch {
      setAuthError('Помилка з’єднання із сервером.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    verifyPinOnServer(pin);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pin');
    setIsAuthenticated(false);
    setPin('');
  };

  const loadAdminData = async (currentPin = pin) => {
    try {
      const [dRes, cRes] = await Promise.all([
        fetch('/api/drawings'),
        fetch('/api/comments?includePending=true', {
          headers: { 'x-admin-pin': currentPin },
        }),
      ]);

      const dData = await dRes.json();
      const cData = await cRes.json();

      setDrawings(dData.drawings || []);
      setComments(cData.comments || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  // Handle image selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadRotation(0);
      setUploadError('');
    }
  };

  // Upload new drawing
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError(t.drawingTitleLabel);
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append(
        'category',
        category === 'Інше' ? (customCategory.trim() || 'Малюнки') : category
      );
      formData.append('description', description.trim());
      formData.append('date', date);
      formData.append('rotation', String(uploadRotation));
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await fetch('/api/drawings', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadSuccess(true);
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadRotation(0);
        setCustomCategory('');
        loadAdminData();
      } else {
        setUploadError(data.error || 'Помилка збереження');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Помилка мережі при завантаженні');
    } finally {
      setUploading(false);
    }
  };

  // Rotate an existing drawing permanently
  const handleRotateDrawing = async (drawingId: string) => {
    try {
      const res = await fetch(`/api/drawings/${drawingId}/rotate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
      });
      const data = await res.json();
      if (data.success) {
        setDrawings((prev) =>
          prev.map((d) => (d.id === drawingId ? { ...d, rotation: data.rotation } : d))
        );
      }
    } catch (err) {
      console.error('Error rotating drawing:', err);
    }
  };

  // Attach derivative media (AI file or Video file upload)
  const handleOpenMediaEditor = (drawing: Drawing) => {
    setEditingDrawingId(drawing.id);
    setMediaAiFile(null);
    setMediaAiPreview(null);
    setMediaVideoFile(null);
    setMediaVideoPreview(null);
    setMediaSavedSuccess(false);
    setMediaUploadError('');
  };

  const handleUploadMedia = async (drawingId: string) => {
    if (!mediaAiFile && !mediaVideoFile) {
      setMediaUploadError('Оберіть хоча б один файл (малюнок чи відео) для завантаження');
      return;
    }

    setIsUploadingMedia(true);
    setMediaUploadError('');
    setMediaSavedSuccess(false);

    try {
      const formData = new FormData();
      if (mediaAiFile) formData.append('aiImage', mediaAiFile);
      if (mediaVideoFile) formData.append('video', mediaVideoFile);

      const res = await fetch(`/api/drawings/${drawingId}/media`, {
        method: 'POST',
        headers: {
          'x-admin-pin': pin,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMediaSavedSuccess(true);
        setDrawings((prev) =>
          prev.map((d) => (d.id === drawingId ? data.drawing : d))
        );
        setMediaAiFile(null);
        setMediaAiPreview(null);
        setMediaVideoFile(null);
        setMediaVideoPreview(null);
        setTimeout(() => setEditingDrawingId(null), 1200);
      } else {
        setMediaUploadError(data.error || 'Помилка завантаження файлу');
      }
    } catch {
      setMediaUploadError('Помилка мережі при завантаженні');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveDerivative = async (drawingId: string, action: 'remove_ai' | 'remove_video') => {
    try {
      const formData = new FormData();
      formData.append('action', action);

      const res = await fetch(`/api/drawings/${drawingId}/media`, {
        method: 'POST',
        headers: { 'x-admin-pin': pin },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setDrawings((prev) =>
          prev.map((d) => (d.id === drawingId ? data.drawing : d))
        );
      }
    } catch (err) {
      console.error('Failed to remove derivative:', err);
    }
  };

  // Approve or Delete Comment
  const handleCommentStatus = async (commentId: string, status: 'approved') => {
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify({ id: commentId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, status: 'approved' } : c))
        );
      }
    } catch (err) {
      console.error('Error approving comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Видалити цей коментар?')) return;
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Delete Drawing
  const handleDeleteDrawing = async (drawingId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей малюнок?')) return;
    try {
      const res = await fetch(`/api/drawings/${drawingId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      });
      const data = await res.json();
      if (data.success) {
        setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
      }
    } catch (err) {
      console.error('Error deleting drawing:', err);
    }
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col relative z-10">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#120e29]/95 backdrop-blur-xl max-w-md w-full rounded-3xl p-6 sm:p-8 border-2 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-purple-900/60 border border-purple-500/40 text-pink-400 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white">
                {t.adminTitle}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
                {t.adminPinPrompt}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder={t.adminPinPlaceholder}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full text-center text-xl font-bold tracking-widest px-4 py-3 rounded-2xl border-2 border-purple-500/40 bg-slate-800/90 text-white focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/20"
                  required
                />
                {authError && (
                  <p className="text-xs text-rose-400 font-medium mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-transform active:scale-98 cursor-pointer"
              >
                {t.adminEnterBtn}
              </button>
            </form>

            <p className="text-[11px] text-purple-300/60">
              💡 PIN: <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-purple-200 border border-purple-500/30">2026</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pendingComments = comments.filter((c) => c.status === 'pending');

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Admin Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#120e29]/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="text-2xl">🦄</span>
              <Sparkles className="w-6 h-6 text-pink-400" />
              <span>{t.adminTitle}</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/70">
              {t.adminSubtitle}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-purple-300 hover:text-rose-400 flex items-center gap-1.5 bg-slate-900/80 hover:bg-rose-950/40 px-3.5 py-2 rounded-xl border border-purple-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.adminLogout}</span>
          </button>
        </div>

        {/* Auto-Sync Banner */}
        <div className="bg-[#0b1b24]/85 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-sm shrink-0">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-emerald-200">
                  Автосинхронізація з папкою Tanja
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Активна
                </span>
              </div>
              <p className="text-xs text-emerald-300/70 mt-0.5 font-mono">
                /Users/imac/Downloads/UNARCHIVED/Tanja
              </p>
              {syncStatusText && (
                <p className="text-xs font-bold text-emerald-300 mt-1">
                  {syncStatusText}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Синхронізую...' : 'Синхронізувати зараз 🔄'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-purple-500/20 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.35)]'
                : 'bg-slate-900/80 text-purple-200 hover:bg-slate-800 border border-purple-500/30'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{t.tabUpload}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'comments'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'bg-slate-900/80 text-purple-200 hover:bg-slate-800 border border-purple-500/30'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.tabComments}</span>
            {pendingComments.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-rose-500 text-white rounded-full text-xs font-extrabold animate-pulse">
                {pendingComments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                : 'bg-slate-900/80 text-purple-200 hover:bg-slate-800 border border-purple-500/30'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{t.tabManage} ({drawings.length})</span>
          </button>
        </div>

        {/* TAB 1: UPLOAD NEW DRAWING */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-100 shadow-md">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-pink-500" />
              <span>{t.uploadTitle}</span>
            </h2>

            {uploadSuccess && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{t.uploadSuccessMsg}</span>
              </div>
            )}

            {uploadError && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* File Upload & Orientation Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Фотографія малюнка:
                </label>
                <div className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/40 rounded-3xl p-6 text-center transition-colors relative">
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative p-2 bg-white rounded-2xl shadow-md">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{
                            transform: `rotate(${uploadRotation}deg)`,
                            transition: 'transform 0.3s ease',
                          }}
                          className="max-h-56 rounded-xl object-contain"
                        />
                      </div>

                      <div className="flex items-center gap-2 z-10">
                        {/* Rotate button before upload */}
                        <button
                          type="button"
                          onClick={() => setUploadRotation((r) => (r + 90) % 360)}
                          className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>{t.btnRotate90} ({uploadRotation}°)</span>
                        </button>

                        <label className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer shadow-xs">
                          <span>Обрати інше фото</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 text-slate-500 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-amber-500">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-700">
                        Оберіть фотографію або сфотографуйте з камери
                      </p>
                      <span className="text-xs text-slate-400">
                        (Формати JPG, PNG, WebP • EXIF очищується автоматично)
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Title & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {t.drawingTitleLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.drawingTitlePlaceholder}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {t.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {t.categoryLabel}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Тваринки', 'Казки', 'Космос', 'Родина', 'Природа', 'Інше'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-amber-400 text-amber-950 scale-105 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {category === 'Інше' && (
                  <input
                    type="text"
                    placeholder="Введіть власну назву категорії..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Daughter's Story */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {t.storyLabel}
                </label>
                <textarea
                  rows={3}
                  placeholder={t.storyPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-pink-400 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{uploading ? t.sending : t.btnPublish}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: COMMENTS MODERATION */}
        {activeTab === 'comments' && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-100 shadow-md space-y-6">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-500" />
                <span>{t.tabComments}</span>
              </span>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                {t.pendingBadge}: {pendingComments.length}
              </span>
            </h2>

            {/* Pending Section */}
            {pendingComments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
                  ⏳ {t.pendingBadge}:
                </h3>
                <div className="space-y-2.5">
                  {pendingComments.map((c) => {
                    const drawing = drawings.find((d) => d.id === c.drawingId);
                    return (
                      <div
                        key={c.id}
                        className="bg-amber-50/60 border-2 border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl p-2 bg-white rounded-xl shadow-xs">
                            {c.sticker || '💖'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-sm">
                                {c.author}
                              </span>
                              {drawing && (
                                <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                                  до «{drawing.title}»
                                </span>
                              )}
                            </div>
                            {c.text && (
                              <p className="text-sm text-slate-700 mt-1 italic">
                                «{c.text}»
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleCommentStatus(c.id, 'approved')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t.btnApprove}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.btnDelete}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approved Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t.alreadyApprovedTitle}
              </h3>
              {comments.filter((c) => c.status === 'approved').length === 0 ? (
                <p className="text-xs text-slate-400 italic">{t.noCommentsYet}</p>
              ) : (
                <div className="space-y-2">
                  {comments
                    .filter((c) => c.status === 'approved')
                    .map((c) => {
                      const drawing = drawings.find((d) => d.id === c.drawingId);
                      return (
                        <div
                          key={c.id}
                          className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{c.sticker || '💖'}</span>
                            <span className="font-bold text-slate-800">{c.author}:</span>
                            <span className="text-slate-600">{c.text}</span>
                            {drawing && (
                              <span className="text-slate-400">
                                (до «{drawing.title}»)
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t.btnDelete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MANAGE ALL DRAWINGS + ROTATION & DERIVATIVES */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-100 shadow-md space-y-6">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <span>{t.allArtworksTitle}</span>
            </h2>

            {/* Derivative Media File Uploader */}
            {editingDrawingId && (() => {
              const currentDrawing = drawings.find((d) => d.id === editingDrawingId);
              if (!currentDrawing) return null;

              return (
                <div className="p-5 sm:p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 border-3 border-purple-200 rounded-3xl space-y-5 animate-in fade-in duration-200 shadow-md">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-purple-950">
                          Додаткові матеріали до малюнка: «{currentDrawing.title}»
                        </h3>
                        <p className="text-xs text-purple-700">
                          Завантажте файл AI-переосмисленого малюнка або відео-анімації з комп'ютера
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingDrawingId(null)}
                      className="text-slate-400 hover:text-slate-700 font-extrabold text-sm px-2 py-1 rounded-lg hover:bg-white/80 transition-colors"
                    >
                      ✕ Закрити
                    </button>
                  </div>

                  {mediaSavedSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>✓ Матеріали успішно завантажено та збережено для цього малюнка!</span>
                    </div>
                  )}

                  {mediaUploadError && (
                    <div className="p-3.5 rounded-2xl bg-rose-100/90 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>{mediaUploadError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* SECTION 1: AI IMAGE FILE UPLOAD */}
                    <div className="bg-white/90 rounded-2xl p-4 border border-purple-200/80 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-pink-500" />
                          <span>1. Похідний AI-малюнок (Зображення)</span>
                        </label>
                        {currentDrawing.derivedImages && currentDrawing.derivedImages.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDerivative(currentDrawing.id, 'remove_ai')}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                          >
                            Видалити поточний ✕
                          </button>
                        )}
                      </div>

                      {/* Current AI image preview */}
                      {currentDrawing.derivedImages && currentDrawing.derivedImages[0] && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <img
                            src={currentDrawing.derivedImages[0]}
                            alt="Current AI"
                            className="w-full h-full object-contain p-1"
                          />
                          <span className="absolute bottom-2 left-2 bg-pink-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Прикріплений AI-арт
                          </span>
                        </div>
                      )}

                      {/* New File selector */}
                      <label className="border-2 border-dashed border-pink-300 hover:border-pink-400 bg-pink-50/40 rounded-2xl p-4 text-center transition-colors cursor-pointer block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setMediaAiFile(file);
                              setMediaAiPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                        {mediaAiPreview ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={mediaAiPreview}
                              alt="Preview"
                              className="w-16 h-16 rounded-xl object-contain bg-white shadow-xs"
                            />
                            <div className="text-left text-xs">
                              <p className="font-bold text-slate-800 truncate max-w-[180px]">
                                {mediaAiFile?.name}
                              </p>
                              <span className="text-pink-600 font-semibold">
                                Обрано новий файл (натисніть «Завантажити»)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs py-2">
                            <p className="font-bold text-slate-700">
                              Оберіть новий файл зображення (PNG, JPG, SVG)
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Натисніть для вибору з комп'ютера
                            </span>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* SECTION 2: VIDEO FILE UPLOAD */}
                    <div className="bg-white/90 rounded-2xl p-4 border border-purple-200/80 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-purple-600" />
                          <span>2. Похідна анімація (Відеофайл)</span>
                        </label>
                        {currentDrawing.videoUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDerivative(currentDrawing.id, 'remove_video')}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                          >
                            Видалити поточне ✕
                          </button>
                        )}
                      </div>

                      {/* Current Video preview */}
                      {currentDrawing.videoUrl && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                          {currentDrawing.videoUrl.endsWith('.mp4') || currentDrawing.videoUrl.endsWith('.webm') ? (
                            <video
                              src={currentDrawing.videoUrl}
                              controls
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <img
                              src={currentDrawing.videoUrl}
                              alt="Current Animation"
                              className="w-full h-full object-contain"
                            />
                          )}
                          <span className="absolute bottom-2 left-2 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Прикріплене відео
                          </span>
                        </div>
                      )}

                      {/* New File selector */}
                      <label className="border-2 border-dashed border-purple-300 hover:border-purple-400 bg-purple-50/40 rounded-2xl p-4 text-center transition-colors cursor-pointer block">
                        <input
                          type="file"
                          accept="video/*,image/svg+xml"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setMediaVideoFile(file);
                              setMediaVideoPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                        {mediaVideoPreview ? (
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 font-bold text-xs">
                              🎬
                            </div>
                            <div className="text-left text-xs">
                              <p className="font-bold text-slate-800 truncate max-w-[180px]">
                                {mediaVideoFile?.name}
                              </p>
                              <span className="text-purple-600 font-semibold">
                                Обрано новий відеофайл (натисніть «Завантажити»)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs py-2">
                            <p className="font-bold text-slate-700">
                              Оберіть відеофайл (MP4, WebM, MOV, SVG)
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Натисніть для вибору з комп'ютера
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Submit / Upload Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingDrawingId(null)}
                      className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                    >
                      Скасувати
                    </button>

                    <button
                      type="button"
                      disabled={isUploadingMedia || (!mediaAiFile && !mediaVideoFile)}
                      onClick={() => handleUploadMedia(currentDrawing.id)}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isUploadingMedia ? 'Завантажую файли...' : 'Завантажити матеріали до малюнка 🚀'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {drawings.map((d) => (
                <div
                  key={d.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center p-2 relative">
                      <img
                        src={d.imageUrl}
                        alt={d.title}
                        style={{ transform: `rotate(${d.rotation || 0}deg)` }}
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Media Badges */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {d.derivedImages && d.derivedImages.length > 0 && (
                          <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                            AI
                          </span>
                        )}
                        {d.videoUrl && (
                          <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                            🎬
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          {d.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {d.rotation || 0}°
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 mt-1">
                        {d.title}
                      </h4>
                      {d.date && (
                        <p className="text-[11px] text-slate-400">
                          {new Date(d.date).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Rotate, Media, Delete */}
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                    {/* Rotate 90 deg */}
                    <button
                      type="button"
                      onClick={() => handleRotateDrawing(d.id)}
                      className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title={t.btnRotate90}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{t.btnRotate90}</span>
                    </button>

                    {/* Manage Derivatives */}
                    <button
                      type="button"
                      onClick={() => handleOpenMediaEditor(d)}
                      className="text-purple-700 hover:text-purple-800 font-bold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="AI Арт та Відео"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Медіа</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteDrawing(d.id)}
                      className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title={t.btnDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
