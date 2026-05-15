import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signatureData } = body;

    if (!signatureData) {
      return NextResponse.json({ error: 'No signature data provided' }, { status: 400 });
    }

    let settings = await db.companySettings.findFirst();

    if (settings) {
      settings = await db.companySettings.update({
        where: { id: settings.id },
        data: { signatureData },
      });
    } else {
      settings = await db.companySettings.create({
        data: { companyName: 'Black94', signatureData },
      });
    }

    return NextResponse.json({ success: true, signatureData: settings.signatureData });
  } catch {
    return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const settings = await db.companySettings.findFirst();
    return NextResponse.json({ signatureData: settings?.signatureData || null });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch signature' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const settings = await db.companySettings.findFirst();
    if (settings) {
      await db.companySettings.update({
        where: { id: settings.id },
        data: { signatureData: null },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete signature' }, { status: 500 });
  }
}
