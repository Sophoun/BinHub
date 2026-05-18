"use client";

import React, { useState } from "react";
import { useAdminData } from "../_hooks/use-admin-data";
import { handleDeleteWebhook, handleToggleWebhook } from "../_utils/admin-helpers";
import { SettingsView } from "../_components/settings-view";
import { AddWebhookModal } from "../_components/modals/add-webhook-modal";
import { updateSettingsAction } from "@/src/lib/actions";

export default function SettingsPage() {
  const { settings, webhooks, fetchWebhooks, fetchSettings, loading } = useAdminData();
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local settings when data is fetched
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (loading && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const onUpdateRetention = async (count: string) => {
    setLocalSettings({ ...localSettings, retention_count: count });
    await updateSettingsAction("retention_count", count);
    fetchSettings();
  };

  return (
    <>
      <SettingsView
        settings={localSettings}
        webhooks={webhooks}
        onUpdateRetention={onUpdateRetention}
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
