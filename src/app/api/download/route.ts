import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { versions, user_apps } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/src/lib/auth';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const versionIdStr = searchParams.get('versionId');

  if (!versionIdStr) {
    return NextResponse.json({ error: 'Missing versionId' }, { status: 400 });
  }

  const versionId = parseInt(versionIdStr, 10);
  const versionResult = await db.select().from(versions).where(eq(versions.id, versionId)).limit(1);
  const version = versionResult[0];

  if (!version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  // Check if user has access to this app
  if (session.user.role !== 'admin') {
    const access = await db.select({ id: user_apps.user_id })
      .from(user_apps)
      .where(and(eq(user_apps.user_id, session.user.id), eq(user_apps.app_id, version.app_id)))
      .limit(1);
      
    if (access.length === 0) {
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

