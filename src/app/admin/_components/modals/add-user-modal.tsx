"use client";

import React, { useState } from "react";
import { Modal, FormItem, Input } from "../ui";
import { createUserAction } from "@/src/lib/actions";

export function AddUserModal({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createUserAction({
        username,
        password_hash: password,
        role,
      });
      if (result.error) {
        alert(result.error);
      } else {
        refresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal title="Add QA User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Username">
          <Input
            required
            placeholder="qa.tester"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormItem>
        <FormItem label="Password">
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormItem>
        <FormItem label="Role">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
          >
            <option value="user">QA User</option>
            <option value="admin">Admin</option>
          </select>
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
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Add User
          </button>
        </div>
      </form>
    </Modal>
  );
}
