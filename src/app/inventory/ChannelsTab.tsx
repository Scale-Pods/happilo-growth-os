'use client';

import React, { useMemo, useState } from 'react';
import { RefreshCw, ArrowUpRight, Ban, RotateCcw } from 'lucide-react';
import {
  CHANNEL_META, CHANNEL_ORDER, buildChannelView, setListing, touchSync, fmtSync, fmtDay,
  type ChannelId, type ChannelSku, type ListingStatus,
} from '@/lib/mock/channelInventory';
import { safetyOf, fmtNum, fmtMoney, fmtDate } from '@/lib/mock/inventory-utils';
import { transferStock } from './actions';
import {
  Card, Kpi, KpiGrid, Modal, Field, Th, ProductCell, Toolbar, Empty, ChannelIcon, BarRow, TabProps, BRAND, BRAND_MID, GOLD,
} from './shared';

const STATUS_BADGE: Record<ListingStatus, string> = {
  Live: 'badge-green',
  'Out of stock': 'badge-red',
  Delisted: 'badge-grey',
  'Pending listing': 'badge-orange',
};

const PO_BADGE: Record<string, string> = { Confirmed: 'badge-blue', Dispatched: 'badge-orange', Received: 'badge-green' };
const NOTE_COLOR = { ok: BRAND_MID, warn: GOLD, bad: 'var(--red)' };
const right: React.CSSProperties = { textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

export default function ChannelsTab({ inventory, setInventory, showToast }: TabProps) {
  const [ch, setCh] = useState<ChannelId>('blinkit');
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [pushFor, setPushFor] = useState<string | null>(null); // product id, '' for chooser
  const [openPo, setOpenPo] = useState<string | null>(null);

  const view = useMemo(() => buildChannelView(ch, inventory), [ch, inventory, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const meta = view.meta;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return view.skus
      .filter((k) => (statusF === 'all' ? true : k.status === statusF))
      .filter((k) => !s || k.p.name.toLowerCase().includes(s) || k.p.sku.toLowerCase().includes(s) || k.extId.toLowerCase().includes(s))
      .sort((a, b) => b.p.avgMonthlySales - a.p.avgMonthlySales);
  }, [view, q, statusF]);

  const syncNow = () => {
    touchSync(ch);
    setTick((t) => t + 1);
    showToast(`${meta.label} synced. Stock and prices are now up to date.`, 'success');
  };

  const toggleListing = (k: ChannelSku) => {
    if (k.status === 'Delisted') {
      setListing(ch, k.p.id, 'Live');
      showToast(`${k.p.name} relisted on ${meta.label}.`, 'success');
    } else {
      setListing(ch, k.p.id, 'Delisted');
      showToast(`${k.p.name} marked delisted on ${meta.label}.`, 'success');
    }
    setTick((t) => t + 1);
  };

  const maxStore = Math.max(...view.stores.map((s) => s.units), 1);
  const k = view.kpi;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Channel selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CHANNEL_ORDER.map((id) => {
          const m = CHANNEL_META[id];
          const active = id === ch;
          const units = inventory.reduce((a, p) => a + ((p as any)[id] as number), 0);
          return (
            <button
              key={id}
              onClick={() => { setCh(id); setQ(''); setStatusF('all'); setOpenPo(null); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 14px 8px 9px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                background: active ? 'rgba(0,82,59,0.07)' : '#fff', border: `1.5px solid ${active ? BRAND : 'rgba(0,82,59,0.14)'}`,
              }}
            >
              <ChannelIcon id={id} size={28} />
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: active ? BRAND : 'var(--label-primary)' }}>{m.label}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--label-secondary)' }}>{fmtNum(units)} units</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Header */}
      <Card>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <ChannelIcon id={ch} size={46} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-dark)' }}>{meta.label}</div>
            <div style={{ fontSize: 12.5, color: 'var(--label-secondary)', marginTop: 3, maxWidth: 680 }}>{meta.blurb}</div>
            <div style={{ fontSize: 12, color: 'var(--label-secondary)', marginTop: 6 }}>
              Last synced {fmtSync(view.lastSync)}  ·  {meta.syncMode}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-secondary btn-sm" onClick={syncNow}><RefreshCw size={13} /> Sync now</button>
            <button className="btn-primary btn-sm" onClick={() => setPushFor('')}><ArrowUpRight size={13} /> Push stock to channel</button>
          </div>
        </div>
      </Card>

      <KpiGrid cols={5}>
        <Kpi label="Units at channel" value={fmtNum(k.units)} sub={`Worth ${fmtMoney(k.stockValue)} at channel prices`} />
        <Kpi label="Live listings" value={`${k.liveSkus} of ${k.totalSkus}`} sub={`${k.oosSkus} out of stock`} tone={k.oosSkus > 3 ? 'orange' : 'mid'} />
        <Kpi label="Fill rate" value={`${k.fill.toFixed(1)}%`} sub="Average across active SKUs" tone={k.fill < 90 ? 'orange' : 'brand'} />
        <Kpi label="Days of cover" value={k.cover >= 100 ? '100+' : k.cover.toFixed(1)} sub={`Target ${meta.target} days`} tone={k.cover < meta.target * 0.6 ? 'red' : 'brand'} />
        <Kpi label={meta.poLabel} value={k.openPos} sub={`${fmtNum(k.inbound)} units on the way`} tone="gold" />
      </KpiGrid>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
        <Card title={`${meta.storeLabel} (${view.stores.length})`} pad={0}>
          <div className="table-scroll-container" style={{ border: 'none', maxHeight: 440, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: 12.5 }}>
              <thead><tr><Th>Location</Th><Th align="right">Units</Th><Th align="right">SKUs stocked</Th><Th align="right">Running short</Th></tr></thead>
              <tbody>
                {view.stores.map((s) => (
                  <tr key={s.code}>
                    <td style={{ minWidth: 230 }}>
                      <BarRow label={s.name} value={s.units} max={maxStore} text="" sub={s.tag ? s.tag : undefined} />
                    </td>
                    <td style={right}>{fmtNum(s.units)}</td>
                    <td style={right}>{s.skusStocked}</td>
                    <td style={{ ...right, color: s.skusLow > 8 ? 'var(--red)' : s.skusLow > 4 ? 'var(--orange)' : 'inherit', fontWeight: s.skusLow > 4 ? 600 : 400 }}>{s.skusLow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Sync and health">
          <div style={{ display: 'grid', gap: 10 }}>
            {view.notes.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.45 }}>
                <span style={{ width: 4, borderRadius: 2, background: NOTE_COLOR[n.tone], flex: '0 0 4px' }} />
                <span>{n.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {view.sections.map((sec) => (
        <Card key={sec.title} title={sec.title} pad={0}>
          {sec.note && <div style={{ padding: '0 18px 10px', fontSize: 12, color: 'var(--label-secondary)' }}>{sec.note}</div>}
          <div className="table-scroll-container" style={{ border: 'none' }}>
            <table className="data-table" style={{ fontSize: 12.5 }}>
              <thead><tr>{sec.columns.map((c, i) => <Th key={c} align={i === 0 ? 'left' : /^[\d₹+\-—]/.test(String(sec.rows[0]?.[i] ?? '')) ? 'right' : 'left'}>{c}</Th>)}</tr></thead>
              <tbody>
                {sec.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, i) => {
                      const numeric = i > 0 && /^[\d₹+\-—]/.test(String(sec.rows[0]?.[i] ?? ''));
                      return <td key={i} style={numeric ? right : i === 0 ? { fontWeight: 600 } : undefined}>{c}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <Card title={`Listings on ${meta.label}`} pad={0}>
        <div style={{ padding: '0 18px' }}>
          <Toolbar>
            <input className="input" style={{ width: 260 }} placeholder="Search product, SKU or listing ID" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="input" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
              <option value="all">All statuses</option>
              {(['Live', 'Out of stock', 'Delisted', 'Pending listing'] as ListingStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>{rows.length} of {view.skus.length} products</span>
          </Toolbar>
        </div>
        <div className="table-scroll-container" style={{ border: 'none', maxHeight: 560, overflowY: 'auto' }}>
          <table className="data-table" style={{ fontSize: 12.5 }}>
            <thead>
              <tr>
                <Th>Product</Th><Th>{ch === 'shopify' ? 'Page' : 'Listing ID'}</Th><Th>Status</Th>
                <Th align="right">{meta.short} price</Th><Th align="right">happilo.com</Th><Th align="right">MRP</Th>
                <Th align="right">Units</Th><Th align="right">Cover</Th><Th align="right">Fill rate</Th><Th align="right">Out of stock hrs, 7 d</Th>
                <Th>{meta.extraLabel}</Th><Th>{' '}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const diff = r.price - r.hPrice;
                return (
                  <tr key={r.p.id} style={r.status === 'Delisted' ? { opacity: 0.65 } : undefined}>
                    <td><ProductCell p={r.p} size={32} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, maxWidth: 190, wordBreak: 'break-all' }}>{r.extId}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
                    <td style={{ ...right, fontWeight: 600, color: diff < 0 ? BRAND_MID : diff > 0 ? '#B87A00' : 'inherit' }}>₹{fmtNum(r.price)}</td>
                    <td style={right}>₹{fmtNum(r.hPrice)}</td>
                    <td style={right}>₹{fmtNum(r.mrp)}</td>
                    <td style={right}>{fmtNum(r.units)}</td>
                    <td style={{ ...right, color: r.status === 'Live' && r.cover < meta.target * 0.4 ? 'var(--red)' : 'inherit', fontWeight: 600 }}>{r.cover > 400 ? '—' : `${r.cover.toFixed(1)} d`}</td>
                    <td style={right}>{r.fill ? `${r.fill.toFixed(1)}%` : '—'}</td>
                    <td style={{ ...right, color: r.oosHrs > 24 ? 'var(--red)' : r.oosHrs > 8 ? 'var(--orange)' : 'inherit' }}>{r.oosHrs}</td>
                    <td style={{ fontSize: 12 }}>{r.extra}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn-secondary btn-sm" style={{ marginRight: 6 }} disabled={r.status !== 'Live' && r.status !== 'Out of stock'} onClick={() => setPushFor(r.p.id)}>Push</button>
                      {r.status === 'Pending listing' ? (
                        <span style={{ fontSize: 11.5, color: 'var(--label-secondary)' }}>Awaiting {meta.short}</span>
                      ) : r.status === 'Delisted' ? (
                        <button className="btn-secondary btn-sm" onClick={() => toggleListing(r)}><RotateCcw size={12} /> Relist</button>
                      ) : (
                        <button className="btn-secondary btn-sm" onClick={() => toggleListing(r)}><Ban size={12} /> Mark delisted</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty text="No products match these filters." />}
        </div>
      </Card>

      <Card title={meta.poLabel} pad={0}>
        <div className="table-scroll-container" style={{ border: 'none' }}>
          <table className="data-table" style={{ fontSize: 12.5 }}>
            <thead>
              <tr><Th>Reference</Th><Th>Status</Th><Th>Raised</Th><Th>Deliver to</Th><Th>{ch === 'shopify' ? 'Expected' : 'Appointment'}</Th><Th>Advance notice</Th><Th align="right">Units</Th><Th align="right">Received</Th></tr>
            </thead>
            <tbody>
              {view.pos.map((o) => (
                <React.Fragment key={o.ref}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setOpenPo(openPo === o.ref ? null : o.ref)}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600 }}>{o.ref}</td>
                    <td><span className={`badge ${PO_BADGE[o.status]}`}>{o.status}</span></td>
                    <td>{fmtDate(o.raised)}</td>
                    <td>{o.dest}</td>
                    <td>{fmtDay(o.slotDate)}, {o.slot}</td>
                    <td style={{ color: o.asnOk ? 'inherit' : 'var(--orange)', fontWeight: o.asnOk ? 400 : 600 }}>{o.asn}</td>
                    <td style={right}>{fmtNum(o.qty)}</td>
                    <td style={right}>{o.receivedQty !== undefined ? `${fmtNum(o.receivedQty)} (${Math.round((o.receivedQty / o.qty) * 100)}%)` : '—'}</td>
                  </tr>
                  {openPo === o.ref && (
                    <tr>
                      <td colSpan={8} style={{ background: 'rgba(0,82,59,0.03)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6, padding: '4px 2px', fontSize: 12 }}>
                          {o.lines.map((l) => (
                            <div key={l.p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                              <span>{l.p.name} ({l.p.pack})</span>
                              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtNum(l.qty)}{l.received !== undefined ? ` / ${fmtNum(l.received)}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pushFor !== null && (
        <PushModal
          key={pushFor}
          ch={ch}
          initialId={pushFor}
          skus={view.skus}
          onClose={() => setPushFor(null)}
          onDone={(name, qty) => {
            touchSync(ch);
            setTick((t) => t + 1);
            setPushFor(null);
            showToast(`Pushed ${fmtNum(qty)} units of ${name} to ${meta.label}.`, 'success');
          }}
          setInventory={setInventory}
          inventory={inventory}
        />
      )}
    </div>
  );
}

function PushModal({
  ch, initialId, skus, inventory, setInventory, onClose, onDone,
}: {
  ch: ChannelId;
  initialId: string;
  skus: ChannelSku[];
  inventory: TabProps['inventory'];
  setInventory: TabProps['setInventory'];
  onClose: () => void;
  onDone: (name: string, qty: number) => void;
}) {
  const meta = CHANNEL_META[ch];
  const sellable = skus.filter((k) => k.status === 'Live' || k.status === 'Out of stock').sort((a, b) => a.cover - b.cover);
  const [pid, setPid] = useState(initialId || sellable[0]?.p.id || '');
  const [qty, setQty] = useState('');
  const [err, setErr] = useState('');

  const k = sellable.find((x) => x.p.id === pid);
  const p = inventory.find((x) => x.id === pid);
  const maxMove = p ? Math.max(0, p.warehouse - safetyOf(p)) : 0;
  const daily = p ? (p.avgMonthlySales * meta.demand) / 30 : 0;
  const suggest = p ? Math.max(0, Math.min(maxMove, Math.ceil(daily * meta.target - ((p as any)[ch] as number)))) : 0;

  const submit = () => {
    if (!p || !k) return setErr('Choose a live product.');
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) return setErr('Enter a whole number of units greater than zero.');
    if (n > p.warehouse) return setErr(`The warehouse only holds ${fmtNum(p.warehouse)} units.`);
    if (n > maxMove) return setErr(`That would take the warehouse below its safety stock of ${fmtNum(safetyOf(p))} units. Move at most ${fmtNum(maxMove)}.`);
    transferStock({ setInventory, product: p, from: 'warehouse', to: ch, qty: n, note: `Pushed to ${meta.label}. Split across locations in line with sales.` });
    onDone(p.name, n);
  };

  return (
    <Modal
      title={`Push stock to ${meta.label}`}
      onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Push stock</button></>}
    >
      {sellable.length === 0 ? (
        <Empty text="There are no live listings to push stock to." />
      ) : (
        <>
          <Field label="Product" hint="Delisted and pending listings are left out. Lowest cover is listed first.">
            <select className="input" style={{ width: '100%' }} value={pid} onChange={(e) => { setPid(e.target.value); setErr(''); setQty(''); }}>
              {sellable.map((x) => <option key={x.p.id} value={x.p.id}>{x.p.name} ({x.p.pack}), {x.cover > 400 ? 'no sales' : `${x.cover.toFixed(1)} d cover`}</option>)}
            </select>
          </Field>
          {p && k && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                ['At warehouse', fmtNum(p.warehouse)],
                [`At ${meta.short}`, fmtNum(k.units)],
                ['Can move', fmtNum(maxMove)],
              ].map(([a, b]) => (
                <div key={a} style={{ background: '#fff', border: '1px solid rgba(0,82,59,0.10)', borderRadius: 12, padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>{a}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand-dark)' }}>{b}</div>
                </div>
              ))}
            </div>
          )}
          <Field label="Units to push" hint={suggest > 0 ? `About ${fmtNum(suggest)} units would bring cover to ${meta.target} days.` : 'Cover is already at or above target.'}>
            <input className="input" style={{ width: '100%' }} type="number" min={1} value={qty} onChange={(e) => { setQty(e.target.value); setErr(''); }} placeholder={suggest ? String(suggest) : 'Units'} />
          </Field>
          {suggest > 0 && <button className="btn-secondary btn-sm" onClick={() => setQty(String(suggest))}>Use {fmtNum(suggest)}</button>}
          {err && <div style={{ color: 'var(--red)', fontSize: 12.5, fontWeight: 600, marginTop: 10 }}>{err}</div>}
        </>
      )}
    </Modal>
  );
}
