import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Map, Radio, Database, Settings, LogOut, Shield, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Antenna Map", to: "/map", icon: Map },
  { label: "Frequency Manager", to: "/frequencies", icon: Radio },
  { label: "Dataset Monitoring", to: "/dataset", icon: Database },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function DashboardHeader() {
  const { logout } = useAuth();
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="header-gradient border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div className="leading-tight">
            <p className="text-xs font-mono text-muted-foreground tracking-widest">ISRO – ISTRAC</p>
            <p className="text-sm font-semibold text-foreground">Carrier Monitoring System</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Bell className="h-4 w-4 text-status-warning animate-pulse" />
            <span className="text-xs text-status-warning font-mono">3 Alerts</span>
          </div>
          <div className="text-right leading-tight hidden sm:block">
            <p className="text-xs text-muted-foreground font-mono">
              {now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <p className="text-xs text-primary font-mono font-semibold">
              {now.toLocaleTimeString("en-IN", { hour12: false })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4 mr-1" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
