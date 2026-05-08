import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { apps } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appIdStr = searchParams.get('appId');

  if (!appIdStr) {
    return new NextResponse('Missing appId', { status: 400 });
  }

  const appId = parseInt(appIdStr, 10);
  const appResult = await db.select().from(apps).where(eq(apps.id, appId)).limit(1);
  const app = appResult[0];

  if (!app || !app.icon_path) {
    // Return a default icon or 404
    return new NextResponse('Icon not found', { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'uploads', app.id.toString(), app.icon_path);
  
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Icon file not found', { status: 404 });
  }

  const fileBuffer = await readFile(filePath);
  const extension = path.extname(app.icon_path).toLowerCase();
  let contentType = 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') contentType = 'image/jpeg';
  if (extension === '.svg') contentType = 'image/svg+xml';
  if (extension === '.webp') contentType = 'image/webp';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
