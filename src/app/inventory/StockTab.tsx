'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ShoppingCart, Download, X } from 'lucide-react';
import type { Product } from '@/lib/mock/inventory';
import { SUPPLIERS } from '@/lib/mock/inventory';
import { useOps, inboundFor, poUnits } from '@/lib/mock/inventory-ops';
import {
  totalStock, coverDays, stockStatus, abcMap, reorderPointOf, safetyOf, fmtNum, fmtINR, fmtMoney, fmtDate,
  CHANNELS, CHANNEL_LABEL, CATEGORIES, TODAY, parseISO, daysBetween, weeklyTrend, StatusKey,
} from '@/lib/mock/inventory-utils';
import { adjustStock } from './actions';
import {
  Card, Drawer, Modal, Field, Th, ProductCell, Thumb, Toolbar, Empty, MiniBars, BarRow, TabProps, downloadCsv, BRAND, BRAND_MID, ChannelName,
} from './shared';

type SortKey = 'name' | 'total' | 'warehouse' | 'cover' | 'value' | 'sales';

const REASONS_ADD = ['Cycle count correction', 'Found during bin check', 'Customer return restocked', 'Opening balance'];
const REASONS_REMOVE = ['Cycle count correction', 'Damaged in handling', 'Write-off (damaged / expired)', 'QC sample', 'Short-pick'];

