/**
 * Per-channel inventory depth for Happilo: dark stores, fulfilment centres,
 * listings, channel prices, purchase orders and inbound shipments.
 *
 * Everything is derived from the shared Product rows, so the units shown for a
 * channel always add up to the per-channel figure on the stock record. Store
 * names, order numbers and listing IDs are working data for the planning team.
 */
import type { Product } from './inventory';
import { CATALOG_BY_SKU } from './catalog';
import { TODAY, addDays, toISO, fmtShortDate, fmtTime, hash01 } from './inventory-utils';

export type ChannelId = 'shopify' | 'amazon' | 'flipkart' | 'blinkit' | 'instamart' | 'zepto' | 'bigbasket';
export type ListingStatus = 'Live' | 'Out of stock' | 'Delisted' | 'Pending listing';
export type PoStatus = 'Confirmed' | 'Dispatched' | 'Received';

export interface ChannelMeta {
  id: ChannelId;
  label: string;
  short: string;
  logo: string | null;
  color: string;
  initial: string;
  kind: 'web' | 'marketplace' | 'quick';
  blurb: string;
  syncMode: string;
  extraLabel: string;
  storeLabel: string; // what the location table is called
  poLabel: string;
  demand: number; // share of unit sales
  target: number; // target days of cover
}

export const CHANNEL_META: Record<ChannelId, ChannelMeta> = {
  shopify: {
    id: 'shopify', label: 'Shopify (happilo.com)', short: 'Shopify', logo: null, color: '#96BF48', initial: 'S', kind: 'web',
    blurb: 'Own web store. Orders are packed from the Bengaluru warehouse and prices match the catalogue.',
    syncMode: 'Updates as each order is placed', extraLabel: 'Oversell protection', storeLabel: 'Stock locations',
    poLabel: 'Restock transfers', demand: 0.17, target: 20,
  },
  amazon: {
    id: 'amazon', label: 'Amazon', short: 'Amazon', logo: '/channels/Amazon_NOw.png', color: '#FF9900', initial: 'A', kind: 'marketplace',
    blurb: 'Amazon.in including Amazon Now. Stock sits in Amazon fulfilment centres or ships from Bengaluru on seller flex.',
    syncMode: 'Every 15 minutes', extraLabel: 'Buy box / fulfilment', storeLabel: 'Fulfilment centres',
    poLabel: 'Inbound shipments', demand: 0.27, target: 26,
  },
  flipkart: {
    id: 'flipkart', label: 'Flipkart', short: 'Flipkart', logo: '/channels/Flipkart_Minutes.png', color: '#2874F0', initial: 'F', kind: 'marketplace',
    blurb: 'Flipkart and Flipkart Minutes. Minutes stores are small city stores that deliver in minutes.',
    syncMode: 'Every 30 minutes', extraLabel: 'On Flipkart Minutes', storeLabel: 'Warehouses and Minutes stores',
    poLabel: 'Inbound shipments', demand: 0.12, target: 24,
  },
  blinkit: {
    id: 'blinkit', label: 'Blinkit', short: 'Blinkit', logo: '/channels/Blink_It.png', color: '#F8CB46', initial: 'B', kind: 'quick',
    blurb: 'Quick commerce. Blinkit sets its own selling price and it varies by pincode, so it can differ slightly from happilo.com.',
    syncMode: 'Vendor stock report every 4 hours', extraLabel: 'Dark stores live', storeLabel: 'Dark stores',
    poLabel: 'Purchase orders from Blinkit', demand: 0.14, target: 14,
  },
  instamart: {
    id: 'instamart', label: 'Instamart', short: 'Instamart', logo: '/channels/Instamart_logo.png', color: '#FC8019', initial: 'I', kind: 'quick',
    blurb: 'Swiggy Instamart. Prices are set by Instamart and move by pincode cluster.',
    syncMode: 'Vendor stock report every 6 hours', extraLabel: 'Dark stores live', storeLabel: 'Dark stores',
    poLabel: 'Purchase orders from Instamart', demand: 0.1, target: 14,
  },
  zepto: {
    id: 'zepto', label: 'Zepto', short: 'Zepto', logo: null, color: '#5A1E96', initial: 'Z', kind: 'quick',
    blurb: 'Quick commerce. Zepto sets its own prices by pincode.',
    syncMode: 'Daily stock file by 6 am', extraLabel: 'Dark stores live', storeLabel: 'Dark stores',
    poLabel: 'Purchase orders from Zepto', demand: 0.11, target: 14,
  },
  bigbasket: {
    id: 'bigbasket', label: 'BigBasket', short: 'BigBasket', logo: '/channels/BigBAsket.png', color: '#84C225', initial: 'B', kind: 'marketplace',
    blurb: 'BigBasket slotted delivery and bbnow. Stock is held in city distribution centres.',
    syncMode: 'Daily stock file by 7 am', extraLabel: 'Centres stocking', storeLabel: 'Distribution centres',
    poLabel: 'Purchase orders from BigBasket', demand: 0.09, target: 22,
  },
};

