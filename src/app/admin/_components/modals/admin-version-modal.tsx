"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Download, Link, Trash2 } from "lucide-react";
import { getAppVersionsAction, deleteVersionAction } from "@/src/lib/actions";
import { App, Version } from "../../_hooks/use-admin-data";

export function AdminVersionModal({
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
