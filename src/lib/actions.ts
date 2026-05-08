"use server";

import { revalidatePath } from "next/cache";
import db from "./db";
import { users, apps, versions, user_apps, download_logs, groups, user_groups, group_apps, api_keys, public_links, webhooks, settings } from "./schema";
import { getSession, login as authLogin, logout as authLogout } from "./auth";
import bcrypt from "bcryptjs";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Auth Actions
export async function loginAction(
  prevState: unknown | undefined,
  formData: FormData,
) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, message: "Missing username or password" };
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = userResult[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { success: false, message: "Invalid username or password" };
  }

  await authLogin({ id: user.id, username: user.username, role: user.role });

  return { success: true, role: user.role };
}

export async function logoutAction() {
  await authLogout();
}

// Admin Actions: Apps
export async function getAppsAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const appsData = await db.query.apps.findMany({
    with: {
      versions: {
        orderBy: [desc(versions.created_at)],
        limit: 1,
      },
    },
  });

  const downloadCounts = await db
    .select({
      app_id: versions.app_id,
      count: sql<number>`count(${download_logs.id})`,
    })
    .from(download_logs)
    .innerJoin(versions, eq(download_logs.version_id, versions.id))
    .groupBy(versions.app_id);

  const countMap = new Map(downloadCounts.map((c) => [c.app_id, c.count]));

  return appsData.map((a) => {
    const { versions, ...appData } = a;
    return {
      ...appData,
      latest_version: versions[0]?.version_number,
      download_count: Number(countMap.get(a.id) || 0),
    };
  });
}

export async function createAppAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const package_name = formData.get("package_name") as string;
  const platform = formData.get("platform") as "android" | "ios";
  const icon = formData.get("icon") as File | null;

  const result = await db
    .insert(apps)
    .values({
      name,
      package_name,
      platform,
    })
    .returning({ id: apps.id });

  const appId = result[0].id;

  if (icon && icon.size > 0) {
    const iconDir = path.join(process.cwd(), "uploads", appId.toString());
    if (!fs.existsSync(iconDir)) {
      await mkdir(iconDir, { recursive: true });
    }
    const extension = path.extname(icon.name) || ".png";
    const iconPath = `icon${extension}`;
    const fullPath = path.join(iconDir, iconPath);
    const buffer = Buffer.from(await icon.arrayBuffer());
    await writeFile(fullPath, buffer);

    await db.update(apps).set({ icon_path: iconPath }).where(eq(apps.id, appId));
  }

  revalidatePath("/admin");
  return { id: appId };
}

export async function updateAppAction(appId: number, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const package_name = formData.get("package_name") as string;
  const platform = formData.get("platform") as "android" | "ios";
  const icon = formData.get("icon") as File | null;

  const updateData: any = {
    name,
    package_name,
    platform,
  };

  if (icon && icon.size > 0) {
    const iconDir = path.join(process.cwd(), "uploads", appId.toString());
    if (!fs.existsSync(iconDir)) {
      await mkdir(iconDir, { recursive: true });
    }
    const extension = path.extname(icon.name) || ".png";
    const iconPath = `icon${extension}`;
    const fullPath = path.join(iconDir, iconPath);
    const buffer = Buffer.from(await icon.arrayBuffer());
    await writeFile(fullPath, buffer);
    updateData.icon_path = iconPath;
  }

  await db.update(apps).set(updateData).where(eq(apps.id, appId));

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteAppAction(appId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Delete files first
  const appDir = path.join(process.cwd(), "uploads", appId.toString());
  if (fs.existsSync(appDir)) {
    // Using rmSync for simplicity in a server action context
    fs.rmSync(appDir, { recursive: true, force: true });
  }

  // Delete from database
  await db.delete(apps).where(eq(apps.id, appId));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}

// Admin Actions: Users
export async function getUsersAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
    })
    .from(users);
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

  const hash = await bcrypt.hash(data.password_hash, 10);

  try {
    const result = await db
      .insert(users)
      .values({
        username: data.username,
        password_hash: hash,
        role: data.role || "user",
      })
      .returning({ id: users.id });

    revalidatePath("/admin");
    return { id: result[0].id };
  } catch (e) {
    return { error: `Username already exists ${e}` };
  }
}

export async function changePasswordAction(userId: number, newPassword: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ password_hash: hash })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function deleteUserAction(userId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Prevent self-deletion
  if (session.user.id === userId) {
    return { error: "You cannot delete your own account" };
  }

  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/admin");
  return { success: true };
}

// Admin Actions: Assignments
export async function getAssignmentsAction(userId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return await db
    .select({ app_id: user_apps.app_id })
    .from(user_apps)
    .where(eq(user_apps.user_id, userId));
}

