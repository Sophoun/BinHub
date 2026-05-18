"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "../ui";
import { getAssignmentsAction, updateAssignmentsAction } from "@/src/lib/actions";
import { App } from "../../_hooks/use-admin-data";

export function AssignmentModal({
  userId,
  apps,
  onClose,
}: {
  userId: number;
  apps: App[];
  onClose: () => void;
}) {
  const [assignedAppIds, setAssignedAppIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchAssignments = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getAssignmentsAction(userId);
      setAssignedAppIds(data.map((a: { app_id: number }) => a.app_id));
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await updateAssignmentsAction(userId, assignedAppIds);
      if (result.error) {
        alert(result.error);
      } else {
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Assign Applications" onClose={onClose}>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : apps.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No apps available to assign.
          </p>
        ) : (
          apps.map((app) => (
            <div key={app.id} className="flex items-center space-x-3">
              <input
                id={`app-${app.id}`}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={assignedAppIds.includes(app.id)}
                onChange={(e) => {
                  if (e.target.checked)
                    setAssignedAppIds([...assignedAppIds, app.id]);
                  else
                    setAssignedAppIds(
                      assignedAppIds.filter((id) => id !== app.id),
                    );
                }}
              />
              <label
                htmlFor={`app-${app.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {app.name}{" "}
                <span className="text-muted-foreground ml-1">
                  ({app.platform.toUpperCase()})
                </span>
              </label>
            </div>
          ))
        )}
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || fetching}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}
