'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Smartphone, Upload, LogOut, LayoutDashboard, ChevronRight, Package, User as UserIcon, History, Trash2, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { App, User } from '@/src/lib/db';

interface Version {
  id: number;
  version_number: string;
  build_number?: string;
  changelog?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('apps');
  const [apps, setApps] = useState<App[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddApp, setShowAddApp] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showUpload, setShowUpload] = useState<number | null>(null);
  const [showAssignments, setShowAssignments] = useState<number | null>(null);
  const [manageVersionsApp, setManageVersionsApp] = useState<App | null>(null);
  
  const router = useRouter();

  const fetchApps = useCallback(async () => {
    const res = await fetch('/api/admin/apps');
    if (res.ok) setApps(await res.json());
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    fetchApps();
    fetchUsers();
  }, [fetchApps, fetchUsers]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-muted/20 md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Smartphone className="h-5 w-5 text-primary" />
            <span>BinHub</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-4 text-sm font-medium">
            <button
              onClick={() => setActiveTab('apps')}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                activeTab === 'apps' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Apps
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                activeTab === 'users' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              Users
            </button>
          </nav>
        </div>
        <div className="mt-auto border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-card">
          <h2 className="text-lg font-semibold tracking-tight">
            {activeTab === 'apps' ? 'Applications' : 'Users Management'}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={activeTab === 'apps' ? () => setShowAddApp(true) : () => setShowAddUser(true)}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Plus className="mr-2 h-4 w-4" />
              {activeTab === 'apps' ? 'Add App' : 'Add User'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {activeTab === 'apps' ? (
              <AppList 
                apps={apps} 
                onUpload={(id: number) => setShowUpload(id)}
                onManageVersions={(app: App) => setManageVersionsApp(app)}
              />
            ) : (
              <UserList 
                users={users} 
                onAssign={(id: number) => setShowAssignments(id)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAddApp && <AddAppModal onClose={() => setShowAddApp(false)} refresh={fetchApps} />}
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} refresh={fetchUsers} />}
      {showUpload && <UploadModal appId={showUpload} onClose={() => setShowUpload(null)} refresh={fetchApps} />}
      {showAssignments && <AssignmentModal userId={showAssignments} apps={apps} onClose={() => setShowAssignments(null)} />}
      {manageVersionsApp && (
        <AdminVersionModal 
          app={manageVersionsApp} 
          onClose={() => setManageVersionsApp(null)} 
          refreshApps={fetchApps} 
        />
      )}
    </div>
  );
}

