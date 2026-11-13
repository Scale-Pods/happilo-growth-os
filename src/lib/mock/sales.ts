/**
 * Happilo sales series (dummy data) - 90 days of revenue and orders by channel,
 * ending 12 Nov 2026. Diwali gifting lifts late Oct and the first week of Nov,
 * then demand cools. Everything is derived from a fixed seed so the numbers are
 * stable between renders.
 */
import { CATALOG_BY_SKU } from './catalog';

export type ChannelKey = 'site' | 'amazon' | 'flipkart' | 'blinkit' | 'zepto' | 'instamart' | 'bigbasket' | 'b2b';

export interface SalesChannel {
  key: ChannelKey;
  label: string;
  color: string;
  /** Typical order value in INR. */
  aov: number;
}

export const SALES_CHANNELS: SalesChannel[] = [
  { key: 'amazon', label: 'Amazon', color: '#00523B', aov: 468 },
  { key: 'site', label: 'happilo.com', color: '#348A5C', aov: 742 },
  { key: 'blinkit', label: 'Blinkit', color: '#F2A71B', aov: 356 },
  { key: 'b2b', label: 'B2B / Bulk', color: '#0C3E33', aov: 38600 },
  { key: 'flipkart', label: 'Flipkart', color: '#7DB88F', aov: 412 },
  { key: 'zepto', label: 'Zepto', color: '#C98A0E', aov: 341 },
  { key: 'bigbasket', label: 'BigBasket', color: '#A9D3B5', aov: 524 },
  { key: 'instamart', label: 'Instamart', color: '#E3C467', aov: 349 },
];

export interface DailySales {
  date: string; // YYYY-MM-DD
  revenue: Record<ChannelKey, number>;
  orders: Record<ChannelKey, number>;
}

const DAY = 86400000;
/** Last full day in the series. */
const LAST_DAY = Date.UTC(2026, 10, 12);
export const SERIES_DAYS = 90;

const BASE: Record<ChannelKey, number> = {
  amazon: 304000,
  site: 186500,
  blinkit: 171000,
  b2b: 214000,
  flipkart: 108500,
  zepto: 97200,
  bigbasket: 68400,
  instamart: 79800,
};

