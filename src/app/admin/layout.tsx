"use client";

import React from "react";
import {
  Smartphone,
  LayoutDashboard,
  History,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { logoutAction } from "@/src/lib/actions";
import { ThemeToggle } from "@/src/components/theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  const getActiveTab = () => {
    if (pathname.includes("/admin/apps")) return "apps";
    if (pathname.includes("/admin/groups")) return "groups";
    if (pathname.includes("/admin/users")) return "users";
    if (pathname.includes("/admin/api-keys")) return "api-keys";
    if (pathname.includes("/admin/settings")) return "settings";
    return "apps";
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: "apps", label: "Apps", icon: LayoutDashboard, href: "/admin/apps" },
    { id: "groups", label: "Groups", icon: History, href: "/admin/groups" },
    { id: "users", label: "Users", icon: Users, href: "/admin/users" },
    { id: "api-keys", label: "API Keys", icon: ShieldCheck, href: "/admin/api-keys" },
    { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
  ];

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
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  activeTab === item.id
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
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
                   const event = new CustomEvent('open-add-modal', { detail: { tab: activeTab } });
                   window.dispatchEvent(event);
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
