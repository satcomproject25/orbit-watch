import { useParams, Link } from "react-router-dom";
import { getAntennaBySlug } from "@/lib/antennaData";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  Satellite, MapPin, Radio, Cpu, Server, Globe, ArrowLeft,
  Download, Activity, BarChart3
} from "lucide-react";

export default function AntennaDetail() {
  const { slug } = useParams<{ slug: string }>();
  const antenna = getAntennaBySlug(slug || "");

  if (!antenna) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Antenna not found.</p>
      </div>
    );
  }

  const online = antenna.status === "online";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="glass-card p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div className={`p-4 rounded-xl ${online ? "bg-status-online/10" : "bg-status-offline/10"}`}>
            <Satellite className={`h-10 w-10 ${online ? "text-status-online" : "text-status-offline"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-foreground">{antenna.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${online ? "bg-status-online/10 text-status-online" : "bg-status-offline/10 text-status-offline"}`}>
                {online ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{antenna.stationLocation}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" className="text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              <Link to={`/antenna/${antenna.slug}/spectrum`}>
                <BarChart3 className="h-3 w-3 mr-1" /> Open Spectrum Monitor
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="text-xs border-border">
              <Download className="h-3 w-3 mr-1" /> Export Report
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Globe, label: "Orbital Position", value: antenna.location },
            { icon: Radio, label: "Band", value: antenna.band },
            { icon: Activity, label: "Freq Range", value: antenna.frequencyRange },
            { icon: Radio, label: "Bandwidth", value: antenna.allocatedBandwidth },
            { icon: Cpu, label: "SDR Type", value: antenna.sdrType },
            { icon: Server, label: "Pi Node", value: antenna.piNodeId },
            { icon: MapPin, label: "Lat / Lng", value: `${antenna.lat}° / ${antenna.lng}°` },
            { icon: Activity, label: "Carriers", value: `${antenna.carrierCount} (${antenna.unauthorizedCount} unauth)` },
          ].map((item, i) => (
            <div key={i} className="glass-card px-4 py-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <item.icon className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-sm font-mono font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Authorized Frequencies */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
            Authorized Carrier Frequencies
          </h3>
          <div className="flex flex-wrap gap-2">
            {antenna.authorizedFrequencies.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-status-authorized/10 text-xs font-mono text-status-authorized border border-status-authorized/20">
                {f} MHz
              </span>
            ))}
          </div>
        </div>

        {/* Connection Info */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
            Node Connection
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Pi IP:</span>
              <span className="ml-2 font-mono text-foreground">{antenna.piIp}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Port:</span>
              <span className="ml-2 font-mono text-foreground">{antenna.piPort}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Heartbeat:</span>
              <span className="ml-2 font-mono text-foreground">{new Date(antenna.lastHeartbeat).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className={`ml-2 font-mono font-semibold ${online ? "text-status-online" : "text-status-offline"}`}>
                {online ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
