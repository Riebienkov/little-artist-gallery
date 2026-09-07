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
    let step: number | undefined;

    try {
      const body = await req.json();
      if (typeof body.rotation === 'number') {
        targetRotation = body.rotation;
      } else if (typeof body.step === 'number') {
        step = body.step;
      } else if (body.direction === 'ccw') {
        step = -90;
      } else if (body.direction === 'cw') {
        step = 90;
      } else if (body.direction === '180') {
        step = 180;
      }
    } catch {
      // Empty body defaults to step = 90
      step = 90;
    }

    const newRotation = rotateDrawing(id, targetRotation, step);
    return NextResponse.json({ success: true, rotation: newRotation });
  } catch (err) {
    console.error('Error rotating drawing:', err);
    return NextResponse.json({ error: 'Помилка обертання' }, { status: 500 });
  }
}
