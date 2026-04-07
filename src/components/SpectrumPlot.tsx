import { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";
import { Antenna } from "@/lib/antennaData";

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION — mirrors interference.py parameters
// ═══════════════════════════════════════════════════════════════════
const FFT_SIZE = 2048;
const NF_PERCENTILE = 0.15;
const CARRIER_K_SIGMA = 3.5;
const MORPH_OPEN_BINS = 3;
const MORPH_CLOSE_BINS = 5;
const INTF_BUMP_THRESHOLD_DB = 2;
const NOISE_BASE_DB = -85;
const CARRIER_PEAK_DB = -25;

// ═══════════════════════════════════════════════════════════════════
// SIMULATED IQ → PSD PIPELINE (mirrors interference.py update())
// ═══════════════════════════════════════════════════════════════════

interface CarrierSpan {
  startFreq: number;
  endFreq: number;
  centerFreq: number;
  peakPower: number;
  bandwidth: number;
  isAuthorized: boolean;
}

interface InterferenceHit {
  startFreq: number;
  endFreq: number;
  peakFreq: number;
  strengthDb: number;
  method: string;
}

interface SpectrumResult {
  points: { freq: number; power: number; noiseFloor: number }[];
  carriers: CarrierSpan[];
  interferences: InterferenceHit[];
  noiseFloorDb: number;
  detectThreshold: number;
}

/**
 * Generate fixed "detected" carrier positions for an antenna.
 * These represent what the SDR actually receives — independent of authorized list.
 */
function getDetectedCarrierPositions(antenna: Antenna): number[] {
  const auth = antenna.authorizedFrequencies;
  const detected = [...auth];
  const baseFreq = auth[0];
  const range = auth[auth.length - 1] - baseFreq;

  // Add unauthorized carriers (persistent per antenna)
  if (antenna.unauthorizedCount > 0) {
    detected.push(baseFreq + Math.round(range * 0.35));
    if (antenna.unauthorizedCount > 1) {
      detected.push(baseFreq + Math.round(range * 0.72));
    }
  }
  // Additional ambient carriers
  detected.push(baseFreq + Math.round(range * 0.15));
  detected.push(baseFreq + Math.round(range * 0.55));
  detected.push(baseFreq + Math.round(range * 0.85));

  return [...new Set(detected)].sort((a, b) => a - b);
}

/**
 * Simulate FFT → PSD → Carrier Detection → Interference Detection
 * Mirrors the full interference.py pipeline.
 */
function runDetectionPipeline(
  antenna: Antenna,
  detectedCarriers: number[],
  authorizedFreqs: number[]
): SpectrumResult {
  const allFreqs = detectedCarriers;
  const freqStart = Math.min(...allFreqs) - 60;
  const freqEnd = Math.max(...allFreqs) + 60;
  const step = 1; // finer resolution for realistic FFT look
  const numPoints = Math.ceil((freqEnd - freqStart) / step);

  // Step 1: Generate raw PSD (simulated FFT output with Hann window)
  const rawPsd: number[] = [];
  const freqs: number[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const f = freqStart + i * step;
    freqs.push(f);

    // Base noise floor with Gaussian variation
    let power = NOISE_BASE_DB + (Math.random() - 0.5) * 4;

    // Add carrier peaks with realistic shape (Gaussian-ish with shoulders)
    for (const cf of detectedCarriers) {
      const dist = Math.abs(f - cf);
      if (dist < 20) {
        // Main lobe: sharp peak
        const carrierPower = CARRIER_PEAK_DB + (Math.random() - 0.5) * 8;
        const mainLobe = carrierPower * Math.exp(-0.5 * (dist / 4) ** 2);
        // Shoulder/skirt
        const skirt = (carrierPower + 15) * Math.exp(-0.5 * (dist / 8) ** 2);
        power = Math.max(power, mainLobe, skirt);
      }
    }

    rawPsd.push(power);
  }

  // Step 2: Smoothing (convolution, mirrors smooth_taps in interference.py)
  const smoothTaps = 5;
  const psdSmoothed = smoothArray(rawPsd, smoothTaps);

  // Step 3: Adaptive noise floor estimation (rolling percentile)
  const noiseFloor = estimateNoiseFloorAdaptive(psdSmoothed);

  // Step 4: Adaptive detection threshold (noise + k·σ)
  const noiseBins = psdSmoothed.filter(v => v < noiseFloor + 10);
  const noiseSigma = Math.max(0.3, stdDev(noiseBins));
  const detectThreshold = noiseFloor + Math.max(2.5, CARRIER_K_SIGMA * noiseSigma);

  // Step 5: Binary carrier mask
  let above = psdSmoothed.map(v => v > detectThreshold);

  // Step 6: Morphological opening (erode then dilate)
  above = morphOpen(above, MORPH_OPEN_BINS);

  // Step 7: Morphological closing (dilate then erode)
  above = morphClose(above, MORPH_CLOSE_BINS);

  // Step 8: Extract carrier spans
  const rawSpans = extractSpans(above, 2);

  // Step 9: Classify carriers as authorized/unauthorized
  const carriers: CarrierSpan[] = rawSpans.map(([r, f]) => {
    const centerFreq = (freqs[r] + freqs[f]) / 2;
    const peakPower = Math.max(...psdSmoothed.slice(r, f + 1));
    const isAuthorized = authorizedFreqs.some(af => Math.abs(centerFreq - af) < 12);
    return {
      startFreq: freqs[r],
      endFreq: freqs[f],
      centerFreq,
      peakPower,
      bandwidth: freqs[f] - freqs[r],
      isAuthorized,
    };
  });

  // Step 10: Interference detection (intra-carrier bump detector)
  const interferences: InterferenceHit[] = [];
  for (const carrier of carriers) {
    if (!carrier.isAuthorized) continue;
    const startIdx = freqs.findIndex(f => f >= carrier.startFreq);
    const endIdx = freqs.findIndex(f => f >= carrier.endFreq);
    if (startIdx < 0 || endIdx < 0 || endIdx - startIdx < 6) continue;

    const segment = psdSmoothed.slice(startIdx, endIdx + 1);
    const envelope = medianEnvelope(segment, 7);
    const residual = segment.map((v, i) => v - envelope[i]);

    // Bump detection
    let inBump = false;
    let bumpStart = 0;
    for (let i = 0; i < residual.length; i++) {
      if (residual[i] > INTF_BUMP_THRESHOLD_DB && !inBump) {
        inBump = true;
        bumpStart = i;
      } else if ((residual[i] <= INTF_BUMP_THRESHOLD_DB || i === residual.length - 1) && inBump) {
        inBump = false;
        if (i - bumpStart >= 2) {
          const peakIdx = bumpStart + residual.slice(bumpStart, i).reduce(
            (best, v, j) => v > residual[bumpStart + best] ? j : best, 0
          );
          interferences.push({
            startFreq: freqs[startIdx + bumpStart],
            endFreq: freqs[startIdx + i],
            peakFreq: freqs[startIdx + peakIdx],
            strengthDb: residual[peakIdx],
            method: "bump",
          });
        }
      }
    }
  }

  // Build output points
  const points = freqs.map((f, i) => ({
    freq: Math.round(f * 10) / 10,
    power: Math.round(psdSmoothed[i] * 10) / 10,
    noiseFloor: Math.round(noiseFloor * 10) / 10,
  }));

  return { points, carriers, interferences, noiseFloorDb: noiseFloor, detectThreshold };
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (ported from interference.py)
// ═══════════════════════════════════════════════════════════════════

function smoothArray(arr: number[], taps: number): number[] {
  const half = Math.floor(taps / 2);
  return arr.map((_, i) => {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
      sum += arr[j]; count++;
    }
    return sum / count;
  });
}

function estimateNoiseFloorAdaptive(psd: number[]): number {
  const windowSize = Math.max(32, Math.floor(psd.length / 8));
  const step = Math.max(1, Math.floor(windowSize / 4));
  const floors: number[] = [];
  for (let i = 0; i <= psd.length - windowSize; i += step) {
    const window = psd.slice(i, i + windowSize).sort((a, b) => a - b);
    const idx = Math.floor(window.length * NF_PERCENTILE);
    floors.push(window[idx]);
  }
  if (floors.length === 0) return percentile(psd, NF_PERCENTILE);
  floors.sort((a, b) => a - b);
  return floors[Math.floor(floors.length / 2)];
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * p)];
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 1;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
}

