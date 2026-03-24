import DashboardHeader from "@/components/DashboardHeader";
import { useAuth } from "@/lib/auth";
import { Settings, User, Shield, Server, Cpu } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" /> Settings
        </h1>

        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4" /> Current User
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs">Email:</span><p className="font-mono text-foreground">{user?.email}</p></div>
            <div><span className="text-muted-foreground text-xs">Role:</span><p className="font-mono text-foreground capitalize">{user?.role}</p></div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" /> Role-Based Access Control
          </h2>
          <p className="text-xs text-muted-foreground">RBAC integration placeholder. Planned roles: Admin, Engineer, Viewer.</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {["Admin", "Engineer", "Viewer"].map((r) => (
              <div key={r} className="bg-secondary rounded p-3">
                <p className="font-semibold text-foreground">{r}</p>
                <p className="text-muted-foreground mt-1">
                  {r === "Admin" ? "Full system access" : r === "Engineer" ? "Monitor & upload" : "Read-only"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="h-4 w-4" /> System Placeholders
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="bg-secondary rounded p-3"><Cpu className="h-4 w-4 mb-1" /> SNMP Telemetry Integration</div>
            <div className="bg-secondary rounded p-3"><Cpu className="h-4 w-4 mb-1" /> AI Interference Classification</div>
          </div>
        </div>
      </div>
    </div>
  );
}
