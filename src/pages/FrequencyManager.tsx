import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { antennas } from "@/lib/antennaData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Radio } from "lucide-react";

export default function FrequencyManager() {
  const [selected, setSelected] = useState(antennas[0].slug);
  const antenna = antennas.find((a) => a.slug === selected)!;
  const [freqs, setFreqs] = useState(antenna.authorizedFrequencies);
  const [newFreq, setNewFreq] = useState("");

  const handleSelect = (slug: string) => {
    setSelected(slug);
    const a = antennas.find((x) => x.slug === slug)!;
    setFreqs(a.authorizedFrequencies);
  };

  const addFreq = () => {
    const f = parseInt(newFreq);
    if (!isNaN(f) && !freqs.includes(f)) {
      setFreqs([...freqs, f].sort((a, b) => a - b));
      setNewFreq("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" /> Authorized Frequency Manager
        </h1>

        <div className="flex gap-2 flex-wrap">
          {antennas.map((a) => (
            <Button
              key={a.slug}
              size="sm"
              variant={selected === a.slug ? "default" : "outline"}
              className="text-xs"
              onClick={() => handleSelect(a.slug)}
            >
              {a.name}
            </Button>
          ))}
        </div>

        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">{antenna.name}</h2>
          <p className="text-xs text-muted-foreground mb-4">{antenna.band} • {antenna.frequencyRange}</p>

          <div className="flex gap-2 mb-4">
            <Input value={newFreq} onChange={(e) => setNewFreq(e.target.value)} placeholder="Frequency (MHz)" type="number" className="max-w-[200px] bg-background/50 border-border text-sm" />
            <Button size="sm" onClick={addFreq} className="bg-status-authorized/10 text-status-authorized border border-status-authorized/20">
              <Plus className="h-3 w-3 mr-1" /> Add Frequency
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {freqs.map((f) => (
              <div key={f} className="flex items-center justify-between px-3 py-2 rounded bg-secondary text-sm font-mono text-foreground">
                {f} MHz
                <button onClick={() => setFreqs(freqs.filter((x) => x !== f))} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">Changes will sync to config_manager.py on connected Pi node.</p>
        </div>
      </div>
    </div>
  );
}
