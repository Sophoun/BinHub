import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Converts an Android App Bundle (.aab) to a universal APK (.apk)
 * using bundletool.
 * 
 * @param aabPath Path to the uploaded .aab file
 * @returns Path to the generated universal .apk file
 */
export async function convertAabToApk(aabPath: string): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `bundletool-${uuidv4()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  const bundletoolPath = path.join(process.cwd(), 'bin', 'bundletool.jar');
  const apksPath = path.join(tempDir, 'output.apks');
  const universalApkName = 'universal.apk';

  try {
    // 1. Generate .apks file with universal mode
    const buildCommand = `java -jar "${bundletoolPath}" build-apks --bundle="${aabPath}" --output="${apksPath}" --mode=universal`;
    await execPromise(buildCommand);

    // 2. Unzip the .apks (which is just a zip file) to get universal.apk
    const unzipCommand = `unzip "${apksPath}" -d "${tempDir}"`;
    await execPromise(unzipCommand);

    const generatedApkPath = path.join(tempDir, universalApkName);
    
    if (!fs.existsSync(generatedApkPath)) {
      throw new Error('Universal APK not found in generated .apks');
    }

    return generatedApkPath;
  } catch (error) {
    console.error('AAB conversion failed:', error);
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
    throw new Error(`Failed to convert AAB to APK: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Shared logic for processing an uploaded file (APK, IPA, or AAB).
 * Handles AAB conversion and metadata extraction.
 */
export async function processUploadedFile(
  file: File, 
  appId: number, 
  platform: string
): Promise<{
  filePath: string;
  originalFilePath?: string;
  fileExt: string;
  originalBuffer: Buffer;
  tempProcessedPath?: string;
  tempOriginalPath?: string;
}> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  let fileExt = path.extname(file.name).toLowerCase().replace('.', '');
  let currentFilePath = path.join(os.tmpdir(), `${uuidv4()}.${fileExt}`);
  
  await fs.promises.writeFile(currentFilePath, buffer);
  
  let tempProcessedPath: string | undefined;
  let tempOriginalPath: string | undefined;

  // Handle AAB conversion
  if (platform === 'android' && fileExt === 'aab') {
    try {
      tempOriginalPath = currentFilePath;
      const apkPath = await convertAabToApk(currentFilePath);
      tempProcessedPath = apkPath;
      
      // For Android AAB, the main installation file is now the converted APK
      // but we keep the original AAB path to save it later.
      return {
        filePath: apkPath,
        originalFilePath: currentFilePath,
        fileExt: 'apk', // Metadata extraction should use the APK
        originalBuffer: buffer,
        tempProcessedPath: apkPath,
        tempOriginalPath: currentFilePath
      };
    } catch (e) {
      if (fs.existsSync(currentFilePath)) await fs.promises.unlink(currentFilePath);
      throw e;
    }
  }

  return {
    filePath: currentFilePath,
    fileExt,
    originalBuffer: buffer,
    tempProcessedPath: currentFilePath
  };
}
