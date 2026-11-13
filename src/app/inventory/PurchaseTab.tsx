'use client';

import React, { useMemo, useState } from 'react';
import { Plus, ChevronRight, ChevronDown, PackageCheck, Truck } from 'lucide-react';
import type { Product } from '@/lib/mock/inventory';
import { SUPPLIERS } from '@/lib/mock/inventory';
import {
  useOps, updateOps, inboundFor, poValue, poUnits, isOpenPO, nextPoNumber, newLot, PO_FLOW,
} from '@/lib/mock/inventory-ops';
import type { PurchaseOrder, PoStatus, PoLine } from '@/lib/mock/inventory-ops';
import {
  totalStock, coverDays, stockStatus, fmtNum, fmtINR, fmtMoney, fmtDate, TODAY, addDays, toISO, daysBetween, parseISO,
} from '@/lib/mock/inventory-utils';
import { logMovement } from './actions';
import { Card, Kpi, KpiGrid, Modal, Field, Th, ProductCell, TabProps, Empty } from './shared';

const STATUS_BADGE: Record<PoStatus, string> = {
  Ordered: 'badge-grey',
  'In Transit': 'badge-blue',
  'At Port': 'badge-orange',
  Customs: 'badge-orange',
  Received: 'badge-green',
};

function suggestedQty(p: Product, inbound: number): number {
  const daily = p.avgMonthlySales / 30;
  const target = daily * (p.leadTime + 45);
  const need = target - totalStock(p) - inbound;
  if (need <= 0) return 0;
  const step = need > 2000 ? 100 : 50;
  return Math.max(p.moq || 0, Math.ceil(need / step) * step);
}

