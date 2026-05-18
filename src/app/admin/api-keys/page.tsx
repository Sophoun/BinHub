"use client";

import React, { useState, useEffect } from "react";
import { useAdminData } from "../_hooks/use-admin-data";
import { handleDeleteApiKey } from "../_utils/admin-helpers";
import { ApiKeyList } from "../_components/api-key-list";
import { AddApiKeyModal } from "../_components/modals/add-api-key-modal";

export default function ApiKeysPage() {
  const { apiKeys, fetchApiKeys, loading } = useAdminData();
  const [showAddApiKey, setShowAddApiKey] = useState(false);

  useEffect(() => {
    const handleOpenAddModal = (e: any) => {
      if (e.detail.tab === 'api-keys') setShowAddApiKey(true);
    };
    window.addEventListener('open-add-modal', handleOpenAddModal);
    return () => window.removeEventListener('open-add-modal', handleOpenAddModal);
  }, []);

  if (loading && apiKeys.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <ApiKeyList apiKeys={apiKeys} onDelete={(id) => handleDeleteApiKey(id, fetchApiKeys)} />

      {showAddApiKey && (
        <AddApiKeyModal onClose={() => setShowAddApiKey(false)} refresh={fetchApiKeys} />
      )}
    </>
  );
}
