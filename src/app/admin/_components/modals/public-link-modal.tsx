"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Check, Copy, Trash2 } from "lucide-react";
import { Modal, FormItem, Input } from "../ui";
import { getPublicLinksAction, createPublicLinkAction, deletePublicLinkAction } from "@/src/lib/actions";
import { Version } from "../../_hooks/use-admin-data";
import { copyToClipboard } from "@/src/lib/utils";

interface PublicLink {
  id: number;
  token: string;
  expires_at: string | null;
  password_hash: string | null;
  created_at: string | null;
}

export function PublicLinkModal({
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

  const copyLink = async (token: string) => {
    const url = `${window.location.protocol}//${window.location.host}/p/${token}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
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
