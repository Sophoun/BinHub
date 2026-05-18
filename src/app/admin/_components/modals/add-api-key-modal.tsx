"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal, FormItem, Input } from "../ui";
import { createApiKeyAction } from "@/src/lib/actions";
import { copyToClipboard } from "@/src/lib/utils";

export function AddApiKeyModal({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createApiKeyAction(name);
      if (result.key) {
        setGeneratedKey(result.key);
        refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Modal title="Generate CI/CD API Key" onClose={onClose}>
      {!generatedKey ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground mb-4">
            Use API keys to securely upload builds from your CI/CD pipeline
            (GitHub Actions, Jenkins, etc.).
          </p>
          <FormItem label="Key Name (e.g., GitHub Production)">
            <Input
              required
              placeholder="Main Build Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              {loading ? "Generating..." : "Generate Key"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  API Key Generated
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Copy this key now. It will not be shown again for security
                    reasons.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <pre className="p-4 bg-muted rounded-md font-mono text-xs break-all whitespace-pre-wrap border select-all">
              {generatedKey}
            </pre>
            <button
              onClick={() => handleCopy(generatedKey)}
              className="absolute top-2 right-2 p-2 rounded-md bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy to clipboard"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            I&apos;ve copied the key
          </button>
        </div>
      )}
    </Modal>
  );
}
