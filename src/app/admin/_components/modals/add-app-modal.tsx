"use client";

import React, { useState } from "react";
import { Modal, FormItem, Input } from "../ui";
import { createAppAction } from "@/src/lib/actions";

export function AddAppModal({
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
  
  // Android Keystore states
  const [ksFile, setKsFile] = useState<File | null>(null);
  const [ksPass, setKsPass] = useState("");
  const [ksAlias, setKsAlias] = useState("");
  const [keyPass, setKeyPass] = useState("");
  const [minifyEnabled, setMinifyEnabled] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name || "Auto-extracting...");
      formData.append("package_name", packageName || "pending");
      formData.append("platform", platform);
      formData.append("minify_enabled", String(minifyEnabled));
      if (icon) formData.append("icon", icon);
      
      if (platform === "android") {
        if (ksFile) formData.append("android_keystore_file", ksFile);
        formData.append("android_keystore_pass", ksPass);
        formData.append("android_key_alias", ksAlias);
        formData.append("android_key_pass", keyPass);
      }

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
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
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

        {platform === "android" && (
          <>
            <div className="mt-4 p-4 border rounded-md bg-muted/30 space-y-4">
              <h4 className="text-sm font-semibold">Build Requirements</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="minify_enabled"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={minifyEnabled}
                  onChange={(e) => setMinifyEnabled(e.target.checked)}
                />
                <label
                  htmlFor="minify_enabled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Require Minified Build (ProGuard/R8)
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                If enabled, uploads that are not obfuscated/minified will be rejected.
              </p>
            </div>

            <div className="mt-4 p-4 border rounded-md bg-muted/30 space-y-3">
              <h4 className="text-sm font-semibold">Android Keystore (Optional)</h4>
              <p className="text-xs text-muted-foreground">
                Required for AAB to signed APK conversion.
              </p>
              <FormItem label="Keystore File (.keystore, .jks)">
                <Input
                  type="file"
                  accept=".keystore,.jks"
                  onChange={(e) => setKsFile(e.target.files?.[0] || null)}
                />
              </FormItem>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormItem label="Keystore Password">
                  <Input
                    type="password"
                    value={ksPass}
                    onChange={(e) => setKsPass(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormItem>
                <FormItem label="Key Alias">
                  <Input
                    value={ksAlias}
                    onChange={(e) => setKsAlias(e.target.value)}
                    placeholder="release-key"
                  />
                </FormItem>
                <FormItem label="Key Password">
                  <Input
                    type="password"
                    value={keyPass}
                    onChange={(e) => setKeyPass(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormItem>
              </div>
            </div>
          </>
        )}

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
