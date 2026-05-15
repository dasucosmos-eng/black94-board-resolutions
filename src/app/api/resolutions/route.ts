import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const resolutions = await db.boardResolution.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(resolutions);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch resolutions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resolution = await db.boardResolution.create({
      data: {
        resolutionNumber: body.resolutionNumber,
        title: body.title,
        date: body.date,
        venue: body.venue || null,
        preamble: body.preamble || null,
        resolvedText: body.resolvedText,
        resolvedBy: body.resolvedBy || null,
        secondedBy: body.secondedBy || null,
        authorityName: body.authorityName || null,
        authorityTitle: body.authorityTitle || null,
        status: body.status || 'draft',
      },
    });
    return NextResponse.json(resolution, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create resolution' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    await db.boardResolution.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete resolution' }, { status: 500 });
  }
}
