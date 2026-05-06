import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { versions } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const versionIdStr = searchParams.get('versionId');

  if (!versionIdStr) {
    return NextResponse.json({ error: 'Missing versionId' }, { status: 400 });
  }

  const versionId = parseInt(versionIdStr, 10);
  const versionResult = await db.select().from(versions).where(eq(versions.id, versionId)).limit(1);
  const version = versionResult[0];

  if (!version || !version.manifest_path) {
    return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'uploads', version.app_id.toString(), version.manifest_path);
  let manifestContent = await readFile(filePath, 'utf-8');

  // Inject the actual download URL
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host');
  const downloadUrl = `${protocol}://${host}/api/download?versionId=${versionId}`;
  
  manifestContent = manifestContent.replace('{{DOWNLOAD_URL}}', downloadUrl);

  return new NextResponse(manifestContent, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

