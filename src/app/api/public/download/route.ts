import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { versions, apps, public_links, download_logs } from '@/src/lib/schema';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const password = searchParams.get('password');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  // 1. Find the public link
  const linkResult = await db.select()
    .from(public_links)
    .where(eq(public_links.token, token))
    .limit(1);

  const link = linkResult[0];

  if (!link) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  // 2. Check expiration
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link has expired' }, { status: 410 });
  }

  // 3. Check password
  if (link.password_hash) {
    if (!password || !(await bcrypt.compare(password, link.password_hash))) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  }

  // 4. Get version and app data
  const versionResult = await db.select({
    version: versions,
    app: apps
  })
  .from(versions)
  .innerJoin(apps, eq(versions.app_id, apps.id))
  .where(eq(versions.id, link.version_id))
  .limit(1);

  const result = versionResult[0];
  if (!result) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  const { version, app } = result;

  // 5. Log download (public)
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await db.insert(download_logs).values({
      version_id: version.id,
      user_id: null, // Public download
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (e) {
    console.error('Failed to log public download:', e);
  }

  // 6. Serve the file
  const filePath = path.join(process.cwd(), 'uploads', version.app_id.toString(), version.file_path);
  const fileBuffer = await readFile(filePath);

  const extension = path.extname(version.file_path);
  const safeAppName = app.name.replace(/[^a-z0-9]/gi, '_');
  const safeVersion = version.version_number.replace(/[^a-z0-9.]/gi, '_');
  const safeBuild = (version.build_number || '1').replace(/[^a-z0-9]/gi, '_');
  
  const customFilename = `${safeAppName}-${safeVersion}-${safeBuild}${extension}`;

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${customFilename}"`,
    },
  });
}
