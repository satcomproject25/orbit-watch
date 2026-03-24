export interface Antenna {
  id: string;
  name: string;
  slug: string;
  location: string;
  lat: number;
  lng: number;
  band: string;
  frequencyRange: string;
  allocatedBandwidth: string;
  sdrType: string;
  piNodeId: string;
  stationLocation: string;
  status: "online" | "offline";
  piIp: string;
  piPort: number;
  lastHeartbeat: string;
  carrierCount: number;
  unauthorizedCount: number;
  authorizedFrequencies: number[];
}

export const antennas: Antenna[] = [
  {
    id: "1", name: "GSAT-30", slug: "gsat30", location: "83°E", lat: 13.0338, lng: 77.5678,
    band: "C-Band", frequencyRange: "3.7 – 4.2 GHz", allocatedBandwidth: "36 MHz",
    sdrType: "RTL-SDR v3", piNodeId: "RPI-NODE-001", stationLocation: "Bangalore, India",
    status: "online", piIp: "192.168.1.101", piPort: 5001,
    lastHeartbeat: new Date().toISOString(), carrierCount: 24, unauthorizedCount: 2,
    authorizedFrequencies: [3700, 3750, 3800, 3850, 3900, 3950, 4000, 4050, 4100, 4150, 4200],
  },
  {
    id: "2", name: "INSAT-25", slug: "insat25", location: "55°E", lat: 19.076, lng: 72.8777,
    band: "Ku-Band", frequencyRange: "11.7 – 12.2 GHz", allocatedBandwidth: "54 MHz",
    sdrType: "HackRF One", piNodeId: "RPI-NODE-002", stationLocation: "Mumbai, India",
    status: "online", piIp: "192.168.1.102", piPort: 5002,
    lastHeartbeat: new Date().toISOString(), carrierCount: 18, unauthorizedCount: 0,
    authorizedFrequencies: [11700, 11750, 11800, 11900, 12000, 12100, 12200],
  },
  {
    id: "3", name: "GISAT-1", slug: "gisat1", location: "93.5°E", lat: 8.5241, lng: 76.9366,
    band: "S-Band", frequencyRange: "2.0 – 2.5 GHz", allocatedBandwidth: "20 MHz",
    sdrType: "USRP B210", piNodeId: "RPI-NODE-003", stationLocation: "Thiruvananthapuram, India",
    status: "offline", piIp: "192.168.1.103", piPort: 5003,
    lastHeartbeat: "2026-03-24T06:30:00Z", carrierCount: 0, unauthorizedCount: 0,
    authorizedFrequencies: [2000, 2100, 2200, 2300, 2400, 2500],
  },
  {
    id: "4", name: "GSAT-24", slug: "gsat24", location: "83°E", lat: 28.6139, lng: 77.209,
    band: "C-Band Extended", frequencyRange: "3.4 – 4.2 GHz", allocatedBandwidth: "72 MHz",
    sdrType: "RTL-SDR v3", piNodeId: "RPI-NODE-004", stationLocation: "Delhi, India",
    status: "online", piIp: "192.168.1.104", piPort: 5004,
    lastHeartbeat: new Date().toISOString(), carrierCount: 32, unauthorizedCount: 1,
    authorizedFrequencies: [3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200],
  },
  {
    id: "5", name: "CMS-02", slug: "cms02", location: "74°E", lat: 22.3072, lng: 73.1812,
    band: "UHF", frequencyRange: "400 – 470 MHz", allocatedBandwidth: "10 MHz",
    sdrType: "Airspy Mini", piNodeId: "RPI-NODE-005", stationLocation: "Vadodara, India",
    status: "online", piIp: "192.168.1.105", piPort: 5005,
    lastHeartbeat: new Date().toISOString(), carrierCount: 12, unauthorizedCount: 0,
    authorizedFrequencies: [400, 410, 420, 430, 440, 450, 460, 470],
  },
];

export function getAntennaBySlug(slug: string) {
  return antennas.find((a) => a.slug === slug);
}
