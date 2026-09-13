import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { api, connectCommandStream } from "@/api/index.js";
import type { Status } from "@/types.js";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Settings2,
  Container,
  FileText,
  HardDrive,
  ScrollText,
  Users,
  Rocket,
  Loader2,
  AlertCircle,
} from "lucide-react";

function CommandBanner() {
  const [isRunning, setIsRunning] = useState(false);
  const streamRef = useRef(false);

  useEffect(() => {
    function checkStream() {
      if (streamRef.current) return;
      streamRef.current = true;
      connectCommandStream(
        () => {
          setIsRunning(true);
        },
        () => {
          setIsRunning(false);
          streamRef.current = false;
        },
        () => {
          setIsRunning(false);
          streamRef.current = false;
        }
      );
    }

    checkStream();
    window.addEventListener("command-started", checkStream);
    return () => window.removeEventListener("command-started", checkStream);
  }, []);

  if (!isRunning) return null;

  return (
    <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-500 px-8 py-3 flex items-center justify-between text-sm shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-medium tracking-tight">System operation in progress...</span>
      </div>
      <Link to="/logs" className="hover:text-emerald-400 font-medium bg-emerald-500/20 px-3 py-1 rounded-md transition-colors">
        View Live Logs
      </Link>
    </div>
  );
}

function ErrorBanner() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleError(e: Event) {
      const customEvent = e as CustomEvent<string>;
      setError(customEvent.detail);
    }
    function clearError() {
      setError(null);
    }

    window.addEventListener("action-error", handleError);
    window.addEventListener("action-started", clearError);
    return () => {
      window.removeEventListener("action-error", handleError);
      window.removeEventListener("action-started", clearError);
    };
  }, []);

  if (!error) return null;

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 text-destructive px-8 py-3 flex items-center justify-between text-sm shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium tracking-tight whitespace-pre-wrap">{error}</span>
      </div>
      <button onClick={() => setError(null)} className="hover:text-destructive/80 transition-colors shrink-0 ml-4 font-medium">
        Dismiss
      </button>
    </div>
  );
}

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/setup", icon: Rocket, label: "Setup" },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { to: "/containers", icon: Container, label: "Containers" },
      { to: "/environment", icon: FileText, label: "Environment" },
      { to: "/logs", icon: ScrollText, label: "Logs" },
      { to: "/storage", icon: HardDrive, label: "Storage" },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/users", icon: Users, label: "Accounts" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", icon: Settings2, label: "Settings" },
    ],
  },
];

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/setup": "Setup Wizard",
  "/containers": "Containers",
  "/environment": "Environment",
  "/logs": "Logs",
  "/storage": "Storage",
  "/users": "Accounts",
  "/settings": "Settings",
};

export default function Layout() {
  const location = useLocation();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    api.getStatus().then(setStatus).catch(() => { });
  }, []);

  const pageTitle = ROUTE_TITLES[location.pathname] ?? "Pomelo";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-5 py-5 flex items-center gap-3">
          <img src="/icon.svg" alt="Pomelo Icon" className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">Pomelo</h1>
            <p className="text-xs text-sidebar-foreground/50 mt-0.5">Admin Panel</p>
          </div>
        </div>

        <Separator className="bg-sidebar-muted" />

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${isActive
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <Separator className="bg-sidebar-muted" />

        <div className="px-5 py-3 space-y-1">
          <p className="text-[11px] font-mono text-sidebar-foreground/50">
            {status?.currentVersion ?? "No release"}
          </p>
          <p className="text-[11px] font-mono text-sidebar-foreground/50">
            Docker: {status?.dockerAvailable ? "Ready" : "Offline"}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <ErrorBanner />
        <CommandBanner />
        <header className="shrink-0 px-8 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{pageTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Deployment control plane</p>
          </div>
          {status?.isDev && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-tight">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Development Mode
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
