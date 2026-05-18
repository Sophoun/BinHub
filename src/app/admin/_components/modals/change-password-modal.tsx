"use client";

import React, { useState } from "react";
import { Modal, FormItem, Input } from "../ui";
import { changePasswordAction } from "@/src/lib/actions";
import { User } from "../../_hooks/use-admin-data";

export function ChangePasswordModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await changePasswordAction(user.id, password);
      alert("Password changed successfully");
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Change Password for ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="New Password">
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormItem>
        <FormItem label="Confirm New Password">
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
