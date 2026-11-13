/**
 * Inventory operations data: lots, purchase orders, stock movements and
 * cycle counts. Held in a small module-level store so edits made in the
 * console survive moving between pages during a session.
 */
import { useSyncExternalStore } from 'react';
import { INITIAL_INVENTORY, SUPPLIERS } from './inventory';
import type { Product } from './inventory';
import { TODAY, addDays, toISO, parseISO, hash01, daysBetween, fmtDate } from './inventory-utils';

// ── Types ──
export interface Batch {
  lot: string;
  productId: string;
  qty: number;
  mfg: string; // ISO date
  expiry: string; // ISO date
  grn: string;
  bay: string;
}

export type PoStatus = 'Ordered' | 'In Transit' | 'At Port' | 'Customs' | 'Received';
export const PO_FLOW: PoStatus[] = ['Ordered', 'In Transit', 'At Port', 'Customs', 'Received'];

export interface PoLine {
  productId: string;
  qty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  country: string;
  lines: PoLine[];
  orderedOn: string;
  eta: string;
  status: PoStatus;
  route: string;
  note?: string;
  receivedOn?: string;
}

export type MoveType = 'GRN' | 'Dispatch' | 'Return' | 'Adjustment' | 'Transfer' | 'Write-off';

export interface Movement {
  id: string;
  ts: string; // ISO datetime
  type: MoveType;
  productId: string;
  qty: number; // positive units moved / received; sign of effect shown by type
  from: string;
  to: string;
  ref: string;
  user: string;
  note?: string;
}

export interface CycleCount {
  id: string;
  productId: string;
  location: string;
  systemQty: number;
  countedQty: number;
  date: string;
  countedBy: string;
  reason: string;
  status: 'Pending review' | 'Approved' | 'Recount asked';
}

export interface OpsState {
  batches: Batch[];
  pos: PurchaseOrder[];
  movements: Movement[];
  counts: CycleCount[];
}

export const USERS = ['Ravi K.', 'Sunitha M.', 'Imran S.', 'Deepa N.', 'Manjunath G.', 'Pooja R.', 'Harish B.'];

const P = (n: number) => INITIAL_INVENTORY[n - 1];
const byId: Record<string, Product> = Object.fromEntries(INITIAL_INVENTORY.map((p) => [p.id, p]));

const ZONE: Record<string, string> = {
  Nuts: 'Rack N',
  'Dry Fruits': 'Rack D',
  Dates: 'Cold room 1 / ',
  'Trail Mixes': 'Rack T',
  Seeds: 'Rack S',
  Makhana: 'Rack M',
  Combos: 'Gifting bay ',
};

function bayFor(p: Product, i: number) {
  const z = ZONE[p.category || 'Nuts'];
  const n = 1 + Math.floor(hash01(p.sku + 'bay' + i) * 7);
  return z.endsWith(' ') || z.endsWith('/ ') ? `${z}${String.fromCharCode(64 + (n % 4) + 1)}${n}` : `${z}${n}`;
}

// ── Lots ──
// Products given a deliberately ageing oldest lot: id -> days of shelf life left
const AGEING: Record<string, number> = {
  'inv-22': 21, // blueberries
  'inv-14': 13, // brazil nuts
  'inv-36': 35, // blueberry cranberry duet
  'inv-26': 25, // kalmi dates
  'inv-7': 30, // roasted salted cashew
  'inv-45': 44, // peri peri makhana
  'inv-10': 52, // inshell walnuts
  'inv-15': 58, // pecan
};

function lotId(mfg: Date, seed: string) {
  const yy = String(mfg.getFullYear()).slice(2);
  const mm = String(mfg.getMonth() + 1).padStart(2, '0');
  const n = String(100 + Math.floor(hash01(seed) * 880)).padStart(4, '0');
  return `HP-B${yy}${mm}-${n}`;
}

