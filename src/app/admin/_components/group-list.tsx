"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Group } from "../_hooks/use-admin-data";

export function GroupList({
  groups,
  onAssign,
  onDelete,
}: {
  groups: Group[];
  onAssign: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Group Name
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Description
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
            {groups.map((group) => (
              <tr
                key={group.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle font-medium">{group.name}</td>
                <td className="p-4 align-middle text-muted-foreground">
                  {group.description || "No description"}
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {group.created_at
                    ? new Date(group.created_at).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onAssign(group.id)}
                      className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3 text-primary"
                    >
                      Manage Members
                    </button>
                    <button
                      onClick={() => onDelete(group.id)}
                      className="inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                      title="Delete Group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  No groups found. Create your first distribution group to
                  simplify access management.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
