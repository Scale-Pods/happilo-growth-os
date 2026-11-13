'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Check } from 'lucide-react';
import type { Product } from '@/lib/mock/inventory';
import { useOps, updateOps } from '@/lib/mock/inventory-ops';
import type { Batch } from '@/lib/mock/inventory-ops';
import { fmtNum, fmtMoney, fmtDate, TODAY, parseISO, daysBetween, CATEGORIES } from '@/lib/mock/inventory-utils';
import { logMovement, CURRENT_USER } from './actions';
import { Card, Kpi, KpiGrid, Th, ProductCell, Toolbar, Empty, TabProps } from './shared';

type Win = 'all' | 'expired' | '30' | '60' | '90';

function suggest(b: Batch, p: Product, left: number): { label: string; kind: 'writeoff' | 'markdown' | 'push' | 'bundle' | 'fefo' } {
  if (left <= 0) return { label: 'Write off, lot is past date', kind: 'writeoff' };
  const quick = p.category === 'Trail Mixes' || p.category === 'Makhana' || p.category === 'Seeds';
  if (left <= 30) {
    return b.qty >= 250
      ? { label: 'Markdown 25% on happilo.com and Amazon', kind: 'markdown' }
      : { label: quick ? 'Bundle into combo packs' : 'Markdown 20%, clear first', kind: quick ? 'bundle' : 'markdown' };
  }
  if (left <= 60) {
    return b.qty >= 300
      ? { label: 'Push to Blinkit, Zepto and Instamart', kind: 'push' }
      : { label: 'Bundle with a fast mover', kind: 'bundle' };
  }
  return { label: 'Keep at top of FEFO picking', kind: 'fefo' };
}

