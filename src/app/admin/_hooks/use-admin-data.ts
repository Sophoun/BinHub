"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAppsAction,
  getUsersAction,
  getGroupsAction,
  getApiKeysAction,
  getWebhooksAction,
  getSettingsAction,
} from "@/src/lib/actions";
import type { App as BaseApp } from "@/src/lib/db";

// Types
export interface User {
  id: number;
  username: string;
  role: "admin" | "user";
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  created_at: string | null;
}

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string | null;
}

export interface App extends BaseApp {
  latest_version?: string;
  download_count?: number;
  android_keystore_path?: string | null;
  android_keystore_pass?: string | null;
  android_key_alias?: string | null;
  android_key_pass?: string | null;
  minify_enabled?: boolean;
}

export interface Version {
  id: number;
  version_number: string;
  build_number?: string;
  changelog?: string;
  created_at: string;
  file_path: string;
  original_file_path?: string;
}

export function useAdminData() {
  const [apps, setApps] = useState<App[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ retention_count: "0" });
  const [loading, setLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    try {
      const data = await getAppsAction();
      setApps(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsersAction();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const data = await getGroupsAction();
      setGroups(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      const data = await getApiKeysAction();
      setApiKeys(data as unknown as ApiKey[]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchWebhooks = useCallback(async () => {
    try {
      const data = await getWebhooksAction();
      setWebhooks(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettingsAction();
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchApps(),
      fetchUsers(),
      fetchGroups(),
      fetchApiKeys(),
      fetchWebhooks(),
      fetchSettings(),
    ]);
    setLoading(false);
  }, [fetchApps, fetchUsers, fetchGroups, fetchApiKeys, fetchWebhooks, fetchSettings]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    apps,
    users,
    groups,
    apiKeys,
    webhooks,
    settings,
    loading,
    refreshAll,
    fetchApps,
    fetchUsers,
    fetchGroups,
    fetchApiKeys,
    fetchWebhooks,
    fetchSettings,
  };
}
