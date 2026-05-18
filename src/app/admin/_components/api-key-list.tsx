"use client";

import React, { useState } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import { ApiKey } from "../_hooks/use-admin-data";
import { copyToClipboard } from "@/src/lib/utils";

export function ApiKeyList({
  apiKeys,
  onDelete,
}: {
  apiKeys: ApiKey[];
  onDelete: (id: number) => void;
}) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (text: string, id: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
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
                      onClick={() => handleCopy(key.key, key.id)}
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
