"use server";

import { revalidatePath } from "next/cache";
import db from "./db";
import { users, apps, versions, user_apps } from "./schema";
import { getSession, login as authLogin, logout as authLogout } from "./auth";
import bcrypt from "bcryptjs";
import { eq, desc, and } from "drizzle-orm";

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

  return appsData.map((a) => {
    const { versions, ...appData } = a;
    return {
      ...appData,
      latest_version: versions[0]?.version_number,
    };
  });
}

export async function createAppAction(data: {
  name: string;
  package_name: string;
  platform: "android" | "ios";
}) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const result = await db
    .insert(apps)
    .values({
      name: data.name,
      package_name: data.package_name,
      platform: data.platform,
    })
    .returning({ id: apps.id });

  revalidatePath("/admin");
  return { id: result[0].id };
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

  await db.transaction(async (tx) => {
    await tx.delete(user_apps).where(eq(user_apps.user_id, userId));

    if (appIds.length > 0) {
      const values = appIds.map((appId) => ({
        user_id: userId,
        app_id: appId,
      }));
      await tx.insert(user_apps).values(values);
    }
  });

  return { success: true };
}

// Admin Actions: Versions
export async function getAppVersionsAction(appId: number) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // If not admin, check if user has access to this app
  if (session.user.role !== "admin") {
    const access = await db
      .select({ id: user_apps.user_id })
      .from(user_apps)
      .where(
        and(
          eq(user_apps.user_id, session.user.id),
          eq(user_apps.app_id, appId),
        ),
      )
      .limit(1);

    if (access.length === 0) {
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

  const userAppsData = await db.query.user_apps.findMany({
    where: eq(user_apps.user_id, session.user.id),
    with: {
      app: {
        with: {
          versions: {
            orderBy: [desc(versions.created_at)],
            limit: 1,
          },
        },
      },
    },
  });

  // Sort apps alphabetically by name
  const sortedApps = userAppsData
    .map((ua) => ua.app)
    .sort((a, b) => a.name.localeCompare(b.name));

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
