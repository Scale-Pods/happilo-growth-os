'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Check, RotateCcw } from 'lucide-react';
import type { Product } from '@/lib/mock/inventory';
import { useOps, updateOps } from '@/lib/mock/inventory-ops';
import type { CycleCount } from '@/lib/mock/inventory-ops';
import { fmtNum, fmtINR, fmtMoney, fmtDate, TODAY, toISO } from '@/lib/mock/inventory-utils';
import { adjustStock, CURRENT_USER } from './actions';
import { Card, Kpi, KpiGrid, Th, ProductCell, Modal, Field, TabProps, Empty } from './shared';

const STATUS_BADGE: Record<CycleCount['status'], string> = {
  'Pending review': 'badge-orange',
  Approved: 'badge-green',
  'Recount asked': 'badge-purple',
};

export default function CountsTab({ inventory, setInventory, showToast }: TabProps) {
  const ops = useOps();
  const [adding, setAdding] = useState(false);
  const byId = useMemo(() => Object.fromEntries(inventory.map((p) => [p.id, p])), [inventory]);

  const stats = useMemo(() => {
    const rows = ops.counts.filter((c) => byId[c.productId]);
    const sys = rows.reduce((a, c) => a + c.systemQty, 0);
    const abs = rows.reduce((a, c) => a + Math.abs(c.countedQty - c.systemQty), 0);
    const net = rows.reduce((a, c) => a + (c.countedQty - c.systemQty), 0);
    const shrink = rows.reduce((a, c) => a + Math.min(0, c.countedQty - c.systemQty) * -byId[c.productId].cost, 0);
    const pending = rows.filter((c) => c.status !== 'Approved').length;
    return { acc: sys ? ((1 - abs / sys) * 100).toFixed(1) : '100', net, shrink, pending, n: rows.length };
  }, [ops.counts, byId]);

  const approve = (c: CycleCount) => {
    const p = byId[c.productId];
    const v = c.countedQty - c.systemQty;
    if (v !== 0) adjustStock({ setInventory, product: p, loc: 'warehouse', delta: v, reason: 'Cycle count correction', note: `${c.id}, ${c.location}` });
    updateOps((s) => ({ counts: s.counts.map((x) => (x.id === c.id ? { ...x, status: 'Approved' as const } : x)) }));
    showToast(v === 0 ? `${c.id} approved, no change to stock.` : `${c.id} approved. Warehouse stock adjusted by ${v > 0 ? '+' : ''}${v} units.`, 'success');
  };

  const recount = (c: CycleCount) => {
    updateOps((s) => ({ counts: s.counts.map((x) => (x.id === c.id ? { ...x, status: 'Recount asked' as const } : x)) }));
    showToast(`Recount requested for ${byId[c.productId].name} (${c.location}).`, 'info');
  };

  const add = (p: Product, counted: number, reason: string) => {
    updateOps((s) => {
      const max = s.counts.reduce((a, c) => Math.max(a, parseInt(c.id.replace('CC-', ''), 10)), 0);
      return {
        counts: [
          { id: `CC-${max + 1}`, productId: p.id, location: 'Bengaluru DC, full SKU count', systemQty: p.warehouse, countedQty: counted, date: toISO(TODAY), countedBy: CURRENT_USER, reason: reason || (counted === p.warehouse ? 'Matches system' : 'Variance found on count'), status: 'Pending review' as const },
          ...s.counts,
        ],
      };
    });
    showToast(`Count recorded for ${p.name}. Variance ${counted - p.warehouse >= 0 ? '+' : ''}${counted - p.warehouse}.`, 'success');
    setAdding(false);
  };

  return (
    <div>
      <KpiGrid>
        <Kpi label="Counts this month" value={stats.n} sub={`${stats.pending} waiting for review`} />
        <Kpi label="Count accuracy" value={`${stats.acc}%`} sub="Units matching system" tone="mid" />
        <Kpi label="Net variance" value={`${stats.net > 0 ? '+' : ''}${fmtNum(stats.net)}`} sub="Units, all counts" tone={stats.net < 0 ? 'orange' : 'brand'} />
        <Kpi label="Shrinkage at cost" value={fmtINR(stats.shrink)} sub="Shortfalls only" tone="red" />
      </KpiGrid>

      <Card
        title="Cycle counts and variances"
        action={<button className="btn-primary btn-sm" onClick={() => setAdding(true)}><Plus size={13} /> Record a count</button>}
        pad={0}
      >
        <div className="table-scroll-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><Th>Count</Th><Th>Product</Th><Th>Bin</Th><Th align="right">System</Th><Th align="right">Counted</Th><Th align="right">Variance</Th><Th align="right">Value</Th><Th>Cause</Th><Th>Status</Th><Th>{' '}</Th></tr></thead>
            <tbody>
              {ops.counts.map((c) => {
                const p = byId[c.productId];
                if (!p) return null;
                const v = c.countedQty - c.systemQty;
                return (
                  <tr key={c.id}>
                    <td style={{ whiteSpace: 'nowrap' }}><b style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.id}</b><div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>{fmtDate(c.date)}  ·  {c.countedBy}</div></td>
                    <td><ProductCell p={p} size={32} /></td>
                    <td>{c.location}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(c.systemQty)}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(c.countedQty)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: v < 0 ? 'var(--red)' : v > 0 ? 'var(--green)' : 'var(--label-secondary)' }}>{v > 0 ? '+' : ''}{v}</td>
                    <td style={{ textAlign: 'right', color: v < 0 ? 'var(--red)' : 'inherit' }}>{v === 0 ? '—' : fmtINR(v * p.cost)}</td>
                    <td style={{ fontSize: 12.5, maxWidth: 220 }}>{c.reason}</td>
                    <td><span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {c.status !== 'Approved' && (
                        <>
                          <button className="btn-primary btn-sm" onClick={() => approve(c)}><Check size={12} /> Approve</button>{' '}
                          {c.status === 'Pending review' && v !== 0 && <button className="btn-secondary btn-sm" onClick={() => recount(c)}><RotateCcw size={12} /> Recount</button>}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ops.counts.length === 0 && <Empty text="No counts recorded yet." />}
        </div>
      </Card>

      {adding && <AddCount inventory={inventory} onClose={() => setAdding(false)} onSave={add} />}
    </div>
  );
}

function AddCount({ inventory, onClose, onSave }: { inventory: Product[]; onClose: () => void; onSave: (p: Product, counted: number, reason: string) => void }) {
  const [pid, setPid] = useState(inventory[0].id);
  const [counted, setCounted] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const p = inventory.find((x) => x.id === pid)!;
  const n = parseInt(counted, 10);
  return (
    <Modal
      title="Record a cycle count"
      onClose={onClose}
      width={460}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => (isNaN(n) || n < 0 ? setErr('Enter the counted quantity.') : onSave(p, n, reason.trim()))}>Save count</button></>}
    >
      <Field label="Product">
        <select className="input" style={{ width: '100%' }} value={pid} onChange={(e) => setPid(e.target.value)}>
          {inventory.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.pack})</option>)}
        </select>
      </Field>
      <Field label="Counted at Bengaluru DC" hint={`System shows ${fmtNum(p.warehouse)} units${!isNaN(n) ? `, variance ${n - p.warehouse >= 0 ? '+' : ''}${n - p.warehouse}` : ''}`}>
        <input className="input" style={{ width: '100%' }} type="number" min={0} value={counted} onChange={(e) => { setCounted(e.target.value); setErr(''); }} />
      </Field>
      <Field label="Cause of variance (optional)">
        <input className="input" style={{ width: '100%' }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. cartons moved between bays" />
      </Field>
      {err && <div style={{ color: 'var(--red)', fontSize: 12.5, fontWeight: 600 }}>{err}</div>}
    </Modal>
  );
}
