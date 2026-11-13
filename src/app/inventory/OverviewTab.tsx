'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, Clock, ShoppingCart } from 'lucide-react';
import { useOps, inboundFor, poValue, isOpenPO } from '@/lib/mock/inventory-ops';
import {
  totalStock, coverDays, stockStatus, abcMap, fmtNum, fmtMoney, fmtINR, CATEGORIES, CHANNELS,
  TODAY, parseISO, daysBetween, reorderPointOf, fmtDate,
} from '@/lib/mock/inventory-utils';
import { Card, Kpi, KpiGrid, BarRow, ProductCell, TabProps, BRAND, BRAND_MID, GOLD, ChannelName } from './shared';

export default function OverviewTab({ inventory, go }: TabProps) {
  const ops = useOps();
  const inbound = useMemo(() => inboundFor(ops.pos), [ops.pos]);

  const d = useMemo(() => {
    const byId = Object.fromEntries(inventory.map((p) => [p.id, p]));
    const units = inventory.reduce((a, p) => a + totalStock(p), 0);
    const valueCost = inventory.reduce((a, p) => a + totalStock(p) * p.cost, 0);
    const valueRetail = inventory.reduce((a, p) => a + totalStock(p) * p.price, 0);
    const monthlyCogs = inventory.reduce((a, p) => a + p.avgMonthlySales * p.cost, 0);
    const avgCover = monthlyCogs > 0 ? Math.round((valueCost / monthlyCogs) * 30) : 0;
    const statuses = inventory.map((p) => ({ p, s: stockStatus(p, inbound[p.id] || 0) }));
    const belowRop = statuses.filter((x) => x.s.key === 'reorder' || x.s.key === 'critical' || x.s.key === 'out');
    const critical = statuses.filter((x) => x.s.key === 'critical' || x.s.key === 'out');
    const over = statuses.filter((x) => x.s.key === 'overstock');
    const overValue = over.reduce((a, x) => a + totalStock(x.p) * x.p.cost, 0);

    let expUnits = 0;
    let expValue = 0;
    const expSkus = new Set<string>();
    let expiredValue = 0;
    ops.batches.forEach((b) => {
      const left = daysBetween(TODAY, parseISO(b.expiry));
      const p = byId[b.productId];
      if (!p) return;
      if (left <= 0) expiredValue += b.qty * p.cost;
      else if (left <= 60) {
        expUnits += b.qty;
        expValue += b.qty * p.cost;
        expSkus.add(b.productId);
      }
    });

    // 30-day stockout risk: SKUs that run dry before the next order could land
    const atRisk = statuses.filter((x) => {
      const days = coverDays(x.p);
      return x.p.avgMonthlySales > 0 && days < x.p.leadTime && !(inbound[x.p.id] && days + 15 >= x.p.leadTime);
    });
    const fillRate = Math.round((1 - atRisk.reduce((a, x) => a + x.p.avgMonthlySales * x.p.price, 0) / inventory.reduce((a, p) => a + p.avgMonthlySales * p.price, 0) * 0.35) * 1000) / 10;

    const abc = abcMap(inventory);
    const totalRev = inventory.reduce((a, p) => a + p.avgMonthlySales * p.price, 0);
    const abcRows = (['A', 'B', 'C'] as const).map((k) => {
      const items = inventory.filter((p) => abc[p.id] === k);
      const rev = items.reduce((a, p) => a + p.avgMonthlySales * p.price, 0);
      const val = items.reduce((a, p) => a + totalStock(p) * p.cost, 0);
      const cogs = items.reduce((a, p) => a + p.avgMonthlySales * p.cost, 0);
      return { k, n: items.length, revShare: (rev / totalRev) * 100, val, cover: cogs > 0 ? Math.round((val / cogs) * 30) : 0 };
    });

    const cats = CATEGORIES.map((c) => {
      const items = inventory.filter((p) => p.category === c);
      const val = items.reduce((a, p) => a + totalStock(p) * p.cost, 0);
      const cogs = items.reduce((a, p) => a + p.avgMonthlySales * p.cost, 0);
      return { c, n: items.length, val, units: items.reduce((a, p) => a + totalStock(p), 0), cover: cogs > 0 ? Math.round((val / cogs) * 30) : 0 };
    }).filter((x) => x.n > 0);

    const locs = CHANNELS.map((ch) => ({
      key: ch.key,
      label: ch.label,
      units: inventory.reduce((a, p) => a + ((p as any)[ch.key] as number), 0),
      val: inventory.reduce((a, p) => a + ((p as any)[ch.key] as number) * p.cost, 0),
    }));

    const attention = [...belowRop]
      .sort((a, b) => coverDays(a.p) - coverDays(b.p))
      .slice(0, 7);

    const openPos = ops.pos.filter(isOpenPO);
    const nextArrival = [...openPos].sort((a, b) => (a.eta < b.eta ? -1 : 1))[0];

    return { units, valueCost, valueRetail, avgCover, belowRop, critical, over, overValue, expUnits, expValue, expSkus, expiredValue, atRisk, fillRate, abcRows, cats, locs, attention, openPos, nextArrival };
  }, [inventory, ops.batches, ops.pos, inbound]);

  const maxCat = Math.max(...d.cats.map((c) => c.val));
  const maxLoc = Math.max(...d.locs.map((l) => l.val));

  return (
    <div>
      <KpiGrid cols={5}>
        <Kpi label="Stock value at cost" value={fmtMoney(d.valueCost)} sub={`${fmtMoney(d.valueRetail)} at selling price`} />
        <Kpi label="Units on hand" value={fmtNum(d.units)} sub={`${inventory.length} SKUs across 8 locations`} tone="mid" />
        <Kpi label="SKUs at or below reorder point" value={d.belowRop.length} sub={`${d.critical.length} critical, counting inbound POs`} tone={d.critical.length ? 'red' : 'orange'} onClick={() => go('purchase')} />
        <Kpi label="Average cover" value={`${d.avgCover} days`} sub="Cost-weighted across all SKUs" tone="mid" />
        <Kpi label="Expiring within 60 days" value={fmtMoney(d.expValue)} sub={`${fmtNum(d.expUnits)} units, ${d.expSkus.size} SKUs`} tone="gold" onClick={() => go('batches')} />
      </KpiGrid>
      <KpiGrid cols={5}>
        <Kpi label="Stockout risk (before restock)" value={`${d.atRisk.length} SKUs`} sub="Cover is shorter than lead time" tone={d.atRisk.length > 2 ? 'red' : 'orange'} />
        <Kpi label="Projected fill rate" value={`${d.fillRate}%`} sub="Next 30 days, revenue weighted" />
        <Kpi label="Overstocked capital" value={fmtMoney(d.overValue)} sub={`${d.over.length} SKUs above 110 days cover`} tone="gold" onClick={() => go('stock', { filter: 'overstock' })} />
        <Kpi label="Open purchase orders" value={fmtMoney(d.openPos.reduce((a, o) => a + poValue(o), 0))} sub={`${d.openPos.length} POs, next arrival ${d.nextArrival ? fmtDate(d.nextArrival.eta) : 'none'}`} onClick={() => go('purchase')} />
        <Kpi label="Past expiry, on hold" value={fmtINR(d.expiredValue)} sub="Awaiting write-off approval" tone={d.expiredValue > 0 ? 'red' : 'brand'} onClick={() => go('batches', { filter: 'expired' })} />
      </KpiGrid>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 16 }}>
        <Card
          title={<span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><AlertTriangle size={15} color="var(--red)" /> Needs action now</span>}
          action={<button className="btn-secondary btn-sm" onClick={() => go('purchase')}><ShoppingCart size={13} /> Raise POs</button>}
          pad={0}
        >
          <div className="table-scroll-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>Product</th><th style={{ textAlign: 'right' }}>On hand</th><th style={{ textAlign: 'right' }}>Cover</th><th style={{ textAlign: 'right' }}>Lead time</th><th>On order</th></tr>
              </thead>
              <tbody>
                {d.attention.map(({ p, s }) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => go('stock', { search: p.name })}>
                    <td><ProductCell p={p} size={34} sub={<span className={`badge ${s.badge}`}>{s.label}</span>} /></td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(totalStock(p))}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: coverDays(p) <= 14 ? 'var(--red)' : 'var(--orange)' }}>{coverDays(p)} d</td>
                    <td style={{ textAlign: 'right' }}>{p.leadTime} d</td>
                    <td>{inbound[p.id] ? <span className="badge badge-blue">{fmtNum(inbound[p.id])}</span> : <span style={{ color: 'var(--label-tertiary)' }}>None</span>}</td>
                  </tr>
                ))}
                {d.attention.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--label-secondary)' }}>Nothing is below its reorder point.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="ABC classification" action={<span style={{ fontSize: 11, color: 'var(--label-secondary)' }}>By monthly revenue</span>}>
          <table className="data-table" style={{ fontSize: 12.5 }}>
            <thead><tr><th>Class</th><th style={{ textAlign: 'right' }}>SKUs</th><th style={{ textAlign: 'right' }}>Revenue share</th><th style={{ textAlign: 'right' }}>Stock at cost</th><th style={{ textAlign: 'right' }}>Cover</th></tr></thead>
            <tbody>
              {d.abcRows.map((r) => (
                <tr key={r.k}>
                  <td><span className={`badge ${r.k === 'A' ? 'badge-green' : r.k === 'B' ? 'badge-orange' : 'badge-grey'}`}>Class {r.k}</span></td>
                  <td style={{ textAlign: 'right' }}>{r.n}</td>
                  <td style={{ textAlign: 'right' }}>{r.revShare.toFixed(1)}%</td>
                  <td style={{ textAlign: 'right' }}>{fmtMoney(r.val)}</td>
                  <td style={{ textAlign: 'right' }}>{r.cover} d</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginTop: 12, lineHeight: 1.5 }}>
            Class A lines drive roughly four-fifths of revenue and should never touch safety stock. Class C is where slow movers like Brazil nuts and pecans sit, so keep orders small and frequent.
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
        <Card title="Stock value by category">
          {d.cats.map((c) => (
            <BarRow key={c.c} label={c.c} sub={`${c.n} SKUs`} value={c.val} max={maxCat} color={BRAND} text={`${fmtMoney(c.val)}  ·  ${c.cover} d cover`} />
          ))}
        </Card>
        <Card title="Stock by location">
          {d.locs.map((l) => (
            <BarRow key={l.key} label={<ChannelName id={l.key} label={l.label} />} value={l.val} max={maxLoc} color={l.key === 'warehouse' ? BRAND : BRAND_MID} text={`${fmtNum(l.units)} units  ·  ${fmtMoney(l.val)}`} />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--label-secondary)', marginTop: 6 }}>
            <Clock size={13} color={GOLD} /> Bengaluru DC (Hoskote) holds {Math.round((d.locs[0].units / d.units) * 100)}% of units.
          </div>
        </Card>
      </div>
    </div>
  );
}
