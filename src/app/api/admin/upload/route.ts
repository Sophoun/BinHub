import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { apps, versions } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/src/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AppInfoParser from 'app-info-parser';
import fs from 'fs';
import { triggerWebhooks, enforceRetentionPolicy } from '@/src/lib/actions';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const appIdStr = formData.get('appId') as string;
    const manualVersion = formData.get('versionNumber') as string;
    const manualBuild = formData.get('buildNumber') as string;
    const changelog = formData.get('changelog') as string;

    if (!file || !appIdStr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appId = parseInt(appIdStr, 10);
    const app = await db.query.apps.findFirst({
      where: eq(apps.id, appId)
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = path.extname(file.name).toLowerCase().replace('.', '');
    const fileName = `${uuidv4()}.${fileExt}`;
    const uploadDir = path.join(process.cwd(), 'uploads', appId.toString());
    
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Automated Metadata Extraction
    let extractedVersion = manualVersion;
    let extractedBuild = manualBuild;
    let extractedPackage = app.package_name;
    let extractedName = app.name;

    try {
      const parser = new AppInfoParser(filePath);
      const info = await parser.parse();
      
      if (app.platform === 'android') {
        extractedVersion = info.versionName || manualVersion;
        extractedBuild = info.versionCode?.toString() || manualBuild;
        extractedPackage = info.package || app.package_name;
        extractedName = info.application?.label?.[0] || app.name;
      } else if (app.platform === 'ios') {
        extractedVersion = info.CFBundleShortVersionString || manualVersion;
        extractedBuild = info.CFBundleVersion || manualBuild;
        extractedPackage = info.CFBundleIdentifier || app.package_name;
        extractedName = info.CFBundleDisplayName || info.CFBundleName || app.name;
      }

      // Auto-update app icon if found in binary
      if (info.icon) {
        const iconBuffer = Buffer.from(info.icon.split(',')[1], 'base64');
        const iconName = `icon.png`;
        const iconPath = path.join(uploadDir, iconName);
        await writeFile(iconPath, iconBuffer);
        await db.update(apps).set({ icon_path: iconName, updated_at: new Date().toISOString() }).where(eq(apps.id, appId));
      }
      
      // Sync app details if they changed
      if (extractedPackage !== app.package_name || extractedName !== app.name) {
        await db.update(apps).set({ 
          package_name: extractedPackage, 
          name: extractedName,
          updated_at: new Date().toISOString()
        }).where(eq(apps.id, appId));
      }
    } catch (e) {
      console.error('Metadata extraction failed:', e);
      if (!manualVersion) {
        // Clean up uploaded file on failure
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return NextResponse.json({ error: 'Failed to extract metadata and no manual version provided' }, { status: 400 });
      }
    }

    let manifestPath = null;
    if (app.platform === 'ios' && (fileExt === 'ipa')) {
      const manifestName = `${uuidv4()}.plist`;
      const manifestContent = generateIosManifest(extractedPackage, extractedVersion, extractedName);
      const mPath = path.join(uploadDir, manifestName);
      await writeFile(mPath, manifestContent);
      manifestPath = manifestName;
    }

    await db.insert(versions).values({
      app_id: appId,
      version_number: extractedVersion,
      build_number: extractedBuild || null,
      file_path: fileName,
      manifest_path: manifestPath,
      changelog: changelog || null,
    });

    // Update app's updatedAt
    await db.update(apps).set({ updated_at: new Date().toISOString() }).where(eq(apps.id, appId));

    // Background tasks
    triggerWebhooks('new_version', {
      app_name: extractedName,
      version: extractedVersion,
      build: extractedBuild,
      platform: app.platform,
      changelog: changelog
    }).catch(e => console.error('Webhook error:', e));

    enforceRetentionPolicy(appId).catch(e => console.error('Retention policy error:', e));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function generateIosManifest(bundleId: string, version: string, title: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
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
        <string>${bundleId}</string>
        <key>bundle-version</key>
        <string>${version}</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>${title}</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>`;
}
