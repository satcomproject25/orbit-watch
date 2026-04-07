import { useParams, Link } from "react-router-dom";
import { getAntennaBySlug } from "@/lib/antennaData";
import DashboardHeader from "@/components/DashboardHeader";
import SpectrumPlot from "@/components/SpectrumPlot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Plus, Trash2, Upload, Download, Activity, Eye
} from "lucide-react";
import { useState } from "react";

export default function AntennaSpectrum() {
  const { slug } = useParams<{ slug: string }>();
  const antenna = getAntennaBySlug(slug || "");
  const [authFreqs, setAuthFreqs] = useState(antenna?.authorizedFrequencies || []);
  const [newFreq, setNewFreq] = useState("");
  const [liveMode, setLiveMode] = useState(false);

  if (!antenna) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Antenna not found.</p>
      </div>
    );
  }

  const addFreq = () => {
    const f = parseInt(newFreq);
    if (!isNaN(f) && !authFreqs.includes(f)) {
      setAuthFreqs([...authFreqs, f].sort((a, b) => a - b));
      setNewFreq("");
    }
  };

  const removeFreq = (f: number) => setAuthFreqs(authFreqs.filter((x) => x !== f));

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/antenna/${slug}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Back to Details
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <Eye className="h-3 w-3" /> Dashboard
          </Link>
        </div>

        {/* Title */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Spectrum Monitor – {antenna.name}</h1>
            <p className="text-xs text-muted-foreground">{antenna.frequencyRange} • {antenna.band} • {antenna.sdrType}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs border-border">
              <Download className="h-3 w-3 mr-1" /> Snapshot
            </Button>
            <Button size="sm" variant="outline" className="text-xs border-border">
              <Download className="h-3 w-3 mr-1" /> Export Report
            </Button>
          </div>
        </div>

        {/* Monitoring Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setLiveMode(true)}
            className={`flex-1 ${liveMode ? "bg-status-monitoring/20 text-status-monitoring border border-status-monitoring/30" : "bg-secondary text-secondary-foreground"}`}
            variant="outline"
          >
            <Activity className="h-4 w-4 mr-2" /> Monitor Signals (LIVE SDR)
          </Button>
          <Button
            onClick={() => setLiveMode(false)}
            className={`flex-1 ${!liveMode ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary text-secondary-foreground"}`}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" /> Monitor From Dataset
          </Button>
        </div>

        {/* Spectrum Plot */}
        <SpectrumPlot antenna={{ ...antenna, authorizedFrequencies: authFreqs }} live={liveMode} />

        {!liveMode && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Upload Dataset</h3>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drop CSV, MAT, or TXT file here</p>
              <p className="text-[10px] text-muted-foreground mt-1">Backend integration pending</p>
            </div>
          </div>
        )}

        {/* Config Manager */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
            Authorized Carrier Frequencies (config_manager.py)
          </h3>
          <div className="flex gap-2 mb-3">
            <Input
              value={newFreq}
              onChange={(e) => setNewFreq(e.target.value)}
              placeholder="Frequency (MHz)"
              className="bg-background/50 border-border max-w-[200px] text-sm"
              type="number"
            />
            <Button size="sm" onClick={addFreq} className="bg-status-authorized/10 text-status-authorized border border-status-authorized/20 hover:bg-status-authorized/20">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {authFreqs.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs font-mono text-foreground">
                {f} MHz
                <button onClick={() => removeFreq(f)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
