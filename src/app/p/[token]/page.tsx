'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Smartphone, Download, ShieldCheck, AlertCircle, Calendar, Package, Clock, Lock } from 'lucide-react';
import { getPublicLinkInfoAction, verifyPublicLinkPasswordAction } from '@/src/lib/actions';
import { ThemeToggle } from '@/src/components/theme-toggle';

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicLinkInfoAction(token);
      if (!data) {
        setError('This link is invalid or has been deleted.');
      } else if ('expired' in data && (data as any).expired) {
        setError('This link has expired.');
      } else if (data && 'has_password' in (data as any)) {
        setInfo(data);
        if (!(data as any).has_password) {
          setAuthorized(true);
        }
      } else {
        setError('Invalid link data.');
      }
    } catch (e) {
      setError('An error occurred while loading the link.');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const result = await verifyPublicLinkPasswordAction(token, password);
      if (result.success) {
        setAuthorized(true);
      } else {
        alert('Invalid password. Please try again.');
      }
    } catch (e) {
      alert('Verification failed.');
    }
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center text-foreground">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Link Unavailable</h1>
        <p className="text-muted-foreground max-w-md">{error}</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Password Protected</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter the password to access this build.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleVerify}>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password"
                type="password"
                required
                autoFocus
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Access Build'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { version, app } = info;
  const isIos = app.platform === 'ios';
  
  // ITMS services link for iOS
  const manifestUrl = `${window.location.protocol}//${window.location.host}/api/public/manifest?token=${token}&password=${encodeURIComponent(password)}`;
  const itmsUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;
  
  // Direct download link for APK/IPA
  const downloadUrl = `/api/public/download?token=${token}&password=${encodeURIComponent(password)}`;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 text-foreground transition-colors duration-300">
      <header className="flex h-16 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Smartphone className="h-5 w-5 text-primary" />
          <span>BinHub Share</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-8 rounded-2xl border bg-card p-8 shadow-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted shadow-inner overflow-hidden border-4 border-card">
                {app.icon_path ? (
                  <img 
                    src={`/api/icon?appId=${app.id}`} 
                    alt={app.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-card">
                {isIos ? <span className="text-[14px]">🍎</span> : <span className="text-[14px]">🤖</span>}
              </div>
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight">{app.name}</h1>
            <p className="text-sm font-mono text-muted-foreground mt-1">{app.package_name}</p>
            
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground shadow-sm">
                v{version.version_number}
              </span>
              {version.build_number && (
                <span className="text-xs text-muted-foreground">
                  Build ({version.build_number})
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 py-4">
            {isIos ? (
              <a 
                href={itmsUrl}
                className="flex h-14 items-center justify-center gap-3 rounded-xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                <Download className="h-5 w-5" />
                <span className="text-lg font-bold">Install on iOS</span>
              </a>
            ) : (
              <a 
                href={downloadUrl}
                className="flex h-14 items-center justify-center gap-3 rounded-xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                <Download className="h-5 w-5" />
                <span className="text-lg font-bold">Download APK</span>
              </a>
            )}
            
            {isIos && (
              <a 
                href={downloadUrl}
                className="flex h-10 items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Download IPA File Directly
              </a>
            )}
          </div>

          {version.changelog && (
            <div className="rounded-xl bg-muted/50 p-6 space-y-2 border border-dashed">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Release Notes</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap italic">"{version.changelog}"</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Released on {new Date(version.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
            {info.expires_at && (
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="h-3.5 w-3.5" />
                <span>Link expires in {Math.ceil((new Date(info.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified and Secure Build via BinHub</span>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-xs text-muted-foreground opacity-50 text-center w-full">
          Powered by BinHub • Internal Binary Distribution
        </p>
      </main>
    </div>
  );
}
