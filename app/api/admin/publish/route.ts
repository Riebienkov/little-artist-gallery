import { NextRequest, NextResponse } from 'next/server';
import { verifyPin } from '@/lib/db';
import { execSync } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const adminPin = req.headers.get('x-admin-pin') || '';
    if (!verifyPin(adminPin)) {
      return NextResponse.json({ error: 'Невірний або відсутній PIN-код' }, { status: 401 });
    }

    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          error:
            'Ця дія доступна лише на вашому Mac (http://localhost:3000/admin). Завантажуйте малюнки локально та публікуйте на Vercel в 1 клік.',
        },
        { status: 400 }
      );
    }

    try {
      execSync('git add -A && git commit -m "feat(gallery): add new drawings and update database from admin"', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('nothing to commit')) {
        throw e;
      }
    }

    execSync('git push origin main', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      message: '🚀 Усі нові малюнки успішно відправлені на Vercel! Живий сайт оновить їх через 1–2 хвилини.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Помилка публікації на Vercel: ${errorMsg}` },
      { status: 500 }
    );
  }
}
