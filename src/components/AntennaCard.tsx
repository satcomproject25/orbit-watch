import { Link } from "react-router-dom";
import { Antenna } from "@/lib/antennaData";
import { Satellite, MapPin, Radio, Activity, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AntennaCard({ antenna }: { antenna: Antenna }) {
  const online = antenna.status === "online";

  return (
    <div className="glass-card p-5 flex flex-col gap-4 animate-fade-in group hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${online ? "bg-status-online/10" : "bg-status-offline/10"}`}>
            <Satellite className={`h-5 w-5 ${online ? "text-status-online" : "text-status-offline"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{antenna.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {antenna.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={online ? "status-dot-online" : "status-dot-offline"} />
          <span className={`text-xs font-mono font-semibold ${online ? "text-status-online" : "text-status-offline"}`}>
            {online ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Radio className="h-3 w-3" /> {antenna.band}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span className="text-status-authorized">{antenna.carrierCount}</span> carriers
        </div>
        <div className="text-muted-foreground col-span-2 font-mono text-[10px]">
          {antenna.stationLocation}
        </div>
      </div>

      {antenna.unauthorizedCount > 0 && (
        <div className="bg-status-unauthorized/10 border border-status-unauthorized/20 rounded px-3 py-1.5 text-xs text-status-unauthorized font-mono flex items-center gap-2">
          <span className="status-dot-offline" />
          {antenna.unauthorizedCount} unauthorized carrier(s) detected
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <Button asChild variant="outline" size="sm" className="flex-1 text-xs border-border hover:border-primary hover:text-primary">
          <Link to={`/antenna/${antenna.slug}`}>
            <Eye className="h-3 w-3 mr-1" /> Details
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
          <Link to={`/antenna/${antenna.slug}#spectrum`}>
            <BarChart3 className="h-3 w-3 mr-1" /> Spectrum
          </Link>
        </Button>
      </div>
    </div>
  );
}
