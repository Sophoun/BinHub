"use client";

import React, { useState, useEffect } from "react";
import { useAdminData } from "../_hooks/use-admin-data";
import { handleDeleteGroup } from "../_utils/admin-helpers";
import { GroupList } from "../_components/group-list";
import { AddGroupModal } from "../_components/modals/add-group-modal";
import { GroupAssignmentModal } from "../_components/modals/group-assignment-modal";

export default function GroupsPage() {
  const { groups, users, apps, fetchGroups, loading } = useAdminData();
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showGroupAssignments, setShowGroupAssignments] = useState<number | null>(null);

  useEffect(() => {
    const handleOpenAddModal = (e: any) => {
      if (e.detail.tab === 'groups') setShowAddGroup(true);
    };
    window.addEventListener('open-add-modal', handleOpenAddModal);
    return () => window.removeEventListener('open-add-modal', handleOpenAddModal);
  }, []);

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <GroupList
        groups={groups}
        onAssign={(id) => setShowGroupAssignments(id)}
        onDelete={(id) => handleDeleteGroup(id, fetchGroups)}
      />

      {showAddGroup && (
        <AddGroupModal onClose={() => setShowAddGroup(false)} refresh={fetchGroups} />
      )}
      {showGroupAssignments && (
        <GroupAssignmentModal
          groupId={showGroupAssignments}
          users={users}
          apps={apps}
          onClose={() => setShowGroupAssignments(null)}
        />
      )}
    </>
  );
}
