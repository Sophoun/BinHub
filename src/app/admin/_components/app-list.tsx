/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Package, Pencil, History, Trash2, Upload, Download } from "lucide-react";
import { App } from "../_hooks/use-admin-data";

export function AppList({
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
                  colSpan={7}
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