export const CHANNEL_ORDER: ChannelId[] = ['shopify', 'amazon', 'flipkart', 'blinkit', 'instamart', 'zepto', 'bigbasket'];

// ── Locations ──
type StoreDef = [city: string, area: string, code: string, weight: number, tag?: string];

const STORES: Record<ChannelId, { prefix: string; list: StoreDef[]; warehouses: string[] }> = {
  shopify: {
    prefix: '',
    list: [['Bengaluru', 'Hoskote warehouse', 'happilo.com location', 1]],
    warehouses: ['Bengaluru warehouse, Hoskote'],
  },
  amazon: {
    prefix: '',
    list: [
      ['Bengaluru', 'Devanahalli', 'BLR8', 15], ['Bengaluru', 'Nelamangala', 'BLR4', 10], ['Mumbai', 'Bhiwandi', 'BOM5', 13],
      ['Delhi NCR', 'Farrukhnagar', 'DEL4', 14], ['Delhi NCR', 'Sohna', 'DEL5', 7], ['Hyderabad', 'Shamshabad', 'HYD3', 8],
      ['Chennai', 'Sriperumbudur', 'MAA4', 8], ['Kolkata', 'Howrah', 'CCU1', 5], ['Pune', 'Chakan', 'PNQ2', 7],
      ['Ahmedabad', 'Naroda', 'AMD1', 4], ['Bengaluru', 'Amazon Now, Koramangala', 'AN-BLR-04', 3, 'Amazon Now'],
      ['Bengaluru', 'Amazon Now, Indiranagar', 'AN-BLR-07', 2, 'Amazon Now'],
    ],
    warehouses: ['BLR8 Devanahalli', 'BOM5 Bhiwandi', 'DEL4 Farrukhnagar', 'HYD3 Shamshabad', 'MAA4 Sriperumbudur'],
  },
  flipkart: {
    prefix: 'Flipkart',
    list: [
      ['Bengaluru', 'Kudlu Gate', 'FK-BLR-KG', 17], ['Bengaluru', 'Malur', 'FK-BLR-ML', 12], ['Mumbai', 'Bhiwandi', 'FK-BOM-BW', 14],
      ['Delhi NCR', 'Farukhnagar', 'FK-DEL-FN', 13], ['Hyderabad', 'Medchal', 'FK-HYD-MD', 9], ['Kolkata', 'Dankuni', 'FK-CCU-DK', 6],
      ['Chennai', 'Pallavaram', 'FK-MAA-PV', 7], ['Pune', 'Talegaon', 'FK-PNQ-TL', 5],
      ['Bengaluru', 'Minutes, Koramangala', 'FM-BLR-12', 3, 'Minutes'], ['Bengaluru', 'Minutes, HSR Layout', 'FM-BLR-19', 2.5, 'Minutes'],
      ['Mumbai', 'Minutes, Andheri West', 'FM-BOM-08', 2, 'Minutes'],
    ],
    warehouses: ['Kudlu Gate, Bengaluru', 'Bhiwandi, Mumbai', 'Farukhnagar, Gurugram', 'Medchal, Hyderabad'],
  },
  blinkit: {
    prefix: 'Blinkit',
    list: [
      ['Bengaluru', 'Koramangala', 'DS-BLR-212', 9.5], ['Bengaluru', 'Indiranagar', 'DS-BLR-187', 8], ['Bengaluru', 'HSR Layout', 'DS-BLR-231', 8.5],
      ['Bengaluru', 'Whitefield', 'DS-BLR-264', 6], ['Mumbai', 'Andheri West', 'DS-MUM-142', 7.5], ['Mumbai', 'Powai', 'DS-MUM-176', 5.5],
      ['Thane', 'Ghodbunder Road', 'DS-THN-058', 4.5], ['Delhi NCR', 'Gurugram Sector 56', 'DS-GGN-119', 8], ['Delhi NCR', 'Noida Sector 62', 'DS-NOI-087', 6.5],
      ['Delhi NCR', 'South Extension', 'DS-DEL-203', 6], ['Hyderabad', 'Gachibowli', 'DS-HYD-094', 6.5], ['Pune', 'Kothrud', 'DS-PNQ-071', 5],
      ['Chennai', 'Adyar', 'DS-MAA-066', 4.5], ['Kolkata', 'Salt Lake', 'DS-CCU-049', 3.5], ['Ahmedabad', 'Satellite', 'DS-AMD-038', 3], ['Jaipur', 'Malviya Nagar', 'DS-JAI-027', 2],
    ],
    warehouses: ['Blinkit Bilaspur FC, Gurugram', 'Blinkit Soukya Road FC, Bengaluru', 'Blinkit Bhiwandi FC, Mumbai', 'Blinkit Medchal FC, Hyderabad', 'Blinkit Dankuni FC, Kolkata'],
  },
  instamart: {
    prefix: 'Instamart',
    list: [
      ['Bengaluru', 'Bellandur', 'IM-BLR-0142', 9], ['Bengaluru', 'HSR Layout', 'IM-BLR-0118', 9], ['Bengaluru', 'Jayanagar', 'IM-BLR-0127', 7],
      ['Bengaluru', 'Marathahalli', 'IM-BLR-0171', 6.5], ['Mumbai', 'Bandra West', 'IM-MUM-0093', 8], ['Mumbai', 'Goregaon East', 'IM-MUM-0104', 6],
      ['Delhi NCR', 'Gurugram Sector 49', 'IM-GGN-0066', 8], ['Delhi NCR', 'Dwarka Sector 12', 'IM-DEL-0081', 6], ['Delhi NCR', 'Noida Sector 18', 'IM-NOI-0052', 6.5],
      ['Hyderabad', 'Kondapur', 'IM-HYD-0075', 7], ['Hyderabad', 'Madhapur', 'IM-HYD-0069', 6], ['Pune', 'Baner', 'IM-PNQ-0048', 5.5],
      ['Chennai', 'Velachery', 'IM-MAA-0057', 5], ['Kolkata', 'New Town', 'IM-CCU-0031', 3.5],
    ],
    warehouses: ['Swiggy Bidadi warehouse, Bengaluru', 'Swiggy Bhiwandi warehouse, Mumbai', 'Swiggy Manesar warehouse, Gurugram', 'Swiggy Shamshabad warehouse, Hyderabad', 'Swiggy Chakan warehouse, Pune'],
  },
  zepto: {
    prefix: 'Zepto',
    list: [
      ['Bengaluru', 'HSR Layout', 'ZP-BLR-0231', 10], ['Bengaluru', 'Koramangala 5th Block', 'ZP-BLR-0207', 9], ['Bengaluru', 'Sarjapur Road', 'ZP-BLR-0254', 7],
      ['Mumbai', 'Andheri East', 'ZP-MUM-0119', 9], ['Mumbai', 'Powai', 'ZP-MUM-0132', 7], ['Thane', 'Majiwada', 'ZP-THN-0044', 5],
      ['Delhi NCR', 'Gurugram Sector 14', 'ZP-GGN-0088', 8], ['Delhi NCR', 'Noida Sector 50', 'ZP-NOI-0061', 6], ['Hyderabad', 'Hitech City', 'ZP-HYD-0079', 8],
      ['Pune', 'Wakad', 'ZP-PNQ-0053', 6], ['Chennai', 'T Nagar', 'ZP-MAA-0046', 5], ['Kolkata', 'Ballygunge', 'ZP-CCU-0027', 3],
    ],
    warehouses: ['Zepto Doddaballapur hub, Bengaluru', 'Zepto Bhiwandi hub, Mumbai', 'Zepto Sonipat hub, Delhi NCR', 'Zepto Medchal hub, Hyderabad'],
  },
  bigbasket: {
    prefix: 'BigBasket',
    list: [
      ['Bengaluru', 'Bommasandra DC', 'BB-BLR-DC1', 22], ['Bengaluru', 'Yeshwantpur DC', 'BB-BLR-DC3', 14], ['Mumbai', 'Bhiwandi DC', 'BB-BOM-DC2', 14],
      ['Delhi NCR', 'Gurugram Sector 37 DC', 'BB-GGN-DC1', 12], ['Hyderabad', 'Bibinagar DC', 'BB-HYD-DC1', 10], ['Chennai', 'Sriperumbudur DC', 'BB-MAA-DC1', 9],
      ['Pune', 'Chakan DC', 'BB-PNQ-DC1', 8], ['Kolkata', 'Dankuni DC', 'BB-CCU-DC1', 6], ['Ahmedabad', 'Sanand DC', 'BB-AMD-DC1', 5],
    ],
    warehouses: ['BigBasket Bommasandra DC, Bengaluru', 'BigBasket Bhiwandi DC, Mumbai', 'BigBasket Gurugram DC', 'BigBasket Bibinagar DC, Hyderabad'],
  },
};

