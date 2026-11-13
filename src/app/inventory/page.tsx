'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Boxes, CalendarClock, ShoppingCart, ArrowRightLeft, History, ClipboardCheck, Store,
} from 'lucide-react';
import { useAppContext } from '../ClientWrapper';
import { useOps, inboundFor, isOpenPO } from '@/lib/mock/inventory-ops';
import { stockStatus, TODAY, parseISO, daysBetween } from '@/lib/mock/inventory-utils';
import type { TabId, TabProps } from './shared';
import OverviewTab from './OverviewTab';
import StockTab from './StockTab';
import BatchesTab from './BatchesTab';
import PurchaseTab from './PurchaseTab';
import ChannelsTab from './ChannelsTab';
import AllocationTab from './AllocationTab';
import MovementsTab from './MovementsTab';
import CountsTab from './CountsTab';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'batches', label: 'Batches & expiry', icon: CalendarClock },
  { id: 'purchase', label: 'Purchase orders', icon: ShoppingCart },
  { id: 'channels', label: 'Channels', icon: Store },
  { id: 'allocation', label: 'Channel allocation', icon: ArrowRightLeft },
  { id: 'movements', label: 'Movements', icon: History },
  { id: 'counts', label: 'Cycle counts', icon: ClipboardCheck },
];

export default function InventoryPage() {
  const { inventory, setInventory, showToast } = useAppContext();
  const ops = useOps();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabId>('overview');
  const [preset, setPreset] = useState<TabProps['preset']>(undefined);

  useEffect(() => setMounted(true), []);

  const counts = useMemo(() => {
    const inbound = inboundFor(ops.pos);
    return {
      stock: inventory.filter((p) => ['critical', 'reorder', 'out'].includes(stockStatus(p, inbound[p.id] || 0).key)).length,
      batches: ops.batches.filter((b) => daysBetween(TODAY, parseISO(b.expiry)) <= 30).length,
      purchase: ops.pos.filter(isOpenPO).length,
      counts: ops.counts.filter((c) => c.status !== 'Approved').length,
    };
  }, [inventory, ops]);

  const go: TabProps['go'] = (t, opts) => {
    setPreset(opts ? { ...opts } : undefined);
    setTab(t);
  };

  const badge: Partial<Record<TabId, number>> = { stock: counts.stock, batches: counts.batches, purchase: counts.purchase, counts: counts.counts };

  const props: TabProps = { inventory, setInventory, showToast, go, preset };

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-dark)', margin: 0 }}>Inventory</h2>
        <p style={{ fontSize: 13, color: 'var(--label-secondary)', margin: '4px 0 0' }}>
          Bengaluru warehouse and channel stock, lots and expiry, purchase orders and cycle counts for {inventory.length} SKUs.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--separator)', marginBottom: 18, overflowX: 'auto' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap',
                color: active ? 'var(--brand)' : 'var(--label-secondary)',
                borderBottom: `2px solid ${active ? 'var(--brand)' : 'transparent'}`, marginBottom: -1,
              }}
            >
              <Icon size={15} />
              {t.label}
              {badge[t.id] ? (
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: t.id === 'stock' || t.id === 'batches' ? 'rgba(229,72,61,0.12)' : 'rgba(0,82,59,0.1)', color: t.id === 'stock' || t.id === 'batches' ? 'var(--red)' : 'var(--brand)' }}>
                  {badge[t.id]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {!mounted ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--label-secondary)', fontSize: 13 }}>Loading stock position</div>
      ) : (
        <>
          {tab === 'overview' && <OverviewTab {...props} />}
          {tab === 'stock' && <StockTab {...props} />}
          {tab === 'batches' && <BatchesTab {...props} />}
          {tab === 'purchase' && <PurchaseTab {...props} />}
          {tab === 'channels' && <ChannelsTab {...props} />}
          {tab === 'allocation' && <AllocationTab {...props} />}
          {tab === 'movements' && <MovementsTab {...props} />}
          {tab === 'counts' && <CountsTab {...props} />}
        </>
      )}
    </div>
  );
}