export async function updateAssignmentsAction(
  userId: number,
  appIds: number[],
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const targetUserId = Number(userId);
  if (isNaN(targetUserId)) {
    return { error: "Invalid user ID" };
  }

  try {
    db.transaction((tx) => {
      // Clean existing assignments
      tx.delete(user_apps).where(eq(user_apps.user_id, targetUserId)).run();

      // Add new assignments if any
      if (appIds.length > 0) {
        const values = appIds
          .map((id) => Number(id))
          .filter((id) => !isNaN(id))
          .map((appId) => ({
            user_id: targetUserId,
            app_id: appId,
          }));

        if (values.length > 0) {
          tx.insert(user_apps).values(values).run();
        }
      }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    console.error("Failed to update assignments:", e);
    return { error: `Failed to update assignments: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// Admin Actions: Versions
export async function getAppVersionsAction(appId: number) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // If not admin, check if user has access to this app
  if (session.user.role !== "admin") {
    // Check direct assignment
    const directAccess = await db
      .select({ id: user_apps.user_id })
      .from(user_apps)
      .where(
        and(
          eq(user_apps.user_id, session.user.id),
          eq(user_apps.app_id, appId),
        ),
      )
      .limit(1);

    // Check group assignment
    const groupAccess = await db
      .select({ id: group_apps.group_id })
      .from(group_apps)
      .innerJoin(user_groups, eq(group_apps.group_id, user_groups.group_id))
      .where(
        and(
          eq(user_groups.user_id, session.user.id),
          eq(group_apps.app_id, appId)
        )
      )
      .limit(1);

    if (directAccess.length === 0 && groupAccess.length === 0) {
      throw new Error("Forbidden");
    }
  }

  return await db
    .select()
    .from(versions)
    .where(eq(versions.app_id, appId))
    .orderBy(desc(versions.created_at));
}

export async function deleteVersionAction(versionId: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await db.delete(versions).where(eq(versions.id, versionId));
  revalidatePath("/admin");
  return { success: true };
}

// User Actions
export async function getMyAppsAction() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // 1. Get apps assigned directly
  const directAppIds = await db
    .select({ id: user_apps.app_id })
    .from(user_apps)
    .where(eq(user_apps.user_id, session.user.id));

  // 2. Get apps assigned via groups
  const groupAppIds = await db
    .select({ id: group_apps.app_id })
    .from(group_apps)
    .innerJoin(user_groups, eq(group_apps.group_id, user_groups.group_id))
    .where(eq(user_groups.user_id, session.user.id));

  // Combine and deduplicate IDs
  const allAppIds = Array.from(new Set([
    ...directAppIds.map(a => a.id),
    ...groupAppIds.map(a => a.id)
  ]));

  if (allAppIds.length === 0) return [];

  // 3. Fetch full app data with latest version
  const appsData = await db.query.apps.findMany({
    where: inArray(apps.id, allAppIds),
    with: {
      versions: {
        orderBy: [desc(versions.created_at)],
        limit: 1,
      },
    },
  });

  // Sort apps alphabetically by name
  const sortedApps = appsData.sort((a, b) => a.name.localeCompare(b.name));

  return sortedApps.map((a) => {
    const { versions, ...appData } = a;
    const latestVersion = versions[0];

    return {
      ...appData,
      version_id: latestVersion?.id,
      version_number: latestVersion?.version_number,
      build_number: latestVersion?.build_number,
      changelog: latestVersion?.changelog,
      version_date: latestVersion?.created_at,
    };
  });
}

// Admin Actions: Groups
export async function getGroupsAction() {
const session = await getSession();
if (!session || session.user.role !== "admin") {
  throw new Error("Unauthorized");
}

return await db.select().from(groups).orderBy(desc(groups.created_at));
}

export async function createGroupAction(data: { name: string; description?: string }) {
const session = await getSession();
if (!session || session.user.role !== "admin") {
  throw new Error("Unauthorized");
}

try {
  const result = await db.insert(groups).values(data).returning({ id: groups.id });
  revalidatePath("/admin");
  return { id: result[0].id };
} catch (e) {
  return { error: `Group already exists or invalid data: ${e}` };
}
}

export async function deleteGroupAction(groupId: number) {
const session = await getSession();
if (!session || session.user.role !== "admin") {
  throw new Error("Unauthorized");
}

await db.delete(groups).where(eq(groups.id, groupId));
revalidatePath("/admin");
return { success: true };
}

export async function getGroupAssignmentsAction(groupId: number) {
const session = await getSession();
if (!session || session.user.role !== "admin") {
  throw new Error("Unauthorized");
}

const assignedUsers = await db
  .select({ user_id: user_groups.user_id })
  .from(user_groups)
  .where(eq(user_groups.group_id, groupId));

const assignedApps = await db
  .select({ app_id: group_apps.app_id })
  .from(group_apps)
  .where(eq(group_apps.group_id, groupId));

return {
  userIds: assignedUsers.map((u) => u.user_id),
  appIds: assignedApps.map((a) => a.app_id),
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
    // Update Users
    tx.delete(user_groups).where(eq(user_groups.group_id, groupId)).run();
    if (userIds.length > 0) {
      tx.insert(user_groups)
        .values(userIds.map((uid) => ({ user_id: uid, group_id: groupId })))
        .run();
    }

    // Update Apps
    tx.delete(group_apps).where(eq(group_apps.group_id, groupId)).run();
    if (appIds.length > 0) {
      tx.insert(group_apps)
        .values(appIds.map((aid) => ({ app_id: aid, group_id: groupId })))
        .run();
    }
  });

  revalidatePath("/admin");
  return { success: true };
} catch (e) {
  return { error: `Failed to update group assignments: ${e}` };
}
}

// Admin Actions: API Keys
export async function getApiKeysAction() {
const session = await getSession();
if (!session) {
  throw new Error("Unauthorized");
}

return await db
  .select()
  .from(api_keys)
  .where(eq(api_keys.user_id, session.user.id))
  .orderBy(desc(api_keys.created_at));
}

export async function createApiKeyAction(name: string) {
const session = await getSession();
if (!session) {
  throw new Error("Unauthorized");
}

const key = crypto.randomBytes(32).toString("hex");

await db.insert(api_keys).values({
  user_id: session.user.id,
  key: key,
  name,
});

revalidatePath("/admin");
return { success: true, key }; // Key is only shown once
}

export async function deleteApiKeyAction(id: number) {
const session = await getSession();
if (!session) {
  throw new Error("Unauthorized");
}

await db.delete(api_keys).where(and(eq(api_keys.id, id), eq(api_keys.user_id, session.user.id)));
revalidatePath("/admin");
return { success: true };
}

// Public Links Actions
export async function getPublicLinksAction(versionId: number) {
const session = await getSession();
if (!session) {
  throw new Error("Unauthorized");
}

return await db
  .select()
  .from(public_links)
  .where(eq(public_links.version_id, versionId))
  .orderBy(desc(public_links.created_at));
}

export async function createPublicLinkAction(data: {
version_id: number;
expires_in_days?: number;
password?: string;
}) {
const session = await getSession();
if (!session) {
  throw new Error("Unauthorized");
}

const token = crypto.randomBytes(16).toString("hex");
let expires_at = null;
if (data.expires_in_days) {
  const date = new Date();
  date.setDate(date.getDate() + data.expires_in_days);
  expires_at = date.toISOString();
}

let password_hash = null;
if (data.password) {
  password_hash = await bcrypt.hash(data.password, 10);
}

await db.insert(public_links).values({
  version_id: data.version_id,
  token,
  expires_at,
  password_hash,
});

return { success: true, token };
}

export async function deletePublicLinkAction(id: number) {
const session = await getSession();
if (!session) {
  throw new Error("Unauthorized");
}

await db.delete(public_links).where(eq(public_links.id, id));
return { success: true };
}

// Webhooks Actions
export async function getWebhooksAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return await db.select().from(webhooks).orderBy(desc(webhooks.created_at));
}

export async function createWebhookAction(data: { name: string; url: string }) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await db.insert(webhooks).values({
    name: data.name,
    url: data.url,
    event: "new_version",
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteWebhookAction(id: number) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await db.delete(webhooks).where(eq(webhooks.id, id));
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleWebhookAction(id: number, active: boolean) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await db.update(webhooks).set({ is_active: active }).where(eq(webhooks.id, id));
  revalidatePath("/admin");
  return { success: true };
}

// Internal Utilities
export async function triggerWebhooks(event: string, data: any) {
  const activeWebhooks = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.event, event), eq(webhooks.is_active, true)));

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const results = await Promise.allSettled(
    activeWebhooks.map((wh) =>
      fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ),
  );

  results.forEach((res, i) => {
    if (res.status === "rejected") {
      console.error(`Webhook ${activeWebhooks[i].name} failed:`, res.reason);
    }
  });
}

// Settings Actions
export async function getSettingsAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const allSettings = await db.select().from(settings);
  const settingsMap: Record<string, string> = {};
  allSettings.forEach((s) => (settingsMap[s.key] = s.value));

  return {
    retention_count: settingsMap["retention_count"] || "0", // 0 means unlimited
  };
}

export async function updateSettingsAction(key: string, value: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });

  revalidatePath("/admin");
  return { success: true };
}

export async function enforceRetentionPolicy(appId: number) {
  const setting = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "retention_count"))
    .limit(1);

  const retentionCount = parseInt(setting[0]?.value || "0", 10);
  if (retentionCount <= 0) return;

  const appVersions = await db
    .select()
    .from(versions)
    .where(eq(versions.app_id, appId))
    .orderBy(desc(versions.created_at));

  if (appVersions.length > retentionCount) {
    const toDelete = appVersions.slice(retentionCount);
    for (const v of toDelete) {
      // Delete file
      const filePath = path.join(
        process.cwd(),
        "uploads",
        appId.toString(),
        v.file_path,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Delete manifest if exists
      if (v.manifest_path) {
        const mPath = path.join(
          process.cwd(),
          "uploads",
          appId.toString(),
          v.manifest_path,
        );
        if (fs.existsSync(mPath)) {
          fs.unlinkSync(mPath);
        }
      }
      // Delete from DB
      await db.delete(versions).where(eq(versions.id, v.id));
    }
    console.log(`Retention policy: Deleted ${toDelete.length} old versions for app ${appId}`);
  }
}
