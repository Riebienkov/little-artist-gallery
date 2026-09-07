import { NextRequest, NextResponse } from 'next/server';
import { getDrawingById, updateDrawing, verifyPin } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pin = req.headers.get('x-admin-pin') || '';

    if (!verifyPin(pin)) {
      return NextResponse.json({ error: 'Невірний PIN-код' }, { status: 401 });
    }

    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          error:
            'На хмарному хостингу Vercel диск захищено від запису (read-only). Будь ласка, зберігайте відредаговані малюнки на вашому Mac (http://localhost:3000/admin) та натисніть «🚀 Опублікувати на Vercel».',
        },
        { status: 400 }
      );
    }

    const drawing = getDrawingById(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Малюнок не знайдено' }, { status: 404 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const frameStyle = (formData.get('frameStyle') as string) || drawing.frameStyle || 'none';
    const rotationRaw = formData.get('rotation');
    const rotation = rotationRaw !== null ? Number(rotationRaw) : 0;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: 'Зображення не передано' }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFilename = `tanja-art-${id}-${Date.now().toString().slice(-4)}.jpg`;
    const filePath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(filePath, buffer);

    // Clean up previous edited image if it was created by the editor
    const oldImageUrl = drawing.imageUrl;
    if (oldImageUrl && (oldImageUrl.includes('tanja-art-') || oldImageUrl.includes('tanja-crop-'))) {
      const oldPath = path.join(process.cwd(), 'public', oldImageUrl.replace(/^\//, ''));
      try {
        if (fs.existsSync(oldPath) && oldPath !== filePath) {
          fs.unlinkSync(oldPath);
        }
      } catch (e) {
        console.error('Error cleaning up previous edit file:', e);
      }
    }

    const updated = updateDrawing(id, {
      imageUrl: `/uploads/${safeFilename}`,
      rotation: isNaN(rotation) ? 0 : rotation,
      frameStyle: frameStyle as 'gold-museum' | 'gold-royal' | 'gold-classic' | 'none',
    });

    return NextResponse.json({ success: true, drawing: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error saving edited image:', msg);
    return NextResponse.json({ error: `Помилка збереження зображення: ${msg}` }, { status: 500 });
  }
}
