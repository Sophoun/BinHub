import { NextResponse } from 'next/server';
import db, { Version } from '@/src/lib/db';
import { getSession } from '@/src/lib/auth';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get('versionId');

  if (!versionId) {
    return NextResponse.json({ error: 'Missing versionId' }, { status: 400 });
  }

  const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(versionId) as Version | undefined;
  if (!version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  // Check if user has access to this app
  if (session.user.role !== 'admin') {
    const access = db.prepare('SELECT 1 FROM user_apps WHERE user_id = ? AND app_id = ?').get(session.user.id, version.app_id);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const filePath = path.join(process.cwd(), 'uploads', version.app_id.toString(), version.file_path);
  const fileBuffer = await readFile(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${version.file_path}"`,
    },
  });
}