/** How strongly each channel follows the gifting season. */
const GIFT_BETA: Record<ChannelKey, number> = {
  amazon: 0.9, site: 1.25, flipkart: 0.85, blinkit: 0.7, zepto: 0.65, instamart: 0.7, bigbasket: 0.8, b2b: 1.6,
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Season curve by calendar date: 0 = normal, 1 = peak gifting. */
function season(ms: number): number {
  const d = new Date(ms);
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  if (m === 9 && day >= 18) return Math.min(1, 0.2 + (day - 18) * 0.065); // 18 Oct onwards, ramping
  if (m === 10) {
    if (day <= 6) return 0.95 - day * 0.01;
    if (day === 7) return 0.62; // day before Diwali, mostly last-minute orders
    if (day === 8) return 0.18; // Diwali
    if (day === 9) return 0.12; // Govardhan puja, bhai dooj next
    return Math.max(-0.12, 0.1 - (day - 9) * 0.08); // cooling off
  }
  if (m === 9 && day < 18) return 0.05;
  return 0;
}

function build(): DailySales[] {
  const out: DailySales[] = [];
  const rand = rng(20261113);
  for (let i = SERIES_DAYS - 1; i >= 0; i--) {
    const ms = LAST_DAY - i * DAY;
    const dt = new Date(ms);
    const dow = dt.getUTCDay();
    const s = season(ms);
    const revenue = {} as Record<ChannelKey, number>;
    const orders = {} as Record<ChannelKey, number>;
    const dayIndex = SERIES_DAYS - 1 - i;
    const trend = 0.9 + (dayIndex / SERIES_DAYS) * 0.16; // slow underlying growth
    for (const ch of SALES_CHANNELS) {
      let mult = trend * (1 + s * GIFT_BETA[ch.key] * 0.95);
      const weekend = dow === 0 || dow === 6;
      if (ch.key === 'b2b') {
        mult *= dow === 0 ? 0.08 : 1;
        mult *= 0.45 + rand() * 1.25; // POs land in lumps
      } else {
        mult *= weekend ? (ch.key === 'site' || ch.key === 'blinkit' || ch.key === 'zepto' || ch.key === 'instamart' ? 1.09 : 1.03) : 1;
        mult *= 0.92 + rand() * 0.17;
      }
      // Amazon Great Indian Festival and Flipkart Big Billion Days, first fortnight of October.
      const m = dt.getUTCMonth();
      const day = dt.getUTCDate();
      if (m === 9 && day >= 3 && day <= 10 && (ch.key === 'amazon' || ch.key === 'flipkart')) mult *= 1.28 + rand() * 0.12;
      const rev = Math.round(BASE[ch.key] * mult);
      revenue[ch.key] = rev;
      const aov = ch.aov * (0.96 + rand() * 0.08) * (1 + Math.max(0, s) * (ch.key === 'b2b' ? 0.1 : 0.16));
      orders[ch.key] = Math.max(ch.key === 'b2b' ? (rev > 0 ? 1 : 0) : 1, Math.round(rev / aov));
    }
    out.push({ date: dt.toISOString().slice(0, 10), revenue, orders });
  }
  return out;
}

export const DAILY_SALES: DailySales[] = build();

export function sumRange(rows: DailySales[]) {
  const revenue = {} as Record<ChannelKey, number>;
  const orders = {} as Record<ChannelKey, number>;
  for (const c of SALES_CHANNELS) { revenue[c.key] = 0; orders[c.key] = 0; }
  for (const r of rows) {
    for (const c of SALES_CHANNELS) {
      revenue[c.key] += r.revenue[c.key];
      orders[c.key] += r.orders[c.key];
    }
  }
  const totalRevenue = SALES_CHANNELS.reduce((a, c) => a + revenue[c.key], 0);
  const totalOrders = SALES_CHANNELS.reduce((a, c) => a + orders[c.key], 0);
  return { revenue, orders, totalRevenue, totalOrders, aov: totalOrders ? Math.round(totalRevenue / totalOrders) : 0 };
}

export function salesWindow(days: number) {
  const cur = DAILY_SALES.slice(-days);
  const prev = DAILY_SALES.slice(-days * 2, -days);
  return { cur, prev, current: sumRange(cur), previous: prev.length ? sumRange(prev) : null };
}

/** Customer-quality figures reported alongside the series (30-day view). */
export const CUSTOMER_METRICS = {
  repeatRate: 31.6, // % of happilo.com orders from returning customers
  repeatRatePrev: 29.8,
  returnsRate: 1.7, // % of units returned or refunded
  returnsRatePrev: 1.4,
  adSpend30: 5812400, // paid media over the last 30 days, INR
  adSpendPrev: 4693700,
};

export interface TopSku {
  sku: string;
  name: string;
  pack: string;
  image: string | null;
  price: number;
  units: number;
  prevUnits: number;
  revenue: number;
}

// Units sold in the last 30 days, all channels, priced at current selling price.
const TOP_RAW: Array<[string, number, number]> = [
  ['Happilo_Whole_Cashews_200g_1PK', 11860, 8940],
  ['Happilo_Californian_Almonds_400g_1PK', 7410, 5870],
  ['Happilo_Trail_Mix_200g_1PK', 10520, 9260],
  ['Happilo_Californian_Almonds_200g_1PK', 9480, 7710],
  ['8906081125880', 1905, 988],
  ['Happilo_Ajwa_Dates_500g_1PK', 2520, 1346],
  ['Happilo_DryFruits_Combo_PO4_850g_1PK', 1672, 802],
  ['Happilo_Soft_Kimia_Dates_500g_1PK', 3976, 2815],
  ['Happilo_Californian_Walnut_200g_1PK', 3448, 2904],
  ['Happilo_Supermom_Trail_Mix_325g_1PK', 3538, 3190],
];

export const TOP_SKUS: TopSku[] = TOP_RAW.map(([sku, units, prevUnits]) => {
  const c = CATALOG_BY_SKU[sku];
  return {
    sku,
    name: c ? c.name : sku,
    pack: c ? c.pack : '',
    image: c ? c.image : null,
    price: c ? c.price : 0,
    units,
    prevUnits,
    revenue: units * (c ? c.price : 0),
  };
}).sort((a, b) => b.revenue - a.revenue);

/** Weekly roll-up (Mon-Sun style blocks counted back from the last day) for charting. */
export function weeklySeries(weeks = 13) {
  const out: Array<{ label: string; revenue: Record<ChannelKey, number>; total: number; orders: number }> = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = DAILY_SALES.length - w * 7;
    const rows = DAILY_SALES.slice(Math.max(0, end - 7), end);
    if (!rows.length) continue;
    const s = sumRange(rows);
    const d = new Date(rows[0].date + 'T00:00:00Z');
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    out.push({ label, revenue: s.revenue, total: s.totalRevenue, orders: s.totalOrders });
  }
  return out;
}

/** Indian digit grouping, e.g. 1248300 -> 12,48,300. */
export function inr(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

/** Compact rupee figure: lakhs below a crore, crores above. */
export function inrShort(n: number): string {
  const v = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (v >= 10000000) return `${sign}₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${sign}₹${(v / 100000).toFixed(2)} L`;
  return `${sign}₹${Math.round(v).toLocaleString('en-IN')}`;
}

export function pctChange(cur: number, prev: number | null | undefined): number | null {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}