function morphOpen(mask: boolean[], k: number): boolean[] {
  const half = Math.floor(k / 2);
  // Erode
  const eroded = mask.map((_, i) => {
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx < 0 || idx >= mask.length || !mask[idx]) return false;
    }
    return true;
  });
  // Dilate
  return eroded.map((_, i) => {
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < eroded.length && eroded[idx]) return true;
    }
    return false;
  });
}

function morphClose(mask: boolean[], k: number): boolean[] {
  const half = Math.floor(k / 2);
  // Dilate
  const dilated = mask.map((_, i) => {
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < mask.length && mask[idx]) return true;
    }
    return false;
  });
  // Erode
  return dilated.map((_, i) => {
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx < 0 || idx >= dilated.length || !dilated[idx]) return false;
    }
    return true;
  });
}

function extractSpans(mask: boolean[], minBins: number): [number, number][] {
  const spans: [number, number][] = [];
  let inSpan = false;
  let start = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && !inSpan) { inSpan = true; start = i; }
    if (!mask[i] && inSpan) {
      inSpan = false;
      if (i - start >= minBins) spans.push([start, i - 1]);
    }
  }
  if (inSpan && mask.length - start >= minBins) spans.push([start, mask.length - 1]);
  return spans;
}

function medianEnvelope(arr: number[], order: number): number[] {
  const half = Math.floor(order / 2);
  return arr.map((_, i) => {
    const window: number[] = [];
    for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
      window.push(arr[j]);
    }
    window.sort((a, b) => a - b);
    return window[Math.floor(window.length / 2)];
  });
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════
function SpectrumTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background/95 border border-border rounded-md px-3 py-2 text-xs shadow-lg">
      <p className="font-mono font-semibold text-foreground">{label} MHz</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value} dBm
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function SpectrumPlot({ antenna, live = false }: { antenna: Antenna; live?: boolean }) {
  const detectedCarriers = useMemo(() => getDetectedCarrierPositions(antenna), [antenna.id]);

  const runPipeline = useCallback(() => {
    return runDetectionPipeline(antenna, detectedCarriers, antenna.authorizedFrequencies);
  }, [antenna, detectedCarriers]);

  const [result, setResult] = useState<SpectrumResult>(() => runPipeline());

  useEffect(() => {
    setResult(runPipeline());
  }, [runPipeline]);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setResult(runPipeline()), 2000);
    return () => clearInterval(t);
  }, [live, runPipeline]);

  // Build chart data with carrier coloring
  const chartData = useMemo(() => {
    return result.points.map(p => {
      const carrier = result.carriers.find(
        c => p.freq >= c.startFreq && p.freq <= c.endFreq
      );
      const isInCarrier = !!carrier;
      const isAuth = carrier?.isAuthorized ?? false;

      return {
        freq: p.freq,
        power: p.power,
        noiseFloor: p.noiseFloor,
        authPower: isInCarrier && isAuth ? p.power : undefined,
        unauthPower: isInCarrier && !isAuth ? p.power : undefined,
        threshold: Math.round(result.detectThreshold * 10) / 10,
      };
    });
  }, [result]);

  const authCarriers = result.carriers.filter(c => c.isAuthorized);
  const unauthCarriers = result.carriers.filter(c => !c.isAuthorized);

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Spectrum – {antenna.name} – interference.py Pipeline
        </h3>
        <div className="flex items-center gap-4">
          {live && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-status-monitoring">
              <span className="status-dot-online" style={{ width: 6, height: 6 }} />
              LIVE
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            NF: {result.noiseFloorDb.toFixed(1)} dBm | Thr: {result.detectThreshold.toFixed(1)} dBm
          </span>
        </div>
      </div>

      {/* Detection Summary */}
      <div className="flex gap-3 text-[10px] font-mono">
        <span className="px-2 py-1 rounded bg-status-authorized/10 text-status-authorized border border-status-authorized/20">
          AUTH: {authCarriers.length} carriers
        </span>
        <span className="px-2 py-1 rounded bg-status-unauthorized/10 text-status-unauthorized border border-status-unauthorized/20">
          UNAUTH: {unauthCarriers.length} carriers
        </span>
        <span className="px-2 py-1 rounded bg-status-warning/10 text-status-warning border border-status-warning/20">
          INTF: {result.interferences.length} detected
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
          <XAxis
            dataKey="freq"
            tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }}
            label={{ value: "Frequency (MHz)", position: "insideBottom", offset: -2, style: { fontSize: 10, fill: "hsl(215 12% 55%)" } }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }}
            label={{ value: "Power (dBm)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(215 12% 55%)" } }}
            domain={[-100, -10]}
          />
          <Tooltip content={<SpectrumTooltip />} />

          {/* Interference regions */}
          {result.interferences.map((intf, i) => (
            <ReferenceArea
              key={`intf-${i}`}
              x1={intf.startFreq}
              x2={intf.endFreq}
              fill="hsl(0 84% 55%)"
              fillOpacity={0.15}
              strokeOpacity={0}
            />
          ))}

          {/* Carrier highlight regions */}
          {result.carriers.map((c, i) => (
            <ReferenceArea
              key={`carrier-${i}`}
              x1={c.startFreq}
              x2={c.endFreq}
              fill={c.isAuthorized ? "hsl(142 76% 45%)" : "hsl(0 84% 55%)"}
              fillOpacity={0.08}
              strokeOpacity={0}
            />
          ))}

          {/* Noise floor line */}
          <Line type="monotone" dataKey="noiseFloor" stroke="hsl(45 93% 55%)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Noise Floor" />

          {/* Detection threshold */}
          <Line type="monotone" dataKey="threshold" stroke="hsl(280 80% 60%)" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Detect Threshold" />

          {/* Full signal trace */}
          <Line type="monotone" dataKey="power" stroke="hsl(215 12% 40%)" strokeWidth={1} dot={false} name="Signal (all)" />

          {/* Authorized carrier power */}
          <Line type="monotone" dataKey="authPower" stroke="hsl(142 76% 45%)" strokeWidth={2.5} dot={false} name="Authorized" connectNulls={false} />

          {/* Unauthorized carrier power */}
          <Line type="monotone" dataKey="unauthPower" stroke="hsl(0 84% 55%)" strokeWidth={2.5} dot={false} name="Unauthorized" connectNulls={false} />

          {/* Authorized frequency reference lines */}
          {antenna.authorizedFrequencies.map((f) => (
            <ReferenceLine key={f} x={f} stroke="hsl(142 76% 45% / 0.25)" strokeDasharray="2 2" />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-authorized inline-block" /> Authorized Carrier</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-unauthorized inline-block" /> Unauthorized Carrier</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-status-warning inline-block" /> Noise Floor</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: "hsl(280 80% 60%)" }} /> Detection Threshold</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-muted-foreground/40 inline-block" /> Signal Trace</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block rounded-sm" style={{ background: "hsl(0 84% 55% / 0.15)" }} /> Interference Region</span>
      </div>

      {/* Carrier Table */}
      {result.carriers.length > 0 && (
        <div className="glass-card p-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-2">Detected Carriers</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1 px-2">#</th>
                  <th className="text-left py-1 px-2">Center (MHz)</th>
                  <th className="text-left py-1 px-2">BW (MHz)</th>
                  <th className="text-left py-1 px-2">Peak (dBm)</th>
                  <th className="text-left py-1 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.carriers.map((c, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1 px-2 text-foreground">{i + 1}</td>
                    <td className="py-1 px-2 text-foreground">{c.centerFreq.toFixed(1)}</td>
                    <td className="py-1 px-2 text-foreground">{c.bandwidth.toFixed(1)}</td>
                    <td className="py-1 px-2 text-foreground">{c.peakPower.toFixed(1)}</td>
                    <td className={`py-1 px-2 font-semibold ${c.isAuthorized ? "text-status-authorized" : "text-status-unauthorized"}`}>
                      {c.isAuthorized ? "AUTH" : "UNAUTH"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interference Log */}
      {result.interferences.length > 0 && (
        <div className="glass-card p-3 border-status-unauthorized/20">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-status-unauthorized mb-2">
            Interference Detections
          </h4>
          {result.interferences.map((intf, i) => (
            <div key={i} className="text-[10px] font-mono text-muted-foreground py-1 border-b border-border/30 last:border-0">
              <span className="text-status-unauthorized">[{intf.method.toUpperCase()}]</span>
              {" "}Peak: {intf.peakFreq.toFixed(2)} MHz | Strength: +{intf.strengthDb.toFixed(1)} dB |
              Range: {intf.startFreq.toFixed(2)}–{intf.endFreq.toFixed(2)} MHz
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
