import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Antenna } from "@/lib/antennaData";

function generateSpectrumData(antenna: Antenna) {
  const points = [];
  const freqStart = antenna.authorizedFrequencies[0] - 50;
  const freqEnd = antenna.authorizedFrequencies[antenna.authorizedFrequencies.length - 1] + 50;
  const step = 2;
  for (let f = freqStart; f <= freqEnd; f += step) {
    const isAuth = antenna.authorizedFrequencies.some((af) => Math.abs(f - af) < 10);
    const noiseFloor = -90 + Math.random() * 5;
    let power = noiseFloor;
    if (isAuth) {
      power = -30 + Math.random() * 15;
    }
    // simulate unauthorized spike
    if (antenna.unauthorizedCount > 0 && f === antenna.authorizedFrequencies[2] + 25) {
      power = -40 + Math.random() * 10;
    }
    points.push({ freq: f, power: Math.round(power * 10) / 10, noiseFloor: -88 });
  }
  return points;
}

export default function SpectrumPlot({ antenna, live = false }: { antenna: Antenna; live?: boolean }) {
  const [data, setData] = useState(() => generateSpectrumData(antenna));

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setData(generateSpectrumData(antenna)), 2000);
    return () => clearInterval(t);
  }, [antenna, live]);

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