export default function StockTab({ inventory, setInventory, showToast, go, preset }: TabProps) {
  const ops = useOps();
  const inbound = useMemo(() => inboundFor(ops.pos), [ops.pos]);
  const abc = useMemo(() => abcMap(inventory), [inventory]);

  const [search, setSearch] = useState(preset?.search || '');
  const [cat, setCat] = useState('all');
  const [status, setStatus] = useState<string>(preset?.filter || 'all');
  const [abcF, setAbcF] = useState('all');
  const [loc, setLoc] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('cover');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  useEffect(() => {
    if (preset?.search !== undefined) setSearch(preset.search);
    if (preset?.filter) setStatus(preset.filter);
  }, [preset]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = inventory.filter((p) => {
      const st = stockStatus(p, inbound[p.id] || 0).key;
      if (q && !(p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.supplier || '').toLowerCase().includes(q))) return false;
      if (cat !== 'all' && p.category !== cat) return false;
      if (status !== 'all' && st !== status) return false;
      if (abcF !== 'all' && abc[p.id] !== abcF) return false;
      if (loc !== 'all' && ((p as any)[loc] as number) <= 0) return false;
      return true;
    });
    const val = (p: Product) => {
      switch (sortKey) {
        case 'total': return totalStock(p);
        case 'warehouse': return p.warehouse;
        case 'cover': return coverDays(p);
        case 'value': return totalStock(p) * p.cost;
        case 'sales': return p.avgMonthlySales;
        default: return 0;
      }
    };
    list = [...list].sort((a, b) => (sortKey === 'name' ? a.name.localeCompare(b.name) : val(a) - val(b)) * (dir === 'asc' ? 1 : -1));
    return list;
  }, [inventory, inbound, abc, search, cat, status, abcF, loc, sortKey, dir]);

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setDir(k === 'name' || k === 'cover' ? 'asc' : 'desc');
    }
  };

  const open = openId ? inventory.find((p) => p.id === openId) || null : null;
  const locQty = (p: Product) => (loc === 'all' ? totalStock(p) : ((p as any)[loc] as number));

  const exportCsv = () => {
    downloadCsv('happilo-stock-position.csv', [
      ['SKU', 'Product', 'Pack', 'Category', ...CHANNELS.map((c) => c.label), 'Total', 'Cover (days)', 'Reorder point', 'Status'],
      ...rows.map((p) => [p.sku, p.name, p.pack || '', p.category || '', ...CHANNELS.map((c) => (p as any)[c.key] as number), totalStock(p), coverDays(p), reorderPointOf(p), stockStatus(p, inbound[p.id] || 0).label]),
    ]);
    showToast(`Exported ${rows.length} SKUs to CSV.`, 'success');
  };

  return (
    <div>
      <Toolbar>
        <div className="search-box-wrapper" style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--label-secondary)' }} />
          <input className="input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search product, SKU or supplier" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="critical">Critical</option>
          <option value="reorder">Reorder</option>
          <option value="healthy">Healthy</option>
          <option value="overstock">Overstock</option>
        </select>
        <select className="input" value={abcF} onChange={(e) => setAbcF(e.target.value)}>
          <option value="all">ABC: all</option>
          <option value="A">Class A</option>
          <option value="B">Class B</option>
          <option value="C">Class C</option>
        </select>
        <select className="input" value={loc} onChange={(e) => setLoc(e.target.value)}>
          <option value="all">All locations</option>
          {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        {(search || cat !== 'all' || status !== 'all' || abcF !== 'all' || loc !== 'all') && (
          <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setCat('all'); setStatus('all'); setAbcF('all'); setLoc('all'); }}>
            <X size={13} /> Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>{rows.length} of {inventory.length} SKUs</span>
          <button className="btn-secondary btn-sm" onClick={exportCsv}><Download size={13} /> Export</button>
        </div>
      </Toolbar>

      <Card pad={0}>
        <div className="table-scroll-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <Th onClick={() => sortBy('name')} active={sortKey === 'name'} dir={dir}>Product</Th>
                <th>Category</th>
                <Th onClick={() => sortBy('total')} active={sortKey === 'total'} dir={dir} align="right">{loc === 'all' ? 'On hand' : CHANNEL_LABEL[loc]}</Th>
                <Th onClick={() => sortBy('warehouse')} active={sortKey === 'warehouse'} dir={dir} align="right">Bengaluru DC</Th>
                <th style={{ textAlign: 'right' }}>In channels</th>
                <Th onClick={() => sortBy('cover')} active={sortKey === 'cover'} dir={dir} align="right">Cover</Th>
                <th style={{ textAlign: 'right' }}>Reorder pt</th>
                <Th onClick={() => sortBy('sales')} active={sortKey === 'sales'} dir={dir} align="right">Sales / mo</Th>
                <Th onClick={() => sortBy('value')} active={sortKey === 'value'} dir={dir} align="right">Value (cost)</Th>
                <th>ABC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = stockStatus(p, inbound[p.id] || 0);
                const days = coverDays(p);
                return (
                  <tr key={p.id} onClick={() => setOpenId(p.id)} style={{ cursor: 'pointer' }}>
                    <td><ProductCell p={p} size={40} sub={`${p.pack}  ·  ${p.sku.length > 26 ? p.sku.slice(0, 24) + '…' : p.sku}`} /></td>
                    <td style={{ color: 'var(--label-secondary)' }}>{p.category}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtNum(locQty(p))}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(p.warehouse)}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(totalStock(p) - p.warehouse)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: st.key === 'critical' ? 'var(--red)' : st.key === 'reorder' ? 'var(--orange)' : 'inherit' }}>{days} d</td>
                    <td style={{ textAlign: 'right', color: 'var(--label-secondary)' }}>{fmtNum(reorderPointOf(p))}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(p.avgMonthlySales)}</td>
                    <td style={{ textAlign: 'right' }}>{fmtMoney(totalStock(p) * p.cost)}</td>
                    <td><span className={`badge ${abc[p.id] === 'A' ? 'badge-green' : abc[p.id] === 'B' ? 'badge-orange' : 'badge-grey'}`}>{abc[p.id]}</span></td>
                    <td>
                      <span className={`badge ${st.badge}`}>{st.label}</span>
                      {inbound[p.id] ? <div style={{ fontSize: 10.5, color: 'var(--label-secondary)', marginTop: 3 }}>+{fmtNum(inbound[p.id])} inbound</div> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty text="No SKUs match these filters." />}
        </div>
      </Card>

      {open && (
        <SkuDrawer
          p={open}
          onClose={() => setOpenId(null)}
          inbound={inbound[open.id] || 0}
          abcClass={abc[open.id]}
          onAdjust={() => setAdjusting(open)}
          onPo={() => { setOpenId(null); go('purchase', { search: open.name }); }}
        />
      )}
      {adjusting && (
        <AdjustModal
          p={inventory.find((x) => x.id === adjusting.id) || adjusting}
          onClose={() => setAdjusting(null)}
          onApply={(loc2, delta, reason, note) => {
            adjustStock({ setInventory, product: adjusting, loc: loc2, delta, reason, note });
            showToast(`${delta > 0 ? 'Added' : 'Removed'} ${fmtNum(Math.abs(delta))} units of ${adjusting.name} at ${CHANNEL_LABEL[loc2]}.`, 'success');
            setAdjusting(null);
          }}
        />
      )}
    </div>
  );
}

