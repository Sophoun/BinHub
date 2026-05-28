"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  LogOut,
  Smartphone,
  Package,
  Calendar,
  Clock,
  History,
  QrCode,
  Check,
  Copy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getMyAppsAction,
  logoutAction,
  getAppVersionsAction,
  getDownloadTokenAction,
} from "@/src/lib/actions";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { copyToClipboard } from "@/src/lib/utils";
import QRCode from "qrcode";

interface AppWithVersion {
  id: number;
  name: string;
  package_name: string;
  platform: "android" | "ios";
  icon_path?: string | null;
  version_id?: number | null;
  version_number?: string | null;
  build_number?: string | null;
  changelog?: string | null;
  version_date?: string | null;
}

interface Version {
  id: number;
  version_number: string;
  build_number?: string | null;
  changelog?: string | null;
  created_at: string | null;
}

export default function UserDashboard() {
  const [apps, setApps] = useState<AppWithVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppHistory, setSelectedAppHistory] =
    useState<AppWithVersion | null>(null);
  const [showQRApp, setShowQRApp] = useState<AppWithVersion | null>(null);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const router = useRouter();

  const fetchApps = useCallback(async () => {
    try {
      const [appsData, token] = await Promise.all([
        getMyAppsAction(),
        getDownloadTokenAction(),
      ]);
      setApps(appsData);
      setDownloadToken(token);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApps();
  }, [fetchApps]);

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  const handleInstall = (platform: "android" | "ios", versionId: number) => {
    const tokenQuery = downloadToken
      ? `&token=${encodeURIComponent(downloadToken)}`
      : "";
    if (platform === "android") {
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = `/api/download?versionId=${versionId}${tokenQuery}`;
    } else {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const manifestUrl = `${protocol}//${host}/api/manifest?versionId=${versionId}${tokenQuery}`;
      const itmsUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = itmsUrl;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Smartphone className="h-5 w-5 text-primary" />
            <span>BinHub</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted/20 pb-12 pt-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Applications
            </h2>
            <p className="text-sm text-muted-foreground">
              Available builds for your account
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-lg border bg-card animate-pulse"
                />
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
                <div
                  key={app.id}
                  className="group relative flex flex-col rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted overflow-hidden transition-colors group-hover:shadow-sm">
                      {app.icon_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/icon?appId=${app.id}&t=${new Date().getTime()}`}
                          alt={app.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                        app.platform === "ios"
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-transparent bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {app.platform.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 mb-6">
                    <h3 className="font-semibold leading-none tracking-tight">
                      {app.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {app.package_name}
                    </p>
                  </div>

                  {app.version_id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            v{app.version_number} ({app.build_number || "1"})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {app.version_date
                              ? new Date(app.version_date).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      {app.changelog && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                          &ldquo;{app.changelog}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleInstall(app.platform, app.version_id!)
                          }
                          className="flex-1 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {app.platform === "ios" ? "Install" : "Download"}
                        </button>
                        <button
                          onClick={() => setShowQRApp(app)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          title="QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedAppHistory(app)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          title="Version History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                      </div>
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

      {selectedAppHistory && (
        <VersionHistoryModal
          app={selectedAppHistory}
          onClose={() => setSelectedAppHistory(null)}
          onInstall={(versionId) =>
            handleInstall(selectedAppHistory.platform, versionId)
          }
        />
      )}

      {showQRApp && (
        <QRCodeModal
          app={showQRApp}
          onClose={() => setShowQRApp(null)}
          token={downloadToken}
        />
      )}

      <footer className="border-t py-6 bg-card">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground font-medium">
          &copy; {new Date().getFullYear()} BinHub &bull; Build Distribution
        </div>
      </footer>
    </div>
  );
}

function VersionHistoryModal({
  app,
  onClose,
  onInstall,
}: {
  app: AppWithVersion;
  onClose: () => void;
  onInstall: (versionId: number) => void;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const data = await getAppVersionsAction(app.id);
        setVersions(data as unknown as Version[]);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchVersions();
  }, [app.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex flex-col space-y-1.5 mb-6">
          <h2 className="text-xl font-semibold leading-none tracking-tight">
            {app.name} History
          </h2>
          <p className="text-sm text-muted-foreground">
            Download previous versions of this application
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No versions found.
            </div>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      v{v.version_number}
                    </span>
                    {v.build_number && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                        Build {v.build_number}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {v.created_at
                      ? new Date(v.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                  {v.changelog && (
                    <div className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2 line-clamp-2">
                      {v.changelog}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onInstall(v.id)}
                  className="shrink-0 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  {app.platform === "ios" ? "Install" : "Download"}
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function QRCodeModal({
  app,
  onClose,
  token,
}: {
  app: AppWithVersion;
  onClose: () => void;
  token: string | null;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [installUrl, setInstallUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const protocol = window.location.protocol;
        const host = window.location.host;
        let url = "";
        const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : "";

        if (app.platform === "android") {
          url = `${protocol}//${host}/api/download?versionId=${app.version_id}${tokenQuery}`;
        } else {
          const manifestUrl = `${protocol}//${host}/api/manifest?versionId=${app.version_id}${tokenQuery}`;
          url = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;
        }

        setInstallUrl(url);
        const dataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error(err);
      }
    };

    if (app.version_id) {
      generateQR();
    }
  }, [app, token]);

  const handleCopy = async () => {
    const success = await copyToClipboard(installUrl);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center">
        <div className="flex flex-col space-y-1.5 text-center mb-6">
          <h2 className="text-xl font-semibold leading-none tracking-tight">
            Scan to {app.platform === "ios" ? "Install" : "Download"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {app.name} v{app.version_number}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-inner mb-6">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="h-48 w-48 sm:h-64 sm:w-64"
            />
          ) : (
            <div className="h-48 w-48 sm:h-64 sm:w-64 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          )}
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={handleCopy}
            className={`w-full inline-flex h-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${isCopied ? "bg-green-50 text-green-600 border-green-200" : "bg-background hover:bg-accent hover:text-accent-foreground"}`}
          >
            {isCopied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied Link!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Install Link
              </>
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Point your camera at the QR code to quickly{" "}
            {app.platform === "ios" ? "install" : "download"} this build on your
            device.
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
