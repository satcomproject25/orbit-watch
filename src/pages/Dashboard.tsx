import { antennas } from "@/lib/antennaData";
import AntennaCard from "@/components/AntennaCard";
import StatusPanel from "@/components/StatusPanel";
import AlertPanel from "@/components/AlertPanel";
import DashboardHeader from "@/components/DashboardHeader";
import dashboardBg from "@/assets/dashboard-bg.jpg";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="relative">
        <img src={dashboardBg} alt="" className="absolute inset-0 w-full h-64 object-cover opacity-15" />
        <div className="absolute inset-0 h-64 bg-gradient-to-b from-transparent to-background" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="text-center pt-4 pb-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Carrier Monitoring System</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">Multi-Antenna SDR Surveillance Dashboard</p>
          </div>

          <StatusPanel />
          <AlertPanel />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Antenna Nodes ({antennas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {antennas.map((a) => (
                <AntennaCard key={a.id} antenna={a} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
