"use client";

import React from "react";
import { HardDrive, Bell, Plus, Trash2, ShieldCheck } from "lucide-react";
import { testLdapConnectionAction } from "@/src/lib/actions";
import { FormItem, Input } from "./ui";

export function SettingsView({
  settings,
  webhooks,
  onUpdateRetention,
  onUpdateSetting,
  onAddWebhook,
  onDeleteWebhook,
  onToggleWebhook,
}: {
  settings: any;
  webhooks: any[];
  onUpdateRetention: (count: string) => void;
  onUpdateSetting: (key: string, value: string) => void;
  onAddWebhook: () => void;
  onDeleteWebhook: (id: number) => void;
  onToggleWebhook: (id: number, active: boolean) => void;
}) {
  return (
    <div className="space-y-8">
      {/* LDAP Authentication */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">LDAP Authentication</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Configure LDAP authentication as a fallback method for user login.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="LDAP URL (Required)">
            <Input
              value={settings.ldap_url || ""}
              onChange={(e) => onUpdateSetting("ldap_url", e.target.value)}
              placeholder="ldap://ldap.example.com:389"
            />
          </FormItem>
          <FormItem label="Base DN (Required)">
            <Input
              value={settings.ldap_base_dn || ""}
              onChange={(e) => onUpdateSetting("ldap_base_dn", e.target.value)}
              placeholder="dc=example,dc=com"
            />
          </FormItem>
          <FormItem label="Bind DN (Optional)">
            <Input
              value={settings.ldap_bind_dn || ""}
              onChange={(e) => onUpdateSetting("ldap_bind_dn", e.target.value)}
              placeholder="cn=admin,dc=example,dc=com"
            />
          </FormItem>
          <FormItem label="Bind Password (Optional)">
            <Input
              type="password"
              value={settings.ldap_bind_password || ""}
              onChange={(e) => onUpdateSetting("ldap_bind_password", e.target.value)}
              placeholder="••••••••"
            />
          </FormItem>
          <FormItem label="Search Filter (Optional)">
            <Input
              value={settings.ldap_search_filter || ""}
              onChange={(e) => onUpdateSetting("ldap_search_filter", e.target.value)}
              placeholder="(&(objectClass=user)(sAMAccountName={{username}}))"
            />
          </FormItem>
          <div className="flex items-end">
            <button
              onClick={async () => {
                const res = (await testLdapConnectionAction()) as { success: boolean; message: string };
                alert(res.message);
              }}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>

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
              value={settings.retention_count || "0"}
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
