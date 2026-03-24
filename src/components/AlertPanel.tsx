import { antennas } from "@/lib/antennaData";
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";

export default function AlertPanel() {
  const alerts = [
    ...antennas.filter(a => a.unauthorizedCount > 0).map(a => ({
      type: "unauthorized" as const,
      message: `${a.name}: ${a.unauthorizedCount} unauthorized carrier(s) detected`,
      time: "Just now",
    })),
    ...antennas.filter(a => a.status === "offline").map(a => ({
      type: "offline" as const,
      message: `${a.name}: Node unreachable – heartbeat lost`,
      time: "5 min ago",
    })),
  ];

  if (alerts.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-status-warning" />
        Interference Alerts
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {alerts.map((a, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 p-2 rounded text-xs ${
              a.type === "unauthorized"
                ? "bg-status-unauthorized/5 border border-status-unauthorized/20 text-status-unauthorized"
                : "bg-status-warning/5 border border-status-warning/20 text-status-warning"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p>{a.message}</p>
              <p className="text-[10px] opacity-60 flex items-center gap-1 mt-0.5">
                <Clock className="h-2.5 w-2.5" /> {a.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
