/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import db from "@/src/lib/db";
import {
  versions,
  user_apps,
  apps,
  download_logs,
  group_apps,
  user_groups,
  api_keys,
  users,
} from "@/src/lib/schema";
import { eq, and, or } from "drizzle-orm";
import { getSession, decrypt } from "@/src/lib/auth";
import path from "path";
import fs from "fs";
import { stat } from "fs/promises";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const versionIdStr = searchParams.get("versionId");
  const type = searchParams.get("type"); // 'original' or 'processed'
  const token = searchParams.get("token");
  const apiKeyParam = searchParams.get("apiKey");

  let session = await getSession();

  // Fallback to token from query param if session cookie is not present
  if (!session && token) {
    try {
      session = (await decrypt(token)) as any;
    } catch (e) {
      console.error("Invalid token provided in download URL");
    }
  }

  // Fallback to API Key from query param
  if (!session && apiKeyParam) {
    const keyResult = await db
      .select({
        user: {
          id: users.id,
          username: users.username,
          role: users.role,
        },
      })
      .from(api_keys)
      .innerJoin(users, eq(api_keys.user_id, users.id))
      .where(eq(api_keys.key, apiKeyParam))
      .limit(1)
      .all();

    if (keyResult[0]) {
      session = { user: keyResult[0].user };
    }
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Check if user has access to this app (Direct or via Group)
  if (session.user.role !== "admin") {
    const userId = session.user.id;

    // Check direct assignment or group assignment
    const access = await db
      .select({ id: apps.id })
      .from(apps)
      .leftJoin(user_apps, eq(apps.id, user_apps.app_id))
      .leftJoin(group_apps, eq(apps.id, group_apps.app_id))
      .leftJoin(user_groups, eq(group_apps.group_id, user_groups.group_id))
      .where(
        and(
          eq(apps.id, version.app_id),
          or(eq(user_apps.user_id, userId), eq(user_groups.user_id, userId)),
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

    db.insert(download_logs)
      .values({
        version_id: versionId,
        user_id: session.user.id,
        ip_address: ip,
        user_agent: userAgent,
      })
      .run();
  } catch (e) {
    console.error("Failed to log download:", e);
  }

  const useOriginal = type === "original" && version.original_file_path;
  const fileNameToDownload = useOriginal
    ? version.original_file_path!
    : version.file_path;
  const filePath = path.join(
    process.cwd(),
    "data/uploads",
    version.app_id.toString(),
    fileNameToDownload,
  );

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "File not found on server" },
      { status: 404 },
    );
  }

  const fileStat = await stat(filePath);
  const fileStream = fs.createReadStream(filePath);

  // Construct the new filename: AppName-Version-BuildNumber.extension
  const extension = path.extname(fileNameToDownload);
  const safeAppName = app.name.replace(/[^a-z0-9]/gi, "_");
  const safeVersion = version.version_number.replace(/[^a-z0-9.]/gi, "_");
  const safeBuild = (version.build_number || "1").replace(/[^a-z0-9]/gi, "_");
  const suffix = useOriginal ? "-original" : "";

  const customFilename = `${safeAppName}-${safeVersion}-${safeBuild}${suffix}${extension}`;

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
      fileStream.on("data", (chunk) =>
        controller.enqueue(new Uint8Array(Buffer.from(chunk))),
      );
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
