'use client';

import React, { useMemo, useState } from 'react';
import { ArrowRight, Repeat } from 'lucide-react';
import type { Product } from '@/lib/mock/inventory';
import {
  totalStock, safetyOf, fmtNum, CHANNELS, CHANNEL_LABEL,
} from '@/lib/mock/inventory-utils';
import { transferStock } from './actions';
import { Card, Field, ProductCell, Th, TabProps, Empty, ChannelName } from './shared';

// Share of unit sales by channel, used to turn stock into days of cover per bucket
const DEMAND: Record<string, number> = { amazon: 0.27, shopify: 0.17, flipkart: 0.12, bigbasket: 0.09, blinkit: 0.14, zepto: 0.11, instamart: 0.1 };
const TARGET: Record<string, number> = { amazon: 26, shopify: 20, flipkart: 24, bigbasket: 22, blinkit: 14, zepto: 14, instamart: 14 };

const chDays = (p: Product, ch: string) => {
  const d = (p.avgMonthlySales * (DEMAND[ch] || 0)) / 30;
  return d > 0 ? ((p as any)[ch] as number) / d : 999;
};

interface Move { p: Product; to: string; qty: number }

function plan(p: Product): Move[] {
  // Move from the warehouse down to each short channel, never dipping below safety stock
  let available = p.warehouse - safetyOf(p);
  const out: Move[] = [];
  const short = Object.keys(DEMAND)
    .map((ch) => ({ ch, days: chDays(p, ch) }))
    .filter((x) => x.days < TARGET[x.ch] * 0.55)
    .sort((a, b) => a.days - b.days);
  for (const { ch } of short) {
    const need = Math.ceil(((p.avgMonthlySales * DEMAND[ch]) / 30) * TARGET[ch] - ((p as any)[ch] as number));
    const qty = Math.min(need, available);
    if (qty >= 10) {
      out.push({ p, to: ch, qty });
      available -= qty;
    }
  }
  return out;
}

export default function AllocationTab({ inventory, setInventory, showToast }: TabProps) {
  const [pid, setPid] = useState(inventory[0]?.id || '');
  const [from, setFrom] = useState('warehouse');
  const [to, setTo] = useState('blinkit');
  const [qty, setQty] = useState('');
  const [err, setErr] = useState('');

  const p = inventory.find((x) => x.id === pid);
  const suggestions = useMemo(() => inventory.flatMap(plan).sort((a, b) => chDays(a.p, a.to) - chDays(b.p, b.to)).slice(0, 12), [inventory]);

  const apply = (m: Move) => {
    transferStock({ setInventory, product: m.p, from: 'warehouse', to: m.to, qty: m.qty, note: 'Rebalance from suggestion' });
    showToast(`Moved ${fmtNum(m.qty)} units of ${m.p.name} to ${CHANNEL_LABEL[m.to]}.`, 'success');
  };

  const submit = () => {
    if (!p) return;
    const n = parseInt(qty, 10);
    if (from === to) return setErr('Pick two different locations.');
    if (isNaN(n) || n <= 0) return setErr('Enter a quantity greater than zero.');
    const have = (p as any)[from] as number;
    if (n > have) return setErr(`${CHANNEL_LABEL[from]} only holds ${fmtNum(have)} units.`);
    if (from === 'warehouse' && have - n < safetyOf(p)) {
      setErr(`That would take the warehouse below its safety stock of ${fmtNum(safetyOf(p))} units. Move at most ${fmtNum(Math.max(0, have - safetyOf(p)))}.`);
      return;
    }
    transferStock({ setInventory, product: p, from, to, qty: n });
    showToast(`Moved ${fmtNum(n)} units of ${p.name} from ${CHANNEL_LABEL[from]} to ${CHANNEL_LABEL[to]}.`, 'success');
    setQty('');
    setErr('');
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="Channel imbalances" pad={0}>
        <div style={{ padding: '0 18px 10px', fontSize: 12, color: 'var(--label-secondary)' }}>
          Channels running short while the warehouse still has stock above safety level. Targets are 14 days for quick commerce and 20 to 26 days for marketplaces and the web store.
        </div>
        <div className="table-scroll-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><Th>Product</Th><Th>Channel</Th><Th align="right">Stock there</Th><Th align="right">Cover</Th><Th align="right">Warehouse</Th><Th align="right">Suggested move</Th><Th>{' '}</Th></tr></thead>
            <tbody>
              {suggestions.map((m) => (
                <tr key={m.p.id + m.to}>
                  <td><ProductCell p={m.p} size={32} /></td>
                  <td><ChannelName id={m.to} label={CHANNEL_LABEL[m.to]} /></td>
                  <td style={{ textAlign: 'right' }}>{fmtNum((m.p as any)[m.to])}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: chDays(m.p, m.to) < 7 ? 'var(--red)' : 'var(--orange)' }}>{Math.round(chDays(m.p, m.to))} d</td>
                  <td style={{ textAlign: 'right' }}>{fmtNum(m.p.warehouse)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtNum(m.qty)} units</td>
                  <td><button className="btn-primary btn-sm" onClick={() => apply(m)}>Move stock</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {suggestions.length === 0 && <Empty text="All channels are within target cover." />}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <Card title="Manual transfer">
          <Field label="Product">
            <select className="input" style={{ width: '100%' }} value={pid} onChange={(e) => { setPid(e.target.value); setErr(''); }}>
              {inventory.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.pack})</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'end' }}>
            <Field label="From">
              <select className="input" style={{ width: '100%' }} value={from} onChange={(e) => { setFrom(e.target.value); setErr(''); }}>
                {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}{p ? ` (${fmtNum((p as any)[c.key])})` : ''}</option>)}
              </select>
            </Field>
            <div style={{ paddingBottom: 18 }}><ArrowRight size={16} color="var(--label-secondary)" /></div>
            <Field label="To">
              <select className="input" style={{ width: '100%' }} value={to} onChange={(e) => { setTo(e.target.value); setErr(''); }}>
                {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}{p ? ` (${fmtNum((p as any)[c.key])})` : ''}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Quantity">
            <input className="input" style={{ width: '100%' }} type="number" min={1} value={qty} onChange={(e) => { setQty(e.target.value); setErr(''); }} placeholder="Units to move" />
          </Field>
          {err && <div style={{ color: 'var(--red)', fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
          <button className="btn-primary" onClick={submit}><Repeat size={14} /> Transfer stock</button>
        </Card>

        {p && (
          <Card title={`Cover by channel: ${p.name}`}>
            <table className="data-table" style={{ fontSize: 12.5 }}>
              <thead><tr><th>Location</th><th style={{ textAlign: 'right' }}>Units</th><th style={{ textAlign: 'right' }}>Share</th><th style={{ textAlign: 'right' }}>Cover</th></tr></thead>
              <tbody>
                {CHANNELS.map((c) => {
                  const q = (p as any)[c.key] as number;
                  const days = c.key === 'warehouse' ? null : Math.round(chDays(p, c.key));
                  return (
                    <tr key={c.key}>
                      <td><ChannelName id={c.key} label={c.label} /></td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(q)}</td>
                      <td style={{ textAlign: 'right' }}>{totalStock(p) ? Math.round((q / totalStock(p)) * 100) : 0}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: days !== null && days < TARGET[c.key] * 0.55 ? 'var(--orange)' : 'inherit' }}>{days === null ? 'Source' : `${days} d`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginTop: 10 }}>
              Safety stock held back at the warehouse: {fmtNum(safetyOf(p))} units.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
