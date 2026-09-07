import { NextRequest, NextResponse } from 'next/server';
import { deleteDrawing, updateDrawing, verifyPin } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pin = req.headers.get('x-admin-pin') || '';

    if (!verifyPin(pin)) {
      return NextResponse.json({ error: 'Невірний PIN-код адміністратора' }, { status: 401 });
    }

    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          error:
            'На хмарному хостингу Vercel файлова система захищена від запису (read-only). Будь ласка, видаляйте малюнки через локальну панель на вашому Mac (http://localhost:3000/admin) та натисніть «🚀 Опублікувати на Vercel».',
        },
        { status: 400 }
      );
    }

    const success = deleteDrawing(id);
    if (!success) {
      return NextResponse.json({ error: 'Малюнок не знайдено' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting drawing:', err);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pin = req.headers.get('x-admin-pin') || '';

    if (!verifyPin(pin)) {
      return NextResponse.json({ error: 'Невірний PIN-код' }, { status: 401 });
    }

    const body = await req.json();
    const updated = updateDrawing(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Малюнок не знайдено' }, { status: 404 });
    }

    return NextResponse.json({ success: true, drawing: updated });
  } catch (err) {
    console.error('Error updating drawing:', err);
    return NextResponse.json({ error: 'Помилка оновлення' }, { status: 500 });
  }
}
