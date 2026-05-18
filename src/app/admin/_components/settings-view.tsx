"use client";

import React from "react";
import { HardDrive, Bell, Plus, Trash2 } from "lucide-react";
import { FormItem, Input } from "./ui";

export function SettingsView({
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
