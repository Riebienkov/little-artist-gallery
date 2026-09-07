import { NextRequest, NextResponse } from 'next/server';
import { syncTanjaFolder, getSyncDir } from '@/lib/sync';
import { verifyPin } from '@/lib/db';

export async function GET() {
  try {
    const result = syncTanjaFolder();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMsg, syncDir: getSyncDir() },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const pin = req.headers.get('x-admin-pin') || '';
    if (!verifyPin(pin)) {
      return NextResponse.json({ error: 'Невірний PIN-код' }, { status: 401 });
    }

    const result = syncTanjaFolder();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMsg, syncDir: getSyncDir() },
      { status: 500 }
    );
  }
}
