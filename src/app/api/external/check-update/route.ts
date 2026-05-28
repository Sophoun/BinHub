/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import db from "@/src/lib/db";
import { apps, versions, api_keys, users } from "@/src/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = request.headers.get("X-API-Key");
    const appIdStr = searchParams.get("appId");
    const packageName = searchParams.get("packageName");
    const platform = searchParams.get("platform") as "android" | "ios" | null;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    if (!appIdStr && !packageName) {
      return NextResponse.json(
        { error: "Missing appId or packageName" },
        { status: 400 },
      );
    }

    // 1. Verify API Key
    const keyResult = await db
      .select({
        userId: api_keys.user_id,
        userRole: users.role,
      })
      .from(api_keys)
      .innerJoin(users, eq(api_keys.user_id, users.id))
      .where(eq(api_keys.key, apiKey))
      .limit(1)
      .all();

    if (!keyResult[0]) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    // 2. Find the Application
    let app: any = null;

    if (appIdStr) {
      const appId = parseInt(appIdStr, 10);
      const appResult = await db
        .select()
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1)
        .all();
      app = appResult[0];
    } else if (packageName) {
      let appQuery = db
        .select()
        .from(apps)
        .where(eq(apps.package_name, packageName));
      if (platform) {
        appQuery = db
          .select()
          .from(apps)
          .where(
            and(
              eq(apps.package_name, packageName),
              eq(apps.platform, platform),
            ),
          );
      }
      const appResult = await appQuery.limit(1).all();
      app = appResult[0];
    }

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // 3. Find Latest Version
    const versionResult = await db
      .select()
      .from(versions)
      .where(eq(versions.app_id, app.id))
      .orderBy(desc(versions.created_at))
      .limit(1)
      .all();

    const latest = versionResult[0];

    if (!latest) {
      return NextResponse.json(
        { error: "No versions available for this app" },
        { status: 404 },
      );
    }

    // 4. Construct URLs
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    let installUrl = "";
    const directDownloadUrl = `${baseUrl}/api/download?versionId=${latest.id}&apiKey=${encodeURIComponent(apiKey)}`;

    if (app.platform === "ios") {
      const manifestUrl = `${baseUrl}/api/manifest?versionId=${latest.id}&apiKey=${encodeURIComponent(apiKey)}`;
      installUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;
    } else {
      installUrl = directDownloadUrl;
    }

    return NextResponse.json({
      success: true,
      app: {
        id: app.id,
        name: app.name,
        package_name: app.package_name,
        platform: app.platform,
      },
      latest_version: {
        id: latest.id,
        version_number: latest.version_number,
        build_number: latest.build_number,
        changelog: latest.changelog,
        created_at: latest.created_at,
        install_url: installUrl,
        download_url: directDownloadUrl,
      },
    });
  } catch (error) {
    console.error("Check update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
