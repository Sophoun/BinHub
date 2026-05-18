import { NextResponse } from "next/server";
import db from "@/src/lib/db";
import { versions, apps, public_links, download_logs } from "@/src/lib/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { stat } from "fs/promises";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const password = searchParams.get("password");
  const type = searchParams.get("type"); // 'original' or 'processed' (default)

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  // 1. Verify link and password
  const linkResult = await db
    .select()
    .from(public_links)
    .where(eq(public_links.token, token))
    .limit(1)
    .all();

  const link = linkResult[0];

  if (!link) {
    return new NextResponse("Invalid link", { status: 404 });
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return new NextResponse("Link expired", { status: 410 });
  }

  if (link.password_hash) {
    if (!password || !(await bcrypt.compare(password, link.password_hash))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  // 2. Get version and app
  const versionResult = await db
    .select()
    .from(versions)
    .where(eq(versions.id, link.version_id))
    .limit(1)
    .all();
  const version = versionResult[0];

  if (!version) {
    return new NextResponse("Version not found", { status: 404 });
  }

  const appResult = await db
    .select()
    .from(apps)
    .where(eq(apps.id, version.app_id))
    .limit(1)
    .all();
  const app = appResult[0];

  if (!app) {
    return new NextResponse("App not found", { status: 404 });
  }

  const useOriginal = type === "original" && version.original_file_path;
  const fileNameToDownload = useOriginal
    ? version.original_file_path!
    : version.file_path;
  const filePath = path.join(
    process.cwd(),
    "data/uploads",
    app.id.toString(),
    fileNameToDownload,
  );

  if (!fs.existsSync(filePath)) {
    return new NextResponse("File not found on server", { status: 404 });
  }

  const fileStat = await stat(filePath);
  const fileStream = fs.createReadStream(filePath);

  // Log download
  try {
    db.insert(download_logs)
      .values({
        version_id: version.id,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      })
      .run();
  } catch (e) {
    console.error("Failed to log download:", e);
  }

  const extension = path.extname(fileNameToDownload);
  const safeName = app.name.replace(/[^a-z0-9]/gi, "_");
  const safeVersion = version.version_number.replace(/[^a-z0-9.]/gi, "_");
  const safeBuild = version.build_number ? `-${version.build_number}` : "";
  const suffix = useOriginal ? "-original" : "";
  const customFilename = `${safeName}-${safeVersion}${safeBuild}${suffix}${extension}`;

  // Content-Type based on extension
  let contentType = "application/octet-stream";
  if (extension === ".apk") {
    contentType = "application/vnd.android.package-archive";
  } else if (extension === ".ipa") {
    contentType = "application/x-itunes-ipa";
  }

  // Use ReadableStream to wrap the Node.js ReadStream for Next.js response
  const stream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(new Uint8Array(Buffer.from(chunk))));
      fileStream.on("end", () => controller.close());
      fileStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      fileStream.destroy();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${customFilename}"`,
      "Content-Length": fileStat.size.toString(),
    },
  });
}
