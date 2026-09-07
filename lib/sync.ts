import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { readDB, writeDB, Drawing } from './db';

export const DEFAULT_SYNC_DIR = '/Users/imac/Downloads/UNARCHIVED/Tanja';

export function getSyncDir(): string {
  return process.env.SYNC_DIR || DEFAULT_SYNC_DIR;
}

export interface SyncResult {
  success: boolean;
  syncDir: string;
  exists: boolean;
  addedCount: number;
  totalDrawings: number;
  filesFound: number;
  errors?: string[];
}

export function syncTanjaFolder(): SyncResult {
  const syncDir = getSyncDir();
  const errors: string[] = [];

  if (!fs.existsSync(syncDir)) {
    return {
      success: false,
      syncDir,
      exists: false,
      addedCount: 0,
      totalDrawings: 0,
      filesFound: 0,
      errors: [`Папка не знайдена: ${syncDir}`],
    };
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const db = readDB();
  const existingSourceFiles = new Set(
    db.drawings.map((d) => d.sourceFile).filter(Boolean)
  );
  const ignoredFiles = new Set(db.ignoredSyncFiles || []);

  // Compute existing image content hashes so we NEVER import duplicates
  const existingHashes = new Set<string>();
  for (const d of db.drawings) {
    if (!d.imageUrl) continue;
    const p = path.join(process.cwd(), 'public', d.imageUrl.replace(/^\//, ''));
    if (fs.existsSync(p)) {
      try {
        const buf = fs.readFileSync(p);
        const h = crypto.createHash('sha256').update(buf).digest('hex');
        existingHashes.add(h);
      } catch {}
    }
  }

  let rawFiles: string[] = [];
  try {
    rawFiles = fs.readdirSync(syncDir);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      syncDir,
      exists: true,
      addedCount: 0,
      totalDrawings: db.drawings.length,
      filesFound: 0,
      errors: [`Помилка читання папки: ${errorMsg}`],
    };
  }

  // Filter image files
  const imageFiles = rawFiles.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  // Sort natural order (Без названия.jpeg, Без названия 2.jpeg, Без названия 3.jpeg, ...)
  imageFiles.sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  let addedCount = 0;

  for (const filename of imageFiles) {
    if (existingSourceFiles.has(filename) || ignoredFiles.has(filename)) {
      continue;
    }

    try {
      const srcPath = path.join(syncDir, filename);
      let srcHash = '';
      try {
        const buf = fs.readFileSync(srcPath);
        srcHash = crypto.createHash('sha256').update(buf).digest('hex');
      } catch {}

      if (srcHash && existingHashes.has(srcHash)) {
        continue;
      }
      const stat = fs.statSync(srcPath);

      // Create a clean destination filename
      const ext = path.extname(filename).toLowerCase();
      // Extract number if present
      const matchNumber = filename.match(/\d+/);
      const numStr = matchNumber ? matchNumber[0] : '1';
      const destFilename = `tanja-sync-${numStr}-${Date.now().toString().slice(-4)}${ext}`;
      const destPath = path.join(uploadDir, destFilename);

      // Copy file
      fs.copyFileSync(srcPath, destPath);

      // Extract pretty title
      let title = `Малюнок №${numStr} (Таня)`;
      if (filename.toLowerCase().includes('ялинка') || filename.toLowerCase().includes('tree')) {
        title = `Святкова Ялинка №${numStr}`;
      } else if (filename.toLowerCase().includes('кот') || filename.toLowerCase().includes('cat')) {
        title = `Котик №${numStr}`;
      }

      const newDrawing: Drawing = {
        id: `drawing-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        date: '',
        category: 'Малюнки',
        description: `Малюнок з авторської папки Тетянки (${filename}) 🎨✨`,
        imageUrl: `/uploads/${destFilename}`,
        sourceFile: filename,
        rotation: 0,
        derivedImages: [],
        videoUrl: '',
        likesCount: 0,
        createdAt: new Date().toISOString(),
      };

      db.drawings.push(newDrawing);
      existingSourceFiles.add(filename);
      if (srcHash) existingHashes.add(srcHash);
      addedCount++;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Не вдалося імпортувати ${filename}: ${errorMsg}`);
    }
  }

  if (addedCount > 0) {
    writeDB(db);
  }

  return {
    success: true,
    syncDir,
    exists: true,
    addedCount,
    totalDrawings: db.drawings.length,
    filesFound: imageFiles.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}
