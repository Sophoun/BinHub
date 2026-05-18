/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Users,
  Smartphone,
  Upload,
  LogOut,
  LayoutDashboard,
  Package,
  History,
  Trash2,
  Calendar,
  Key,
  Pencil,
  Download,
  ShieldCheck,
  Link,
  Copy,
  Check,
  Settings,
  Bell,
  HardDrive,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { App as BaseApp } from "@/src/lib/db";
import { ThemeToggle } from "@/src/components/theme-toggle";
import {
  getAppsAction,
  getUsersAction,
  logoutAction,
  createAppAction,
  updateAppAction,
  createUserAction,
  getAssignmentsAction,
  updateAssignmentsAction,
  getAppVersionsAction,
  deleteVersionAction,
  changePasswordAction,
  deleteAppAction,
  deleteUserAction,
  getGroupsAction,
  createGroupAction,
  deleteGroupAction,
  getGroupAssignmentsAction,
  updateGroupAssignmentsAction,
  getApiKeysAction,
  createApiKeyAction,
  getPublicLinksAction,
  createPublicLinkAction,
  deletePublicLinkAction,
  deleteApiKeyAction,
  getWebhooksAction,
  deleteWebhookAction,
  toggleWebhookAction,
  getSettingsAction,
  updateSettingsAction,
  createWebhookAction,
} from "@/src/lib/actions";
import { copyToClipboard } from "@/src/lib/utils";

// Omit password_hash from User type since it's not returned by the action
interface User {
  id: number;
  username: string;
  role: "admin" | "user";
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  created_at: string | null;
}

interface ApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string | null;
}

interface PublicLink {
  id: number;
  token: string;
  expires_at: string | null;
  password_hash: string | null;
  created_at: string | null;
}

// Extend App type to include calculated fields
interface App extends BaseApp {
  latest_version?: string;
  download_count?: number;
}

