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
  RefreshCw,
  FolderUp,
  CopyX,
  Rocket
} from 'lucide-react';
import { Drawing, Comment } from '@/lib/db';
import { useLanguage } from '@/components/LanguageContext';

interface DuplicateGroup {
  groupId: string;
  matchType: 'exact_hash' | 'stem_match';
  reason: string;
  drawings: (Drawing & { fileSize?: number; fileHash?: string })[];
}

export default function AdminPage() {
  const { t } = useLanguage();

  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'batch' | 'duplicates' | 'comments' | 'manage'>('upload');

  // Batch Upload State
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchCategory, setBatchCategory] = useState('Малюнки');
  const [batchDate, setBatchDate] = useState('');
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [batchResult, setBatchResult] = useState<{ addedCount: number; skippedCount: number; message: string } | null>(null);
  const [batchError, setBatchError] = useState('');

  // Duplicates State
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [redundantCount, setRedundantCount] = useState(0);
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');

  // Publishing State (deploy local changes to Vercel via Git)
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');

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
      loadDuplicates(currentPin);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const getActivePin = () => {
    return pin || (typeof window !== 'undefined' ? sessionStorage.getItem('admin_pin') || '' : '') || '2026';
  };

  // Load duplicates list
  const loadDuplicates = async (customPin?: string) => {
    setIsLoadingDuplicates(true);
    setDuplicateMessage('');
    try {
      const activePin = customPin || getActivePin();
      const res = await fetch('/api/admin/duplicates', {
        headers: { 'x-admin-pin': activePin },
      });
      const data = await res.json();
      if (data.success) {
        setDuplicateGroups(data.groups || []);
        setRedundantCount(data.redundantCount || 0);
      }
    } catch (e) {
      console.error('Failed to load duplicates:', e);
    } finally {
      setIsLoadingDuplicates(false);
    }
  };

  // Auto clean duplicates
  const handleAutoCleanDuplicates = async () => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('Видалити всі зайві копії автоматично? Буде збережено по одній оригінальній версії кожного малюнка.')) {
        return;
      }
    }
    setIsCleaningDuplicates(true);
    setDuplicateMessage('⏳ Очищую дублікати та оновлюю базу...');
    try {
      const activePin = getActivePin();
      const res = await fetch('/api/admin/duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': activePin,
        },
        body: JSON.stringify({ action: 'auto_clean' }),
      });
      const data = await res.json();
      if (data.success) {
        setDuplicateMessage(`✓ Успішно видалено ${data.removedCount} дублікатів! У галереї залишилося ${data.remainingDrawingsCount} унікальних малюнків.`);
        setDuplicateGroups([]);
        setRedundantCount(0);
        await loadAdminData(activePin);
        await loadDuplicates(activePin);
      } else {
        setDuplicateMessage(`Помилка: ${data.error || 'Не вдалося очистити дублікати'}`);
      }
    } catch {
      setDuplicateMessage('Помилка мережі при очищенні дублікатів');
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  // Delete specific duplicate
  const handleDeleteSpecificDuplicate = async (drawingId: string) => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('Видалити цей конкретний дублікат?')) return;
    }
    try {
      const activePin = getActivePin();
      const res = await fetch('/api/admin/duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': activePin,
        },
        body: JSON.stringify({ action: 'delete_ids', ids: [drawingId] }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAdminData(activePin);
        await loadDuplicates(activePin);
      }
    } catch (e) {
      console.error('Error deleting duplicate:', e);
    }
  };

  // 1-Click Publish to Vercel via Git Push
  const handlePublishToVercel = async () => {
    setIsPublishing(true);
    setPublishMessage('');
    try {
      const activePin = getActivePin();
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'x-admin-pin': activePin },
      });
      const data = await res.json();
      if (data.success) {
        setPublishMessage(data.message);
      } else {
        setPublishMessage(`Помилка: ${data.error || 'Не вдалося опублікувати на Vercel'}`);
      }
    } catch {
      setPublishMessage('Помилка з’єднання при публікації на Vercel');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle batch files selection (from files input or folder input or drag-and-drop)
  const handleBatchFiles = (newFiles: FileList | File[]) => {
    const list = Array.from(newFiles).filter((f) => {
      const ext = f.name.slice((f.name.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
      return ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    });
    setBatchFiles(list);
    setBatchResult(null);
    setBatchError('');
  };

  // Upload batch
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchFiles.length === 0) return;

    setIsBatchUploading(true);
    setBatchError('');
    setBatchResult(null);

    try {
      const formData = new FormData();
      batchFiles.forEach((file) => formData.append('files', file));
      formData.append('category', batchCategory);
      if (batchDate) formData.append('date', batchDate);

      const activePin = getActivePin();
      const res = await fetch('/api/admin/batch-upload', {
        method: 'POST',
        headers: { 'x-admin-pin': activePin },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setBatchResult({
          addedCount: data.addedCount,
          skippedCount: data.skippedCount,
          message: `✓ Успішно додано ${data.addedCount} малюнків! ${data.skippedCount > 0 ? `(${data.skippedCount} пропущено як дублікати)` : ''}`,
        });
        setBatchFiles([]);
        loadAdminData();
        loadDuplicates();
      } else {
        setBatchError(data.error || 'Помилка при пакетному завантаженні');
      }
    } catch {
      setBatchError('Помилка мережі при завантаженні файлів');
    } finally {
      setIsBatchUploading(false);
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

          <div className="flex items-center gap-2">
            <button
              onClick={handlePublishToVercel}
              disabled={isPublishing}
              className="text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-3.5 py-2 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              title="Опублікувати всі збережені малюнки на Vercel"
            >
              <Rocket className={`w-3.5 h-3.5 ${isPublishing ? 'animate-bounce' : ''}`} />
              <span>{isPublishing ? 'Публікую на Vercel...' : '🚀 Опублікувати на Vercel'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-purple-300 hover:text-rose-400 flex items-center gap-1.5 bg-slate-900/80 hover:bg-rose-950/40 px-3.5 py-2 rounded-xl border border-purple-500/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.adminLogout}</span>
            </button>
          </div>
        </div>

        {/* Publish Message Banner */}
        {publishMessage && (
          <div className="p-4 rounded-2xl bg-purple-950/90 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-between gap-3 shadow-md">
            <span>{publishMessage}</span>
            <button
              onClick={() => setPublishMessage('')}
              className="text-purple-400 hover:text-white font-extrabold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

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
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_15px_rgba(14,165,233,0.35)]'
                : 'bg-slate-900/80 text-purple-200 hover:bg-slate-800 border border-purple-500/30'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>{t.tabBatch}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('duplicates');
              loadDuplicates();
            }}
            className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'duplicates'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.35)]'
                : 'bg-slate-900/80 text-purple-200 hover:bg-slate-800 border border-purple-500/30'
            }`}
          >
            <CopyX className="w-4 h-4" />
            <span>{t.tabDuplicates}</span>
            {redundantCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-rose-500 text-white rounded-full text-xs font-extrabold animate-pulse">
                {redundantCount}
              </span>
            )}
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

        {/* TAB: BATCH FOLDER UPLOAD */}
        {activeTab === 'batch' && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-100 shadow-md space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <FolderUp className="w-5 h-5 text-sky-600" />
                <span>Масове завантаження малюнків з папки</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Виберіть цілу папку зі сканами на вашому пристрої або виділіть багато файлів одразу. 
                Система автоматично виявить та пропустить дублікати тих малюнків, які вже є в галереї.
              </p>
            </div>

            {batchResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">{batchResult.message}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Додано {batchResult.addedCount} нових робіт Тані.
                  </p>
                </div>
              </div>
            )}

            {batchError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{batchError}</span>
              </div>
            )}

            <form onSubmit={handleBatchSubmit} className="space-y-6">
              {/* Drop / Selection Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) handleBatchFiles(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50/60'
                }`}
              >
                <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                    <FolderUp className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-800">
                      Перетягніть файли або виберіть папку
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Підтримуються формати JPG, JPEG, PNG, WEBP
                    </p>
                  </div>

                  {/* Dual Upload Buttons: Folder or Files */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <label
                      htmlFor="batch-folder-input"
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-2 active:scale-95"
                    >
                      <FolderUp className="w-4 h-4" />
                      <span>📁 Вибрати цілу папку</span>
                    </label>
                    <input
                      id="batch-folder-input"
                      type="file"
                      multiple
                      ref={(el) => {
                        if (el) {
                          el.setAttribute('webkitdirectory', '');
                          el.setAttribute('directory', '');
                        }
                      }}
                      onChange={(e) => e.target.files && handleBatchFiles(e.target.files)}
                      className="hidden"
                    />

                    <label
                      htmlFor="batch-files-input"
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-2 active:scale-95"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>🖼️ Вибрати окремі файли</span>
                    </label>
                    <input
                      id="batch-files-input"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => e.target.files && handleBatchFiles(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Files Summary & Parameters */}
              {batchFiles.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">
                        Обрано файлів: <span className="text-sky-600 font-black">{batchFiles.length}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({(batchFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)} МБ)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBatchFiles([])}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer self-start sm:self-auto"
                    >
                      ✕ Очистити вибір
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Категорія для цієї пачки:
                      </label>
                      <select
                        value={batchCategory}
                        onChange={(e) => setBatchCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                      >
                        <option value="Малюнки">Малюнки (загальна)</option>
                        <option value="Тваринки">Тваринки 🐱</option>
                        <option value="Казки">Казки & Персонажі 🧚‍♀️</option>
                        <option value="Космос">Космос & Пригоди 🚀</option>
                        <option value="Сім'я">Сім'я & Любов ❤️</option>
                        <option value="Природа">Природа & Квіти 🌺</option>
                        <option value="Інше">Інше ✨</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Дата створення (необов'язково):
                      </label>
                      <input
                        type="date"
                        value={batchDate}
                        onChange={(e) => setBatchDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Якщо залишити порожнім — малюнки будуть без прив'язки до дати
                      </p>
                    </div>
                  </div>

                  {/* Preview file chips */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Список файлів у черзі:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                      {batchFiles.slice(0, 30).map((file, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[180px]"
                          title={file.name}
                        >
                          📄 {file.name}
                        </span>
                      ))}
                      {batchFiles.length > 30 && (
                        <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          + ще {batchFiles.length - 30} файлів...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Batch Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isBatchUploading}
                      className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isBatchUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Завантажую {batchFiles.length} файлів...</span>
                        </>
                      ) : (
                        <>
                          <FolderUp className="w-4 h-4" />
                          <span>Завантажити {batchFiles.length} малюнків у галерею 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB: DUPLICATES SCAN & CLEAN */}
        {activeTab === 'duplicates' && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-100 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <CopyX className="w-5 h-5 text-teal-600" />
                  <span>Пошук та очищення дублікатів</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Виявлення файлів-двійників за цифровим відбитком (SHA-256) та ідентичними іменами (.jpeg / .jpg).
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadDuplicates()}
                disabled={isLoadingDuplicates}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDuplicates ? 'animate-spin' : ''}`} />
                <span>{isLoadingDuplicates ? 'Сканую...' : 'Оновити пошук 🔄'}</span>
              </button>
            </div>

            {duplicateMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{duplicateMessage}</span>
              </div>
            )}

            {/* Status Summary Banner */}
            {redundantCount === 0 && !isLoadingDuplicates ? (
              <div className="p-8 text-center bg-teal-50/60 border-2 border-dashed border-teal-200 rounded-3xl">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-teal-950">
                  🎉 Дублікатів не знайдено!
                </h3>
                <p className="text-xs text-teal-700 max-w-md mx-auto mt-1">
                  Усі малюнки в галереї є унікальними. Немає жодного зайвого файлу-двійника.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Clean in 1 click banner */}
                <div className="p-5 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">
                        Знайдено груп дублікатів: <span className="text-rose-600 font-black">{duplicateGroups.length}</span>
                      </span>
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 text-xs font-black rounded-full">
                        {redundantCount} зайвих копій
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Очищення автоматично збереже по 1 оригінальному файлу з кожної пари та безпечно видалить лише надлишкові дублікати.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoCleanDuplicates}
                    disabled={isCleaningDuplicates}
                    className="px-5 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isCleaningDuplicates ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Очищення...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Очистити всі дублікати в 1 клік ({redundantCount}) 🧹</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Duplicates Groups List */}
                <div className="space-y-4">
                  {duplicateGroups.map((group, gIdx) => (
                    <div
                      key={group.groupId || gIdx}
                      className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                            #{gIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {group.reason}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {group.drawings.length} копії в групі
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {group.drawings.map((d, dIdx) => {
                          const isPrimary = dIdx === 0;
                          return (
                            <div
                              key={d.id}
                              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                                isPrimary
                                  ? 'bg-emerald-50/80 border-emerald-300'
                                  : 'bg-rose-50/60 border-rose-200'
                              }`}
                            >
                              <div>
                                <div className="h-36 relative rounded-lg overflow-hidden bg-slate-900 mb-2 border border-slate-200">
                                  <img
                                    src={d.imageUrl}
                                    alt={d.title}
                                    className="w-full h-full object-contain"
                                  />
                                  <span
                                    className={`absolute top-1.5 left-1.5 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs ${
                                      isPrimary
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-rose-500 text-white'
                                    }`}
                                  >
                                    {isPrimary ? '✓ Оригінал (залишиться)' : '✕ Дублікат (до видалення)'}
                                  </span>
                                </div>

                                <h4 className="text-xs font-extrabold text-slate-800 truncate" title={d.title}>
                                  {d.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5" title={d.imageUrl}>
                                  {d.imageUrl.replace('/drawings/', '')}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                  <span>{d.category}</span>
                                  {d.date && <span>• {d.date}</span>}
                                  <span>• ⭐ {d.likesCount || 0}</span>
                                </div>
                              </div>

                              {!isPrimary && (
                                <div className="pt-2 mt-2 border-t border-rose-200/60">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSpecificDuplicate(d.id)}
                                    className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Видалити цей файл</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
