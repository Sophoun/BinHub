'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, LogOut, Smartphone, Package, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AppWithVersion {
  id: number;
  name: string;
  package_name: string;
  platform: 'android' | 'ios';
  version_id?: number;
  version_number?: string;
  build_number?: string;
  changelog?: string;
  version_date?: string;
}

export default function UserDashboard() {
  const [apps, setApps] = useState<AppWithVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchApps = useCallback(async () => {
    const res = await fetch('/api/user/apps');
    if (res.ok) {
      setApps(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleInstall = (app: AppWithVersion) => {
    if (!app.version_id) return;

    if (app.platform === 'android') {
      const url = `/api/download?versionId=${app.version_id}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const manifestUrl = `${protocol}//${host}/api/manifest?versionId=${app.version_id}`;
      const itmsUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;
      window.location.href = itmsUrl;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Smartphone className="h-5 w-5 text-primary" />
            <span>BinHub</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 bg-muted/20 pb-12 pt-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Applications</h2>
            <p className="text-sm text-muted-foreground">
              Available builds for your account
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          ) : apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No apps assigned</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                Contact your administrator to get access to apps.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => (
                <div key={app.id} className="group relative flex flex-col rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Package className="h-6 w-6" />
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      app.platform === 'ios' ? 'border-transparent bg-primary text-primary-foreground' : 'border-transparent bg-secondary text-secondary-foreground'
                    }`}>
                      {app.platform.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 mb-6">
                    <h3 className="font-semibold leading-none tracking-tight">{app.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{app.package_name}</p>
                  </div>

                  {app.version_id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>v{app.version_number} ({app.build_number || '1'})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{app.version_date ? new Date(app.version_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      {app.changelog && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                          &ldquo;{app.changelog}&rdquo;
                        </p>
                      )}

                      <button
                        onClick={() => handleInstall(app)}
                        className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {app.platform === 'ios' ? 'Install' : 'Download'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded-md bg-muted/50 text-xs text-muted-foreground italic">
                      No versions available
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6 bg-card">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground font-medium">
          &copy; {new Date().getFullYear()} BinHub &bull; Build Distribution
        </div>
      </footer>
    </div>
  );
}
