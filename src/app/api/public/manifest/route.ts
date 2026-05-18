import { NextResponse } from "next/server";
import db from "@/src/lib/db";
import { versions, public_links } from "@/src/lib/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const password = searchParams.get("password");

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

  // 2. Get version
  const versionResult = await db
    .select()
    .from(versions)
    .where(eq(versions.id, link.version_id))
    .limit(1)
    .all();
  const version = versionResult[0];

  if (!version || !version.manifest_path) {
    return new NextResponse("Manifest not found", { status: 404 });
  }

  const filePath = path.join(
    process.cwd(),
    "data/uploads",
    version.app_id.toString(),
    version.manifest_path,
  );
  let manifestContent = (await readFile(filePath)).toString();

  // 3. Inject the ACTUAL public download URL
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const downloadUrl = `${protocol}://${host}/api/public/download?token=${token}&password=${encodeURIComponent(password || "")}`;

  manifestContent = manifestContent.replace("{{DOWNLOAD_URL}}", downloadUrl);

  return new Response(manifestContent, {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
