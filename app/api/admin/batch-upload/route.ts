import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, Drawing, verifyPin } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const adminPin = req.headers.get('x-admin-pin') || '';
    if (!verifyPin(adminPin)) {
      return NextResponse.json({ error: 'Невірний або відсутній PIN-код' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const category = (formData.get('category') as string) || 'Малюнки';
    const dateRaw = formData.get('date') as string | null;
    const date = dateRaw ? dateRaw.trim() : '';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Не вибрано жодного файлу для завантаження' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const db = readDB();

    // Compute hashes of existing drawings to prevent duplicates during batch upload
    const existingHashes = new Set<string>();
    for (const d of db.drawings) {
      if (!d.imageUrl) continue;
      const fullPath = path.join(process.cwd(), 'public', d.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) {
        try {
          const buf = fs.readFileSync(fullPath);
          const hash = crypto.createHash('sha256').update(buf).digest('hex');
          existingHashes.add(hash);
        } catch {}
      }
    }

    let addedCount = 0;
    let skippedCount = 0;
    const addedList: { id: string; title: string; filename: string }[] = [];
    const skippedList: { filename: string; reason: string }[] = [];

    // Process each file
    for (const file of files) {
      if (!file || file.size === 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

      if (existingHashes.has(fileHash)) {
        skippedCount++;
        skippedList.push({ filename: file.name, reason: 'Вже є в галереї (ідентичний вміст)' });
        continue;
      }

      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const cleanStem = path.parse(file.name).name.replace(/[_\-]+/g, ' ').trim();
      const destFilename = `tanja-batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${ext}`;
      const destPath = path.join(uploadDir, destFilename);

      fs.writeFileSync(destPath, buffer);
      existingHashes.add(fileHash);

      // Pretty title from file name
      let title = cleanStem || `Малюнок Тані`;
      if (/^без названия/i.test(title)) {
        const matchNum = title.match(/\d+/);
        title = matchNum ? `Малюнок №${matchNum[0]} (Таня)` : `Малюнок Тані`;
      }

      const newDrawing: Drawing = {
        id: `drawing-batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        date,
        category,
        description: `Завантажено з батьківського кабінету 🎨`,
        imageUrl: `/uploads/${destFilename}`,
        sourceFile: file.name,
        rotation: 0,
        derivedImages: [],
        videoUrl: '',
        likesCount: 0,
        createdAt: new Date().toISOString(),
      };

      db.drawings.unshift(newDrawing);
      addedCount++;
      addedList.push({ id: newDrawing.id, title: newDrawing.title, filename: file.name });
    }

    if (addedCount > 0) {
      writeDB(db);
    }

    return NextResponse.json({
      success: true,
      addedCount,
      skippedCount,
      totalProcessed: files.length,
      added: addedList,
      skipped: skippedList,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error during batch upload:', errorMsg);
    if (errorMsg.includes('EROFS') || errorMsg.includes('read-only')) {
      return NextResponse.json(
        {
          error:
            'На хмарному хостингу Vercel системний диск захищений від запису (Serverless Read-Only). Будь ласка, відкрийте локальну адмінку на Mac (http://localhost:3000/admin), завантажте малюнки там та натисніть «Опублікувати на Vercel»! 🚀',
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: `Помилка пакетного завантаження: ${errorMsg}` }, { status: 500 });
  }
}
