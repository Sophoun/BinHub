"use client";

import React, { useState } from "react";
import { Modal, FormItem, Input } from "../ui";
import { createWebhookAction } from "@/src/lib/actions";

export function AddWebhookModal({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createWebhookAction({ name, url });
      refresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to add webhook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Outgoing Webhook" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Webhook Name (e.g., Slack Channel)">
          <Input
            required
            placeholder="Testing Notifications"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormItem>
        <FormItem label="Endpoint URL">
          <Input
            required
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </FormItem>
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
            {loading ? "Adding..." : "Add Webhook"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
