import { NextRequest, NextResponse } from 'next/server';
import { verifyPin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin) {
      return NextResponse.json({ error: 'Введіть PIN-код' }, { status: 400 });
    }

    const isValid = verifyPin(pin);
    return NextResponse.json({ valid: isValid });
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Помилка авторизації' }, { status: 500 });
  }
}