function buildBatches(): Batch[] {
  const out: Batch[] = [];
  INITIAL_INVENTORY.forEach((p, idx) => {
    const wh = p.warehouse;
    if (wh <= 0) return;
    const shelf = p.shelfLifeDays || 270;
    const n = wh >= 900 ? 3 : wh >= 180 ? 2 : 1;
    const shares = n === 3 ? [0.2, 0.32, 0.48] : n === 2 ? [0.3, 0.7] : [1];
    const ageing = AGEING[p.id];
    let left = wh;
    for (let i = 0; i < n; i++) {
      const qty = i === n - 1 ? left : Math.round(wh * shares[i]);
      left -= qty;
      const newestAge = 8 + Math.floor(hash01(p.sku + 'new') * 24);
      let mfgAge: number;
      if (i === n - 1) mfgAge = newestAge;
      else if (i === 0) {
        const cap = Math.min(shelf * 0.42, shelf - 100);
        mfgAge = ageing !== undefined ? shelf - ageing : Math.round(Math.max(newestAge + 20, cap * (0.7 + hash01(p.sku + 'old') * 0.3)));
      } else {
        mfgAge = Math.round(newestAge + (shelf * 0.2 + hash01(p.sku + 'mid') * 20));
      }
      const mfg = addDays(TODAY, -mfgAge);
      const exp = addDays(mfg, shelf);
      const recv = addDays(mfg, 2 + Math.floor(hash01(p.sku + 'r' + i) * 6));
      out.push({
        lot: lotId(mfg, p.sku + i),
        productId: p.id,
        qty,
        mfg: toISO(mfg),
        expiry: toISO(exp),
        grn: `GRN-${String(recv.getMonth() + 1).padStart(2, '0')}${String(recv.getDate()).padStart(2, '0')}-${String(210 + idx * 3 + i).padStart(4, '0')}`,
        bay: bayFor(p, i),
      });
    }
  });
  // One cranberry lot already past its date, held for write-off
  const cran = out.find((b) => b.productId === 'inv-23');
  if (cran && cran.qty > 200) {
    const take = 126;
    cran.qty -= take;
    const mfg = addDays(TODAY, -(365 + 6));
    out.push({
      lot: lotId(mfg, 'cran-exp'),
      productId: 'inv-23',
      qty: take,
      mfg: toISO(mfg),
      expiry: toISO(addDays(mfg, 365)),
      grn: 'GRN-1119-0188',
      bay: 'Hold cage 1',
    });
  }
  return out;
}

// ── Purchase orders ──
function line(n: number, qty: number): PoLine {
  return { productId: P(n).id, qty, unitCost: P(n).cost };
}

function buildPOs(): PurchaseOrder[] {
  const d = (n: number) => toISO(addDays(TODAY, n));
  const mk = (
    n: number,
    supplierKey: string,
    lines: PoLine[],
    ordered: number,
    eta: number,
    status: PoStatus,
    route: string,
    note?: string,
    received?: number
  ): PurchaseOrder => ({
    id: `HP/PO/26-27/${String(n).padStart(4, '0')}`,
    supplier: SUPPLIERS[supplierKey].name,
    country: SUPPLIERS[supplierKey].country,
    lines,
    orderedOn: d(ordered),
    eta: d(eta),
    status,
    route,
    note,
    receivedOn: received !== undefined ? d(received) : undefined,
  });
  return [
    mk(151, 'CA_ALM', [line(1, 9400), line(2, 4200)], -34, 16, 'In Transit', 'Oakland to Nhava Sheva, then road to Bengaluru', 'Vessel MSC Tessa, ETD 2 Nov'),
    mk(149, 'CA_PIS', [line(12, 3100)], -41, 4, 'At Port', 'Oakland to Chennai, then road to Bengaluru', 'Awaiting berth, port out expected in 2 days'),
    mk(152, 'CA_WAL', [line(9, 2600)], -3, 47, 'Ordered', 'Oakland to Nhava Sheva', 'Advance paid, packing schedule confirmed'),
    mk(147, 'AF_DRY', [line(16, 4300)], -33, 3, 'Customs', 'Kabul to Attari, then road to Bengaluru', 'Duty paid, awaiting FSSAI sampling clearance'),
    mk(150, 'TR_APR', [line(17, 5200)], -22, 14, 'In Transit', 'Izmir to Mundra, then road to Bengaluru'),
    mk(153, 'SA_AJW', [line(24, 1850)], -19, 15, 'In Transit', 'Jeddah to Chennai, then road to Bengaluru'),
    mk(155, 'KL_CSH', [line(6, 8600)], -2, 8, 'Ordered', 'Kollam to Bengaluru by road', 'Expedited, processor shifting two grading lines'),
    mk(148, 'KL_CSH', [line(5, 12400)], -6, 3, 'In Transit', 'Kollam to Bengaluru by road', 'Two trucks, second one due a day behind'),
    mk(154, 'BR_MK2', [line(47, 9200)], -4, 9, 'Ordered', 'Madhubani to Bengaluru by road'),
    mk(146, 'OM_DAT', [line(27, 3600), line(28, 3100)], -30, 2, 'Customs', 'Sohar to Chennai, then road to Bengaluru', 'Bill of entry filed, examination order received'),
    mk(145, 'IR_DAT', [line(30, 2300), line(26, 1750)], -24, 11, 'In Transit', 'Bandar Abbas to Nhava Sheva, then road'),
    mk(143, 'MP_SEED', [line(41, 3600)], -17, -5, 'Received', 'Neemuch to Bengaluru by road', undefined, -5),
    mk(142, 'AE_DAT', [line(29, 4100)], -35, -9, 'Received', 'Jebel Ali to Chennai, then road', undefined, -9),
    mk(140, 'KL_CSH', [line(5, 11800), line(7, 5200)], -19, -11, 'Received', 'Kollam to Bengaluru by road', undefined, -11),
  ];
}

