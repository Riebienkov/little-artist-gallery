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

    const drawing = getDrawingById(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Малюнок не знайдено' }, { status: 404 });
    }

    const formData = await req.formData();
    const action = formData.get('action') as string | null;

    // Handle removal of assets
    if (action === 'remove_ai') {
      const updated = updateDrawing(id, { derivedImages: [] });
      return NextResponse.json({ success: true, drawing: updated });
    }

    if (action === 'remove_video') {
      const updated = updateDrawing(id, { videoUrl: '' });
      return NextResponse.json({ success: true, drawing: updated });
    }

    const aiFile = formData.get('aiImage') as File | null;
    const videoFile = formData.get('video') as File | null;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const updates: { derivedImages?: string[]; videoUrl?: string } = {};

    // 1. Process AI image upload if provided
    if (aiFile && aiFile.size > 0) {
      const bytes = await aiFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(aiFile.name).toLowerCase() || '.png';
      const filename = `derived-ai-${id}-${Date.now().toString().slice(-5)}${ext}`;
      const destPath = path.join(uploadDir, filename);

      fs.writeFileSync(destPath, buffer);
      updates.derivedImages = [`/uploads/${filename}`];
    }

    // 2. Process Video upload if provided
    if (videoFile && videoFile.size > 0) {
      const bytes = await videoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(videoFile.name).toLowerCase() || '.mp4';
      const filename = `derived-vid-${id}-${Date.now().toString().slice(-5)}${ext}`;
      const destPath = path.join(uploadDir, filename);

      fs.writeFileSync(destPath, buffer);
      updates.videoUrl = `/uploads/${filename}`;
    }

    const updated = updateDrawing(id, updates);
    return NextResponse.json({ success: true, drawing: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to upload media:', err);
    return NextResponse.json({ error: `Помилка завантаження: ${errorMsg}` }, { status: 500 });
  }
}
