"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Download, Users, ShieldCheck } from "lucide-react";
import { useAdminData, App, Version } from "../_hooks/use-admin-data";
import { handleDeleteApp } from "../_utils/admin-helpers";
import { AppList } from "../_components/app-list";
import { AddAppModal } from "../_components/modals/add-app-modal";
import { EditAppModal } from "../_components/modals/edit-app-modal";
import { UploadModal } from "../_components/modals/upload-modal";
import { AdminVersionModal } from "../_components/modals/admin-version-modal";
import { PublicLinkModal } from "../_components/modals/public-link-modal";

export default function AppsPage() {
  const { apps, users, groups, fetchApps, loading } = useAdminData();
  const [showAddApp, setShowAddApp] = useState(false);
  const [showEditApp, setShowEditApp] = useState<App | null>(null);
  const [showUpload, setShowUpload] = useState<number | null>(null);
  const [manageVersionsApp, setManageVersionsApp] = useState<App | null>(null);
  const [showPublicLinks, setShowPublicLinks] = useState<Version | null>(null);

  useEffect(() => {
    const handleOpenAddModal = (e: any) => {
      if (e.detail.tab === 'apps') setShowAddApp(true);
    };
    window.addEventListener('open-add-modal', handleOpenAddModal);
    return () => window.removeEventListener('open-add-modal', handleOpenAddModal);
  }, []);

  if (loading && apps.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const totalDownloads = apps.reduce((acc, app) => acc + (app.download_count || 0), 0);
  const qaUsersCount = users.filter((u) => u.role === "user").length;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Smartphone} label="Total Apps" value={apps.length} />
        <StatCard icon={Download} label="Downloads" value={totalDownloads} />
        <StatCard icon={Users} label="QA Users" value={qaUsersCount} />
        <StatCard icon={ShieldCheck} label="Active Groups" value={groups.length} />
      </div>

      <AppList
        apps={apps}
        onUpload={(id) => setShowUpload(id)}
        onManageVersions={(app) => setManageVersionsApp(app)}
        onEdit={(app) => setShowEditApp(app)}
        onDelete={(id) => handleDeleteApp(id, fetchApps)}
      />

      {showAddApp && (
        <AddAppModal onClose={() => setShowAddApp(false)} refresh={fetchApps} />
      )}
      {showEditApp && (
        <EditAppModal
          app={showEditApp}
          onClose={() => setShowEditApp(null)}
          refresh={fetchApps}
        />
      )}
      {showUpload && (
        <UploadModal
          appId={showUpload}
          onClose={() => setShowUpload(null)}
          refresh={fetchApps}
        />
      )}
      {manageVersionsApp && (
        <AdminVersionModal
          app={manageVersionsApp}
          onClose={() => setManageVersionsApp(null)}
          refreshApps={fetchApps}
          onManagePublicLinks={(v) => setShowPublicLinks(v)}
        />
      )}
      {showPublicLinks && (
        <PublicLinkModal
          version={showPublicLinks}
          onClose={() => setShowPublicLinks(null)}
        />
      )}
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any, label: string, value: number }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}
