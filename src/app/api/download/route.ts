import { NextResponse } from "next/server";
import db from "@/src/lib/db";
import { versions, user_apps, apps, download_logs } from "@/src/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/src/lib/auth";
import { readFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const versionIdStr = searchParams.get("versionId");
  const type = searchParams.get("type"); // 'original' or 'processed'

  if (!versionIdStr) {
    return NextResponse.json({ error: "Missing versionId" }, { status: 400 });
  }

  const versionId = parseInt(versionIdStr, 10);
  const versionResult = await db
    .select({
      version: versions,
      app: apps,
    })
    .from(versions)
    .innerJoin(apps, eq(versions.app_id, apps.id))
    .where(eq(versions.id, versionId))
    .limit(1);

  const result = versionResult[0];

  if (!result) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const { version, app } = result;

  // Check if user has access to this app
  if (session.user.role !== "admin") {
    const access = await db
      .select({ id: user_apps.user_id })
      .from(user_apps)
      .where(
        and(
          eq(user_apps.user_id, session.user.id),
          eq(user_apps.app_id, version.app_id),
        ),
      )
      .limit(1);

    if (access.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Log download for analytics
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await db.insert(download_logs).values({
      version_id: versionId,
      user_id: session.user.id,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (e) {
    console.error("Failed to log download:", e);
  }

  const useOriginal = type === "original" && version.original_file_path;
  const fileNameToDownload = useOriginal
    ? version.original_file_path!
    : version.file_path;
  const filePath = path.join(
    process.cwd(),
    "uploads",
    version.app_id.toString(),
    fileNameToDownload,
  );

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "File not found on server" },
      { status: 404 },
    );
  }

  const fileBuffer = await readFile(filePath);

  // Construct the new filename: AppName-Version-BuildNumber.extension
  const extension = path.extname(fileNameToDownload);
  const safeAppName = app.name.replace(/[^a-z0-9]/gi, "_");
  const safeVersion = version.version_number.replace(/[^a-z0-9.]/gi, "_");
  const safeBuild = (version.build_number || "1").replace(/[^a-z0-9]/gi, "_");
  const suffix = useOriginal ? "-original" : "";

  const customFilename = `${safeAppName}-${safeVersion}-${safeBuild}${suffix}${extension}`;

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${customFilename}"`,
    },
  });
}
