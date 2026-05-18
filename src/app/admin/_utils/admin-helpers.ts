"use client";

import {
  deleteAppAction,
  deleteUserAction,
  deleteGroupAction,
  deleteApiKeyAction,
  deleteWebhookAction,
  toggleWebhookAction,
} from "@/src/lib/actions";

export async function handleDeleteApp(appId: number, onSuccess: () => void) {
  if (
    !confirm(
      "Are you sure you want to delete this application and all of its versions? This action cannot be undone.",
    )
  )
    return;
  try {
    await deleteAppAction(appId);
    onSuccess();
  } catch (e) {
    alert("Failed to delete application.");
  }
}

export async function handleDeleteUser(userId: number, onSuccess: () => void) {
  if (
    !confirm(
      "Are you sure you want to delete this user? This action cannot be undone.",
    )
  )
    return;
  try {
    const result = await deleteUserAction(userId);
    if (result.error) {
      alert(result.error);
    } else {
      onSuccess();
    }
  } catch (e) {
    alert("Failed to delete user.");
  }
}

export async function handleDeleteGroup(groupId: number, onSuccess: () => void) {
  if (
    !confirm(
      "Are you sure you want to delete this group? Access for users in this group will be revoked.",
    )
  )
    return;
  try {
    await deleteGroupAction(groupId);
    onSuccess();
  } catch (e) {
    alert("Failed to delete group.");
  }
}

export async function handleDeleteApiKey(id: number, onSuccess: () => void) {
  if (
    !confirm(
      "Are you sure you want to delete this API Key? CI/CD pipelines using this key will fail.",
    )
  )
    return;
  try {
    await deleteApiKeyAction(id);
    onSuccess();
  } catch (e) {
    alert("Failed to delete API Key.");
  }
}

export async function handleDeleteWebhook(id: number, onSuccess: () => void) {
  if (!confirm("Are you sure you want to delete this webhook?")) return;
  try {
    await deleteWebhookAction(id);
    onSuccess();
  } catch (e) {
    alert("Failed to delete webhook.");
  }
}

export async function handleToggleWebhook(id: number, active: boolean, onSuccess: () => void) {
  try {
    await toggleWebhookAction(id, active);
    onSuccess();
  } catch (e) {
    alert("Failed to toggle webhook.");
  }
}
