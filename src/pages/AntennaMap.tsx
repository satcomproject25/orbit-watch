import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { antennas } from "@/lib/antennaData";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const onlineIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:hsl(142,76%,45%);border:2px solid hsl(142,76%,35%);box-shadow:0 0 10px hsl(142,76%,45%,0.5)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const offlineIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:hsl(0,72%,51%);border:2px solid hsl(0,72%,41%);box-shadow:0 0 10px hsl(0,72%,51%,0.5)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function AntennaMap() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-lg font-bold text-foreground mb-4">Satellite Antenna Location Map</h1>
        <div className="glass-card overflow-hidden rounded-lg" style={{ height: "70vh" }}>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {antennas.map((a) => (
              <Marker key={a.id} position={[a.lat, a.lng]} icon={a.status === "online" ? onlineIcon : offlineIcon}>
                <Popup>
                  <div className="text-xs space-y-1 min-w-[160px]">
                    <p className="font-bold text-sm">{a.name}</p>
                    <p>{a.stationLocation}</p>
                    <p>{a.band} • {a.location}</p>
                    <p className={a.status === "online" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {a.status.toUpperCase()}
                    </p>
                    <Button size="sm" className="w-full mt-1 text-xs" onClick={() => navigate(`/antenna/${a.slug}`)}>
                      <Eye className="h-3 w-3 mr-1" /> View Details
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
