import { NextRequest, NextResponse } from 'next/server';
import { incrementLike, getStats } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { drawingId } = await req.json();
    if (!drawingId) {
      return NextResponse.json({ error: 'Missing drawingId' }, { status: 400 });
    }

    const newLikes = incrementLike(drawingId);
    const stats = getStats();

    return NextResponse.json({ success: true, likesCount: newLikes, totalStars: stats.totalStars });
  } catch (err) {
    console.error('Error incrementing like:', err);
    return NextResponse.json({ error: 'Failed to add star' }, { status: 500 });
  }
}
