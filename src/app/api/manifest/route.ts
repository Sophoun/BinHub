/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import db from "@/src/lib/db";
import { versions, api_keys, users } from "@/src/lib/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import { getSession, decrypt } from "@/src/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const versionIdStr = searchParams.get("versionId");
  const token = searchParams.get("token");
  const apiKeyParam = searchParams.get("apiKey");

  let session = await getSession();

  // Fallback to token from query param if session cookie is not present
  if (!session && token) {
    try {
      session = (await decrypt(token)) as any;
    } catch (e) {
      console.error("Invalid token provided in manifest URL");
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
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!versionIdStr) {
    return new NextResponse("Missing versionId", { status: 400 });
  }

  const versionId = parseInt(versionIdStr, 10);
  const versionResult = await db
    .select()
    .from(versions)
    .where(eq(versions.id, versionId))
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

  // Replace {{DOWNLOAD_URL}} with the actual absolute URL
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  let downloadUrl = `${protocol}://${host}/api/download?versionId=${versionId}`;

  // If we used a token for authentication, pass it to the download URL
  if (token) {
    downloadUrl += `&amp;token=${encodeURIComponent(token)}`;
  } else if (apiKeyParam) {
    downloadUrl += `&amp;apiKey=${encodeURIComponent(apiKeyParam)}`;
  }

  manifestContent = manifestContent.replace("{{DOWNLOAD_URL}}", downloadUrl);

  return new NextResponse(manifestContent, {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