const PRICE_SPREAD: Record<ChannelId, [number, number]> = {
  shopify: [0, 0],
  amazon: [-0.05, 0],
  flipkart: [-0.06, 0],
  blinkit: [-0.06, 0.06],
  instamart: [-0.06, 0.06],
  zepto: [-0.06, 0.06],
  bigbasket: [-0.05, 0.03],
};

// ── Small helpers ──
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
const alnum = (seed: string, len: number) => Array.from({ length: len }, (_, i) => ALNUM[Math.floor(hash01(seed + i) * ALNUM.length)]).join('');
const digits = (seed: string, len: number) => Array.from({ length: len }, (_, i) => Math.floor(hash01(seed + 'd' + i) * 10)).join('');
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WEEKDAY[dt.getDay()]} ${fmtShortDate(dt)}`;
};

function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f);
  for (let k = 0; left > 0 && k < order.length; k++, left--) out[order[k].i]++;
  return out;
}

// ── Mutable listing and sync state (kept for the session) ──
const listingOverride: Record<string, 'Delisted' | 'Live'> = {};
const syncAt: Partial<Record<ChannelId, string>> = {};

export function setListing(ch: ChannelId, productId: string, status: 'Delisted' | 'Live') {
  listingOverride[`${ch}:${productId}`] = status;
}
export function touchSync(ch: ChannelId) {
  syncAt[ch] = new Date().toISOString();
}
export function lastSyncOf(ch: ChannelId): Date {
  const s = syncAt[ch];
  if (s) return new Date(s);
  const mins = 6 * 60 + 10 + Math.floor(hash01(ch + 'sync') * 170);
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), Math.floor(mins / 60), mins % 60);
}
export const fmtSync = (d: Date) => `${fmtShortDate(d)}, ${fmtTime(d)}`;

// ── View types ──
export interface ChannelSku {
  p: Product;
  extId: string;
  status: ListingStatus;
  units: number;
  price: number;
  hPrice: number;
  mrp: number;
  fill: number;
  cover: number;
  oosHrs: number;
  extra: string;
  storesLive: number;
}
export interface StoreRow {
  code: string;
  name: string;
  city: string;
  tag?: string;
  units: number;
  skusStocked: number;
  skusLow: number;
}
export interface PoLine { p: Product; qty: number; received?: number }
export interface ChannelPo {
  ref: string;
  status: PoStatus;
  raised: string;
  dest: string;
  slotDate: string;
  slot: string;
  asn: string;
  asnOk: boolean;
  lines: PoLine[];
  qty: number;
  receivedQty?: number;
}
export interface Section { title: string; note?: string; columns: string[]; rows: (string | number)[][] }
export interface Note { tone: 'ok' | 'warn' | 'bad'; text: string }

export interface ChannelView {
  meta: ChannelMeta;
  stores: StoreRow[];
  skus: ChannelSku[];
  pos: ChannelPo[];
  sections: Section[];
  notes: Note[];
  kpi: { units: number; liveSkus: number; totalSkus: number; oosSkus: number; fill: number; cover: number; openPos: number; inbound: number; stockValue: number };
  lastSync: Date;
}

const nf = new Intl.NumberFormat('en-IN');
const n0 = (n: number) => nf.format(Math.round(n));

export function channelPrice(p: Product, ch: ChannelId): number {
  const mrp = p.mrp ?? p.price;
  const [lo, hi] = PRICE_SPREAD[ch];
  const f = 1 + lo + (hi - lo) * hash01(p.sku + ch + 'price');
  return Math.min(mrp, Math.max(1, Math.round(p.price * f)));
}

function listingBase(p: Product, ch: ChannelId): 'Live' | 'Delisted' | 'Pending listing' {
  const h = hash01(p.sku + ch + 'listing');
  const quick = ch === 'blinkit' || ch === 'instamart' || ch === 'zepto';
  const pend = quick && p.category === 'Combos' ? 0.2 : 0.035;
  if (h < 0.045) return 'Delisted';
  if (h < 0.045 + pend) return 'Pending listing';
  return 'Live';
}

export function buildChannelView(ch: ChannelId, inventory: Product[]): ChannelView {
  const meta = CHANNEL_META[ch];
  const def = STORES[ch];
  const quick = meta.kind === 'quick';
  const units = (p: Product) => (p as any)[ch] as number;

  // Per-store allocation of each SKU's channel units
  const alloc: number[][] = inventory.map((p) =>
    allocate(units(p), def.list.map((s) => s[3] * (0.55 + hash01(p.sku + s[2]) * 0.9)))
  );

  // SKU rows
  const skus: ChannelSku[] = inventory.map((p, i) => {
    const u = units(p);
    const daily = (p.avgMonthlySales * meta.demand) / 30;
    const cover = daily > 0 ? Math.round((u / daily) * 10) / 10 : 999;
    let status: ListingStatus = listingOverride[`${ch}:${p.id}`] ?? listingBase(p, ch);
    if (status === 'Live' && u === 0) status = 'Out of stock';
    const h = hash01(p.sku + ch + 'fill');
    let fill: number;
    if (u === 0) fill = 0;
    else if (cover < 4) fill = 62 + h * 18;
    else if (cover < 8) fill = 82 + h * 9;
    else fill = (quick ? 91 : 93.5) + h * 7.5;
    if (status === 'Delisted' || status === 'Pending listing') fill = 0;
    const hrsH = hash01(p.sku + ch + 'oos');
    const oosHrs = u === 0 ? Math.round(96 + hrsH * 60) : cover < 3 ? Math.round(18 + hrsH * 40) : cover < 7 ? Math.round(5 + hrsH * 14) : Math.round(hrsH * 5);
    const storesLive = alloc[i].filter((q) => q > 0).length;
    let extra = '';
    if (ch === 'amazon') {
      const bb = Math.round((76 + hash01(p.sku + 'bb') * 23) * 10) / 10;
      const fba = hash01(p.sku + 'fba') < 0.78;
      extra = `${bb}% buy box, ${fba ? 'FBA' : 'Seller flex'}`;
    } else if (ch === 'flipkart') {
      extra = p.category !== 'Combos' && hash01(p.sku + 'fm') < 0.5 ? 'Yes' : 'No';
    } else if (ch === 'shopify') {
      extra = u === 0 ? 'On, sells out at 0' : cover < 10 ? 'On, holds back 3 units' : 'On';
    } else {
      extra = status === 'Live' || status === 'Out of stock' ? `${storesLive} of ${def.list.length}` : 'None';
    }
    const ext =
      ch === 'amazon' ? 'B0' + alnum(p.sku + 'asin', 8)
      : ch === 'flipkart' ? ['NUT', 'DFR', 'DTE', 'SNK'][Math.floor(hash01(p.sku + 'fp') * 4)] + alnum(p.sku + 'fsn', 13)
      : ch === 'blinkit' ? 'BL-' + digits(p.sku + 'bl', 6)
      : ch === 'instamart' ? 'IM-' + digits(p.sku + 'im', 7)
      : ch === 'zepto' ? 'ZPT-' + alnum(p.sku + 'zp', 6)
      : ch === 'bigbasket' ? 'BB' + digits(p.sku + 'bb', 7)
      : '/products/' + (CATALOG_BY_SKU[p.sku]?.handle || p.sku.toLowerCase());
    return {
      p, extId: ext, status, units: u, price: channelPrice(p, ch), hPrice: p.price, mrp: p.mrp ?? p.price,
      fill: Math.round(fill * 10) / 10, cover, oosHrs, extra, storesLive,
    };
  });

  // Stores
  const stores: StoreRow[] = def.list.map((s, si) => {
    let total = 0, stocked = 0, low = 0;
    skus.forEach((k, i) => {
      if (k.status === 'Delisted' || k.status === 'Pending listing') { total += alloc[i][si]; return; }
      const q = alloc[i][si];
      total += q;
      if (q > 0) stocked++;
      if (q > 0 && q <= 8) low++;
      if (q === 0 && k.units > 0) low++;
    });
    return {
      code: s[2], city: s[0], tag: s[4], units: total, skusStocked: stocked, skusLow: low,
      name: def.prefix ? `${s[0]} – ${s[1]} (${def.prefix} ${s[2]})` : s[2] === 'happilo.com location' ? `${s[0]} – ${s[1]}` : `${s[0]} – ${s[1]} (${s[2]})`,
    };
  });

  // Purchase orders / shipments
  const rankBase = skus
    .filter((k) => k.status === 'Live' || k.status === 'Out of stock')
    .sort((a, b) => b.p.avgMonthlySales - a.p.avgMonthlySales);
  const rank = rankBase.slice(0, 24);
  const poCount = quick ? 6 : 4;
  const ages = quick ? [1, 3, 5, 9, 16, 23] : [2, 6, 13, 21];
  const pos: ChannelPo[] = ages.slice(0, poCount).map((age, i) => {
    const seed = ch + 'po' + i;
    const raisedD = addDays(TODAY, -age);
    const yymm = `${String(raisedD.getFullYear()).slice(2)}${String(raisedD.getMonth() + 1).padStart(2, '0')}`;
    const four = digits(seed, 4);
    const ref =
      ch === 'blinkit' ? `BL-PO-${yymm}-${four}`
      : ch === 'instamart' ? `IM-PO-${yymm}-${four}`
      : ch === 'zepto' ? `ZP-PO-${yymm}-${four}`
      : ch === 'bigbasket' ? `BB-PO-${digits(seed, 7)}`
      : ch === 'amazon' ? `FBA15${alnum(seed, 6)}`
      : ch === 'flipkart' ? `FK-INB-${yymm}${digits(seed, 5)}`
      : `TRF-WEB-${1040 + (poCount - i) * 3 + Math.floor(hash01(seed) * 3)}`;
    let status: PoStatus;
    if (quick) status = i === 0 ? 'Confirmed' : i === 1 ? (hash01(seed) < 0.5 ? 'Confirmed' : 'Dispatched') : i === 2 ? 'Dispatched' : 'Received';
    else status = i === 0 ? 'Confirmed' : i === 1 ? 'Dispatched' : 'Received';
    const nLines = 4 + Math.floor(hash01(seed + 'n') * 3);
    const off = (i * 3) % 12;
    const lines: PoLine[] = Array.from({ length: nLines }, (_, j) => {
      const k = rank[(off + j * 2 + Math.floor(hash01(seed + j) * 2)) % rank.length];
      const base = (k.p.avgMonthlySales * meta.demand * (12 + hash01(seed + 'q' + j) * 9)) / 30;
      const qty = Math.max(24, Math.round(base / 6) * 6);
      return { p: k.p, qty, received: status === 'Received' ? Math.round(qty * (0.91 + hash01(seed + 'r' + j) * 0.09)) : undefined };
    }).filter((l, j, a) => a.findIndex((x) => x.p.id === l.p.id) === j);
    const slotChoices = ['9:00 to 11:00 am', '11:00 am to 1:00 pm', '2:00 to 4:00 pm', '4:00 to 6:00 pm'];
    const slotOff = status === 'Received' ? -(age - 2) : status === 'Dispatched' ? 1 + (i % 2) : 2 + i;
    const asnOk = status !== 'Confirmed' || hash01(seed + 'asn') < 0.5;
    return {
      ref, status, raised: toISO(raisedD), dest: def.warehouses[(i + Math.floor(hash01(ch + 'w') * 3)) % def.warehouses.length],
      slotDate: toISO(addDays(TODAY, slotOff)), slot: slotChoices[Math.floor(hash01(seed + 's') * 4)],
      asn: status === 'Received' ? 'Receipt closed' : asnOk ? (ch === 'amazon' ? 'Shipment plan accepted' : 'Advance notice accepted') : (ch === 'amazon' ? 'Labels not printed' : 'Advance notice not raised yet'),
      asnOk, lines, qty: lines.reduce((a, l) => a + l.qty, 0),
      receivedQty: status === 'Received' ? lines.reduce((a, l) => a + (l.received || 0), 0) : undefined,
    };
  });

  const open = pos.filter((o) => o.status !== 'Received');
  const incoming: Record<string, number> = {};
  open.forEach((o) => o.lines.forEach((l) => (incoming[l.p.id] = (incoming[l.p.id] || 0) + l.qty)));

  // KPIs
  const live = skus.filter((k) => k.status === 'Live');
  const liveUnits = live.reduce((a, k) => a + k.units, 0);
  const totalUnits = skus.reduce((a, k) => a + k.units, 0);
  const fillRows = skus.filter((k) => k.fill > 0);
  const kpi = {
    units: totalUnits,
    liveSkus: live.length,
    totalSkus: skus.length,
    oosSkus: skus.filter((k) => k.status === 'Out of stock').length,
    fill: fillRows.length ? Math.round((fillRows.reduce((a, k) => a + k.fill, 0) / fillRows.length) * 10) / 10 : 0,
    cover: (() => {
      const daily = skus.reduce((a, k) => a + (k.p.avgMonthlySales * meta.demand) / 30, 0);
      return daily > 0 ? Math.round((liveUnits / daily) * 10) / 10 : 0;
    })(),
    openPos: open.length,
    inbound: open.reduce((a, o) => a + o.qty, 0),
    stockValue: skus.reduce((a, k) => a + k.units * k.price, 0),
  };

  // Sections
  const sections: Section[] = [];
  const topBy = (n: number, f: (k: ChannelSku) => number) => [...skus].filter((k) => k.status !== 'Delisted').sort((a, b) => f(b) - f(a)).slice(0, n);
  const label = (k: ChannelSku) => `${k.p.name} (${k.p.pack})`;

  if (ch === 'shopify') {
    const rowsLoc = [...skus]
      .filter((k) => k.status !== 'Delisted')
      .sort((a, b) => a.cover - b.cover)
      .slice(0, 12)
      .map((k) => {
        const committed = Math.min(k.units, Math.round(((k.p.avgMonthlySales * meta.demand) / 30) * (1.1 + hash01(k.p.sku + 'cm') * 0.9)));
        const carts = Math.round(((k.p.avgMonthlySales * meta.demand) / 30) * (0.9 + hash01(k.p.sku + 'ac') * 1.6) * (k.cover < 7 ? 1.6 : 0.7));
        return [label(k), n0(k.units - committed), n0(committed), n0(incoming[k.p.id] || 0), `${k.cover > 400 ? '—' : k.cover.toFixed(1)} d`, k.extra, carts];
      });
    sections.push({
      title: 'Inventory at Bengaluru warehouse, lowest cover first',
      note: 'Available is what the store can still sell. Committed is on orders not yet packed. Incoming is on open restock transfers.',
      columns: ['Product', 'Available', 'Committed', 'Incoming', 'Cover', 'Oversell protection', 'Abandoned carts'],
      rows: rowsLoc,
    });
    const variantRows = topBy(8, (k) => k.p.avgMonthlySales).map((k) => {
      const hasPk = /_1PK$/.test(k.p.sku);
      const base = k.p.sku.replace(/_1PK$/, '');
      return [
        label(k),
        hasPk ? k.p.sku : k.p.sku, hasPk ? `${base}_2PK` : 'Single pack only', hasPk ? `${base}_5PK` : 'Single pack only',
        `${n0(k.units)} / ${hasPk ? n0(Math.floor(k.units / 2)) : '—'} / ${hasPk ? n0(Math.floor(k.units / 5)) : '—'}`,
      ];
    });
    sections.push({
      title: 'Pack variants on the store',
      note: 'Pack of 2 and pack of 5 draw from the same single-pack stock, so sellable packs shrink as units fall.',
      columns: ['Product', 'Pack of 1', 'Pack of 2', 'Pack of 5', 'Sellable packs (1 / 2 / 5)'],
      rows: variantRows,
    });
    const alerts = skus
      .filter((k) => k.status !== 'Delisted' && k.cover < 10)
      .sort((a, b) => a.cover - b.cover)
      .slice(0, 8)
      .map((k) => {
        const carts = Math.round(((k.p.avgMonthlySales * meta.demand) / 30) * (1.2 + hash01(k.p.sku + 'ar') * 1.4) * 1.5);
        const wait = Math.round(carts * (0.5 + hash01(k.p.sku + 'nm') * 0.9));
        const need = Math.max(0, Math.round(((k.p.avgMonthlySales * meta.demand) / 30) * meta.target - k.units));
        return [label(k), carts, wait, n0(k.units), n0(need)];
      });
    if (alerts.length)
      sections.push({
        title: 'Abandoned-cart restock alerts',
        note: 'Items sitting in open carts or on a notify-me list while stock is short.',
        columns: ['Product', 'Open carts', 'Notify-me sign-ups', 'Units left', 'Units to reach 20 days'],
        rows: alerts,
      });
    const cat = (c: string) => inventory.filter((p) => p.category === c);
    const bigPack = inventory.filter((p) => /(\d+)\s*kg|(5\d\d|[6-9]\d\d)\s*g/i.test(p.pack || '')).length;
    sections.push({
      title: 'Collections on happilo.com',
      columns: ['Collection', 'Products', 'Units available'],
      rows: [
        ['Gifting', inventory.filter((p) => p.category === 'Combos' || p.price >= 450).length, n0(inventory.filter((p) => p.category === 'Combos' || p.price >= 450).reduce((a, p) => a + p.shopify, 0))],
        ['Nuts', cat('Nuts').length, n0(cat('Nuts').reduce((a, p) => a + p.shopify, 0))],
        ['Dry Fruits', cat('Dry Fruits').length, n0(cat('Dry Fruits').reduce((a, p) => a + p.shopify, 0))],
        ['Dates', cat('Dates').length, n0(cat('Dates').reduce((a, p) => a + p.shopify, 0))],
        ['Makhana', cat('Makhana').length, n0(cat('Makhana').reduce((a, p) => a + p.shopify, 0))],
        ['Trail Mixes', cat('Trail Mixes').length, n0(cat('Trail Mixes').reduce((a, p) => a + p.shopify, 0))],
        ['Seeds', cat('Seeds').length, n0(cat('Seeds').reduce((a, p) => a + p.shopify, 0))],
        ['Combos', cat('Combos').length, n0(cat('Combos').reduce((a, p) => a + p.shopify, 0))],
        ['Bulk Order', bigPack, n0(inventory.filter((p) => /(\d+)\s*kg|(5\d\d|[6-9]\d\d)\s*g/i.test(p.pack || '')).reduce((a, p) => a + p.shopify, 0))],
      ],
    });
  }

  if (ch === 'amazon') {
    let fbaU = 0, flexU = 0, fbaS = 0, flexS = 0;
    skus.forEach((k) => {
      const fba = k.extra.endsWith('FBA');
      if (fba) { fbaU += k.units; if (k.units) fbaS++; } else { flexU += k.units; if (k.units) flexS++; }
    });
    sections.push({
      title: 'Fulfilment split',
      note: 'FBA stock is held and shipped by Amazon. Seller flex ships from the Bengaluru warehouse against Amazon orders.',
      columns: ['Fulfilment', 'SKUs', 'Units', 'Share'],
      rows: [
        ['Fulfilled by Amazon', fbaS, n0(fbaU), `${Math.round((fbaU / Math.max(1, fbaU + flexU)) * 100)}%`],
        ['Seller flex (Bengaluru)', flexS, n0(flexU), `${Math.round((flexU / Math.max(1, fbaU + flexU)) * 100)}%`],
      ],
    });
    sections.push({
      title: 'Lowest buy box share',
      columns: ['Product', 'ASIN', 'Buy box', 'Our price', 'Units'],
      rows: [...skus].filter((k) => k.status === 'Live').sort((a, b) => parseFloat(a.extra) - parseFloat(b.extra)).slice(0, 6).map((k) => [label(k), k.extId, k.extra.split(',')[0], `₹${k.price}`, n0(k.units)]),
    });
  }

  if (ch === 'flipkart') {
    const mins = skus.filter((k) => k.extra === 'Yes' && k.status === 'Live');
    sections.push({
      title: 'Flipkart Minutes',
      note: 'Small-store delivery in minutes. Listing is opt-in per product.',
      columns: ['Measure', 'Value'],
      rows: [
        ['Products enabled', `${mins.length} of ${skus.length}`],
        ['Minutes stores', stores.filter((s) => s.tag === 'Minutes').length],
        ['Units in Minutes stores', n0(stores.filter((s) => s.tag === 'Minutes').reduce((a, s) => a + s.units, 0))],
      ],
    });
  }

  if (quick || ch === 'bigbasket') {
    const clusters: [string, string][] = [
      ['Bengaluru South (Koramangala, HSR)', '560034, 560102'], ['Bengaluru East (Whitefield, Bellandur)', '560066, 560103'],
      ['Mumbai western suburbs', '400050, 400053'], ['Delhi NCR (Gurugram, Noida)', '122011, 201309'], ['Hyderabad west', '500032, 500081'],
      ['Pune (Kothrud, Baner)', '411038, 411045'], ['Chennai south', '600020, 600042'], ['Kolkata', '700091, 700156'],
    ];
    const t2 = topBy(2, (k) => k.p.avgMonthlySales);
    const [lo, hi] = PRICE_SPREAD[ch];
    sections.push({
      title: 'Price by pincode cluster',
      note: `${meta.short} sets prices by pincode, so they move slightly around the happilo.com price and never go above MRP.`,
      columns: ['Cluster', 'Sample pincodes', 'Price index vs happilo.com', ...t2.map((k) => `${k.p.name} ${k.p.pack}`)],
      rows: clusters.map(([name, pins]) => {
        const idx = Math.max(lo, Math.min(hi, lo + (hi - lo) * hash01(ch + name))) * 0.8;
        return [
          name, pins, `${idx >= 0 ? '+' : ''}${(idx * 100).toFixed(1)}%`,
          ...t2.map((k) => `₹${Math.min(k.mrp, Math.round(k.hPrice * (1 + idx)))}`),
        ];
      }),
    });
  }

  // Notes
  const notes: Note[] = [];
  const oos = skus.filter((k) => k.status === 'Out of stock');
  if (oos.length) notes.push({ tone: 'bad', text: `${oos.length} ${oos.length === 1 ? 'SKU is' : 'SKUs are'} out of stock here, for example ${oos.slice(0, 2).map((k) => k.p.name).join(' and ')}.` });
  const lowCover = skus.filter((k) => k.status === 'Live' && k.cover < meta.target * 0.4);
  if (lowCover.length) notes.push({ tone: 'warn', text: `${lowCover.length} live SKUs have under ${Math.round(meta.target * 0.4)} days of cover. Push stock from the warehouse or check the open orders below.` });
  const dl = skus.filter((k) => k.status === 'Delisted' && k.units > 0);
  if (dl.length) notes.push({ tone: 'warn', text: `${dl.length} delisted ${dl.length === 1 ? 'SKU still holds' : 'SKUs still hold'} ${n0(dl.reduce((a, k) => a + k.units, 0))} units. Relist them or move the stock back to the warehouse.` });
  const pend = skus.filter((k) => k.status === 'Pending listing');
  if (pend.length) notes.push({ tone: 'warn', text: `${pend.length} ${pend.length === 1 ? 'listing is' : 'listings are'} waiting for ${meta.short} to approve, so ${n0(pend.reduce((a, k) => a + k.units, 0))} units cannot sell yet.` });
  const lowFill = skus.filter((k) => k.fill > 0 && k.fill < 85);
  if (lowFill.length) notes.push({ tone: 'warn', text: `Fill rate is under 85% on ${lowFill.length} SKUs, which usually means short supply on recent orders.` });
  const noAsn = open.filter((o) => !o.asnOk);
  if (noAsn.length) notes.push({ tone: 'warn', text: `${noAsn.length} open ${noAsn.length === 1 ? 'order has' : 'orders have'} no advance notice yet (${noAsn.map((o) => o.ref).join(', ')}). The delivery slot can be refused without it.` });
  const priced = skus.filter((k) => k.hPrice !== k.price);
  if (priced.length && ch !== 'shopify') {
    const below = priced.filter((k) => k.price < k.hPrice).length;
    notes.push({ tone: 'ok', text: `${priced.length} SKUs are priced differently from happilo.com (${below} lower, ${priced.length - below} higher). None is above MRP.` });
  }
  if (ch === 'shopify') notes.push({ tone: 'ok', text: 'Oversell protection is on for every product, so a product stops selling when available stock reaches zero.' });
  if (ch === 'amazon') notes.push({ tone: 'ok', text: 'Amazon Now dark stores in Bengaluru are stocked from the same Amazon listings.' });
  if (ch === 'flipkart') notes.push({ tone: 'ok', text: 'Flipkart Minutes stores are replenished from the Bengaluru and Mumbai warehouses.' });
  if (!notes.some((n) => n.tone !== 'ok')) notes.unshift({ tone: 'ok', text: 'No stock or listing problems on this channel.' });

  return { meta, stores, skus, pos, sections, notes, kpi, lastSync: lastSyncOf(ch) };
}