export default function PurchaseTab({ inventory, setInventory, showToast, preset }: TabProps) {
  const ops = useOps();
  const inbound = useMemo(() => inboundFor(ops.pos), [ops.pos]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<{ supplierKey: string; lines: { productId: string; qty: number }[] } | null>(null);
  const byId = useMemo(() => Object.fromEntries(inventory.map((p) => [p.id, p])), [inventory]);

  const suggestions = useMemo(() => {
    const groups: Record<string, { supplierKey: string; items: { p: Product; qty: number; days: number; key: string }[] }> = {};
    inventory.forEach((p) => {
      const inb = inbound[p.id] || 0;
      const st = stockStatus(p, inb);
      if (st.key !== 'reorder' && st.key !== 'critical' && st.key !== 'out') return;
      const qty = suggestedQty(p, inb);
      if (qty <= 0) return;
      const sk = Object.values(SUPPLIERS).find((s) => s.name === p.supplier)?.key || 'OWN';
      (groups[sk] ||= { supplierKey: sk, items: [] }).items.push({ p, qty, days: coverDays(p), key: st.key });
    });
    return Object.values(groups).sort((a, b) => Math.min(...a.items.map((i) => i.days)) - Math.min(...b.items.map((i) => i.days)));
  }, [inventory, inbound]);

  const open = ops.pos.filter(isOpenPO).sort((a, b) => (a.eta < b.eta ? -1 : 1));
  const received = ops.pos.filter((o) => !isOpenPO(o)).sort((a, b) => ((a.receivedOn || '') < (b.receivedOn || '') ? 1 : -1));
  const openValue = open.reduce((a, o) => a + poValue(o), 0);
  const late = open.filter((o) => daysBetween(TODAY, parseISO(o.eta)) < 0).length;

  const receive = (o: PurchaseOrder) => {
    updateOps((s) => ({
      pos: s.pos.map((x) => (x.id === o.id ? { ...x, status: 'Received' as PoStatus, receivedOn: toISO(TODAY) } : x)),
      batches: [
        ...s.batches,
        ...o.lines.map((l, i) => newLot(byId[l.productId], l.qty, `GRN-${toISO(TODAY).slice(5).replace('-', '')}-${o.id.slice(-4)}${i}`)),
      ],
    }));
    setInventory((prev) =>
      prev.map((p) => {
        const l = o.lines.filter((x) => x.productId === p.id).reduce((a, x) => a + x.qty, 0);
        return l ? { ...p, warehouse: p.warehouse + l } : p;
      })
    );
    o.lines.forEach((l) =>
      logMovement({ type: 'GRN', productId: l.productId, qty: l.qty, from: o.supplier, to: 'Bengaluru DC', ref: o.id, user: 'Ravi K.', note: 'Inward QC passed' })
    );
    showToast(`${o.id} received. ${fmtNum(poUnits(o))} units added to Bengaluru DC.`, 'success');
  };

  const advance = (o: PurchaseOrder) => {
    const domestic = o.country === 'India';
    let idx = PO_FLOW.indexOf(o.status);
    let next = PO_FLOW[idx + 1];
    if (domestic && next && (next === 'At Port' || next === 'Customs')) next = 'Received';
    if (next === 'Received') return receive(o);
    updateOps((s) => ({ pos: s.pos.map((x) => (x.id === o.id ? { ...x, status: next } : x)) }));
    showToast(`${o.id} moved to ${next}.`, 'success');
  };

  const create = (po: PurchaseOrder) => {
    updateOps((s) => ({ pos: [po, ...s.pos] }));
    showToast(`${po.id} raised with ${po.supplier}, ${fmtMoney(poValue(po))}.`, 'success');
    setModal(null);
  };

  return (
    <div>
      <KpiGrid>
        <Kpi label="Open purchase orders" value={open.length} sub={late ? `${late} past its ETA` : 'All within ETA'} tone={late ? 'orange' : 'brand'} />
        <Kpi label="Open order value" value={fmtMoney(openValue)} sub="At landed cost" tone="mid" />
        <Kpi label="Units inbound" value={fmtNum(open.reduce((a, o) => a + poUnits(o), 0))} sub={`Next ETA ${open[0] ? fmtDate(open[0].eta) : 'none'}`} />
        <Kpi label="Reorder suggestions" value={suggestions.reduce((a, g) => a + g.items.length, 0)} sub={`${suggestions.length} suppliers`} tone="gold" />
      </KpiGrid>

      <Card
        title="Reorder suggestions"
        action={<button className="btn-primary btn-sm" onClick={() => setModal({ supplierKey: 'CA_ALM', lines: [] })}><Plus size={13} /> New PO</button>}
        style={{ marginBottom: 16 }}
      >
        <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginBottom: 12 }}>
          Quantities cover lead time plus 45 days of sales, after counting stock and orders already on the way. Rounded up to the supplier minimum.
        </div>
        {suggestions.length === 0 && <Empty text="Nothing needs reordering right now." />}
        <div style={{ display: 'grid', gap: 12 }}>
          {suggestions.map((g) => {
            const sup = SUPPLIERS[g.supplierKey];
            const val = g.items.reduce((a, i) => a + i.qty * i.p.cost, 0);
            return (
              <div key={g.supplierKey} style={{ border: '1px solid rgba(0,82,59,0.12)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,82,59,0.05)', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--brand-dark)' }}>{sup.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--label-secondary)', marginLeft: 8 }}>{sup.city}, {sup.country}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{fmtMoney(val)}</span>
                    <button className="btn-primary btn-sm" onClick={() => setModal({ supplierKey: g.supplierKey, lines: g.items.map((i) => ({ productId: i.p.id, qty: i.qty })) })}>Raise PO</button>
                  </div>
                </div>
                <table className="data-table" style={{ fontSize: 12.5 }}>
                  <tbody>
                    {g.items.map((i) => (
                      <tr key={i.p.id}>
                        <td><ProductCell p={i.p} size={32} sub={i.p.pack} /></td>
                        <td><span className={`badge ${i.key === 'reorder' ? 'badge-orange' : 'badge-red'}`}>{i.key === 'reorder' ? 'Reorder' : 'Critical'}</span></td>
                        <td style={{ textAlign: 'right' }}>{i.days} d cover</td>
                        <td style={{ textAlign: 'right', color: 'var(--label-secondary)' }}>{i.p.leadTime} d lead</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtNum(i.qty)} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Open purchase orders and inbound" pad={0} style={{ marginBottom: 16 }}>
        <div className="table-scroll-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><Th>{' '}</Th><Th>PO number</Th><Th>Supplier</Th><Th align="right">Units</Th><Th align="right">Value</Th><Th>Ordered</Th><Th>ETA</Th><Th>Status</Th><Th>{' '}</Th></tr></thead>
            <tbody>
              {open.map((o) => {
                const eta = daysBetween(TODAY, parseISO(o.eta));
                const isOpen = expanded === o.id;
                return (
                  <React.Fragment key={o.id}>
                    <tr onClick={() => setExpanded(isOpen ? null : o.id)} style={{ cursor: 'pointer' }}>
                      <td>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{o.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.supplier}</div>
                        <div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>{o.country}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(poUnits(o))}</td>
                      <td style={{ textAlign: 'right' }}>{fmtMoney(poValue(o))}</td>
                      <td>{fmtDate(o.orderedOn)}</td>
                      <td>{fmtDate(o.eta)}<div style={{ fontSize: 11, color: eta < 0 ? 'var(--red)' : 'var(--label-secondary)' }}>{eta < 0 ? `${-eta} d late` : eta === 0 ? 'Today' : `in ${eta} d`}</div></td>
                      <td><span className={`badge ${STATUS_BADGE[o.status]}`}>{o.status}</span></td>
                      <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        {o.status !== 'Ordered' && (
                          <button className="btn-primary btn-sm" onClick={() => receive(o)}><PackageCheck size={12} /> Receive</button>
                        )}{' '}
                        {o.status !== 'Customs' && !(o.status === 'In Transit' && o.country === 'India') && (
                          <button className="btn-secondary btn-sm" onClick={() => advance(o)}><Truck size={12} /> {o.status === 'Ordered' ? 'Mark shipped' : o.status === 'In Transit' ? 'At port' : 'Into customs'}</button>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={9} style={{ background: 'rgba(0,82,59,0.03)' }}>
                          <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginBottom: 8 }}>{o.route}{o.note ? `  ·  ${o.note}` : ''}</div>
                          {o.lines.map((l) => {
                            const p = byId[l.productId];
                            if (!p) return null;
                            return (
                              <div key={l.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', gap: 12 }}>
                                <ProductCell p={p} size={30} />
                                <span style={{ fontSize: 12.5 }}>{fmtNum(l.qty)} units at {fmtINR(l.unitCost)}  =  <b>{fmtMoney(l.qty * l.unitCost)}</b></span>
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {open.length === 0 && <Empty text="No open purchase orders." />}
        </div>
      </Card>

      <Card title="Recently received" pad={0}>
        <div className="table-scroll-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><Th>PO number</Th><Th>Supplier</Th><Th align="right">Units</Th><Th align="right">Value</Th><Th>Received</Th></tr></thead>
            <tbody>
              {received.slice(0, 6).map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.id}</td>
                  <td>{o.supplier}</td>
                  <td style={{ textAlign: 'right' }}>{fmtNum(poUnits(o))}</td>
                  <td style={{ textAlign: 'right' }}>{fmtMoney(poValue(o))}</td>
                  <td>{o.receivedOn ? fmtDate(o.receivedOn) : ''} <span className="badge badge-green" style={{ marginLeft: 6 }}>Received</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && <PoModal init={modal} inventory={inventory} pos={ops.pos} onClose={() => setModal(null)} onCreate={create} />}
    </div>
  );
}

function PoModal({ init, inventory, pos, onClose, onCreate }: { init: { supplierKey: string; lines: { productId: string; qty: number }[] }; inventory: Product[]; pos: PurchaseOrder[]; onClose: () => void; onCreate: (po: PurchaseOrder) => void }) {
  const [sk, setSk] = useState(init.supplierKey);
  const [lines, setLines] = useState<{ productId: string; qty: string }[]>(init.lines.map((l) => ({ productId: l.productId, qty: String(l.qty) })));
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const sup = SUPPLIERS[sk];
  const options = inventory.filter((p) => p.supplier === sup.name);
  const used = new Set(lines.map((l) => l.productId));
  const parsed: PoLine[] = lines
    .map((l) => ({ productId: l.productId, qty: parseInt(l.qty, 10) || 0, unitCost: inventory.find((p) => p.id === l.productId)?.cost || 0 }))
    .filter((l) => l.qty > 0);
  const total = parsed.reduce((a, l) => a + l.qty * l.unitCost, 0);
  const lead = Math.max(0, ...lines.map((l) => inventory.find((p) => p.id === l.productId)?.leadTime || 0));

  const changeSupplier = (k: string) => {
    setSk(k);
    setLines([]);
  };

  const submit = () => {
    if (!parsed.length) return setErr('Add at least one line with a quantity.');
    const id = nextPoNumber(pos);
    const domestic = sup.country === 'India';
    onCreate({
      id,
      supplier: sup.name,
      country: sup.country,
      lines: parsed,
      orderedOn: toISO(TODAY),
      eta: toISO(addDays(TODAY, lead || 10)),
      status: 'Ordered',
      route: domestic ? `${sup.city} to Bengaluru by road` : `${sup.city} to Chennai or Nhava Sheva, then road to Bengaluru`,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal
      title="New purchase order"
      onClose={onClose}
      width={620}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Raise PO  ·  {fmtMoney(total)}</button></>}
    >
      <Field label="Supplier">
        <select className="input" style={{ width: '100%' }} value={sk} onChange={(e) => changeSupplier(e.target.value)}>
          {Object.values(SUPPLIERS).map((s) => <option key={s.key} value={s.key}>{s.name}, {s.city}</option>)}
        </select>
      </Field>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 6 }}>Lines</div>
      {lines.map((l, i) => {
        const p = inventory.find((x) => x.id === l.productId);
        return (
          <div key={l.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>{p && <ProductCell p={p} size={30} sub={`${fmtINR(p.cost)} per unit  ·  ${p.leadTime} d lead`} />}</div>
            <input className="input" type="number" min={0} style={{ width: 100 }} value={l.qty} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} />
            <button className="btn-icon" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} aria-label="Remove line">×</button>
          </div>
        );
      })}
      <select className="input" style={{ width: '100%', marginBottom: 14 }} value="" onChange={(e) => e.target.value && setLines((ls) => [...ls, { productId: e.target.value, qty: String(inventory.find((p) => p.id === e.target.value)?.moq || 500) }])}>
        <option value="">Add a product from this supplier</option>
        {options.filter((p) => !used.has(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.pack})</option>)}
      </select>
      <Field label="Notes for the supplier (optional)">
        <input className="input" style={{ width: '100%' }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Packing, labelling or shipment instructions" />
      </Field>
      <div style={{ fontSize: 12.5, color: 'var(--label-secondary)' }}>
        Expected arrival around {fmtDate(addDays(TODAY, lead || 10))} based on a {lead || 10}-day lead time. PO value {fmtINR(total)}.
      </div>
      {err && <div style={{ color: 'var(--red)', fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{err}</div>}
    </Modal>
  );
}
