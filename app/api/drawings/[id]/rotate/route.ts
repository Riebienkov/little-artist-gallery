import { NextRequest, NextResponse } from 'next/server';
import { rotateDrawing, verifyPin } from '@/lib/db';

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

    let targetRotation: number | undefined;
    try {
      const body = await req.json();
      targetRotation = body.rotation;
    } catch {
      // Empty body is fine, defaults to +90 deg
    }

    const newRotation = rotateDrawing(id, targetRotation);
    return NextResponse.json({ success: true, rotation: newRotation });
  } catch (err) {
    console.error('Error rotating drawing:', err);
    return NextResponse.json({ error: 'Помилка обертання' }, { status: 500 });
  }
}
