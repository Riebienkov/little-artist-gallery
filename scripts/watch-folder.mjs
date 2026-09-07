import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SYNC_DIR = process.env.SYNC_DIR || '/Users/imac/Downloads/UNARCHIVED/Tanja';

console.log(`[Folder Watcher] Watching folder: ${SYNC_DIR}`);

if (!fs.existsSync(SYNC_DIR)) {
  console.error(`[Folder Watcher Error] Target folder not found: ${SYNC_DIR}`);
  process.exit(1);
}

// Initial sync on start
try {
  execSync(`node "${path.join(__dirname, 'sync.mjs')}"`, { stdio: 'inherit' });
} catch (e) {
  console.error('[Folder Watcher] Initial sync failed:', e);
}

let debounceTimer = null;

fs.watch(SYNC_DIR, (eventType, filename) => {
  if (!filename) return;
  const ext = path.extname(filename).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;

  console.log(`[Folder Watcher] Detected change: ${eventType} on ${filename}`);

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      console.log(`[Folder Watcher] Triggering sync for new file...`);
      execSync(`node "${path.join(__dirname, 'sync.mjs')}"`, { stdio: 'inherit' });
    } catch (err) {
      console.error('[Folder Watcher] Error during sync:', err);
    }
  }, 1000);
});

console.log(`[Folder Watcher] Ready and actively listening for new drawings! ✨`);
