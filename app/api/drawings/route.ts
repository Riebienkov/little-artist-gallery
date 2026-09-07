import { NextRequest, NextResponse } from 'next/server';
import { getDrawings, addDrawing, getStats } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const drawings = getDrawings();
    const stats = getStats();
    return NextResponse.json({ drawings, stats });
  } catch (err) {
    console.error('Failed to get drawings:', err);
    return NextResponse.json({ error: 'Failed to fetch drawings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const category = (formData.get('category') as string) || 'Малюнки';
    const description = (formData.get('description') as string) || '';
    const dateRaw = formData.get('date') as string | null;
    const date = dateRaw ? dateRaw.trim() : '';
    const imageFile = formData.get('image') as File | null;

    if (!title) {
      return NextResponse.json({ error: 'Вкажіть назву малюнка' }, { status: 400 });
    }

    let imageUrl = '/uploads/demo-cat.svg';

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sanitize extension and filename
      const ext = path.extname(imageFile.name) || '.jpg';
      const safeFilename = `drawing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, safeFilename);
      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/${safeFilename}`;
    }

    const newDrawing = addDrawing({
      title,
      category,
      description,
      date,
      imageUrl,
    });

    return NextResponse.json({ success: true, drawing: newDrawing });
  } catch (err) {
    console.error('Error uploading drawing:', err);
    return NextResponse.json({ error: 'Помилка збереження малюнка' }, { status: 500 });
  }
}
