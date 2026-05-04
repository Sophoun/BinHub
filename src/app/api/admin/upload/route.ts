import { NextResponse } from 'next/server';
import db, { App } from '@/src/lib/db';
import { getSession } from '@/src/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const appId = formData.get('appId') as string;
  const versionNumber = formData.get('versionNumber') as string;
  const buildNumber = formData.get('buildNumber') as string;
  const changelog = formData.get('changelog') as string;

  if (!file || !appId || !versionNumber) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(appId) as App | undefined;
  if (!app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const uploadDir = path.join(process.cwd(), 'uploads', appId);
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  let manifestPath = null;
  if (app.platform === 'ios' && fileExt === 'ipa') {
    const manifestName = `${uuidv4()}.plist`;
    const manifestContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key>
          <string>software-package</string>
          <key>url</key>
          <string>{{DOWNLOAD_URL}}</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key>
        <string>${app.package_name}</string>
        <key>bundle-version</key>
        <string>${versionNumber}</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>${app.name}</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>`;
    const mPath = path.join(uploadDir, manifestName);
    await writeFile(mPath, manifestContent);
    manifestPath = manifestName;
  }

  db.prepare(`
    INSERT INTO versions (app_id, version_number, build_number, file_path, manifest_path, changelog)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(appId, versionNumber, buildNumber, fileName, manifestPath, changelog);

  return NextResponse.json({ success: true });
}
