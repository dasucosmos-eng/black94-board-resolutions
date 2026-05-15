import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let settings = await db.companySettings.findFirst();
    if (!settings) {
      settings = await db.companySettings.create({
        data: { companyName: 'Black94' },
      });
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const existing = await db.companySettings.findFirst();
    
    if (existing) {
      const updated = await db.companySettings.update({
        where: { id: existing.id },
        data: {
          companyName: body.companyName ?? existing.companyName,
          address: body.address ?? existing.address,
          phone: body.phone ?? existing.phone,
          email: body.email ?? existing.email,
          cin: body.cin ?? existing.cin,
          authorityName: body.authorityName ?? existing.authorityName,
          authorityTitle: body.authorityTitle ?? existing.authorityTitle,
        },
      });
      return NextResponse.json(updated);
    } else {
      const created = await db.companySettings.create({
        data: {
          companyName: body.companyName ?? 'Black94',
          address: body.address,
          phone: body.phone,
          email: body.email,
          cin: body.cin,
          authorityName: body.authorityName,
          authorityTitle: body.authorityTitle,
        },
      });
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
