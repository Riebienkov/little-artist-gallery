import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, verifyPin, Drawing } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface DuplicateGroup {
  groupId: string;
  matchType: 'exact_hash' | 'stem_match';
  reason: string;
  drawings: (Drawing & { fileSize?: number; fileHash?: string })[];
}

export async function GET(req: NextRequest) {
  try {
    const adminPin = req.headers.get('x-admin-pin') || '';
    if (!verifyPin(adminPin)) {
      return NextResponse.json({ error: 'Невірний або відсутній PIN-код' }, { status: 401 });
    }

    const db = readDB();
    const hashToDrawings: Record<string, (Drawing & { fileSize?: number; fileHash?: string })[]> = {};
    const stemToDrawings: Record<string, (Drawing & { fileSize?: number; fileHash?: string })[]> = {};

    const handledIds = new Set<string>();
    const groups: DuplicateGroup[] = [];

    // 1. Compute hashes & file sizes
    for (const d of db.drawings) {
      if (!d.imageUrl) continue;
      const fullPath = path.join(process.cwd(), 'public', d.imageUrl.replace(/^\//, ''));
      let hash = '';
      let size = 0;

      if (fs.existsSync(fullPath)) {
        try {
          const buf = fs.readFileSync(fullPath);
          hash = crypto.createHash('sha256').update(buf).digest('hex');
          const stat = fs.statSync(fullPath);
          size = stat.size;
        } catch {}
      }

      const item = { ...d, fileSize: size, fileHash: hash };

      if (hash) {
        if (!hashToDrawings[hash]) hashToDrawings[hash] = [];
        hashToDrawings[hash].push(item);
      }

      if (d.sourceFile) {
        const stem = path.parse(d.sourceFile).name.toLowerCase().trim();
        if (stem) {
          if (!stemToDrawings[stem]) stemToDrawings[stem] = [];
          stemToDrawings[stem].push(item);
        }
      }
    }

    // 2. Collect exact hash duplicate groups
    for (const [hash, list] of Object.entries(hashToDrawings)) {
      if (list.length > 1) {
        const group: DuplicateGroup = {
          groupId: `hash-${hash.slice(0, 10)}`,
          matchType: 'exact_hash',
          reason: 'Абсолютно однаковий вміст файлу (100% точна копія)',
          drawings: list,
        };
        groups.push(group);
        list.forEach((item) => handledIds.add(item.id));
      }
    }

    // 3. Collect stem duplicates (e.g. .jpg vs .jpeg of the same scan if not already grouped by hash)
    for (const [stem, list] of Object.entries(stemToDrawings)) {
      const unhandled = list.filter((item) => !handledIds.has(item.id));
      if (unhandled.length > 1) {
        const group: DuplicateGroup = {
          groupId: `stem-${stem.replace(/\s+/g, '-')}`,
          matchType: 'stem_match',
          reason: `Однакова назва скану (${list[0].sourceFile})`,
          drawings: unhandled,
        };
        groups.push(group);
        unhandled.forEach((item) => handledIds.add(item.id));
      }
    }

    // Total redundant copies (how many can be removed)
    const redundantCount = groups.reduce((acc, g) => acc + (g.drawings.length - 1), 0);

    return NextResponse.json({
      success: true,
      totalGroups: groups.length,
      redundantCount,
      groups,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error finding duplicates:', errorMsg);
    return NextResponse.json({ error: `Помилка пошуку дублікатів: ${errorMsg}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminPin = req.headers.get('x-admin-pin') || '';
    if (!verifyPin(adminPin)) {
      return NextResponse.json({ error: 'Невірний або відсутній PIN-код' }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action as 'auto_clean' | 'delete_ids';
    const db = readDB();

    let idsToDelete: string[] = [];

    if (action === 'delete_ids') {
      idsToDelete = (body.ids as string[]) || [];
    } else if (action === 'auto_clean') {
      let changed = true;
      while (changed) {
        changed = false;
        const hashToDrawings: Record<string, Drawing[]> = {};
        const stemToDrawings: Record<string, Drawing[]> = {};
        const handled = new Set<string>();

        const activeDrawings = db.drawings.filter((d) => !idsToDelete.includes(d.id));

        for (const d of activeDrawings) {
          if (!d.imageUrl) continue;
          const fullPath = path.join(process.cwd(), 'public', d.imageUrl.replace(/^\//, ''));
          if (fs.existsSync(fullPath)) {
            try {
              const buf = fs.readFileSync(fullPath);
              const hash = crypto.createHash('sha256').update(buf).digest('hex');
              if (!hashToDrawings[hash]) hashToDrawings[hash] = [];
              hashToDrawings[hash].push(d);
            } catch {}
          }
          if (d.sourceFile) {
            const stem = path.parse(d.sourceFile).name.toLowerCase().trim();
            if (stem) {
              if (!stemToDrawings[stem]) stemToDrawings[stem] = [];
              stemToDrawings[stem].push(d);
            }
          }
        }

        let newDeletions = 0;
        // Hash duplicates: keep item 0, delete others
        for (const list of Object.values(hashToDrawings)) {
          if (list.length > 1) {
            for (let i = 1; i < list.length; i++) {
              if (!idsToDelete.includes(list[i].id)) {
                idsToDelete.push(list[i].id);
                handled.add(list[i].id);
                newDeletions++;
              }
            }
            handled.add(list[0].id);
          }
        }

        // Stem duplicates: keep item 0, delete others
        for (const list of Object.values(stemToDrawings)) {
          const remaining = list.filter((x) => !handled.has(x.id) && !idsToDelete.includes(x.id));
          if (remaining.length > 1) {
            for (let i = 1; i < remaining.length; i++) {
              idsToDelete.push(remaining[i].id);
              handled.add(remaining[i].id);
              newDeletions++;
            }
            handled.add(remaining[0].id);
          }
        }

        if (newDeletions > 0) {
          changed = true;
        }
      }
    } else {
      return NextResponse.json({ error: 'Невідома дія (action)' }, { status: 400 });
    }

    const deleteSet = new Set(idsToDelete);
    if (deleteSet.size === 0) {
      return NextResponse.json({
        success: true,
        removedCount: 0,
        remainingDrawingsCount: db.drawings.length,
        message: 'Дублікатів для видалення не знайдено',
      });
    }

    // Collect drawings being removed to check whether files can be safely deleted
    const removedDrawings = db.drawings.filter((d) => deleteSet.has(d.id));
    db.drawings = db.drawings.filter((d) => !deleteSet.has(d.id));
    db.comments = db.comments.filter((c) => !deleteSet.has(c.drawingId));

    // Record removed sourceFiles in ignored list so sync never re-imports them
    if (!db.ignoredSyncFiles) db.ignoredSyncFiles = [];
    for (const rd of removedDrawings) {
      if (rd.sourceFile && !db.ignoredSyncFiles.includes(rd.sourceFile)) {
        db.ignoredSyncFiles.push(rd.sourceFile);
      }
    }

    // Save DB
    writeDB(db);

    // Delete unused files from disk
    const remainingUrls = new Set(db.drawings.map((d) => d.imageUrl));
    for (const rd of removedDrawings) {
      if (rd.imageUrl && !remainingUrls.has(rd.imageUrl)) {
        const fullPath = path.join(process.cwd(), 'public', rd.imageUrl.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {
            console.warn(`Could not unlink duplicate file ${fullPath}:`, e);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      removedCount: deleteSet.size,
      remainingDrawingsCount: db.drawings.length,
      removedIds: Array.from(deleteSet),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error resolving duplicates:', errorMsg);
    return NextResponse.json({ error: `Помилка очищення дублікатів: ${errorMsg}` }, { status: 500 });
  }
}