// ── Movements ──
const CH_REF: Record<string, (s: string) => string> = {
  amazon: (s) => `FBA shipment FBA${15 + Math.floor(hash01(s) * 3)}${String.fromCharCode(65 + Math.floor(hash01(s + 'a') * 26))}${Math.floor(hash01(s + 'b') * 8999 + 1000)}${String.fromCharCode(65 + Math.floor(hash01(s + 'c') * 26))}`,
  blinkit: (s) => `ASN BL-${Math.floor(hash01(s) * 8000 + 1500)}`,
  zepto: (s) => `ZP-PO-${Math.floor(hash01(s) * 90000 + 10000)}`,
  flipkart: (s) => `FK-WH-${Math.floor(hash01(s) * 40000 + 20000)}`,
  instamart: (s) => `SWG-ASN-${Math.floor(hash01(s) * 70000 + 30000)}`,
  bigbasket: (s) => `BB-PO-${Math.floor(hash01(s) * 800000 + 100000)}`,
  shopify: (s) => `Web orders, dispatch run ${Math.floor(hash01(s) * 3 + 1)}`,
};

const CH_LIST = ['amazon', 'blinkit', 'zepto', 'flipkart', 'instamart', 'bigbasket', 'shopify'];
const CH_NAME: Record<string, string> = {
  amazon: 'Amazon',
  blinkit: 'Blinkit',
  zepto: 'Zepto',
  flipkart: 'Flipkart',
  instamart: 'Instamart',
  bigbasket: 'BigBasket',
  shopify: 'Shopify (happilo.com)',
};

function pickProduct(seed: string): Product {
  // bias towards fast movers
  const r = Math.pow(hash01(seed), 1.7);
  return INITIAL_INVENTORY[Math.floor(r * INITIAL_INVENTORY.length)];
}

