/**
 * Figures shown on the Executive Board and Master Dashboard, worked out from
 * the shared app data. Every field is read defensively because the other
 * modules own their own data and may add or rename optional fields.
 */
import { inrShort } from '@/lib/mock/sales';

type Any = Record<string, any>;

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const CHANNEL_FIELDS = ['warehouse', 'amazon', 'blinkit', 'zepto', 'flipkart', 'instamart', 'bigbasket', 'shopify'];
const EXPIRY_FIELDS = ['nearExpiryUnits', 'nearExpiry', 'expiringUnits', 'nearExpiryCount'];

export interface StockRow {
  id: string;
  name: string;
  units: number;
  value: number;
  coverDays: number;
  leadTime: number;
  monthly: number;
  suggestedPo: number;
  nearExpiry: number | null;
}

export function inventoryHealth(inventory: Any[] | undefined) {
  const rows: StockRow[] = (inventory || []).map((p) => {
    const units = CHANNEL_FIELDS.reduce((a, f) => a + num(p[f]), 0);
    const monthly = num(p.avgMonthlySales);
    const daily = monthly / 30;
    const leadTime = num(p.leadTime, 30);
    const coverDays = daily > 0 ? Math.round(units / daily) : 999;
    const want = Math.ceil(daily * (leadTime + 45));
    const suggestedPo = Math.max(0, Math.round((want - units) / 50) * 50);
    const found = EXPIRY_FIELDS.find((f) => p[f] !== undefined && p[f] !== null);
    return {
      id: String(p.id ?? p.sku ?? p.name),
      name: String(p.name ?? p.sku ?? 'Unnamed SKU'),
      units,
      value: units * num(p.cost),
      coverDays,
      leadTime,
      monthly,
      suggestedPo,
      nearExpiry: found ? num(p[found]) : null,
    };
  });
  const belowReorder = rows.filter((r) => r.monthly > 0 && r.coverDays <= r.leadTime + 7).sort((a, b) => a.coverDays - b.coverDays);
  const overstock = rows.filter((r) => r.monthly > 0 && r.coverDays > 120).sort((a, b) => b.value - a.value);
  const hasExpiry = rows.some((r) => r.nearExpiry !== null);
  return {
    rows,
    stockValue: rows.reduce((a, r) => a + r.value, 0),
    units: rows.reduce((a, r) => a + r.units, 0),
    belowReorder,
    overstock,
    healthy: rows.length - belowReorder.length - overstock.length,
    hasExpiry,
    nearExpiryUnits: rows.reduce((a, r) => a + (r.nearExpiry || 0), 0),
    nearExpirySkus: rows.filter((r) => (r.nearExpiry || 0) > 0).length,
    medianCover: (() => {
      const c = rows.filter((r) => r.monthly > 0).map((r) => r.coverDays).sort((a, b) => a - b);
      return c.length ? c[Math.floor(c.length / 2)] : 0;
    })(),
  };
}

export function receivablesSnapshot(receivables: Any[] | undefined) {
  const list = receivables || [];
  const overdue = list.filter((r) => num(r.overdueDays) > 0);
  const bucket = (lo: number, hi: number) =>
    overdue.filter((r) => num(r.overdueDays) >= lo && num(r.overdueDays) <= hi).reduce((a, r) => a + num(r.outstanding), 0);
  return {
    outstanding: list.reduce((a, r) => a + num(r.outstanding), 0),
    overdueValue: overdue.reduce((a, r) => a + num(r.outstanding), 0),
    overdueCount: overdue.length,
    accounts: list.length,
    b1: bucket(1, 30),
    b2: bucket(31, 60),
    b3: bucket(61, 100000),
    worst: [...overdue].sort((a, b) => num(b.outstanding) * Math.min(num(b.overdueDays), 60) - num(a.outstanding) * Math.min(num(a.overdueDays), 60)).slice(0, 3),
  };
}

export function supportSnapshot(cases: Any[] | undefined, reviews: Any[] | undefined) {
  const cs = cases || [];
  const rv = reviews || [];
  const open = cs.filter((c) => String(c.status).toLowerCase() === 'open');
  const escalated = open.filter((c) => c.escalation && String(c.escalation).toLowerCase() !== 'none');
  const rated = rv.filter((r) => num(r.rating) > 0);
  const rating = rated.length ? rated.reduce((a, r) => a + num(r.rating), 0) / rated.length : 0;
  const lowUnanswered = rv.filter((r) => num(r.rating) > 0 && num(r.rating) <= 3 && !r.reply);
  return {
    total: cs.length,
    open: open.length,
    escalated,
    rating,
    reviewCount: rated.length,
    low: rv.filter((r) => num(r.rating) > 0 && num(r.rating) <= 3).length,
    lowUnanswered,
  };
}

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();

export function b2bSnapshot(leads: Any[] | undefined) {
  const list = leads || [];
  const stageOf = (l: Any) => norm(l.stage ?? l.current_stage);
  const active = list.filter((l) => !['won', 'lost'].includes(stageOf(l)));
  const count = (...names: string[]) => list.filter((l) => names.includes(stageOf(l))).length;
  const withValue = list.filter((l) => num(l.dealValue ?? l.value ?? l.expectedValue) > 0 && !['won', 'lost'].includes(stageOf(l)));
  return {
    total: list.length,
    active: active.length,
    won: count('won'),
    lost: count('lost'),
    sample: count('sample sent'),
    negotiation: count('negotiation'),
    interested: count('interested', 'demo booked'),
    pipelineValue: withValue.length ? withValue.reduce((a, l) => a + num(l.dealValue ?? l.value ?? l.expectedValue), 0) : null,
  };
}

