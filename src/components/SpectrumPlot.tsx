import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Antenna } from "@/lib/antennaData";

// Fixed "detected" carrier positions per antenna (simulates what the antenna actually receives)
function getDetectedCarriers(antenna: Antenna): number[] {
  // Use all authorized freqs plus some extra unauthorized ones as detected carriers
  const detected = [...antenna.authorizedFrequencies];
  // Add some unauthorized carriers based on antenna id for consistency
  const baseFreq = antenna.authorizedFrequencies[0];
  const range = antenna.authorizedFrequencies[antenna.authorizedFrequencies.length - 1] - baseFreq;
  if (antenna.unauthorizedCount > 0) {
    detected.push(baseFreq + Math.round(range * 0.35));
    if (antenna.unauthorizedCount > 1) {
      detected.push(baseFreq + Math.round(range * 0.72));
    }
  }
  // Add a few more "received" carriers that aren't necessarily in authorized list
  detected.push(baseFreq + Math.round(range * 0.15));
  detected.push(baseFreq + Math.round(range * 0.55));
  detected.push(baseFreq + Math.round(range * 0.85));
  // Deduplicate
  return [...new Set(detected)].sort((a, b) => a - b);
}

function generateSpectrumData(antenna: Antenna, detectedCarriers: number[]) {
  const points = [];
  const allFreqs = detectedCarriers;
  const freqStart = Math.min(...allFreqs) - 50;
  const freqEnd = Math.max(...allFreqs) + 50;
  const step = 2;
  for (let f = freqStart; f <= freqEnd; f += step) {
    const nearDetected = detectedCarriers.some((cf) => Math.abs(f - cf) < 10);
    const isAuth = antenna.authorizedFrequencies.some((af) => Math.abs(f - af) < 10);
    const noiseFloor = -90 + Math.random() * 5;
    let power = noiseFloor;
    if (nearDetected) {
      power = -30 + Math.random() * 15;
    }
    points.push({
      freq: f,
      power: Math.round(power * 10) / 10,
      authPower: nearDetected && isAuth ? Math.round(power * 10) / 10 : undefined,
      unauthPower: nearDetected && !isAuth ? Math.round(power * 10) / 10 : undefined,
      noiseFloor: -88,
    });
  }
  return points;
}

export default function SpectrumPlot({ antenna, live = false }: { antenna: Antenna; live?: boolean }) {
  const detectedCarriers = useMemo(() => getDetectedCarriers(antenna), [antenna.id]);
  const [data, setData] = useState(() => generateSpectrumData(antenna, detectedCarriers));

  useEffect(() => {
    setData(generateSpectrumData(antenna, detectedCarriers));
  }, [antenna.authorizedFrequencies, detectedCarriers]);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setData(generateSpectrumData(antenna, detectedCarriers)), 2000);
    return () => clearInterval(t);
  }, [antenna, live, detectedCarriers]);

  const authFreqs = useMemo(() => antenna.authorizedFrequencies, [antenna]);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Spectrum – {antenna.name}
        </h3>
        {live && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-status-monitoring">
            <span className="status-dot-online" style={{ width: 6, height: 6 }} />
            LIVE
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
          <XAxis dataKey="freq" tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} label={{ value: "Frequency (MHz)", position: "insideBottom", offset: -2, style: { fontSize: 10, fill: "hsl(215 12% 55%)" } }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} label={{ value: "Power (dBm)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(215 12% 55%)" } }} domain={[-100, -10]} />
          <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 14% 18%)", borderRadius: 6, fontSize: 11 }} />
          <Line type="monotone" dataKey="noiseFloor" stroke="hsl(45 93% 55%)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Noise Floor" />
          <Line type="monotone" dataKey="power" stroke="hsl(190 85% 50%)" strokeWidth={1.5} dot={false} name="Signal Power" />
          {authFreqs.map((f) => (
            <ReferenceLine key={f} x={f} stroke="hsl(142 76% 45% / 0.3)" strokeDasharray="2 2" />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Signal</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-warning inline-block" /> Noise Floor</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-authorized/30 inline-block" /> Auth. Freq</span>
      </div>
    </div>
  );
}