function buildMovements(pos: PurchaseOrder[]): Movement[] {
  const list: Movement[] = [];
  let seq = 4180;
  const push = (m: Omit<Movement, 'id'>) => list.push({ id: `MV-${seq++}`, ...m });
  const at = (dayOffset: number, seed: string) => {
    const d = addDays(TODAY, -dayOffset);
    const mins = 9 * 60 + Math.floor(hash01(seed + 't') * 9 * 60);
    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return d.toISOString();
  };
  const user = (s: string) => USERS[Math.floor(hash01(s + 'u') * USERS.length)];

  // GRNs for received orders
  pos.filter((o) => o.status === 'Received').forEach((o) => {
    o.lines.forEach((l, i) => {
      const dayOff = Math.max(0, daysBetween(parseISO(o.receivedOn!), TODAY));
      push({
        ts: at(dayOff, o.id + i),
        type: 'GRN',
        productId: l.productId,
        qty: l.qty,
        from: o.supplier,
        to: 'Bengaluru DC',
        ref: o.id,
        user: 'Ravi K.',
        note: 'Inward QC passed',
      });
    });
  });

  for (let k = 0; k < 62; k++) {
    const s = 'mv' + k;
    const dayOff = Math.floor(k / 5.5);
    const p = pickProduct(s);
    const r = hash01(s + 'type');
    const monthlyPerDay = p.avgMonthlySales / 30;
    const ch = CH_LIST[Math.floor(hash01(s + 'ch') * CH_LIST.length)];
    if (r < 0.42) {
      const qty = Math.max(12, Math.round(monthlyPerDay * (1.2 + hash01(s + 'q') * 3.4)));
      push({ ts: at(dayOff, s), type: 'Dispatch', productId: p.id, qty, from: 'Bengaluru DC', to: CH_NAME[ch], ref: CH_REF[ch](s), user: user(s) });
    } else if (r < 0.65) {
      const qty = Math.max(10, Math.round(monthlyPerDay * (0.8 + hash01(s + 'q') * 2)));
      const qc = ['blinkit', 'zepto', 'instamart'][Math.floor(hash01(s + 'qc') * 3)];
      push({
        ts: at(dayOff, s),
        type: 'Transfer',
        productId: p.id,
        qty,
        from: 'Bengaluru DC',
        to: CH_NAME[qc],
        ref: `TRF-${Math.floor(hash01(s + 'ref') * 900 + 100)}`,
        user: user(s),
        note: 'Replenishment for dark stores',
      });
    } else if (r < 0.8) {
      const qty = Math.max(2, Math.round(monthlyPerDay * (0.05 + hash01(s + 'q') * 0.2)));
      const rc = ['amazon', 'flipkart', 'shopify'][Math.floor(hash01(s + 'rc') * 3)];
      push({
        ts: at(dayOff, s),
        type: 'Return',
        productId: p.id,
        qty,
        from: CH_NAME[rc],
        to: 'Bengaluru DC',
        ref: `RTO-${Math.floor(hash01(s + 'ref') * 9000 + 1000)}`,
        user: user(s),
        note: hash01(s + 'n') > 0.5 ? 'Seal intact, restocked' : 'Seal broken, sent to QC hold',
      });
    } else if (r < 0.93) {
      const qty = Math.max(1, Math.round(2 + hash01(s + 'q') * 14));
      const why = ['Pack damaged during picking', 'Count correction after bin check', 'Moisture seen on carton, set aside', 'Short-picked order corrected'][Math.floor(hash01(s + 'why') * 4)];
      push({ ts: at(dayOff, s), type: 'Adjustment', productId: p.id, qty, from: 'Bengaluru DC', to: 'Adjustment', ref: `ADJ-${Math.floor(hash01(s + 'ref') * 900 + 100)}`, user: user(s), note: why });
    } else {
      const qty = Math.max(4, Math.round(6 + hash01(s + 'q') * 30));
      push({ ts: at(dayOff, s), type: 'Write-off', productId: p.id, qty, from: 'Bengaluru DC', to: 'Write-off', ref: `WO-${Math.floor(hash01(s + 'ref') * 90 + 10)}`, user: 'Sunitha M.', note: 'Damaged in transit, claim raised' });
    }
  }
  list.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  // renumber so the newest has the highest id
  const n = list.length;
  list.forEach((m, i) => (m.id = `MV-${4180 + n - i}`));
  return list;
}