interface Version {
  id: number;
  version_number: string;
  build_number?: string;
  changelog?: string;
  created_at: string;
  file_path: string;
  original_file_path?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("apps");
  const [apps, setApps] = useState<App[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ retention_count: "0" });
  const [showAddApp, setShowAddApp] = useState(false);
  const [showEditApp, setShowEditApp] = useState<App | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [showUpload, setShowUpload] = useState<number | null>(null);
  const [showAssignments, setShowAssignments] = useState<number | null>(null);
  const [showGroupAssignments, setShowGroupAssignments] = useState<
    number | null
  >(null);
  const [showPublicLinks, setShowPublicLinks] = useState<Version | null>(null);
  const [manageVersionsApp, setManageVersionsApp] = useState<App | null>(null);
  const [showChangePassword, setShowChangePassword] = useState<User | null>(
    null,
  );

  const router = useRouter();

  const fetchApps = useCallback(async () => {
    try {
      const data = await getAppsAction();
      setApps(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsersAction();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const data = await getGroupsAction();
      setGroups(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      const data = await getApiKeysAction();
      setApiKeys(data as unknown as ApiKey[]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchWebhooks = useCallback(async () => {
    try {
      const data = await getWebhooksAction();
      setWebhooks(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettingsAction();
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApps();
    fetchUsers();
    fetchGroups();
    fetchApiKeys();
    fetchWebhooks();
    fetchSettings();
  }, [
    fetchApps,
    fetchUsers,
    fetchGroups,
    fetchApiKeys,
    fetchWebhooks,
    fetchSettings,
  ]);

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  const handleDeleteApp = async (appId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this application and all of its versions? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteAppAction(appId);
      fetchApps();
    } catch (e) {
      alert("Failed to delete application.");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    )
      return;
    try {
      const result = await deleteUserAction(userId);
      if (result.error) {
        alert(result.error);
      } else {
        fetchUsers();
      }
    } catch (e) {
      alert("Failed to delete user.");
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this group? Access for users in this group will be revoked.",
      )
    )
      return;
    try {
      await deleteGroupAction(groupId);
      fetchGroups();
    } catch (e) {
      alert("Failed to delete group.");
    }
  };

  const handleDeleteApiKey = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this API Key? CI/CD pipelines using this key will fail.",
      )
    )
      return;
    try {
      await deleteApiKeyAction(id);
      fetchApiKeys();
    } catch (e) {
      alert("Failed to delete API Key.");
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    try {
      await deleteWebhookAction(id);
      fetchWebhooks();
    } catch (e) {
      alert("Failed to delete webhook.");
    }
  };

  const handleToggleWebhook = async (id: number, active: boolean) => {
    try {
      await toggleWebhookAction(id, active);
      fetchWebhooks();
    } catch (e) {
      alert("Failed to toggle webhook.");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-muted/20 md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Smartphone className="h-5 w-5 text-primary" />
            <span>BinHub</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-4 text-sm font-medium">
            <button
              onClick={() => setActiveTab("apps")}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                activeTab === "apps"
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Apps
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                activeTab === "groups"
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-4 w-4" />
              Groups
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                activeTab === "users"
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("api-keys")}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                activeTab === "api-keys"
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              API Keys
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                activeTab === "settings"
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </nav>
        </div>
        <div className="mt-auto border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-card">
          <h2 className="text-lg font-semibold tracking-tight">
            {activeTab === "apps"
              ? "Applications"
              : activeTab === "groups"
                ? "Distribution Groups"
                : activeTab === "api-keys"
                  ? "CI/CD API Keys"
                  : activeTab === "settings"
                    ? "Global Settings"
                    : "Users Management"}
          </h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {activeTab !== "settings" && (
              <button
                onClick={() => {
                  if (activeTab === "apps") setShowAddApp(true);
                  else if (activeTab === "groups") setShowAddGroup(true);
                  else if (activeTab === "api-keys") setShowAddApiKey(true);
                  else setShowAddUser(true);
                }}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === "apps"
                  ? "Add App"
                  : activeTab === "groups"
                    ? "Create Group"
                    : activeTab === "api-keys"
                      ? "New API Key"
                      : "Add User"}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {activeTab === "apps" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Apps</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-bold">{apps.length}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Downloads</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-bold">
                        {apps.reduce(
                          (acc, app) => acc + (app.download_count || 0),
                          0,
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">QA Users</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-bold">
                        {users.filter((u) => u.role === "user").length}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Active Groups</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-bold">{groups.length}</div>
                    </div>
                  </div>
                </div>
                <AppList
                  apps={apps}
                  onUpload={(id: number) => setShowUpload(id)}
                  onManageVersions={(app: App) => setManageVersionsApp(app)}
                  onEdit={(app: App) => setShowEditApp(app)}
                  onDelete={handleDeleteApp}
                />
              </>
            )}
            {activeTab === "groups" && (
              <GroupList
                groups={groups}
                onAssign={(id: number) => setShowGroupAssignments(id)}
                onDelete={handleDeleteGroup}
              />
            )}
            {activeTab === "users" && (
              <UserList
                users={users}
                onAssign={(id: number) => setShowAssignments(id)}
                onChangePassword={(user: User) => setShowChangePassword(user)}
                onDelete={handleDeleteUser}
              />
            )}
            {activeTab === "api-keys" && (
              <ApiKeyList apiKeys={apiKeys} onDelete={handleDeleteApiKey} />
            )}
            {activeTab === "settings" && (
              <SettingsView
                settings={settings}
                webhooks={webhooks}
                onUpdateRetention={(count) => {
                  updateSettingsAction("retention_count", count);
                  setSettings({ ...settings, retention_count: count });
                }}
                onAddWebhook={() => setShowAddWebhook(true)}
                onDeleteWebhook={handleDeleteWebhook}
                onToggleWebhook={handleToggleWebhook}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAddApp && (
        <AddAppModal onClose={() => setShowAddApp(false)} refresh={fetchApps} />
      )}
      {showEditApp && (
        <EditAppModal
          app={showEditApp}
          onClose={() => setShowEditApp(null)}
          refresh={fetchApps}
        />
      )}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          refresh={fetchUsers}
        />
      )}
      {showAddGroup && (
        <AddGroupModal
          onClose={() => setShowAddGroup(false)}
          refresh={fetchGroups}
        />
      )}
      {showAddApiKey && (
        <AddApiKeyModal
          onClose={() => setShowAddApiKey(false)}
          refresh={fetchApiKeys}
        />
      )}
      {showAddWebhook && (
        <AddWebhookModal
          onClose={() => setShowAddWebhook(false)}
          refresh={fetchWebhooks}
        />
      )}
      {showUpload && (
        <UploadModal
          appId={showUpload}
          onClose={() => setShowUpload(null)}
          refresh={fetchApps}
        />
      )}
      {showAssignments && (
        <AssignmentModal
          userId={showAssignments}
          apps={apps}
          onClose={() => setShowAssignments(null)}
        />
      )}
      {showGroupAssignments && (
        <GroupAssignmentModal
          groupId={showGroupAssignments}
          users={users}
          apps={apps}
          onClose={() => setShowGroupAssignments(null)}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal
          user={showChangePassword}
          onClose={() => setShowChangePassword(null)}
        />
      )}
      {manageVersionsApp && (
        <AdminVersionModal
          app={manageVersionsApp}
          onClose={() => setManageVersionsApp(null)}
          refreshApps={fetchApps}
          onManagePublicLinks={(v) => setShowPublicLinks(v)}
        />
      )}
      {showPublicLinks && (
        <PublicLinkModal
          version={showPublicLinks}
          onClose={() => setShowPublicLinks(null)}
        />
      )}
    </div>
  );
}

function AppList({
  apps,
  onUpload,
  onManageVersions,
  onEdit,
  onDelete,
}: {
  apps: App[];
  onUpload: (id: number) => void;
  onManageVersions: (app: App) => void;
  onEdit: (app: App) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[80px]">
                ID
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                App
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Platform
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Package
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Version
              </th>
              <th
                className="h-10 px-4 text-center align-middle font-medium text-muted-foreground"
                title="Total Downloads"
              >
                <Download className="h-4 w-4 mx-auto" />
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {apps.map((app) => (
              <tr
                key={app.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                  #{app.id}
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden">
                      {app.icon_path ? (
                        <img
                          src={`/api/icon?appId=${app.id}&t=${new Date().getTime()}`}
                          alt={app.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium">{app.name}</span>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      app.platform === "ios"
                        ? "border-transparent bg-primary text-primary-foreground shadow"
                        : "border-transparent bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {app.platform.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 align-middle text-muted-foreground font-mono text-[12px]">
                  {app.package_name}
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {app.latest_version || "N/A"}
                </td>
                <td className="p-4 align-middle text-center font-medium">
                  {app.download_count || 0}
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(app)}
                      className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8"
                      title="Edit App"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onManageVersions(app)}
                      className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8"
                      title="Manage Versions"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(app.id)}
                      className="inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                      title="Delete App"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onUpload(app.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      New Version
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserList({
  users,
  onAssign,
  onChangePassword,
  onDelete,
}: {
  users: User[];
  onAssign: (id: number) => void;
  onChangePassword: (user: User) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Username
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Role
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle font-medium">
                  {user.username}
                </td>
                <td className="p-4 align-middle capitalize">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      user.role === "admin"
                        ? "border-transparent bg-primary text-primary-foreground shadow"
                        : "border-transparent bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onChangePassword(user)}
                      className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      title="Change Password"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Password
                    </button>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => onAssign(user.id)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3 text-primary"
                      >
                        Assign Apps
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(user.id)}
                      className="inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Shadcn Modal Components
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h2>
        </div>
        {children}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function FormItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function AddAppModal({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [platform, setPlatform] = useState<"android" | "ios">("android");
  const [icon, setIcon] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name || "Auto-extracting...");
      formData.append("package_name", packageName || "pending");
      formData.append("platform", platform);
      if (icon) formData.append("icon", icon);

      await createAppAction(formData);
      refresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to add application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Application" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md border border-dashed mb-2 italic">
          Tip: You can just select the platform and app name. Better yet,
          details will be automatically updated when you upload your first
          build!
        </p>
        <FormItem label="App Icon (optional)">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setIcon(e.target.files?.[0] || null)}
          />
        </FormItem>
        <FormItem label="Initial App Name">
          <Input
            required
            placeholder="QA Runner"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormItem>
        <FormItem label="Bundle ID / Package Name (optional)">
          <Input
            placeholder="com.company.app"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
          />
        </FormItem>
        <FormItem label="Platform">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "android" | "ios")}
          >
            <option value="android">Android (APK/AAB)</option>
            <option value="ios">iOS (IPA)</option>
          </select>
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add App"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditAppModal({
  app,
  onClose,
  refresh,
}: {
  app: App;
  onClose: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState(app.name);
  const [packageName, setPackageName] = useState(app.package_name);
  const [platform, setPlatform] = useState<"android" | "ios">(
    app.platform as "android" | "ios",
  );
  const [icon, setIcon] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("package_name", packageName);
      formData.append("platform", platform);
      if (icon) formData.append("icon", icon);

      await updateAppAction(app.id, formData);
      refresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Edit ${app.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Change App Icon (optional)">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden">
              {app.icon_path ? (
                <img
                  src={`/api/icon?appId=${app.id}&t=${new Date().getTime()}`}
                  alt={app.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setIcon(e.target.files?.[0] || null)}
            />
          </div>
        </FormItem>
        <FormItem label="App Name">
          <Input
            required
            placeholder="QA Runner"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormItem>
        <FormItem label="Bundle ID / Package Name">
          <Input
            required
            placeholder="com.company.app"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
          />
        </FormItem>
        <FormItem label="Platform">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "android" | "ios")}
          >
            <option value="android">Android (APK/AAB)</option>
            <option value="ios">iOS (IPA)</option>
          </select>
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddUserModal({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createUserAction({
        username,
        password_hash: password,
        role,
      });
      if (result.error) {
        alert(result.error);
      } else {
        refresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal title="Add QA User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Username">
          <Input
            required
            placeholder="qa.tester"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormItem>
        <FormItem label="Password">
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormItem>
        <FormItem label="Role">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
          >
            <option value="user">QA User</option>
            <option value="admin">Admin</option>
          </select>
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Add User
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UploadModal({
  appId,
  onClose,
  refresh,
}: {
  appId: number;
  onClose: () => void;
  refresh: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [build, setBuild] = useState("");
  const [changelog, setChangelog] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("appId", appId.toString());
    formData.append("versionNumber", version);
    formData.append("buildNumber", build);
    formData.append("changelog", changelog);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      refresh();
      onClose();
    } else {
      const err = await res.json();
      alert(err.error || "Upload failed");
    }
    setUploading(false);
  };

  return (
    <Modal title="Upload New Version" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Binary (APK/AAB/IPA)">
          <Input
            required
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </FormItem>
        <div className="grid grid-cols-2 gap-4">
          <FormItem label="Version (optional)">
            <Input
              placeholder="Auto-detect"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </FormItem>
          <FormItem label="Build (optional)">
            <Input
              placeholder="Auto-detect"
              value={build}
              onChange={(e) => setBuild(e.target.value)}
            />
          </FormItem>
        </div>
        <p className="text-[10px] text-muted-foreground -mt-2">
          Note: .aab files will be automatically converted to universal .apk.
        </p>
        <FormItem label="Release Notes">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="What's new in this build?"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
          />
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "Uploading & Processing..." : "Upload Version"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignmentModal({
  userId,
  apps,
  onClose,
}: {
  userId: number;
  apps: App[];
  onClose: () => void;
}) {
  const [assignedAppIds, setAssignedAppIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchAssignments = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getAssignmentsAction(userId);
      setAssignedAppIds(data.map((a: { app_id: number }) => a.app_id));
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await updateAssignmentsAction(userId, assignedAppIds);
      if (result.error) {
        alert(result.error);
      } else {
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Assign Applications" onClose={onClose}>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : apps.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No apps available to assign.
          </p>
        ) : (
          apps.map((app) => (
            <div key={app.id} className="flex items-center space-x-3">
              <input
                id={`app-${app.id}`}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={assignedAppIds.includes(app.id)}
                onChange={(e) => {
                  if (e.target.checked)
                    setAssignedAppIds([...assignedAppIds, app.id]);
                  else
                    setAssignedAppIds(
                      assignedAppIds.filter((id) => id !== app.id),
                    );
                }}
              />
              <label
                htmlFor={`app-${app.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {app.name}{" "}
                <span className="text-muted-foreground ml-1">
                  ({app.platform.toUpperCase()})
                </span>
              </label>
            </div>
          ))
        )}
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || fetching}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}

function AdminVersionModal({
  app,
  onClose,
  refreshApps,
  onManagePublicLinks,
}: {
  app: App;
  onClose: () => void;
  refreshApps: () => void;
  onManagePublicLinks: (version: Version) => void;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAppVersionsAction(app.id);
      setVersions(data as unknown as Version[]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [app.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVersions();
  }, [fetchVersions]);

  const handleDelete = async (versionId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this version? This action cannot be undone.",
      )
    )
      return;

    try {
      await deleteVersionAction(versionId);
      await fetchVersions();
      refreshApps();
    } catch (e) {
      alert("Failed to delete version.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl rounded-lg border bg-card p-6 shadow-lg sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex flex-col space-y-1.5 mb-6">
          <h2 className="text-xl font-semibold leading-none tracking-tight">
            Manage Versions: {app.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            View and delete existing builds.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No versions found.
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 transition-colors">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Version
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Build
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {versions.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-3 px-4 align-middle font-medium">
                        v{v.version_number}
                      </td>
                      <td className="p-3 px-4 align-middle text-muted-foreground">
                        {v.build_number || "-"}
                      </td>
                      <td className="p-3 px-4 align-middle text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(v.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/download?versionId=${v.id}`}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            APK/IPA
                          </a>
                          {v.original_file_path && (
                            <a
                              href={`/api/download?versionId=${v.id}&type=original`}
                              className="inline-flex h-8 items-center justify-center rounded-md border border-primary/30 bg-primary/5 px-3 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-primary/10"
                              title="Download original uploaded file (e.g. AAB)"
                            >
                              <Download className="mr-1 h-3.5 w-3.5" />
                              AAB
                            </a>
                          )}
                          <button
                            onClick={() => onManagePublicLinks(v)}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <Link className="mr-1 h-3.5 w-3.5" />
                            Share
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="inline-flex h-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 px-3 text-xs font-medium transition-colors"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ChangePasswordModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await changePasswordAction(user.id, password);
      alert("Password changed successfully");
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Change Password for ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="New Password">
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormItem>
        <FormItem label="Confirm New Password">
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function GroupList({
  groups,
  onAssign,
  onDelete,
}: {
  groups: Group[];
  onAssign: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Group Name
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Description
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Created
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {groups.map((group) => (
              <tr
                key={group.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle font-medium">{group.name}</td>
                <td className="p-4 align-middle text-muted-foreground">
                  {group.description || "No description"}
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {group.created_at
                    ? new Date(group.created_at).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onAssign(group.id)}
                      className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3 text-primary"
                    >
                      Manage Members
                    </button>
                    <button
                      onClick={() => onDelete(group.id)}
                      className="inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                      title="Delete Group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  No groups found. Create your first distribution group to
                  simplify access management.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddGroupModal({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createGroupAction({ name, description });
      if (result.error) {
        alert(result.error);
      } else {
        refresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Distribution Group" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Group Name">
          <Input
            required
            placeholder="Beta Testers"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormItem>
        <FormItem label="Description">
          <Input
            placeholder="Internal QA team and beta testers"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function GroupAssignmentModal({
  groupId,
  users,
  apps,
  onClose,
}: {
  groupId: number;
  users: User[];
  apps: App[];
  onClose: () => void;
}) {
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [assignedAppIds, setAssignedAppIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"users" | "apps">("users");

  const fetchAssignments = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getGroupAssignmentsAction(groupId);
      setAssignedUserIds(data.userIds);
      setAssignedAppIds(data.appIds);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [groupId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await updateGroupAssignmentsAction(
        groupId,
        assignedUserIds,
        assignedAppIds,
      );
      if (result.error) {
        alert(result.error);
      } else {
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Manage Group Memberships" onClose={onClose}>
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveSubTab("apps")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "apps" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Applications
        </button>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : activeSubTab === "users" ? (
          users
            .filter((u) => u.role !== "admin")
            .map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <input
                  id={`user-${user.id}`}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={assignedUserIds.includes(user.id)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setAssignedUserIds([...assignedUserIds, user.id]);
                    else
                      setAssignedUserIds(
                        assignedUserIds.filter((id) => id !== user.id),
                      );
                  }}
                />
                <label
                  htmlFor={`user-${user.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {user.username}
                </label>
              </div>
            ))
        ) : (
          apps.map((app) => (
            <div key={app.id} className="flex items-center space-x-3">
              <input
                id={`app-${app.id}`}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={assignedAppIds.includes(app.id)}
                onChange={(e) => {
                  if (e.target.checked)
                    setAssignedAppIds([...assignedAppIds, app.id]);
                  else
                    setAssignedAppIds(
                      assignedAppIds.filter((id) => id !== app.id),
                    );
                }}
              />
              <label
                htmlFor={`app-${app.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {app.name}{" "}
                <span className="text-muted-foreground ml-1">
                  ({app.platform.toUpperCase()})
                </span>
              </label>
            </div>
          ))
        )}
        {!fetching &&
          activeSubTab === "users" &&
          users.filter((u) => u.role !== "admin").length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No users available.
            </p>
          )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || fetching}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}

function ApiKeyList({
  apiKeys,
  onDelete,
}: {
  apiKeys: ApiKey[];
  onDelete: (id: number) => void;
}) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = async (text: string, id: number) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Key Name
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Key (Masked)
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Created
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {apiKeys.map((key) => (
              <tr
                key={key.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle font-medium">{key.name}</td>
                <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                  {key.key.substring(0, 8)}...
                  {key.key.substring(key.key.length - 4)}
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {key.created_at
                    ? new Date(key.created_at).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => copyToClipboard(key.key, key.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
                      title="Copy API Key"
                    >
                      {copiedId === key.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(key.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/20 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete API Key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {apiKeys.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  No API keys found. Generate a key to automate build uploads
                  via CI/CD.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddApiKeyModal({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createApiKeyAction(name);
      if (result.key) {
        setGeneratedKey(result.key);
        refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Generate CI/CD API Key" onClose={onClose}>
      {!generatedKey ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground mb-4">
            Use API keys to securely upload builds from your CI/CD pipeline
            (GitHub Actions, Jenkins, etc.).
          </p>
          <FormItem label="Key Name (e.g., GitHub Production)">
            <Input
              required
              placeholder="Main Build Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormItem>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Key"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  API Key Generated
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Copy this key now. It will not be shown again for security
                    reasons.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <pre className="p-4 bg-muted rounded-md font-mono text-xs break-all whitespace-pre-wrap border select-all">
              {generatedKey}
            </pre>
            <button
              onClick={() => copyToClipboard(generatedKey)}
              className="absolute top-2 right-2 p-2 rounded-md bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            I&apos;ve copied the key
          </button>
        </div>
      )}
    </Modal>
  );
}

function PublicLinkModal({
  version,
  onClose,
}: {
  version: Version;
  onClose: () => void;
}) {
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setLoadingCreating] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>("7");
  const [password, setPassword] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicLinksAction(version.id);
      setLinks(data as unknown as PublicLink[]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [version.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLinks();
  }, [fetchLinks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreating(true);
    try {
      await createPublicLinkAction({
        version_id: version.id,
        expires_in_days: expiresIn ? parseInt(expiresIn, 10) : undefined,
        password: password || undefined,
      });
      setPassword("");
      await fetchLinks();
    } catch (e) {
      alert("Failed to create link");
    }
    setLoadingCreating(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePublicLinkAction(id);
      await fetchLinks();
    } catch (e) {
      alert("Failed to delete link");
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.protocol}//${window.location.host}/p/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <Modal title={`Share Version v${version.version_number}`} onClose={onClose}>
      <div className="space-y-6">
        <form
          onSubmit={handleCreate}
          className="space-y-4 p-4 border rounded-lg bg-muted/30"
        >
          <h3 className="text-sm font-medium">Create New Shareable Link</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormItem label="Expires in (days)">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
              >
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="">Never</option>
              </select>
            </FormItem>
            <FormItem label="Password (optional)">
              <Input
                type="password"
                placeholder="Leave empty for none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormItem>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full inline-flex h-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Generate Share Link"}
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Active Links</h3>
          {loading ? (
            <div className="h-20 bg-muted animate-pulse rounded-md" />
          ) : links.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4 italic">
              No active share links for this version.
            </p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-muted-foreground">
                      {link.token.substring(0, 8)}...
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {link.expires_at
                        ? `Exp: ${new Date(link.expires_at).toLocaleDateString()}`
                        : "Never expires"}
                      {link.password_hash && (
                        <span className="ml-1 text-primary">● Protected</span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyLink(link.token)}
                      className="inline-flex h-8 px-2 items-center justify-center rounded-md border hover:bg-accent"
                    >
                      {copiedToken === link.token ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1 text-xs">
                        {copiedToken === link.token ? "Copied" : "Copy"}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function SettingsView({
  settings,
  webhooks,
  onUpdateRetention,
  onAddWebhook,
  onDeleteWebhook,
  onToggleWebhook,
}: {
  settings: any;
  webhooks: any[];
  onUpdateRetention: (count: string) => void;
  onAddWebhook: () => void;
  onDeleteWebhook: (id: number) => void;
  onToggleWebhook: (id: number, active: boolean) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Retention Policy */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Storage Retention Policy</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Automatically delete old builds to save server disk space. When a new
          version is uploaded, older versions beyond this limit will be
          permanently removed.
        </p>
        <div className="flex items-center gap-4 max-w-sm">
          <FormItem label="Keep last N versions (0 = unlimited)">
            <Input
              type="number"
              min="0"
              value={settings.retention_count}
              onChange={(e) => onUpdateRetention(e.target.value)}
            />
          </FormItem>
        </div>
      </div>

      {/* Webhooks */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Outgoing Webhooks</h3>
          </div>
          <button
            onClick={onAddWebhook}
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Webhook
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 transition-colors">
                <th className="h-10 px-6 text-left align-middle font-medium text-muted-foreground">
                  Name
                </th>
                <th className="h-10 px-6 text-left align-middle font-medium text-muted-foreground">
                  URL
                </th>
                <th className="h-10 px-6 text-center align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-10 px-6 text-right align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {webhooks.map((wh) => (
                <tr
                  key={wh.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="p-4 px-6 align-middle font-medium">
                    {wh.name}
                  </td>
                  <td className="p-4 px-6 align-middle font-mono text-xs text-muted-foreground max-w-[300px] truncate">
                    {wh.url}
                  </td>
                  <td className="p-4 px-6 align-middle text-center">
                    <button
                      onClick={() => onToggleWebhook(wh.id, !wh.is_active)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                        wh.is_active
                          ? "border-transparent bg-green-100 text-green-800"
                          : "border-transparent bg-gray-100 text-gray-800"
                      }`}
                    >
                      {wh.is_active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="p-4 px-6 align-middle text-right">
                    <button
                      onClick={() => onDeleteWebhook(wh.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/20 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {webhooks.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground italic"
                  >
                    No webhooks configured. Add a webhook to notify Slack or
                    Teams when new builds are ready.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AddWebhookModal({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createWebhookAction({ name, url });
      refresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to add webhook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Outgoing Webhook" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Webhook Name (e.g., Slack Channel)">
          <Input
            required
            placeholder="Testing Notifications"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormItem>
        <FormItem label="Endpoint URL">
          <Input
            required
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Webhook"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
