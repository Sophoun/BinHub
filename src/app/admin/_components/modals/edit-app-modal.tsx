/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Package } from "lucide-react";
import { Modal, FormItem, Input } from "../ui";
import { updateAppAction } from "@/src/lib/actions";
import { App } from "../../_hooks/use-admin-data";

export function EditAppModal({
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
