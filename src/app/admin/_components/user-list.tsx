"use client";

import React from "react";
import { Key, Trash2 } from "lucide-react";
import { User } from "../_hooks/use-admin-data";

export function UserList({
  users,
  onAssign,
  onChangePassword,
  onDelete,
}: {
  users: User[];
  onAssign: (id: number) => void;
  onChangePassword: (user: User) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Username
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Role
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle font-medium">
                  {user.username}
                </td>
                <td className="p-4 align-middle capitalize">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      user.role === "admin"
                        ? "border-transparent bg-primary text-primary-foreground shadow"
                        : "border-transparent bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onChangePassword(user)}
                      className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      title="Change Password"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Password
                    </button>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => onAssign(user.id)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3 text-primary"
                      >
                        Assign Apps
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(user.id)}
                      className="inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
