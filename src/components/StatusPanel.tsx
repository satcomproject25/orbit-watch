import { antennas } from "@/lib/antennaData";
import { Activity, AlertTriangle, Radio, Wifi } from "lucide-react";

export default function StatusPanel() {
  const online = antennas.filter((a) => a.status === "online").length;
  const totalCarriers = antennas.reduce((s, a) => s + a.carrierCount, 0);
  const totalUnauthorized = antennas.reduce((s, a) => s + a.unauthorizedCount, 0);

  const stats = [
    { label: "Nodes Online", value: `${online}/${antennas.length}`, icon: Wifi, color: "text-status-online" },
    { label: "Total Carriers", value: totalCarriers, icon: Radio, color: "text-primary" },
    { label: "Unauthorized", value: totalUnauthorized, icon: AlertTriangle, color: totalUnauthorized > 0 ? "text-status-unauthorized" : "text-status-online" },
    { label: "Active Monitoring", value: online, icon: Activity, color: "text-status-monitoring" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="glass-card px-4 py-3 flex items-center gap-3">
          <s.icon className={`h-5 w-5 ${s.color}`} />
          <div>
            <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