export default function BatchesTab({ inventory, setInventory, showToast, preset }: TabProps) {
  const ops = useOps();
  const [win, setWin] = useState<Win>((preset?.filter as Win) || '60');
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [done, setDone] = useState<Record<string, string>>({});

  useEffect(() => {
    if (preset?.filter) setWin(preset.filter as Win);
  }, [preset]);

  const byId = useMemo(() => Object.fromEntries(inventory.map((p) => [p.id, p])), [inventory]);

  const lots = useMemo(() => {
    // FEFO rank per product: earliest expiry first
    const rank: Record<string, number> = {};
    const sorted = [...ops.batches].sort((a, b) => (a.expiry < b.expiry ? -1 : 1));
    return sorted.map((b) => {
      rank[b.productId] = (rank[b.productId] ?? 0) + 1;
      return { b, p: byId[b.productId], left: daysBetween(TODAY, parseISO(b.expiry)), fefo: rank[b.productId] };
    }).filter((x) => x.p);
  }, [ops.batches, byId]);

  const kpi = useMemo(() => {
    const val = (xs: typeof lots) => xs.reduce((a, x) => a + x.b.qty * x.p.cost, 0);
    const expired = lots.filter((x) => x.left <= 0);
    const d30 = lots.filter((x) => x.left > 0 && x.left <= 30);
    const d60 = lots.filter((x) => x.left > 30 && x.left <= 60);
    const avgLeft = Math.round(lots.reduce((a, x) => a + x.left * x.b.qty, 0) / Math.max(1, lots.reduce((a, x) => a + x.b.qty, 0)));
    return { expired, d30, d60, val, avgLeft };
  }, [lots]);

  const rows = lots.filter((x) => {
    const q = search.trim().toLowerCase();
    if (q && !(x.p.name.toLowerCase().includes(q) || x.b.lot.toLowerCase().includes(q))) return false;
    if (cat !== 'all' && x.p.category !== cat) return false;
    if (win === 'expired') return x.left <= 0;
    if (win === 'all') return true;
    return x.left <= Number(win);
  });

  const writeOff = (x: (typeof lots)[number]) => {
    const { b, p } = x;
    updateOps((s) => ({ batches: s.batches.filter((l) => l.lot !== b.lot) }));
    setInventory((prev) => prev.map((q) => (q.id === p.id ? { ...q, warehouse: Math.max(0, q.warehouse - b.qty) } : q)));
    logMovement({ type: 'Write-off', productId: p.id, qty: b.qty, from: 'Bengaluru DC', to: 'Write-off', ref: `WO-${b.lot.slice(-4)}`, user: CURRENT_USER, note: `Lot ${b.lot} past expiry, destroyed` });
    showToast(`Wrote off ${fmtNum(b.qty)} units from lot ${b.lot} (${fmtMoney(b.qty * p.cost)}).`, 'success');
  };

  const act = (x: (typeof lots)[number], label: string) => {
    setDone((d) => ({ ...d, [x.b.lot]: label }));
    showToast(`${label} queued for ${x.p.name}, lot ${x.b.lot}.`, 'success');
  };

  return (
    <div>
      <KpiGrid>
        <Kpi label="Lots in warehouse" value={lots.length} sub={`Weighted shelf life left ${kpi.avgLeft} days`} />
        <Kpi label="Expire within 30 days" value={kpi.d30.length} sub={`${fmtMoney(kpi.val(kpi.d30))} at cost`} tone="red" onClick={() => setWin('30')} />
        <Kpi label="Expire in 31 to 60 days" value={kpi.d60.length} sub={`${fmtMoney(kpi.val(kpi.d60))} at cost`} tone="gold" onClick={() => setWin('60')} />
        <Kpi label="Past expiry" value={kpi.expired.length} sub={`${fmtMoney(kpi.val(kpi.expired))} to write off`} tone={kpi.expired.length ? 'red' : 'brand'} onClick={() => setWin('expired')} />
      </KpiGrid>

      <Toolbar>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--label-secondary)' }} />
          <input className="input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search product or lot number" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" value={win} onChange={(e) => setWin(e.target.value as Win)}>
          <option value="expired">Past expiry</option>
          <option value="30">Expiring in 30 days</option>
          <option value="60">Expiring in 60 days</option>
          <option value="90">Expiring in 90 days</option>
          <option value="all">All lots</option>
        </select>
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--label-secondary)' }}>{rows.length} lots, sorted by expiry (FEFO)</span>
      </Toolbar>

      <Card pad={0}>
        <div className="table-scroll-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <Th>Product</Th><Th>Lot</Th><Th>Bay</Th><Th align="right">Qty</Th><Th>Mfg</Th><Th>Expiry</Th><Th align="right">Days left</Th><Th align="right">Value</Th><Th>Suggested action</Th><Th>{' '}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => {
                const s = suggest(x.b, x.p, x.left);
                const doneLabel = done[x.b.lot];
                return (
                  <tr key={x.b.lot}>
                    <td><ProductCell p={x.p} size={36} sub={x.fefo === 1 ? <span className="badge badge-blue">Pick first</span> : `FEFO position ${x.fefo}`} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{x.b.lot}<div style={{ fontSize: 10.5, color: 'var(--label-secondary)' }}>{x.b.grn}</div></td>
                    <td>{x.b.bay}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(x.b.qty)}</td>
                    <td>{fmtDate(x.b.mfg)}</td>
                    <td>{fmtDate(x.b.expiry)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${x.left <= 0 ? 'badge-red' : x.left <= 30 ? 'badge-red' : x.left <= 60 ? 'badge-orange' : 'badge-green'}`}>{x.left <= 0 ? `${-x.left} d past` : `${x.left} d`}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{fmtMoney(x.b.qty * x.p.cost)}</td>
                    <td style={{ fontSize: 12.5, maxWidth: 220 }}>{doneLabel ? <span style={{ color: 'var(--green)', fontWeight: 600 }}><Check size={12} /> {doneLabel}</span> : s.label}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {s.kind === 'writeoff' ? (
                        <button className="btn-destructive btn-sm" onClick={() => writeOff(x)}><Trash2 size={12} /> Write off</button>
                      ) : s.kind === 'fefo' ? null : !doneLabel ? (
                        <button className="btn-secondary btn-sm" onClick={() => act(x, s.kind === 'markdown' ? 'Markdown' : s.kind === 'push' ? 'Quick-commerce push' : 'Bundle plan')}>Start</button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty text="No lots in this window." />}
        </div>
      </Card>
    </div>
  );
}
