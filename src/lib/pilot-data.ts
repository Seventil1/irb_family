export const WEEKS = ["18 мая", "25 мая", "1 июня", "8 июня", "15 июня", "22 июня"] as const;

export type SegmentKey = "msk" | "regions" | "pilot" | "control";

export const SEGMENTS: { key: SegmentKey; label: string; color: string; isPilot: boolean }[] = [
  { key: "msk", label: "МСК + СПб", color: "var(--chart-pilot-1)", isPilot: true },
  { key: "regions", label: "Регионы", color: "var(--chart-pilot-2)", isPilot: true },
  { key: "pilot", label: "Весь пилот", color: "var(--chart-pilot-3)", isPilot: true },
  { key: "control", label: "Контрольная", color: "var(--chart-control)", isPilot: false },
];

export const LEADS: Record<SegmentKey, number[]> = {
  msk: [70, 103, 101, 164, 152, 164],
  regions: [347, 420, 510, 556, 520, 667],
  pilot: [417, 523, 611, 720, 672, 831],
  control: [277, 370, 365, 415, 377, 436],
};

export const BUDGET: Record<SegmentKey, number[]> = {
  msk: [26340, 44865, 102227, 79164, 108017, 62150],
  regions: [24954, 36552, 45816, 43913, 44624, 79194],
  pilot: [51294, 81417, 148043, 123077, 152641, 141344],
  control: [20002, 28571, 44896, 59529, 30195, 32801],
};

export const CPL: Record<SegmentKey, number[]> = {
  msk: [376, 436, 1012, 483, 711, 379],
  regions: [72, 87, 90, 79, 86, 119],
  pilot: [123, 156, 242, 171, 227, 170],
  control: [72, 77, 123, 143, 80, 75],
};

// Дельты и средние из скриншота
export const DELTAS = {
  leads: {
    msk: { wow: 7.89, vs5: 38.98, vs3: 17.99, avg5: 118, avg3: 139 },
    regions: { wow: 28.27, vs5: 41.73, vs3: 26.17, avg5: 471, avg3: 529 },
    pilot: { wow: 23.66, vs5: 41.18, vs3: 24.46, avg5: 589, avg3: 668 },
    control: { wow: 15.65, vs5: 20.84, vs3: 13.05, avg5: 361, avg3: 386 },
  },
  budget: {
    msk: { wow: -42.46 },
    regions: { wow: 77.47 },
    pilot: { wow: -7.4 },
    control: { wow: 8.63 },
  },
  cpl: {
    msk: { wow: -46.67, vs5: -38.0, vs3: -45.4, avg5: 611, avg3: 694 },
    regions: { wow: 38.36, vs5: 42.64, vs3: 40.16, avg5: 83, avg3: 85 },
    pilot: { wow: -25.12, vs5: -10.05, vs3: -19.6, avg5: 189, avg3: 212 },
    control: { wow: -6.07, vs5: -25.92, vs3: -35.34, avg5: 102, avg3: 116 },
  },
} as const;

export const nf = new Intl.NumberFormat("ru-RU");
export const nfRub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});
export const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2).replace(".", ",")}%`;

export function buildSeries(metric: Record<SegmentKey, number[]>) {
  return WEEKS.map((w, i) => ({
    week: w,
    msk: metric.msk[i],
    regions: metric.regions[i],
    pilot: metric.pilot[i],
    control: metric.control[i],
  }));
}
