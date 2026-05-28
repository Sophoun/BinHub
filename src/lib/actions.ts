/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import db from "./db";
import {
  users,
  apps,
  versions,
  user_apps,
  download_logs,
  groups,
  user_groups,
  group_apps,
  api_keys,
  public_links,
  webhooks,
  settings,
} from "./schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { getSession, login, logout, authenticateLdap, getLdapConfig } from "./auth";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import * as ldap from "ldapjs";
const Client = (ldap as any).createClient || (ldap as any).default?.createClient || (ldap as any).Client;
import { v4 as uuidv4 } from "uuid";

// Auth Actions
export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
    .all();
  let user = userResult[0];

  // Try local auth
  if (user && (await bcrypt.compare(password, user.password_hash))) {
    await login({ id: user.id, username: user.username, role: user.role });
    return { success: true, role: user.role };
  }

  // Fallback to LDAP
  if (await authenticateLdap(username, password)) {
    // If user doesn't exist in DB, create one
    if (!user) {
      const newUser = await db
        .insert(users)
        .values({
          username,
          password_hash: "LDAP_USER",
          role: "user",
        })
        .returning({ id: users.id, username: users.username, role: users.role });
      user = newUser[0] as any;
    }

    await login({ id: user.id, username: user.username, role: user.role });
    return { success: true, role: user.role };
  }

  return { success: false, message: "Invalid username or password" };
}

export async function logoutAction() {
  await logout();
  revalidatePath("/");
}

export async function getDownloadTokenAction() {
  const cookieStore = await cookies();
  return cookieStore.get("session")?.value || null;
}

// User Actions
export async function getUsersAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return await db
    .select({ id: users.id, username: users.username, role: users.role })
    .from(users)
    .all();
}

export async function createUserAction(data: {
  username: string;
  password_hash: string;
  role: "admin" | "user";
}) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  const password_hash = await bcrypt.hash(data.password_hash, 10);
  try {
    await db.insert(users).values({ ...data, password_hash });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteUserAction(id: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  if (id === session.user.id) {
    return { error: "You cannot delete yourself" };
  }
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin");
  return { success: true };
}

export async function changePasswordAction(
  userId: number,
  newPassword: string,
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  const password_hash = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ password_hash, updated_at: new Date().toISOString() })
    .where(eq(users.id, userId));
  return { success: true };
}

// App Actions
export async function getAppsAction() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (session.user.role === "admin") {
    const data = await db
      .select({
        id: apps.id,
        name: apps.name,
        package_name: apps.package_name,
        platform: apps.platform,
        icon_path: apps.icon_path,
        android_keystore_path: apps.android_keystore_path,
        android_keystore_pass: apps.android_keystore_pass,
        android_key_alias: apps.android_key_alias,
        android_key_pass: apps.android_key_pass,
        minify_enabled: apps.minify_enabled,
        created_at: apps.created_at,
        updated_at: apps.updated_at,
        latest_version: sql<string>`(SELECT version_number FROM versions WHERE app_id = apps.id ORDER BY created_at DESC LIMIT 1)`,
        download_count: sql<number>`(SELECT COUNT(*) FROM download_logs dl JOIN versions v ON dl.version_id = v.id WHERE v.app_id = apps.id)`,
      })
      .from(apps)
      .all();
    return data;
  }

  // Regular user: Only assigned apps
  const data = await db
    .select({
      id: apps.id,
      name: apps.name,
      package_name: apps.package_name,
      platform: apps.platform,
      icon_path: apps.icon_path,
      android_keystore_path: apps.android_keystore_path,
      android_keystore_pass: apps.android_keystore_pass,
      android_key_alias: apps.android_key_alias,
      android_key_pass: apps.android_key_pass,
      minify_enabled: apps.minify_enabled,
      created_at: apps.created_at,
      updated_at: apps.updated_at,
      latest_version: sql<string>`(SELECT version_number FROM versions WHERE app_id = apps.id ORDER BY created_at DESC LIMIT 1)`,
      download_count: sql<number>`(SELECT COUNT(*) FROM download_logs dl JOIN versions v ON dl.version_id = v.id WHERE v.app_id = apps.id)`,
    })
    .from(apps)
    .innerJoin(user_apps, eq(apps.id, user_apps.app_id))
    .where(eq(user_apps.user_id, session.user.id))
    .all();

  return data;
}

