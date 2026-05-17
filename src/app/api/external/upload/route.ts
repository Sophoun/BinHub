import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { apps, versions, api_keys, users } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir, unlink, copyFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AppInfoParser from 'app-info-parser';
import fs from 'fs';
import { triggerWebhooks, enforceRetentionPolicy } from '@/src/lib/actions';
import { processUploadedFile } from '@/src/lib/upload-utils';

export async function POST(request: Request) {
  let tempProcessedPath: string | undefined;
  let tempOriginalPath: string | undefined;
  try {
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    // Verify API Key
    const keyResult = await db.select({
      userId: api_keys.user_id,
      userRole: users.role
    })
    .from(api_keys)
    .innerJoin(users, eq(api_keys.user_id, users.id))
    .where(eq(api_keys.key, apiKey))
    .limit(1)
    .all();

    const keyInfo = keyResult[0];

    if (!keyInfo) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    // Only admins can upload via API Key for now
    if (keyInfo.userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
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

    // Process file (AAB to APK conversion if needed)
    const processed = await processUploadedFile(file, appId, app.platform);
    tempProcessedPath = processed.tempProcessedPath;
    tempOriginalPath = processed.tempOriginalPath;

    const fileExt = processed.fileExt;
    const fileName = `${uuidv4()}.${fileExt}`;
    const uploadDir = path.join(process.cwd(), 'uploads', appId.toString());
    
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const finalFilePath = path.join(uploadDir, fileName);
    
    // Save processed file (APK/IPA)
    await copyFile(processed.filePath, finalFilePath);
    await unlink(processed.filePath);

    // Save original file if it was converted (e.g., .aab)
    let originalFileName = null;
    if (processed.originalFilePath) {
      const origExt = path.extname(processed.originalFilePath).replace('.', '');
      originalFileName = `${uuidv4()}.${origExt}`;
      const finalOriginalPath = path.join(uploadDir, originalFileName);
      await copyFile(processed.originalFilePath, finalOriginalPath);
      await unlink(processed.originalFilePath);
    }
    
    // Cleanup conversion directory if needed
    if (tempProcessedPath && tempProcessedPath !== processed.filePath) {
       try {
         const tempDir = path.dirname(tempProcessedPath);
         if (tempDir.includes('bundletool-')) {
           await fs.promises.rm(tempDir, { recursive: true, force: true });
         }
       } catch (e) {}
    }

    // Automated Metadata Extraction (always from processed file - APK/IPA)
    let extractedVersion = manualVersion;
    let extractedBuild = manualBuild;
    let extractedPackage = app.package_name;
    let extractedName = app.name;

    try {
      const parser = new AppInfoParser(finalFilePath);
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
        if (fs.existsSync(finalFilePath)) await unlink(finalFilePath);
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
      original_file_path: originalFileName,
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

    return NextResponse.json({ 
      success: true, 
      version: extractedVersion, 
      build: extractedBuild,
      app: extractedName
    });
  } catch (error) {
    console.error('External upload error:', error);
    if (tempProcessedPath && fs.existsSync(tempProcessedPath)) {
      try {
        const tempDir = path.dirname(tempProcessedPath);
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (e) {}
    }
    if (tempOriginalPath && fs.existsSync(tempOriginalPath)) {
      try { await unlink(tempOriginalPath); } catch (e) {}
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
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
