"use client";

import React, { useState } from "react";
import { Modal, FormItem, Input, Textarea } from "../ui";

export function UploadModal({
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
    try {
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
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred during upload");
    } finally {
      setUploading(false);
    }
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
          <Textarea
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
