'use client';

const STORAGE_KEY = 'tanja_gallery_user_likes_v2';
const EVENT_NAME = 'tanja-star-update';

export function getLocalLikes(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalLike(drawingId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const likes = getLocalLikes();
    likes[drawingId] = (likes[drawingId] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
    
    // Broadcast event for all components on the page
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { drawingId, userLikes: likes[drawingId] },
      })
    );
    return likes[drawingId];
  } catch {
    return 0;
  }
}

export function getLocalLikeCount(drawingId: string): number {
  const likes = getLocalLikes();
  return likes[drawingId] || 0;
}