export async function getMyAppsAction() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;

  const userAppsResult = await db
    .select({
      id: apps.id,
      name: apps.name,
      package_name: apps.package_name,
      platform: apps.platform,
      icon_path: apps.icon_path,
      version_id: versions.id,
      version_number: versions.version_number,
      build_number: versions.build_number,
      changelog: versions.changelog,
      version_date: versions.created_at,
    })
    .from(apps)
    .leftJoin(user_apps, eq(apps.id, user_apps.app_id))
    .leftJoin(group_apps, eq(apps.id, group_apps.app_id))
    .leftJoin(user_groups, eq(group_apps.group_id, user_groups.group_id))
    .leftJoin(versions, eq(apps.id, versions.app_id))
    .where(or(eq(user_apps.user_id, userId), eq(user_groups.user_id, userId)))
    .orderBy(desc(versions.created_at))
    .all();

  // Deduplicate to show only the latest version per app
  const uniqueApps: any[] = [];
  const seenIds = new Set();

  for (const item of userAppsResult) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueApps.push(item);
    }
  }

  return uniqueApps;
}

export async function createAppAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const package_name = formData.get("package_name") as string;
  const platform = formData.get("platform") as "android" | "ios";
  const icon = formData.get("icon") as File;
  const minifyEnabled = formData.get("minify_enabled") === "true";
  
  // Keystore fields
  const keystoreFile = formData.get("android_keystore_file") as File;
  const ksPass = formData.get("android_keystore_pass") as string;
  const ksAlias = formData.get("android_key_alias") as string;
  const keyPass = formData.get("android_key_pass") as string;

  const result = await db
    .insert(apps)
    .values({
      name,
      package_name,
      platform,
      android_keystore_pass: ksPass || null,
      android_key_alias: ksAlias || null,
      android_key_pass: keyPass || null,
      minify_enabled: minifyEnabled,
    })
    .returning({ id: apps.id });

  const appId = result[0].id;

  const uploadDir = path.join(process.cwd(), "data/uploads", appId.toString());
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  if (icon && icon.size > 0) {
    const bytes = await icon.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const iconPath = "icon.png";
    fs.writeFileSync(path.join(uploadDir, iconPath), buffer);
    await db
      .update(apps)
      .set({ icon_path: iconPath })
      .where(eq(apps.id, appId));
  }

  if (keystoreFile && keystoreFile.size > 0) {
    const bytes = await keystoreFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ksFileName = "upload.keystore";
    const ksPath = path.join(uploadDir, ksFileName);
    fs.writeFileSync(ksPath, buffer);
    await db
      .update(apps)
      .set({ android_keystore_path: ksFileName })
      .where(eq(apps.id, appId));
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateAppAction(id: number, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const package_name = formData.get("package_name") as string;
  const platform = formData.get("platform") as "android" | "ios";
  const icon = formData.get("icon") as File;
  
  // Keystore fields
  const keystoreFile = formData.get("android_keystore_file") as File;
  const ksPass = formData.get("android_keystore_pass") as string;
  const ksAlias = formData.get("android_key_alias") as string;
  const keyPass = formData.get("android_key_pass") as string;

  await db
    .update(apps)
    .set({
      name,
      package_name,
      platform,
      android_keystore_pass: ksPass || null,
      android_key_alias: ksAlias || null,
      android_key_pass: keyPass || null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(apps.id, id));

  const uploadDir = path.join(process.cwd(), "data/uploads", id.toString());
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  if (icon && icon.size > 0) {
    const bytes = await icon.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const iconPath = "icon.png";
    fs.writeFileSync(path.join(uploadDir, iconPath), buffer);
    await db.update(apps).set({ icon_path: iconPath }).where(eq(apps.id, id));
  }

  if (keystoreFile && keystoreFile.size > 0) {
    const bytes = await keystoreFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ksFileName = "upload.keystore";
    const ksPath = path.join(uploadDir, ksFileName);
    fs.writeFileSync(ksPath, buffer);
    await db.update(apps).set({ android_keystore_path: ksFileName }).where(eq(apps.id, id));
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteAppAction(appId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const uploadDir = path.join(process.cwd(), "data/uploads", appId.toString());
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }

  await db.delete(apps).where(eq(apps.id, appId));
  revalidatePath("/admin");
  return { success: true };
}

// Version Actions
export async function getAppVersionsAction(appId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return await db
    .select()
    .from(versions)
    .where(eq(versions.app_id, appId))
    .orderBy(desc(versions.created_at))
    .all();
}

export async function deleteVersionAction(versionId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const version = await db.query.versions.findFirst({
    where: eq(versions.id, versionId),
  });

  if (version) {
    const uploadDir = path.join(
      process.cwd(),
      "data/uploads",
      version.app_id.toString(),
    );

    // Delete main file
    const filePath = path.join(uploadDir, version.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Delete original file if exists
    if (version.original_file_path) {
      const originalPath = path.join(uploadDir, version.original_file_path);
      if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
    }

    // Delete manifest if exists
    if (version.manifest_path) {
      const manifestPath = path.join(uploadDir, version.manifest_path);
      if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
    }
  }

  await db.delete(versions).where(eq(versions.id, versionId));
  revalidatePath("/admin");
  return { success: true };
}

// Assignment Actions
export async function getAssignmentsAction(userId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return await db
    .select({ app_id: user_apps.app_id })
    .from(user_apps)
    .where(eq(user_apps.user_id, userId))
    .all();
}

export async function updateAssignmentsAction(
  userId: number,
  appIds: number[],
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  try {
    await db.delete(user_apps).where(eq(user_apps.user_id, userId));
    if (appIds.length > 0) {
      await db
        .insert(user_apps)
        .values(appIds.map((appId) => ({ user_id: userId, app_id: appId })));
    }
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// Group Actions
export async function getGroupsAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return await db.select().from(groups).all();
}

export async function createGroupAction(data: {
  name: string;
  description: string;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  try {
    await db.insert(groups).values(data);
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteGroupAction(id: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  await db.delete(groups).where(eq(groups.id, id));
  revalidatePath("/admin");
  return { success: true };
}

export async function getGroupAssignmentsAction(groupId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const userResults = await db
    .select({ userId: user_groups.user_id })
    .from(user_groups)
    .where(eq(user_groups.group_id, groupId))
    .all();
  const appResults = await db
    .select({ appId: group_apps.app_id })
    .from(group_apps)
    .where(eq(group_apps.group_id, groupId))
    .all();

  return {
    userIds: userResults.map((r) => r.userId),
    appIds: appResults.map((r) => r.appId),
  };
}

export async function updateGroupAssignmentsAction(
  groupId: number,
  userIds: number[],
  appIds: number[],
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  try {
    db.transaction((tx) => {
      tx.delete(user_groups).where(eq(user_groups.group_id, groupId)).run();
      if (userIds.length > 0) {
        tx.insert(user_groups)
          .values(userIds.map((id) => ({ group_id: groupId, user_id: id })))
          .run();
      }

      tx.delete(group_apps).where(eq(group_apps.group_id, groupId)).run();
      if (appIds.length > 0) {
        tx.insert(group_apps)
          .values(appIds.map((id) => ({ group_id: groupId, app_id: id })))
          .run();
      }
    });
    revalidatePath("/admin");

    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// API Key Actions
export async function getApiKeysAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return await db.select().from(api_keys).all();
}

export async function createApiKeyAction(name: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  const key = `bh_${uuidv4().replace(/-/g, "")}`;
  await db.insert(api_keys).values({
    user_id: session.user.id,
    key,
    name,
  });
  revalidatePath("/admin");
  return { key };
}

export async function deleteApiKeyAction(id: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  await db.delete(api_keys).where(eq(api_keys.id, id));
  revalidatePath("/admin");
  return { success: true };
}

// Public Link Actions
export async function getPublicLinksAction(versionId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");

  return await db
    .select()
    .from(public_links)
    .where(eq(public_links.version_id, versionId))
    .all();
}

export async function createPublicLinkAction(data: {
  version_id: number;
  expires_in_days?: number;
  password?: string;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");

  const token = uuidv4();
  let expires_at: string | null = null;
  if (data.expires_in_days) {
    const date = new Date();
    date.setDate(date.getDate() + data.expires_in_days);
    expires_at = date.toISOString();
  }

  let password_hash: string | null = null;
  if (data.password) {
    password_hash = await bcrypt.hash(data.password, 10);
  }

  await db.insert(public_links).values({
    version_id: data.version_id,
    token,
    expires_at,
    password_hash,
  });

  revalidatePath("/admin");
  return { token };
}

export async function deletePublicLinkAction(id: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");

  await db.delete(public_links).where(eq(public_links.id, id));
  revalidatePath("/admin");
  return { success: true };
}

export async function getPublicLinkInfoAction(token: string) {
  const linkResult = await db
    .select()
    .from(public_links)
    .where(eq(public_links.token, token))
    .limit(1)
    .all();
  const link = linkResult[0];

  if (!link) return null;
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { expired: true };
  }

  const versionResult = await db
    .select()
    .from(versions)
    .where(eq(versions.id, link.version_id))
    .limit(1)
    .all();
  const version = versionResult[0];

  const appResult = await db
    .select()
    .from(apps)
    .where(eq(apps.id, version.app_id))
    .limit(1)
    .all();
  const app = appResult[0];

  return {
    version,
    app,
    has_password: !!link.password_hash,
    expires_at: link.expires_at,
  };
}

export async function verifyPublicLinkPasswordAction(
  token: string,
  password: string,
) {
  const linkResult = await db
    .select()
    .from(public_links)
    .where(eq(public_links.token, token))
    .limit(1)
    .all();
  const link = linkResult[0];

  if (!link || !link.password_hash) return { success: false };

  const match = await bcrypt.compare(password, link.password_hash);
  return { success: match };
}

// Webhook Actions
export async function getWebhooksAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");
  return await db.select().from(webhooks).all();
}

export async function createWebhookAction(data: { name: string; url: string }) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");
  await db.insert(webhooks).values(data);
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteWebhookAction(id: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");
  await db.delete(webhooks).where(eq(webhooks.id, id));
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleWebhookAction(id: number, active: boolean) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");
  await db
    .update(webhooks)
    .set({ is_active: active })
    .where(eq(webhooks.id, id));
  return { success: true };
}
// Settings Actions
export async function getSettingsAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  const data = await db.select().from(settings).all();
  return data.reduce((acc: any, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}

export async function testLdapConnectionAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");

  const config = await getLdapConfig();
  const url = config["ldap_url"];
  const bindDn = config["ldap_bind_dn"] || "";
  const bindPassword = config["ldap_bind_password"] || "";

  if (!url) return { success: false, message: "LDAP URL is required" };

  return new Promise((resolve) => {
    const client = Client({ url });
    client.bind(bindDn, bindPassword, (err) => {
      client.unbind();
      if (err) {
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true, message: "Connection successful" });
      }
    });
  });
}


export async function updateSettingsAction(key: string, value: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin")
    throw new Error("Unauthorized");
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updated_at: new Date().toISOString() },
    });
  return { success: true };
}

// Background Tasks & Utilities
export async function triggerWebhooks(event: string, data: any) {
  const activeWebhooks = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.event, event), eq(webhooks.is_active, true)))
    .all();

  for (const wh of activeWebhooks) {
    try {
      // Special handling for Telegram
      if (wh.url.includes("api.telegram.org")) {
        const message = `🚀 *New Build Ready!*\n\n*App:* ${data.app_name}\n*Version:* ${data.version} (${data.build})\n*Platform:* ${data.platform.toUpperCase()}\n\n*Changelog:*\n_${data.changelog || "No release notes provided."}_`;
        await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message, parse_mode: "Markdown" }),
        });
      } else {
        await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, data }),
        });
      }
    } catch (e) {
      console.error(`Webhook failed for ${wh.url}:`, e);
    }
  }
}

export async function enforceRetentionPolicy(appId: number) {
  const settingResult = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "retention_count"))
    .limit(1)
    .all();

  const retentionCount = parseInt(settingResult[0]?.value || "0", 10);
  if (retentionCount <= 0) return;

  const appVersions = await db
    .select()
    .from(versions)
    .where(eq(versions.app_id, appId))
    .orderBy(desc(versions.created_at))
    .all();

  if (appVersions.length > retentionCount) {
    const toDelete = appVersions.slice(retentionCount);
    for (const v of toDelete) {
      const uploadDir = path.join(
        process.cwd(),
        "data/uploads",
        appId.toString(),
      );

      // Delete main file
      const filePath = path.join(uploadDir, v.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      // Delete original file if exists
      if (v.original_file_path) {
        const originalPath = path.join(uploadDir, v.original_file_path);
        if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
      }

      // Delete manifest if exists
      if (v.manifest_path) {
        const mPath = path.join(uploadDir, v.manifest_path);
        if (fs.existsSync(mPath)) fs.unlinkSync(mPath);
      }

      // Delete from DB
      await db.delete(versions).where(eq(versions.id, v.id));
    }
    console.log(
      `Retention policy: Deleted ${toDelete.length} old versions for app ${appId}`,
    );
  }
}
