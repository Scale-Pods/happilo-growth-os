'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAppContext } from '../ClientWrapper';
import type { Lead, WhatsappLog, EmailLog } from '@/lib/data/b2bCrm';
import {
  LayoutDashboard,
  Package,
  Bot,
  DollarSign,
  Users,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { SALES_CHANNELS, salesWindow, inr, inrShort, pctChange } from '@/lib/mock/sales';
import {
  inventoryHealth,
  receivablesSnapshot,
  supportSnapshot,
  b2bSnapshot,
  contentSnapshot,
  attentionList,
} from '../dashboard/metrics';

interface MasterDashboardProps {
  b2bCrm: {
    leads: Lead[];
    whatsappLogs: WhatsappLog[];
    emailLogs: EmailLog[];
  };
}

const TONE: Record<string, string> = { red: 'var(--red)', amber: 'var(--brand-gold)', green: 'var(--brand-mid)' };

export default function MasterDashboard({ b2bCrm }: MasterDashboardProps) {
  const { inventory, supportCases, receivables, reviews, contentDrafts } = useAppContext();

  const inv = useMemo(() => inventoryHealth(inventory as any), [inventory]);
  const rec = useMemo(() => receivablesSnapshot(receivables as any), [receivables]);
  const sup = useMemo(() => supportSnapshot(supportCases as any, reviews as any), [supportCases, reviews]);
  const b2b = useMemo(() => b2bSnapshot(b2bCrm.leads as any), [b2bCrm.leads]);
  const content = useMemo(() => contentSnapshot(contentDrafts as any), [contentDrafts]);
  const attention = useMemo(() => attentionList({ inv, rec, sup, b2b, content }), [inv, rec, sup, b2b, content]);

  const win = useMemo(() => salesWindow(30), []);
  const revChange = win.previous ? pctChange(win.current.totalRevenue, win.previous.totalRevenue) : null;
  const channels = useMemo(
    () => SALES_CHANNELS.map((c) => ({ ...c, revenue: win.current.revenue[c.key] })).sort((a, b) => b.revenue - a.revenue),
    [win]
  );
  const topChannel = channels[0]?.revenue || 1;

  const positiveReplies = useMemo(
    () =>
      b2bCrm.whatsappLogs.filter((l) => l.direction === 'inbound' && l.interest === 'positive').length +
      b2bCrm.emailLogs.filter((l) => l.direction === 'inbound' && l.interest === 'positive').length,
    [b2bCrm.whatsappLogs, b2bCrm.emailLogs]
  );

  const modules = [
    { id: 'executive', name: 'Executive Board', href: '/dashboard', icon: LayoutDashboard, stat: inrShort(win.current.totalRevenue), label: 'Revenue, last 30 days' },
    { id: 'inventory', name: 'Inventory Intel', href: '/inventory', icon: Package, stat: `${inv.belowReorder.length} below reorder`, label: `${inv.rows.length} SKUs, ${inrShort(inv.stockValue)} at cost` },
    { id: 'customer-care', name: 'Customer Care', href: '/customer-care', icon: Bot, stat: `${sup.open} open`, label: `${sup.escalated.length} escalated, rating ${sup.rating ? sup.rating.toFixed(1) : '-'}` },
    { id: 'content-os', name: 'Content OS', href: '/marketing', icon: Sparkles, stat: `${content.review} to review`, label: `${content.total} scripts in the pipeline` },
    { id: 'b2b-crm', name: 'B2B CRM', href: '/b2b-crm/dashboard', icon: Users, stat: `${b2b.active} open leads`, label: `${b2b.won} won, ${positiveReplies} positive replies` },
    { id: 'receivables', name: 'Receivables', href: '/accounts-receivable/dashboard', icon: DollarSign, stat: `${rec.overdueCount} overdue`, label: `${inrShort(rec.overdueValue)} past due` },
  ];

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <style>{`
        .md-two { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; }
        .md-mods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 1100px) { .md-two { grid-template-columns: 1fr; } .md-mods { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .md-mods { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Master Dashboard</h2>
        <p style={{ fontSize: 13, color: 'var(--label-secondary)', margin: '4px 0 0' }}>
          Sales, stock, dues, support and pipeline in one view. Open a module for the detail.
        </p>
      </div>

      <div className="metrics-grid">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand)' } as React.CSSProperties}>
          <span className="label">Revenue, last 30 days</span>
          <span className="value">{inrShort(win.current.totalRevenue)}</span>
          {revChange !== null && (
            <span className="trend" style={{ color: revChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {revChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(revChange).toFixed(1)}% on the 30 days before
            </span>
          )}
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand-mid)' } as React.CSSProperties}>
          <span className="label">Orders</span>
          <span className="value">{win.current.totalOrders.toLocaleString('en-IN')}</span>
          <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>Average order {inr(win.current.aov)}</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--brand-gold)' } as React.CSSProperties}>
          <span className="label">Stock value at cost</span>
          <span className="value">{inrShort(inv.stockValue)}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: inv.belowReorder.length ? 'var(--red)' : 'var(--green)' }}>
            {inv.belowReorder.length} SKU{inv.belowReorder.length === 1 ? '' : 's'} below reorder level
          </span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--red)' } as React.CSSProperties}>
          <span className="label">Overdue from distributors</span>
          <span className="value">{inrShort(rec.overdueValue)}</span>
          <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>
            {rec.overdueCount} accounts, {inrShort(rec.outstanding)} outstanding in all
          </span>
        </div>
      </div>

      <div className="md-two" style={{ marginBottom: 20 }}>
        <div className="liquid-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Revenue by channel</h3>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', margin: '2px 0 14px' }}>Last 30 days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {channels.map((c) => (
              <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 84px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                <span>{c.label}</span>
                <div style={{ height: 9, borderRadius: 5, background: 'var(--fill-tertiary)' }}>
                  <div style={{ width: `${(c.revenue / topChannel) * 100}%`, height: '100%', borderRadius: 5, background: c.color }} />
                </div>
                <span style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{inrShort(c.revenue)}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/dashboard" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
              Full sales breakdown on the Executive Board
            </Link>
          </div>
        </div>

        <div className="liquid-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Needs attention today</h3>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', margin: '2px 0 14px' }}>Tap an item to open the module</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {attention.length === 0 && <div style={{ fontSize: 13, color: 'var(--label-secondary)' }}>Nothing urgent right now.</div>}
            {attention.slice(0, 6).map((a) => (
              <Link key={a.id} href={a.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--fill-quaternary)', borderLeft: `3px solid ${TONE[a.tone]}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: a.tone === 'amber' ? '#9A6B00' : TONE[a.tone] }}>{a.tag}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 2 }}>{a.text}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Modules</h3>
        <div className="md-mods">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.id} href={m.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'var(--fill-quaternary)', border: '1px solid var(--separator)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0, 82, 59, 0.10)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} />
                    </div>
                    <ArrowUpRight size={14} style={{ color: 'var(--label-tertiary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--label-secondary)', marginTop: 2 }}>{m.label}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand)' }}>{m.stat}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