export function contentSnapshot(drafts: Any[] | undefined) {
  const list = drafts || [];
  const by = (s: string) => list.filter((d) => norm(d.status) === s).length;
  return {
    total: list.length,
    draft: by('draft'),
    review: by('review'),
    approved: by('approved'),
    published: by('published') + by('posted') + by('scheduled'),
    nextInReview: list.find((d) => norm(d.status) === 'review') || null,
  };
}

export interface AttentionItem {
  id: string;
  tag: string;
  tone: 'red' | 'amber' | 'green';
  text: string;
  href: string;
}

export function attentionList(args: {
  inv: ReturnType<typeof inventoryHealth>;
  rec: ReturnType<typeof receivablesSnapshot>;
  sup: ReturnType<typeof supportSnapshot>;
  b2b: ReturnType<typeof b2bSnapshot>;
  content: ReturnType<typeof contentSnapshot>;
}): AttentionItem[] {
  const { inv, rec, sup, b2b, content } = args;
  const out: AttentionItem[] = [];

  inv.belowReorder.slice(0, 3).forEach((r) => {
    const late = r.coverDays < r.leadTime;
    out.push({
      id: `ro-${r.id}`,
      tag: 'Stock',
      tone: late ? 'red' : 'amber',
      text: `${r.name}: ${r.units.toLocaleString('en-IN')} units across all locations, about ${r.coverDays} days of cover. Supplier lead time is ${r.leadTime} days${late ? ', so we will run dry before a fresh PO lands' : ''}.${r.suggestedPo > 0 ? ` Raise a PO for around ${r.suggestedPo.toLocaleString('en-IN')} units today.` : ''}`,
      href: '/inventory',
    });
  });

  rec.worst.slice(0, 2).forEach((r: Any) => {
    out.push({
      id: `ar-${r.id}`,
      tag: 'Dues',
      tone: num(r.overdueDays) > 45 ? 'red' : 'amber',
      text: `${r.name} owes ${inrShort(num(r.outstanding))}, ${num(r.overdueDays)} days past due${r.stage ? ` (at ${r.stage})` : ''}. ${num(r.overdueDays) > 45 ? 'Needs a call from the founder, reminders alone are not working.' : 'Follow up by phone this week.'}`,
      href: '/accounts-receivable/dashboard',
    });
  });

  sup.escalated.slice(0, 2).forEach((c: Any) => {
    out.push({
      id: `sc-${c.id}`,
      tag: 'Support',
      tone: 'amber',
      text: `${c.customer} (${c.channel}): ${String(c.escalation).toLowerCase()}. Case still open, ${c.time}.`,
      href: '/customer-care',
    });
  });

  if (sup.lowUnanswered.length) {
    const r = sup.lowUnanswered[0] as Any;
    out.push({
      id: 'rv-low',
      tag: 'Reviews',
      tone: 'amber',
      text: `${sup.lowUnanswered.length} low review${sup.lowUnanswered.length > 1 ? 's' : ''} with no reply yet. Oldest is ${r.customer}'s ${num(r.rating)}-star on ${r.platform}.`,
      href: '/customer-care',
    });
  }

  if (inv.overstock.length) {
    const o = inv.overstock[0];
    out.push({
      id: `os-${o.id}`,
      tag: 'Overstock',
      tone: 'green',
      text: `${o.name} has ${o.coverDays} days of cover and ${inrShort(o.value)} sitting in stock. Hold off on reorders and push it in the next bundle or B2B quote.`,
      href: '/inventory',
    });
  }

  if (inv.hasExpiry && inv.nearExpirySkus > 0) {
    out.push({
      id: 'expiry',
      tag: 'Expiry',
      tone: 'amber',
      text: `${inv.nearExpiryUnits.toLocaleString('en-IN')} units across ${inv.nearExpirySkus} SKU${inv.nearExpirySkus > 1 ? 's' : ''} are close to expiry. Move them through Zepto and Instamart before month end.`,
      href: '/inventory',
    });
  }

  if (b2b.sample + b2b.negotiation > 0) {
    out.push({
      id: 'b2b',
      tag: 'B2B',
      tone: 'green',
      text: `${b2b.negotiation} account${b2b.negotiation === 1 ? '' : 's'} in negotiation and ${b2b.sample} with samples out. Chase the sample feedback before they go cold after the festive rush.`,
      href: '/b2b-crm/dashboard',
    });
  }

  if (content.review > 0) {
    out.push({
      id: 'content',
      tag: 'Content',
      tone: 'green',
      text: `${content.review} script${content.review > 1 ? 's' : ''} waiting for sign-off${content.nextInReview ? `, starting with "${(content.nextInReview as Any).title}"` : ''}.`,
      href: '/marketing',
    });
  }

  const order = { red: 0, amber: 1, green: 2 } as const;
  return out.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 8);
}
