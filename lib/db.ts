import fs from 'fs';
import path from 'path';

export interface Drawing {
  id: string;
  title: string;
  date?: string;
  category: string;
  description: string;
  imageUrl: string;
  rotation?: number; // 0, 90, 180, 270
  derivedImages?: string[]; // URLs of AI reimagined art
  videoUrl?: string; // URL of generated video animation
  sourceFile?: string; // Original filename from sync folder
  likesCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  drawingId: string;
  author: string;
  sticker?: string;
  text: string;
  status: 'approved' | 'pending';
  createdAt: string;
}

export interface Settings {
  siteTitle: string;
  artistName: string;
  adminPin: string;
}

export interface DBData {
  drawings: Drawing[];
  comments: Comment[];
  settings: Settings;
}

const dbPath = path.join(process.cwd(), 'data', 'db.json');

const defaultData: DBData = {
  drawings: [],
  comments: [],
  settings: {
    siteTitle: "Казкова майстерня Тані",
    artistName: "Таня",
    adminPin: process.env.ADMIN_PIN || "2026",
  },
};

export function readDB(): DBData {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw) as DBData;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return defaultData;
  }
}

export function writeDB(data: DBData): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// Drawings
export function getDrawings(): Drawing[] {
  const db = readDB();
  return (db.drawings || []).sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : new Date(a.createdAt || 0).getTime();
    const timeB = b.date ? new Date(b.date).getTime() : new Date(b.createdAt || 0).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });
}

export function getDrawingById(id: string): Drawing | undefined {
  const db = readDB();
  return db.drawings.find((d) => d.id === id);
}

export function addDrawing(drawing: Omit<Drawing, 'id' | 'likesCount' | 'createdAt'>): Drawing {
  const db = readDB();
  const newDrawing: Drawing = {
    ...drawing,
    rotation: drawing.rotation || 0,
    derivedImages: drawing.derivedImages || [],
    videoUrl: drawing.videoUrl || '',
    id: `drawing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    likesCount: 0,
    createdAt: new Date().toISOString(),
  };
  db.drawings.unshift(newDrawing);
  writeDB(db);
  return newDrawing;
}

export function updateDrawing(id: string, updates: Partial<Drawing>): Drawing | null {
  const db = readDB();
  const index = db.drawings.findIndex((d) => d.id === id);
  if (index === -1) return null;

  db.drawings[index] = {
    ...db.drawings[index],
    ...updates,
  };
  writeDB(db);
  return db.drawings[index];
}

export function rotateDrawing(id: string, targetRotation?: number): number {
  const db = readDB();
  const drawing = db.drawings.find((d) => d.id === id);
  if (!drawing) return 0;

  if (targetRotation !== undefined) {
    drawing.rotation = (targetRotation % 360 + 360) % 360;
  } else {
    drawing.rotation = ((drawing.rotation || 0) + 90) % 360;
  }

  writeDB(db);
  return drawing.rotation;
}

export function deleteDrawing(id: string): boolean {
  const db = readDB();
  const initialLength = db.drawings.length;
  db.drawings = db.drawings.filter((d) => d.id !== id);
  db.comments = db.comments.filter((c) => c.drawingId !== id);
  writeDB(db);
  return db.drawings.length < initialLength;
}

export function incrementLike(drawingId: string): number {
  const db = readDB();
  const drawing = db.drawings.find((d) => d.id === drawingId);
  if (drawing) {
    drawing.likesCount = (drawing.likesCount || 0) + 1;
    writeDB(db);
    return drawing.likesCount;
  }
  return 0;
}

// Comments
export function getComments(drawingId?: string, includePending = false): Comment[] {
  const db = readDB();
  let comments = db.comments || [];
  if (drawingId) {
    comments = comments.filter((c) => c.drawingId === drawingId);
  }
  if (!includePending) {
    comments = comments.filter((c) => c.status === 'approved');
  }
  return comments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addComment(comment: Omit<Comment, 'id' | 'status' | 'createdAt'>): Comment {
  const db = readDB();
  const newComment: Comment = {
    ...comment,
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.comments.unshift(newComment);
  writeDB(db);
  return newComment;
}

export function updateCommentStatus(id: string, status: 'approved' | 'pending'): boolean {
  const db = readDB();
  const comment = db.comments.find((c) => c.id === id);
  if (comment) {
    comment.status = status;
    writeDB(db);
    return true;
  }
  return false;
}

export function deleteComment(id: string): boolean {
  const db = readDB();
  const initialLength = db.comments.length;
  db.comments = db.comments.filter((c) => c.id !== id);
  writeDB(db);
  return db.comments.length < initialLength;
}

// Auth & Settings
export function verifyPin(pin: string): boolean {
  const db = readDB();
  const validPin = process.env.ADMIN_PIN || db.settings.adminPin || '2026';
  return pin.trim() === validPin.trim();
}

export function getStats() {
  const db = readDB();
  const totalStars = db.drawings.reduce((sum, d) => sum + (d.likesCount || 0), 0);
  const totalDrawings = db.drawings.length;
  const pendingCommentsCount = db.comments.filter((c) => c.status === 'pending').length;
  const approvedCommentsCount = db.comments.filter((c) => c.status === 'approved').length;
  return {
    totalStars,
    totalDrawings,
    pendingCommentsCount,
    approvedCommentsCount,
  };
}
