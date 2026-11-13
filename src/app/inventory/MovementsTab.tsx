'use client';

import React, { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { useOps } from '@/lib/mock/inventory-ops';
import type { MoveType } from '@/lib/mock/inventory-ops';
import { fmtNum, fmtDate, fmtTime, TODAY, daysBetween, parseISO } from '@/lib/mock/inventory-utils';
import { Card, Th, ProductCell, Toolbar, Empty, TabProps, downloadCsv } from './shared';

const BADGE: Record<MoveType, string> = {
  GRN: 'badge-green',
  Dispatch: 'badge-blue',
  Return: 'badge-orange',
  Adjustment: 'badge-grey',
  Transfer: 'badge-purple',
  'Write-off': 'badge-red',
};
const SIGN: Record<MoveType, string> = { GRN: '+', Dispatch: '-', Return: '+', Adjustment: '', Transfer: '', 'Write-off': '-' };

export default function MovementsTab({ inventory, showToast }: TabProps) {
  const ops = useOps();
  const [type, setType] = useState('all');
  const [range, setRange] = useState('14');
  const [search, setSearch] = useState('');
  const [user, setUser] = useState('all');
  const byId = useMemo(() => Object.fromEntries(inventory.map((p) => [p.id, p])), [inventory]);
  const users = useMemo(() => Array.from(new Set(ops.movements.map((m) => m.user))).sort(), [ops.movements]);

  const rows = ops.movements.filter((m) => {
    const p = byId[m.productId];
    if (!p) return false;
    if (type !== 'all' && m.type !== type) return false;
    if (user !== 'all' && m.user !== user) return false;
    if (range !== 'all') {
      const t = new Date(m.ts);
      const local = daysBetween(new Date(t.getFullYear(), t.getMonth(), t.getDate()), TODAY);
      if (local > Number(range) - 1) return false;
    }
    const q = search.trim().toLowerCase();
    if (q && !(p.name.toLowerCase().includes(q) || m.ref.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.note || '').toLowerCase().includes(q))) return false;
    return true;
  });

  const exportCsv = () => {
    downloadCsv('happilo-stock-movements.csv', [
      ['Movement', 'Date', 'Time', 'Type', 'Product', 'Qty', 'From', 'To', 'Reference', 'User', 'Note'],
      ...rows.map((m) => {
        const d = new Date(m.ts);
        return [m.id, fmtDate(d), fmtTime(d), m.type, byId[m.productId]?.name || '', m.qty, m.from, m.to, m.ref, m.user, m.note || ''];
      }),
    ]);
    showToast(`Exported ${rows.length} movements.`, 'success');
  };

  return (
    <div>
      <Toolbar>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--label-secondary)' }} />
          <input className="input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search product, reference or note" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All movement types</option>
          {(Object.keys(BADGE) as MoveType[]).map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="input" value={user} onChange={(e) => setUser(e.target.value)}>
          <option value="all">All users</option>
          {users.map((u) => <option key={u}>{u}</option>)}
        </select>
        <select className="input" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="3">Last 3 days</option>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="all">Everything</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>{rows.length} entries</span>
          <button className="btn-secondary btn-sm" onClick={exportCsv}><Download size={13} /> Export</button>
        </div>
      </Toolbar>
      <Card pad={0}>
        <div className="table-scroll-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><Th>When</Th><Th>Type</Th><Th>Product</Th><Th align="right">Qty</Th><Th>From</Th><Th>To</Th><Th>Reference</Th><Th>By</Th></tr></thead>
            <tbody>
              {rows.slice(0, 120).map((m) => {
                const d = new Date(m.ts);
                const p = byId[m.productId];
                return (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(d)}<div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>{fmtTime(d)}  ·  {m.id}</div></td>
                    <td><span className={`badge ${BADGE[m.type]}`}>{m.type}</span></td>
                    <td><ProductCell p={p} size={30} sub={m.note || p.pack} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: SIGN[m.type] === '+' ? 'var(--green)' : SIGN[m.type] === '-' ? 'var(--red)' : 'inherit' }}>{SIGN[m.type]}{fmtNum(m.qty)}</td>
                    <td>{m.from}</td>
                    <td>{m.to}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{m.ref}</td>
                    <td>{m.user}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty text="No movements match these filters." />}
        </div>
      </Card>
    </div>
  );
}
