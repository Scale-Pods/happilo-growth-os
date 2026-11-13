'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Chart from 'chart.js/auto';
import { useAppContext } from '../ClientWrapper';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import {
  SALES_CHANNELS,
  CUSTOMER_METRICS,
  TOP_SKUS,
  salesWindow,
  weeklySeries,
  inr,
  inrShort,
  pctChange,
} from '@/lib/mock/sales';
import {
  inventoryHealth,
  receivablesSnapshot,
  supportSnapshot,
  b2bSnapshot,
  contentSnapshot,
  attentionList,
} from './metrics';

const INK2 = '#4B5A52';
const GRID = 'rgba(12, 62, 51, 0.08)';
const TONE: Record<string, string> = { red: 'var(--red)', amber: 'var(--brand-gold)', green: 'var(--brand-mid)' };

const PERIODS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

function Delta({ value, invert = false, suffix = 'vs previous' }: { value: number | null; invert?: boolean; suffix?: string }) {
  if (value === null) return <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>No earlier period</span>;
  const good = invert ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: good ? 'var(--green)' : 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <Icon size={13} />
      {Math.abs(value).toFixed(1)}% <span style={{ fontWeight: 500, color: 'var(--label-secondary)' }}>{suffix}</span>
    </span>
  );
}

function Card({ title, sub, href, linkLabel, children, style }: { title: string; sub?: string; href?: string; linkLabel?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="liquid-card" style={{ padding: 20, ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
          {sub && <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginTop: 2 }}>{sub}</div>}
        </div>
        {href && (
          <Link href={href} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {linkLabel || 'Open'} <ChevronRight size={12} style={{ verticalAlign: '-2px' }} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--separator)' }}>
      <span style={{ color: 'var(--label-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: tone || 'var(--label-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { inventory, supportCases, reviews, receivables, b2bLeads, contentDrafts } = useAppContext();
  const [days, setDays] = useState(30);

  const barRef = useRef<HTMLCanvasElement | null>(null);
  const donutRef = useRef<HTMLCanvasElement | null>(null);

  const win = useMemo(() => salesWindow(days), [days]);
  const weekly = useMemo(() => weeklySeries(13), []);
  const cur = win.current;
  const prev = win.previous;

  const inv = useMemo(() => inventoryHealth(inventory as any), [inventory]);
  const rec = useMemo(() => receivablesSnapshot(receivables as any), [receivables]);
  const sup = useMemo(() => supportSnapshot(supportCases as any, reviews as any), [supportCases, reviews]);
  const b2b = useMemo(() => b2bSnapshot(b2bLeads as any), [b2bLeads]);
  const content = useMemo(() => contentSnapshot(contentDrafts as any), [contentDrafts]);
  const attention = useMemo(() => attentionList({ inv, rec, sup, b2b, content }), [inv, rec, sup, b2b, content]);

  const channelRows = useMemo(
    () =>
      SALES_CHANNELS.map((c) => ({
        ...c,
        revenue: cur.revenue[c.key],
        orders: cur.orders[c.key],
        share: cur.totalRevenue ? (cur.revenue[c.key] / cur.totalRevenue) * 100 : 0,
        change: prev ? pctChange(cur.revenue[c.key], prev.revenue[c.key]) : null,
      })).sort((a, b) => b.revenue - a.revenue),
    [cur, prev]
  );

  const adSpendChange = pctChange(CUSTOMER_METRICS.adSpend30, CUSTOMER_METRICS.adSpendPrev);
  const roas = CUSTOMER_METRICS.adSpend30
    ? (salesWindow(30).current.totalRevenue - salesWindow(30).current.revenue.b2b) / CUSTOMER_METRICS.adSpend30
    : 0;

  // Weekly revenue by channel (stacked)
  useEffect(() => {
    if (!barRef.current) return;
    const chart = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: weekly.map((w) => w.label),
        datasets: SALES_CHANNELS.map((c) => ({
          label: c.label,
          data: weekly.map((w) => w.revenue[c.key]),
          backgroundColor: c.color,
          borderWidth: 0,
          borderRadius: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { color: INK2, boxWidth: 10, boxHeight: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${inrShort(Number(ctx.parsed.y))}` } },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: INK2, font: { size: 11 } } },
          y: {
            stacked: true,
            grid: { color: GRID },
            border: { display: false },
            ticks: { color: INK2, font: { size: 11 }, callback: (v) => `₹${(Number(v) / 100000).toFixed(0)}L` },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [weekly]);

  // Channel mix (doughnut)
  useEffect(() => {
    if (!donutRef.current) return;
    const chart = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: channelRows.map((c) => c.label),
        datasets: [{ data: channelRows.map((c) => c.revenue), backgroundColor: channelRows.map((c) => c.color), borderColor: '#FFFFFF', borderWidth: 2 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${inrShort(Number(ctx.parsed))}` } },
        },
      },
    });
    return () => chart.destroy();
  }, [channelRows]);

  const maxSku = Math.max(...TOP_SKUS.map((s) => s.revenue), 1);
  const periodLabel = PERIODS.find((p) => p.days === days)?.label ?? '';

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <style>{`
        .eb-two { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; }
        .eb-four { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .eb-wide { overflow-x: auto; }
        @media (max-width: 1100px) { .eb-two { grid-template-columns: 1fr; } .eb-four { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .eb-four { grid-template-columns: 1fr; } }
        .eb-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 520px; }
        .eb-table th { text-align: right; font-size: 11px; font-weight: 600; color: var(--label-secondary); padding: 6px 8px; border-bottom: 1px solid var(--separator); }
        .eb-table td { text-align: right; padding: 9px 8px; border-bottom: 1px solid var(--separator); font-variant-numeric: tabular-nums; }
        .eb-table th:first-child, .eb-table td:first-child { text-align: left; }
        .eb-pill { border: 1px solid var(--separator); background: var(--bg-layer1); color: var(--label-secondary); font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 999px; cursor: pointer; font-family: inherit; }
        .eb-pill.on { background: var(--brand); border-color: var(--brand); color: #fff; }
        .eb-link-tile { text-decoration: none; color: inherit; display: block; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Executive Board</h2>
          <p style={{ fontSize: 13, color: 'var(--label-secondary)', margin: '4px 0 0' }}>
            Sales are to 12 November. Stock, dues and support queues are as of this morning.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--label-secondary)', marginRight: 4 }}>Sales period</span>
          {PERIODS.map((p) => (
            <button key={p.days} type="button" className={`eb-pill${days === p.days ? ' on' : ''}`} onClick={() => setDays(p.days)}>
              Last {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales KPIs */}
      <div className="metrics-grid">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand)' } as React.CSSProperties}>
          <span className="label">Revenue, last {periodLabel}</span>
          <span className="value">{inrShort(cur.totalRevenue)}</span>
          <Delta value={prev ? pctChange(cur.totalRevenue, prev.totalRevenue) : null} />
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand-mid)' } as React.CSSProperties}>
          <span className="label">Orders</span>
          <span className="value">{cur.totalOrders.toLocaleString('en-IN')}</span>
          <Delta value={prev ? pctChange(cur.totalOrders, prev.totalOrders) : null} />
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand-gold)' } as React.CSSProperties}>
          <span className="label">Average order value</span>
          <span className="value">{inr(cur.aov)}</span>
          <Delta value={prev ? pctChange(cur.aov, prev.aov) : null} />
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand-dark)' } as React.CSSProperties}>
          <span className="label">Repeat customers (happilo.com)</span>
          <span className="value">{CUSTOMER_METRICS.repeatRate}<span className="metric-sub">%</span></span>
          <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>
            Returns {CUSTOMER_METRICS.returnsRate}% of units, up from {CUSTOMER_METRICS.returnsRatePrev}%
          </span>
        </div>
      </div>

      {/* Operations KPIs */}
      <div className="metrics-grid">
        <Link href="/inventory" className="eb-link-tile">
          <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand-mid)', cursor: 'pointer' } as React.CSSProperties}>
            <span className="label">Stock value at cost</span>
            <span className="value">{inrShort(inv.stockValue)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: inv.belowReorder.length ? 'var(--red)' : 'var(--green)' }}>
              {inv.belowReorder.length ? `${inv.belowReorder.length} SKU${inv.belowReorder.length > 1 ? 's' : ''} below reorder level` : 'Nothing below reorder level'}
            </span>
          </div>
        </Link>
        <Link href="/accounts-receivable/dashboard" className="eb-link-tile">
          <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)', cursor: 'pointer' } as React.CSSProperties}>
            <span className="label">Overdue from distributors</span>
            <span className="value">{inrShort(rec.overdueValue)}</span>
            <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>
              {rec.overdueCount} of {rec.accounts} accounts late, {inrShort(rec.outstanding)} outstanding
            </span>
          </div>
        </Link>
        <Link href="/customer-care" className="eb-link-tile">
          <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand-gold)', cursor: 'pointer' } as React.CSSProperties}>
            <span className="label">Review rating</span>
            <span className="value">{sup.rating ? sup.rating.toFixed(1) : '-'}<span className="metric-sub">/5</span></span>
            <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>
              {sup.open} open case{sup.open === 1 ? '' : 's'}, {sup.escalated.length} escalated
            </span>
          </div>
        </Link>
        <Link href="/b2b-crm/dashboard" className="eb-link-tile">
          <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand-dark)', cursor: 'pointer' } as React.CSSProperties}>
            <span className="label">B2B pipeline</span>
            <span className="value">{b2b.active}<span className="metric-sub"> open</span></span>
            <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>
              {b2b.negotiation} negotiating, {b2b.sample} samples out, {b2b.won} won
            </span>
          </div>
        </Link>
      </div>

      {/* Chart + attention */}
      <div className="eb-two" style={{ marginBottom: 20 }}>
        <Card title="Weekly revenue by channel" sub="13 weeks to 12 November. Diwali gifting peaked in the first week of November.">
          <div style={{ height: 330, position: 'relative' }}>
            <canvas ref={barRef} />
          </div>
        </Card>

        <Card title="Needs attention today" sub="Picked from live stock, dues, support and pipeline">
          {attention.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--label-secondary)' }}>Nothing urgent right now.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {attention.map((a) => (
                <Link key={a.id} href={a.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'var(--fill-quaternary)', borderLeft: `3px solid ${TONE[a.tone]}` }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: TONE[a.tone] === 'var(--brand-gold)' ? '#9A6B00' : TONE[a.tone] }}>{a.tag}</div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 2 }}>{a.text}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Channel table + mix */}
      <div className="eb-two" style={{ marginBottom: 20 }}>
        <Card title="Channels" sub={`Last ${periodLabel}, compared with the ${periodLabel} before`}>
          <div className="eb-wide">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Revenue</th>
                  <th>Share</th>
                  <th>Orders</th>
                  <th>AOV</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {channelRows.map((c) => (
                  <tr key={c.key}>
                    <td>
                      <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: c.color, marginRight: 8 }} />
                      {c.label}
                    </td>
                    <td style={{ fontWeight: 600 }}>{inr(c.revenue)}</td>
                    <td>{c.share.toFixed(1)}%</td>
                    <td>{c.orders.toLocaleString('en-IN')}</td>
                    <td>{inr(c.orders ? c.revenue / c.orders : 0)}</td>
                    <td style={{ color: c.change === null ? 'var(--label-secondary)' : c.change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {c.change === null ? '-' : `${c.change >= 0 ? '+' : ''}${c.change.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Channel mix" sub={`Share of revenue, last ${periodLabel}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ height: 210, width: 210, position: 'relative', flex: '0 0 auto', margin: '0 auto' }}>
              <canvas ref={donutRef} />
            </div>
            <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {channelRows.slice(0, 5).map((c) => (
                <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: c.color, marginRight: 7 }} />{c.label}</span>
                  <span style={{ fontWeight: 600 }}>{c.share.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top SKUs + inventory health */}
      <div className="eb-two" style={{ marginBottom: 20 }}>
        <Card title="Top 10 products by revenue" sub="Last 30 days, all channels, at current selling price" href="/inventory" linkLabel="Inventory">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TOP_SKUS.map((s, i) => {
              const chg = pctChange(s.units, s.prevUnits);
              return (
                <div key={s.sku} style={{ display: 'grid', gridTemplateColumns: '20px 40px 1fr auto', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--label-secondary)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', border: '1px solid var(--separator)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.name} <span style={{ color: 'var(--label-secondary)', fontWeight: 500 }}>{s.pack}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'var(--fill-tertiary)', marginTop: 5 }}>
                      <div style={{ width: `${(s.revenue / maxSku) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--brand-mid)' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{inrShort(s.revenue)}</div>
                    <div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>
                      {s.units.toLocaleString('en-IN')} units{chg !== null ? `, ${chg >= 0 ? '+' : ''}${chg.toFixed(0)}%` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Inventory health" sub="Days of cover from average monthly sales" href="/inventory" linkLabel="Inventory">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Below reorder', value: inv.belowReorder.length, color: 'var(--red)' },
              { label: 'Healthy', value: inv.healthy, color: 'var(--brand-mid)' },
              { label: 'Overstocked', value: inv.overstock.length, color: '#9A6B00' },
            ].map((t) => (
              <div key={t.label} style={{ background: 'var(--fill-quaternary)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>{t.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.color }}>{t.value}</div>
              </div>
            ))}
          </div>
          <Row label="Median days of cover" value={`${inv.medianCover} days`} />
          <Row label="Units on hand, all locations" value={inv.units.toLocaleString('en-IN')} />
          {inv.hasExpiry && <Row label="Units close to expiry" value={inv.nearExpiryUnits.toLocaleString('en-IN')} tone={inv.nearExpiryUnits ? 'var(--red)' : undefined} />}
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 600, color: 'var(--label-secondary)' }}>Closest to running out</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {inv.belowReorder.slice(0, 4).map((r) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <AlertTriangle size={12} style={{ color: r.coverDays < r.leadTime ? 'var(--red)' : 'var(--brand-gold)', marginRight: 6, verticalAlign: '-1px' }} />
                  {r.name}
                </span>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{r.coverDays}d <span style={{ fontWeight: 500, color: 'var(--label-secondary)' }}>/ {r.leadTime}d lead</span></span>
              </div>
            ))}
            {inv.belowReorder.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--label-secondary)' }}>Every SKU has cover beyond its lead time.</div>}
          </div>
        </Card>
      </div>

      {/* Snapshots */}
      <div className="eb-four">
        <Card title="Receivables" href="/accounts-receivable/dashboard" linkLabel="Open">
          <Row label="Outstanding" value={inrShort(rec.outstanding)} />
          <Row label="1 to 30 days late" value={inrShort(rec.b1)} />
          <Row label="31 to 60 days late" value={inrShort(rec.b2)} tone={rec.b2 ? '#9A6B00' : undefined} />
          <Row label="Over 60 days late" value={inrShort(rec.b3)} tone={rec.b3 ? 'var(--red)' : undefined} />
        </Card>
        <Card title="Support" href="/customer-care" linkLabel="Open">
          <Row label="Open cases" value={sup.open} />
          <Row label="Escalated" value={sup.escalated.length} tone={sup.escalated.length ? 'var(--red)' : undefined} />
          <Row label="Reviews, average" value={sup.rating ? `${sup.rating.toFixed(1)} of ${sup.reviewCount}` : '-'} />
          <Row label="Low reviews unanswered" value={sup.lowUnanswered.length} tone={sup.lowUnanswered.length ? '#9A6B00' : undefined} />
        </Card>
        <Card title="B2B pipeline" href="/b2b-crm/dashboard" linkLabel="Open">
          <Row label="Leads in the CRM" value={b2b.total} />
          <Row label="Interested or demo booked" value={b2b.interested} />
          <Row label="Samples sent" value={b2b.sample} />
          <Row label="Negotiation / won" value={`${b2b.negotiation} / ${b2b.won}`} />
        </Card>
        <Card title="Marketing" href="/marketing" linkLabel="Open">
          <Row label="Paid media, 30 days" value={inrShort(CUSTOMER_METRICS.adSpend30)} />
          <Row label="Spend vs previous 30" value={adSpendChange === null ? '-' : `${adSpendChange >= 0 ? '+' : ''}${adSpendChange.toFixed(0)}%`} />
          <Row label="Revenue per rupee of ads" value={`₹${roas.toFixed(1)}`} />
          <Row label="Scripts: draft / review / ready" value={`${content.draft} / ${content.review} / ${content.approved}`} />
        </Card>
      </div>
    </div>
  );
}
