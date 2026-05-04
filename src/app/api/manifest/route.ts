import { NextResponse } from 'next/server';
import db, { Version } from '@/src/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get('versionId');

  if (!versionId) {
    return NextResponse.json({ error: 'Missing versionId' }, { status: 400 });
  }

  const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(versionId) as Version | undefined;
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