function AppList({ apps, onUpload, onManageVersions }: { apps: App[], onUpload: (id: number) => void, onManageVersions: (app: App) => void }) {
  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Platform</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Package</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Version</th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {apps.map((app) => (
              <tr key={app.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle font-medium">{app.name}</td>
                <td className="p-4 align-middle">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    app.platform === 'ios' ? 'border-transparent bg-primary text-primary-foreground shadow' : 'border-transparent bg-secondary text-secondary-foreground'
                  }`}>
                    {app.platform.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 align-middle text-muted-foreground font-mono text-[12px]">{app.package_name}</td>
                <td className="p-4 align-middle text-muted-foreground">{app.latest_version || 'N/A'}</td>
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onManageVersions(app)}
                      className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8"
                      title="Manage Versions"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onUpload(app.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      New Version
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserList({ users, onAssign }: { users: User[], onAssign: (id: number) => void }) {
  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Username</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {users.map((user) => (
              <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle font-medium">{user.username}</td>
                <td className="p-4 align-middle capitalize">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    user.role === 'admin' ? 'border-transparent bg-primary text-primary-foreground shadow' : 'border-transparent bg-secondary text-secondary-foreground'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 align-middle text-right">
                  {user.role !== 'admin' && (
                    <button 
                      onClick={() => onAssign(user.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3 text-primary"
                    >
                      Assign Apps
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Shadcn Modal Components
function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
        </div>
        {children}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

function FormItem({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function AddAppModal({ onClose, refresh }: { onClose: () => void, refresh: () => void }) {
  const [name, setName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [platform, setPlatform] = useState('android');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/apps', {
      method: 'POST',
      body: JSON.stringify({ name, package_name: packageName, platform }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      refresh();
      onClose();
    }
  };

  return (
    <Modal title="Add Application" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="App Name">
          <Input required placeholder="QA Runner" value={name} onChange={(e) => setName(e.target.value)} />
        </FormItem>
        <FormItem label="Bundle ID / Package Name">
          <Input required placeholder="com.company.app" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
        </FormItem>
        <FormItem label="Platform">
          <select 
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="android">Android (APK)</option>
            <option value="ios">iOS (IPA)</option>
          </select>
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button type="button" onClick={onClose} className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0">Cancel</button>
          <button type="submit" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">Add App</button>
        </div>
      </form>
    </Modal>
  );
}

function AddUserModal({ onClose, refresh }: { onClose: () => void, refresh: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      refresh();
      onClose();
    }
  };

  return (
    <Modal title="Add QA User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Username">
          <Input required placeholder="qa.tester" value={username} onChange={(e) => setUsername(e.target.value)} />
        </FormItem>
        <FormItem label="Password">
          <Input required type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormItem>
        <FormItem label="Role">
          <select 
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">QA User</option>
            <option value="admin">Admin</option>
          </select>
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button type="button" onClick={onClose} className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0">Cancel</button>
          <button type="submit" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">Add User</button>
        </div>
      </form>
    </Modal>
  );
}

function UploadModal({ appId, onClose, refresh }: { appId: number, onClose: () => void, refresh: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [build, setBuild] = useState('');
  const [changelog, setChangelog] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('appId', appId.toString());
    formData.append('versionNumber', version);
    formData.append('buildNumber', build);
    formData.append('changelog', changelog);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    if (res.ok) {
      refresh();
      onClose();
    }
    setUploading(false);
  };

  return (
    <Modal title="Upload New Version" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormItem label="Binary (APK/IPA)">
          <Input required type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </FormItem>
        <div className="grid grid-cols-2 gap-4">
          <FormItem label="Version">
            <Input required placeholder="1.0.0" value={version} onChange={(e) => setVersion(e.target.value)} />
          </FormItem>
          <FormItem label="Build">
            <Input placeholder="42" value={build} onChange={(e) => setBuild(e.target.value)} />
          </FormItem>
        </div>
        <FormItem label="Release Notes">
          <textarea 
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="What's new in this build?"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
          />
        </FormItem>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <button type="button" onClick={onClose} className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0">Cancel</button>
          <button type="submit" disabled={uploading} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignmentModal({ userId, apps, onClose }: { userId: number, apps: App[], onClose: () => void }) {
  const [assignedAppIds, setAssignedAppIds] = useState<number[]>([]);

  const fetchAssignments = useCallback(async () => {
    const res = await fetch(`/api/admin/assignments?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setAssignedAppIds(data.map((a: { app_id: number }) => a.app_id));
    }
  }, [userId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSubmit = async () => {
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      body: JSON.stringify({ userId, appIds: assignedAppIds }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) onClose();
  };

  return (
    <Modal title="Assign Applications" onClose={onClose}>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
        {apps.map((app) => (
          <div key={app.id} className="flex items-center space-x-3">
            <input
              id={`app-${app.id}`}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={assignedAppIds.includes(app.id)}
              onChange={(e) => {
                if (e.target.checked) setAssignedAppIds([...assignedAppIds, app.id]);
                else setAssignedAppIds(assignedAppIds.filter(id => id !== app.id));
              }}
            />
            <label htmlFor={`app-${app.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {app.name} <span className="text-muted-foreground ml-1">({app.platform.toUpperCase()})</span>
            </label>
          </div>
        ))}
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <button type="button" onClick={onClose} className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:mt-0">Cancel</button>
        <button onClick={handleSubmit} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">Save Changes</button>
      </div>
    </Modal>
  );
}

function AdminVersionModal({ app, onClose, refreshApps }: { app: App, onClose: () => void, refreshApps: () => void }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/apps/${app.id}/versions`);
    if (res.ok) {
      setVersions(await res.json());
    }
    setLoading(false);
  }, [app.id]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleDelete = async (versionId: number) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) return;
    
    const res = await fetch(`/api/admin/versions/${versionId}`, {
      method: 'DELETE',
    });
    
    if (res.ok) {
      await fetchVersions();
      refreshApps(); // Refresh the main app list in case the latest version was deleted
    } else {
      alert('Failed to delete version.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-lg border bg-card p-6 shadow-lg sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex flex-col space-y-1.5 mb-6">
          <h2 className="text-xl font-semibold leading-none tracking-tight">Manage Versions: {app.name}</h2>
          <p className="text-sm text-muted-foreground">View and delete existing builds.</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No versions found.</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 transition-colors">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Version</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Build</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {versions.map((v) => (
                    <tr key={v.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-3 px-4 align-middle font-medium">v{v.version_number}</td>
                      <td className="p-3 px-4 align-middle text-muted-foreground">{v.build_number || '-'}</td>
                      <td className="p-3 px-4 align-middle text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(v.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 px-4 align-middle text-right">
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="inline-flex h-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 px-3 text-xs font-medium transition-colors"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
