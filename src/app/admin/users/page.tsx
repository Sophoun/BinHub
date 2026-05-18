"use client";

import React, { useState, useEffect } from "react";
import { useAdminData, User } from "../_hooks/use-admin-data";
import { handleDeleteUser } from "../_utils/admin-helpers";
import { UserList } from "../_components/user-list";
import { AddUserModal } from "../_components/modals/add-user-modal";
import { AssignmentModal } from "../_components/modals/assignment-modal";
import { ChangePasswordModal } from "../_components/modals/change-password-modal";

export default function UsersPage() {
  const { users, apps, fetchUsers, loading } = useAdminData();
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAssignments, setShowAssignments] = useState<number | null>(null);
  const [showChangePassword, setShowChangePassword] = useState<User | null>(null);

  useEffect(() => {
    const handleOpenAddModal = (e: any) => {
      if (e.detail.tab === 'users') setShowAddUser(true);
    };
    window.addEventListener('open-add-modal', handleOpenAddModal);
    return () => window.removeEventListener('open-add-modal', handleOpenAddModal);
  }, []);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <UserList
        users={users}
        onAssign={(id) => setShowAssignments(id)}
        onChangePassword={(user) => setShowChangePassword(user)}
        onDelete={(id) => handleDeleteUser(id, fetchUsers)}
      />

      {showAddUser && (
        <AddUserModal onClose={() => setShowAddUser(false)} refresh={fetchUsers} />
      )}
      {showAssignments && (
        <AssignmentModal
          userId={showAssignments}
          apps={apps}
          onClose={() => setShowAssignments(null)}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal
          user={showChangePassword}
          onClose={() => setShowChangePassword(null)}
        />
      )}
    </>
  );
}
