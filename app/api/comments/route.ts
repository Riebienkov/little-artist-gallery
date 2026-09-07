import { NextRequest, NextResponse } from 'next/server';
import { getComments, addComment, updateCommentStatus, deleteComment, verifyPin } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const drawingId = searchParams.get('drawingId') || undefined;
    const includePending = searchParams.get('includePending') === 'true';

    const comments = getComments(drawingId, includePending);
    return NextResponse.json({ comments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drawingId, author, sticker, text } = body;

    if (!drawingId || !author) {
      return NextResponse.json({ error: 'Вкажіть автора' }, { status: 400 });
    }

    if (!text && !sticker) {
      return NextResponse.json({ error: 'Додайте текст або наліпку' }, { status: 400 });
    }

    const comment = addComment({
      drawingId,
      author: author.trim().slice(0, 50),
      sticker: sticker || '',
      text: (text || '').trim().slice(0, 300),
    });

    return NextResponse.json({ 
      success: true, 
      comment,
      message: 'Ваше тепле побажання надіслано! Воно з’явиться після швидкої перевірки.'
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    return NextResponse.json({ error: 'Помилка збереження коментаря' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const pin = req.headers.get('x-admin-pin') || '';
    if (!verifyPin(pin)) {
      return NextResponse.json({ error: 'Невірний PIN-код' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || (status !== 'approved' && status !== 'pending')) {
      return NextResponse.json({ error: 'Невірні параметри' }, { status: 400 });
    }

    const updated = updateCommentStatus(id, status);
    return NextResponse.json({ success: updated });
  } catch (err) {
    console.error('Error updating comment:', err);
    return NextResponse.json({ error: 'Помилка оновлення статусу' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const pin = req.headers.get('x-admin-pin') || '';
    if (!verifyPin(pin)) {
      return NextResponse.json({ error: 'Невірний PIN-код' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID обов’язковий' }, { status: 400 });
    }

    const deleted = deleteComment(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 });
  }
}
