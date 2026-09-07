import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SYNC_DIR = process.env.SYNC_DIR || '/Users/imac/Downloads/UNARCHIVED/Tanja';
const DB_PATH = path.join(rootDir, 'data', 'db.json');
const UPLOAD_DIR = path.join(rootDir, 'public', 'uploads');

console.log(`[Sync] Scanning folder: ${SYNC_DIR}`);

if (!fs.existsSync(SYNC_DIR)) {
  console.error(`[Sync Error] Directory does not exist: ${SYNC_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

let db = { drawings: [], comments: [], settings: {}, ignoredSyncFiles: [] };
if (fs.existsSync(DB_PATH)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
}

const existingSourceFiles = new Set(
  (db.drawings || []).map((d) => d.sourceFile).filter(Boolean)
);
const ignoredFiles = new Set(db.ignoredSyncFiles || []);

// Compute existing image content hashes so we never import duplicate scans
const existingHashes = new Set();
for (const d of db.drawings || []) {
  if (!d.imageUrl) continue;
  const p = path.join(rootDir, 'public', d.imageUrl.replace(/^\//, ''));
  if (fs.existsSync(p)) {
    try {
      const buf = fs.readFileSync(p);
      const h = crypto.createHash('sha256').update(buf).digest('hex');
      existingHashes.add(h);
    } catch {}
  }
}

const allFiles = fs.readdirSync(SYNC_DIR);
const imageFiles = allFiles.filter((f) => {
  const ext = path.extname(f).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
});

// Sort natural order
imageFiles.sort((a, b) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
});

console.log(`[Sync] Found ${imageFiles.length} image files in folder.`);

let addedCount = 0;

for (const filename of imageFiles) {
  if (existingSourceFiles.has(filename) || ignoredFiles.has(filename)) {
    continue;
  }

  const srcPath = path.join(SYNC_DIR, filename);
  let srcHash = '';
  try {
    const buf = fs.readFileSync(srcPath);
    srcHash = crypto.createHash('sha256').update(buf).digest('hex');
  } catch {}

  if (srcHash && existingHashes.has(srcHash)) {
    console.log(`[Sync Skip Duplicate Content] Skipping ${filename} (hash already in gallery)`);
    continue;
  }
  const stat = fs.statSync(srcPath);
  const ext = path.extname(filename).toLowerCase();
  const matchNumber = filename.match(/\d+/);
  const numStr = matchNumber ? matchNumber[0] : '1';
  const destFilename = `tanja-sync-${numStr}-${Date.now().toString().slice(-4)}${ext}`;
  const destPath = path.join(UPLOAD_DIR, destFilename);

  fs.copyFileSync(srcPath, destPath);

  const newDrawing = {
    id: `drawing-sync-${numStr}-${Date.now()}`,
    title: `Малюнок №${numStr} (Таня)`,
    date: '',
    category: 'Малюнки',
    description: `Оригінальний малюнок із папки Тетянки (${filename}) 🎨✨`,
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
}

if (addedCount > 0) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log(`[Sync Success] Successfully imported ${addedCount} new drawings! Total in gallery: ${db.drawings.length}`);
} else {
  console.log(`[Sync Info] All ${imageFiles.length} drawings are already synced. Nothing new to add.`);
}
