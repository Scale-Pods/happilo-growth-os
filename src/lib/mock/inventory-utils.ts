import type { Product } from './inventory';

export const CHANNELS = [
  { key: 'warehouse', label: 'Bengaluru DC' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'shopify', label: 'Shopify (happilo.com)' },
  { key: 'flipkart', label: 'Flipkart' },
  { key: 'bigbasket', label: 'BigBasket' },
  { key: 'blinkit', label: 'Blinkit' },
  { key: 'zepto', label: 'Zepto' },
  { key: 'instamart', label: 'Instamart' },
] as const;

export type ChannelKey = (typeof CHANNELS)[number]['key'];

export const CHANNEL_LABEL: Record<string, string> = Object.fromEntries(CHANNELS.map((c) => [c.key, c.label]));

export const CATEGORIES = ['Nuts', 'Dry Fruits', 'Dates', 'Trail Mixes', 'Seeds', 'Makhana', 'Combos'];

export const totalStock = (p: Product) =>
  p.warehouse + p.amazon + p.blinkit + p.zepto + p.flipkart + p.instamart + p.bigbasket + p.shopify;

export const channelStock = (p: Product) => totalStock(p) - p.warehouse;

export const coverDays = (p: Product, qty = totalStock(p)) =>
  p.avgMonthlySales > 0 ? Math.round((qty / p.avgMonthlySales) * 30) : 999;

export const reorderPointOf = (p: Product) =>
  p.reorderPoint ?? Math.round((p.avgMonthlySales / 30) * (p.leadTime + 7));

export const safetyOf = (p: Product) => p.safetyStock ?? Math.round((p.avgMonthlySales / 30) * 7);

export type StatusKey = 'out' | 'critical' | 'reorder' | 'healthy' | 'overstock';

export function stockStatus(p: Product, inbound = 0): { key: StatusKey; label: string; badge: string } {
  const total = totalStock(p);
  const days = coverDays(p);
  if (total === 0) return { key: 'out', label: 'Out of stock', badge: 'badge-red' };
  if (days <= 10 || (days < p.leadTime * 0.5 && inbound === 0)) return { key: 'critical', label: 'Critical', badge: 'badge-red' };
  if (total + inbound <= reorderPointOf(p) || days < Math.min(p.leadTime, 21)) return { key: 'reorder', label: 'Reorder', badge: 'badge-orange' };
  if (days > 110) return { key: 'overstock', label: 'Overstock', badge: 'badge-purple' };
  return { key: 'healthy', label: 'Healthy', badge: 'badge-green' };
}

/** ABC by cumulative share of monthly revenue (80 / 15 / 5). */
export function abcMap(items: Product[]): Record<string, 'A' | 'B' | 'C'> {
  const rows = items
    .map((p) => ({ id: p.id, rev: p.avgMonthlySales * p.price }))
    .sort((a, b) => b.rev - a.rev);
  const sum = rows.reduce((a, r) => a + r.rev, 0) || 1;
  let run = 0;
  const out: Record<string, 'A' | 'B' | 'C'> = {};
  rows.forEach((r) => {
    out[r.id] = run / sum < 0.8 ? 'A' : run / sum < 0.95 ? 'B' : 'C';
    run += r.rev;
  });
  return out;
}

// ── Formatting ──
const nf = new Intl.NumberFormat('en-IN');
export const fmtNum = (n: number) => nf.format(Math.round(n));
export const fmtINR = (n: number) => '₹' + nf.format(Math.round(n));
export function fmtMoney(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return fmtINR(n);
}

// ── Dates (day precision, so server and client render the same) ──
const d0 = new Date();
export const TODAY = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (d: Date | string) => {
  const x = typeof d === 'string' ? parseISO(d.slice(0, 10)) : d;
  return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
};
export const fmtShortDate = (d: Date | string) => {
  const x = typeof d === 'string' ? parseISO(d.slice(0, 10)) : d;
  return `${x.getDate()} ${MONTHS[x.getMonth()]}`;
};
export const fmtTime = (d: Date) => {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${((h + 11) % 12) + 1}:${m} ${h >= 12 ? 'pm' : 'am'}`;
};

export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** 12-week sales trend for a SKU, deterministic. Returns units per week. */
export function weeklyTrend(p: Product): number[] {
  const base = p.avgMonthlySales / 4.33;
  const drift = (hash01(p.sku + 'd') - 0.4) * 0.25;
  return Array.from({ length: 12 }, (_, i) => {
    const season = 1 + 0.07 * Math.sin((i + hash01(p.sku) * 6) / 1.7);
    const noise = 0.9 + hash01(p.sku + i) * 0.2;
    return Math.round(base * (1 + drift * ((i - 6) / 6)) * season * noise);
  });
}
