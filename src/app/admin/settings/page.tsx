"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAdminData } from "../_hooks/use-admin-data";
import { handleDeleteWebhook, handleToggleWebhook } from "../_utils/admin-helpers";
import { SettingsView } from "../_components/settings-view";
import { AddWebhookModal } from "../_components/modals/add-webhook-modal";
import { updateSettingsAction } from "@/src/lib/actions";

export default function SettingsPage() {
  const { settings, webhooks, fetchWebhooks, fetchSettings, loading } = useAdminData();
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const isSyncingRef = useRef(false);

  // Sync local settings when remote settings are loaded/changed
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (loading && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const onUpdateSetting = async (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    await updateSettingsAction(key, value);
    fetchSettings();
  };

  const onUpdateRetention = (count: string) => onUpdateSetting("retention_count", count);

  return (
    <>
      <SettingsView
        settings={localSettings}
        webhooks={webhooks}
        onUpdateRetention={onUpdateRetention}
        onUpdateSetting={onUpdateSetting}
        onAddWebhook={() => setShowAddWebhook(true)}
        onDeleteWebhook={(id) => handleDeleteWebhook(id, fetchWebhooks)}
        onToggleWebhook={(id, active) => handleToggleWebhook(id, active, fetchWebhooks)}
      />

      {showAddWebhook && (
        <AddWebhookModal onClose={() => setShowAddWebhook(false)} refresh={fetchWebhooks} />
      )}
    </>
  );
}
