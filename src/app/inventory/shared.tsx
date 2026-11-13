'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { Product } from '@/lib/mock/inventory';
import { CHANNEL_META } from '@/lib/mock/channelInventory';
import type { ChannelId } from '@/lib/mock/channelInventory';

export type ToastFn = (message: string, type?: string) => void;

export const BRAND = '#00523B';
export const BRAND_MID = '#348A5C';
export const GOLD = '#F2A71B';

export const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(0,82,59,0.10)',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(12,62,51,0.04), 0 4px 14px rgba(12,62,51,0.05)',
};

export function Card({
  children,
  style,
  title,
  action,
  pad = 18,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: React.ReactNode;
  action?: React.ReactNode;
  pad?: number;
}) {
  return (
    <div style={{ ...cardStyle, padding: pad, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-dark)' }}>{title}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  tone = 'brand',
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'brand' | 'red' | 'orange' | 'gold' | 'mid';
  onClick?: () => void;
}) {
  const color = { brand: BRAND, red: 'var(--red)', orange: 'var(--orange)', gold: '#B87A00', mid: BRAND_MID }[tone];
  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        borderTop: `3px solid ${tone === 'brand' ? BRAND : tone === 'gold' ? GOLD : tone === 'mid' ? BRAND_MID : tone === 'red' ? 'var(--red)' : 'var(--orange)'}`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--label-secondary)' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color, margin: '6px 0 4px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--label-secondary)' }}>{sub}</div>}
    </div>
  );
}

export function KpiGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 5 ? 170 : 210}px, 1fr))`, gap: 14, marginBottom: 18 }}>{children}</div>
  );
}

export function Thumb({ p, size = 40 }: { p: Pick<Product, 'image' | 'name'>; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        background: '#fff',
        border: '1px solid rgba(0,82,59,0.12)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <span style={{ fontSize: 10, color: 'var(--label-tertiary)' }}>No image</span>
      )}
    </div>
  );
}

export function ProductCell({ p, size = 40, sub }: { p: Product; size?: number; sub?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220 }}>
      <Thumb p={p} size={size} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--label-primary)', lineHeight: 1.3 }}>{p.name}</div>
        <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 1 }}>{sub ?? p.pack}</div>
      </div>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  width = 520,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(12,62,51,0.35)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...cardStyle, width: '100%', maxWidth: width, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(12,62,51,0.25)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--separator)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-dark)' }}>{title}</div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ padding: '14px 20px', borderTop: '1px solid var(--separator)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ onClose, children, width = 520 }: { onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,62,51,0.30)', zIndex: 1900 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: width, background: '#F8FAF7', boxShadow: '-16px 0 48px rgba(12,62,51,0.2)', overflowY: 'auto' }}
      >
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 5 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

export const fieldStyle: React.CSSProperties = { width: '100%' };

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--fill-quaternary)', padding: 3, borderRadius: 10, gap: 2 }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '5px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'inherit',
            background: value === o.value ? '#fff' : 'transparent',
            color: value === o.value ? BRAND : 'var(--label-secondary)',
            boxShadow: value === o.value ? '0 1px 3px rgba(12,62,51,0.12)' : 'none',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Horizontal bar with label and value, used in category / location breakdowns. */
export function BarRow({ label, value, max, text, color = BRAND, sub }: { label: React.ReactNode; value: number; max: number; text: React.ReactNode; color?: string; sub?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, gap: 8 }}>
        <span style={{ fontWeight: 600, color: 'var(--label-primary)' }}>
          {label}
          {sub && <span style={{ fontWeight: 400, color: 'var(--label-secondary)', marginLeft: 6 }}>{sub}</span>}
        </span>
        <span style={{ color: 'var(--label-secondary)', fontVariantNumeric: 'tabular-nums' }}>{text}</span>
      </div>
      <div style={{ height: 7, background: 'rgba(0,82,59,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(1.5, (value / (max || 1)) * 100)}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export function MiniBars({ data, height = 56, color = BRAND_MID }: { data: number[]; height?: number; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((v, i) => (
        <div key={i} title={`${v} units`} style={{ flex: 1, height: `${(v / max) * 100}%`, minHeight: 3, background: i === data.length - 1 ? BRAND : color, opacity: i === data.length - 1 ? 1 : 0.55, borderRadius: '3px 3px 0 0' }} />
      ))}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>{children}</div>;
}

export function Empty({ text }: { text: string }) {
  return <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--label-secondary)', fontSize: 13 }}>{text}</div>;
}

export function Th({ children, onClick, active, dir, align }: { children: React.ReactNode; onClick?: () => void; active?: boolean; dir?: 'asc' | 'desc'; align?: 'right' | 'left' | 'center' }) {
  return (
    <th onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap', textAlign: align, userSelect: 'none' }}>
      {children}
      {active && <span style={{ marginLeft: 4, fontSize: 10 }}>{dir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );
}

export const num: React.CSSProperties = { textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type TabId = 'overview' | 'stock' | 'batches' | 'purchase' | 'channels' | 'allocation' | 'movements' | 'counts';

export interface TabProps {
  inventory: Product[];
  setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
  showToast: ToastFn;
  go: (tab: TabId, opts?: { search?: string; filter?: string }) => void;
  preset?: { search?: string; filter?: string };
}

/** Small rounded channel mark: logo file where we have one, coloured initial otherwise. */
export function ChannelIcon({ id, size = 20 }: { id: string; size?: number }) {
  const m = (CHANNEL_META as Record<string, (typeof CHANNEL_META)[ChannelId]>)[id];
  const box: React.CSSProperties = { width: size, height: size, flex: `0 0 ${size}px`, borderRadius: Math.round(size * 0.28), overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle' };
  if (!m) return <span style={{ ...box, background: BRAND, color: '#fff', fontSize: size * 0.5, fontWeight: 700 }}>H</span>;
  if (m.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={m.logo} alt={m.short} style={{ ...box, objectFit: 'cover', border: '1px solid rgba(0,82,59,0.12)' }} />;
  }
  return <span style={{ ...box, background: m.color, color: '#fff', fontSize: size * 0.55, fontWeight: 700 }}>{m.initial}</span>;
}

export function ChannelName({ id, label, size = 18 }: { id: string; label: string; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <ChannelIcon id={id} size={size} />
      {label}
    </span>
  );
}