function SkuDrawer({ p, onClose, inbound, abcClass, onAdjust, onPo }: { p: Product; onClose: () => void; inbound: number; abcClass: string; onAdjust: () => void; onPo: () => void }) {
  const ops = useOps();
  const lots = useMemo(
    () => ops.batches.filter((b) => b.productId === p.id).sort((a, b) => (a.expiry < b.expiry ? -1 : 1)),
    [ops.batches, p.id]
  );
  const pos = ops.pos.filter((o) => o.status !== 'Received' && o.lines.some((l) => l.productId === p.id));
  const trend = useMemo(() => weeklyTrend(p), [p]);
  const total = totalStock(p);
  const st = stockStatus(p, inbound);
  const maxCh = Math.max(...CHANNELS.map((c) => (p as any)[c.key] as number), 1);
  const sup = Object.values(SUPPLIERS).find((s) => s.name === p.supplier);
  const margin = Math.round(((p.price - p.cost) / p.price) * 100);

  return (
    <Drawer onClose={onClose} width={560}>
      <div style={{ padding: '18px 22px', background: '#fff', borderBottom: '1px solid var(--separator)', position: 'sticky', top: 0, zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Thumb p={p} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-dark)', lineHeight: 1.25 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: 'var(--label-secondary)', margin: '4px 0 8px', wordBreak: 'break-all' }}>{p.pack}  ·  {p.category}  ·  {p.sku}</div>
            <span className={`badge ${st.badge}`}>{st.label}</span>{' '}
            <span className="badge badge-grey">Class {abcClass}</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn-primary btn-sm" onClick={onAdjust}><SlidersHorizontal size={13} /> Adjust stock</button>
          <button className="btn-secondary btn-sm" onClick={onPo}><ShoppingCart size={13} /> Reorder</button>
        </div>
      </div>

      <div style={{ padding: 22, display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            ['On hand', fmtNum(total)],
            ['Cover', `${coverDays(p)} days`],
            ['Sales / month', fmtNum(p.avgMonthlySales)],
            ['Reorder point', fmtNum(reorderPointOf(p))],
            ['Safety stock', fmtNum(safetyOf(p))],
            ['Inbound', inbound ? fmtNum(inbound) : 'None'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#fff', border: '1px solid rgba(0,82,59,0.10)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>{k}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--brand-dark)', marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        <Card title="Stock by location">
          {CHANNELS.map((c) => {
            const q = (p as any)[c.key] as number;
            return <BarRow key={c.key} label={<ChannelName id={c.key} label={c.label} />} value={q} max={maxCh} color={c.key === 'warehouse' ? BRAND : BRAND_MID} text={`${fmtNum(q)}  ·  ${coverDays(p, q) > 400 ? '—' : Math.round((q / (p.avgMonthlySales || 1)) * 30) + ' d'}`} />;
          })}
        </Card>

        <Card title="Lots in Bengaluru DC (first expiry, first out)">
          {lots.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--label-secondary)' }}>No lots held at the warehouse.</div>}
          {lots.length > 0 && (
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead><tr><th>Lot</th><th>Bay</th><th style={{ textAlign: 'right' }}>Qty</th><th>Expiry</th></tr></thead>
              <tbody>
                {lots.map((b, i) => {
                  const left = daysBetween(TODAY, parseISO(b.expiry));
                  return (
                    <tr key={b.lot}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                        {b.lot}{i === 0 && <span className="badge badge-blue" style={{ marginLeft: 6 }}>Pick first</span>}
                      </td>
                      <td>{b.bay}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(b.qty)}</td>
                      <td style={{ color: left <= 0 ? 'var(--red)' : left <= 60 ? 'var(--orange)' : 'inherit' }}>{fmtDate(b.expiry)} <span style={{ color: 'var(--label-secondary)' }}>({left <= 0 ? 'expired' : `${left} d`})</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Sales, last 12 weeks" action={<span style={{ fontSize: 11, color: 'var(--label-secondary)' }}>Units per week</span>}>
          <MiniBars data={trend} height={70} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--label-secondary)', marginTop: 6 }}>
            <span>12 wks ago</span>
            <span>This week: {fmtNum(trend[11])}</span>
          </div>
        </Card>

        <Card title="Supplier and economics">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px', fontSize: 12.5 }}>
            <Info k="Supplier" v={p.supplier || '—'} />
            <Info k="Origin" v={p.origin || '—'} />
            <Info k="Lead time" v={`${p.leadTime} days`} />
            <Info k="Minimum order" v={p.moq ? `${fmtNum(p.moq)} units` : '—'} />
            <Info k="Shelf life" v={p.shelfLifeDays ? `${Math.round(p.shelfLifeDays / 30.4)} months` : '—'} />
            <Info k="Supplier city" v={sup ? `${sup.city}, ${sup.country}` : '—'} />
            <Info k="Landed cost" v={`${fmtINR(p.cost)} per unit`} />
            <Info k="Selling price" v={`${fmtINR(p.price)} (MRP ${fmtINR(p.mrp || p.price)})`} />
            <Info k="Gross margin" v={`${margin}%`} />
            <Info k="Stock value" v={fmtMoney(total * p.cost)} />
          </div>
          {pos.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--separator)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Inbound orders</div>
              {pos.map((o) => (
                <div key={o.id} style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>{o.id} <span className="badge badge-blue" style={{ marginLeft: 4 }}>{o.status}</span></span>
                  <span style={{ color: 'var(--label-secondary)' }}>{fmtNum(o.lines.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty, 0))} units, ETA {fmtDate(o.eta)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Drawer>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>{k}</div>
      <div style={{ fontWeight: 600, color: 'var(--label-primary)' }}>{v}</div>
    </div>
  );
}

function AdjustModal({ p, onClose, onApply }: { p: Product; onClose: () => void; onApply: (loc: string, delta: number, reason: string, note: string) => void }) {
  const [loc, setLoc] = useState('warehouse');
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('remove');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState(REASONS_REMOVE[0]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const current = (p as any)[loc] as number;
  const n = parseInt(qty, 10);
  const delta = isNaN(n) ? 0 : mode === 'add' ? n : mode === 'remove' ? -n : n - current;

  const reasons = delta >= 0 && mode !== 'remove' ? REASONS_ADD : REASONS_REMOVE;

  const submit = () => {
    if (isNaN(n) || n < 0 || (mode !== 'set' && n === 0)) return setErr('Enter a quantity greater than zero.');
    if (mode === 'remove' && n > current) return setErr(`Only ${fmtNum(current)} units are held at ${CHANNEL_LABEL[loc]}.`);
    if (delta === 0) return setErr('That matches the current quantity, nothing to change.');
    onApply(loc, delta, reasons.includes(reason) ? reason : reasons[0], note.trim());
  };

  return (
    <Modal
      title={`Adjust stock: ${p.name}`}
      onClose={onClose}
      width={480}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Apply adjustment</button></>}
    >
      <Field label="Location">
        <select className="input" style={{ width: '100%' }} value={loc} onChange={(e) => { setLoc(e.target.value); setErr(''); }}>
          {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label} ({fmtNum((p as any)[c.key])} units)</option>)}
        </select>
      </Field>
      <Field label="Action">
        <div style={{ display: 'flex', gap: 8 }}>
          {([['add', 'Add stock'], ['remove', 'Remove stock'], ['set', 'Set to count']] as const).map(([k, l]) => (
            <button key={k} className={mode === k ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'} onClick={() => { setMode(k); setErr(''); setReason(k === 'add' ? REASONS_ADD[0] : REASONS_REMOVE[0]); }}>{l}</button>
          ))}
        </div>
      </Field>
      <Field label={mode === 'set' ? 'Counted quantity' : 'Quantity'} hint={delta !== 0 ? `Result: ${fmtNum(current)} to ${fmtNum(current + delta)} units (${delta > 0 ? '+' : ''}${fmtNum(delta)})` : undefined}>
        <input className="input" style={{ width: '100%' }} type="number" min={0} value={qty} onChange={(e) => { setQty(e.target.value); setErr(''); }} placeholder="0" />
      </Field>
      <Field label="Reason">
        <select className="input" style={{ width: '100%' }} value={reasons.includes(reason) ? reason : reasons[0]} onChange={(e) => setReason(e.target.value)}>
          {reasons.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Note (optional)">
        <input className="input" style={{ width: '100%' }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. bin C4, carton 12 torn" />
      </Field>
      {err && <div style={{ color: 'var(--red)', fontSize: 12.5, fontWeight: 600 }}>{err}</div>}
    </Modal>
  );
}