// ── Cycle counts ──
function buildCounts(): CycleCount[] {
  const rows: Array<[number, number, string, 'Pending review' | 'Approved' | 'Recount asked', number, string]> = [
    [5, -9, 'Short-picked cartons, two never entered', 'Pending review', 2, 'Imran S.'],
    [1, 6, 'Late GRN posting, stock was physically in', 'Approved', 4, 'Deepa N.'],
    [31, -14, 'Pack damage in picking', 'Pending review', 2, 'Imran S.'],
    [24, -3, 'Moisture on two cartons, discarded', 'Approved', 6, 'Manjunath G.'],
    [45, -22, 'Unlabelled carton found in the wrong bay', 'Recount asked', 1, 'Harish B.'],
    [16, 0, 'Matches system', 'Approved', 8, 'Deepa N.'],
    [47, -11, 'Possible mix-up with Cream & Onion carton', 'Recount asked', 1, 'Pooja R.'],
    [3, 4, 'Wrong unit entered on last GRN', 'Approved', 9, 'Manjunath G.'],
    [37, -6, 'Opened pack, used for QC sample', 'Approved', 7, 'Pooja R.'],
    [11, -17, 'Short-pick on Amazon batch', 'Pending review', 3, 'Harish B.'],
  ];
  return rows.map(([n, variance, reason, status, ago, by], i) => {
    const p = P(n);
    const system = Math.max(60, Math.round(p.warehouse * (0.1 + hash01(p.sku + 'cc') * 0.08)));
    return {
      id: `CC-${2611 - i}`,
      productId: p.id,
      location: bayFor(p, 0),
      systemQty: system,
      countedQty: system + variance,
      date: toISO(addDays(TODAY, -ago)),
      countedBy: by,
      reason,
      status,
    };
  });
}

// ── Store ──
function init(): OpsState {
  const pos = buildPOs();
  return { batches: buildBatches(), pos, movements: buildMovements(pos), counts: buildCounts() };
}

let state: OpsState = init();
const listeners = new Set<() => void>();

export const getOps = () => state;
export function updateOps(fn: (s: OpsState) => Partial<OpsState>) {
  state = { ...state, ...fn(state) };
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
export function useOps(): OpsState {
  return useSyncExternalStore(subscribe, getOps, getOps);
}

// ── Helpers ──
export const poValue = (o: PurchaseOrder) => o.lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
export const poUnits = (o: PurchaseOrder) => o.lines.reduce((a, l) => a + l.qty, 0);
export const isOpenPO = (o: PurchaseOrder) => o.status !== 'Received';

export function inboundFor(pos: PurchaseOrder[]): Record<string, number> {
  const m: Record<string, number> = {};
  pos.filter(isOpenPO).forEach((o) => o.lines.forEach((l) => (m[l.productId] = (m[l.productId] || 0) + l.qty)));
  return m;
}

export function nextPoNumber(pos: PurchaseOrder[]) {
  const max = pos.reduce((a, o) => Math.max(a, parseInt(o.id.split('/').pop() || '0', 10)), 0);
  return `HP/PO/26-27/${String(max + 1).padStart(4, '0')}`;
}

export function nextMovementId(ms: Movement[]) {
  const max = ms.reduce((a, m) => Math.max(a, parseInt(m.id.replace('MV-', ''), 10)), 0);
  return `MV-${max + 1}`;
}

/** Apply a warehouse quantity change to lots: additions go on the newest lot, deductions follow FEFO. */
export function applyBatchDelta(batches: Batch[], productId: string, delta: number): Batch[] {
  const mine = batches.filter((b) => b.productId === productId).sort((a, b) => (a.expiry < b.expiry ? -1 : 1));
  if (!mine.length || delta === 0) return batches;
  const next = new Map(batches.map((b) => [b.lot, { ...b }]));
  if (delta > 0) {
    const target = next.get(mine[mine.length - 1].lot)!;
    target.qty += delta;
  } else {
    let need = -delta;
    for (const b of mine) {
      if (need <= 0) break;
      const t = next.get(b.lot)!;
      const take = Math.min(t.qty, need);
      t.qty -= take;
      need -= take;
    }
  }
  return batches.map((b) => next.get(b.lot)!).filter((b) => b.qty > 0);
}

export function newLot(p: Product, qty: number, grn: string): Batch {
  const mfg = addDays(TODAY, -10);
  return {
    lot: lotId(mfg, p.sku + grn),
    productId: p.id,
    qty,
    mfg: toISO(mfg),
    expiry: toISO(addDays(mfg, p.shelfLifeDays || 270)),
    grn,
    bay: bayFor(p, 9),
  };
}

export const productById = (id: string) => byId[id];
export { fmtDate };
