import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stampData } = body;

    if (!stampData) {
      return NextResponse.json({ error: 'No stamp data provided' }, { status: 400 });
    }

    let settings = await db.companySettings.findFirst();

    if (settings) {
      settings = await db.companySettings.update({
        where: { id: settings.id },
        data: { stampData },
      });
    } else {
      settings = await db.companySettings.create({
        data: { companyName: 'Black94', stampData },
      });
    }

    return NextResponse.json({ success: true, stampData: settings.stampData });
  } catch {
    return NextResponse.json({ error: 'Failed to save stamp' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const settings = await db.companySettings.findFirst();
    return NextResponse.json({ stampData: settings?.stampData || null });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stamp' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const settings = await db.companySettings.findFirst();
    if (settings) {
      await db.companySettings.update({
        where: { id: settings.id },
        data: { stampData: null },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete stamp' }, { status: 500 });
  }
}
