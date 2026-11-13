'use client';

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { CalendarPost } from '@/lib/mock/marketingCalendar';
import { PlatformIcon } from './shared';

const MONTHS = [
  { label: 'November 2026', prefix: '2026-11', days: 30, offset: 6 }, // 1 Nov 2026 is a Sunday
  { label: 'December 2026', prefix: '2026-12', days: 31, offset: 1 }, // 1 Dec 2026 is a Tuesday
];
const TODAY = '2026-11-13';
const FILTERS = ['all', 'Instagram', 'YouTube', 'Meta Ads', 'Pinterest', 'LinkedIn', 'WhatsApp'];

const statusColor = (s: CalendarPost['status']) => (s === 'Published' ? 'var(--green)' : s === 'Scheduled' ? 'var(--blue)' : 'var(--orange)');
const statusBg = (s: CalendarPost['status']) => (s === 'Published' ? 'rgba(30,158,95,0.10)' : s === 'Scheduled' ? 'rgba(0,82,59,0.08)' : 'rgba(242,167,27,0.14)');

function prettyDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CalendarTab({ posts }: { posts: CalendarPost[] }) {
  const [monthIdx, setMonthIdx] = useState(0);
  const [filter, setFilter] = useState('all');
  const [openDate, setOpenDate] = useState<string | null>(null);
  const month = MONTHS[monthIdx];
  const visible = posts.filter((p) => filter === 'all' || p.platform === filter);
  const monthCount = visible.filter((p) => p.date.startsWith(month.prefix)).length;
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < month.offset; i++) cells.push(<div key={`b${i}`} />);
  for (let day = 1; day <= month.days; day++) {
    const iso = `${month.prefix}-${String(day).padStart(2, '0')}`;
    const dayPosts = visible.filter((p) => p.date === iso);
    const isToday = iso === TODAY;
    cells.push(
      <div
        key={iso}
        onClick={() => dayPosts.length > 0 && setOpenDate(iso)}
        style={{ minHeight: '92px', background: isToday ? 'rgba(249,194,0,0.10)' : 'var(--bg-layer2)', border: isToday ? '1.5px solid var(--brand-gold)' : '1px solid var(--separator)', borderRadius: '8px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px', cursor: dayPosts.length ? 'pointer' : 'default', minWidth: 0 }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: isToday ? 'var(--brand-dark)' : 'var(--label-secondary)' }}>{day}{isToday ? ' · today' : ''}</span>
        {dayPosts.slice(0, 2).map((post) => (
          <div key={post.id} title={post.title} style={{ background: statusBg(post.status), borderLeft: `3px solid ${statusColor(post.status)}`, padding: '2px 4px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            <img src={post.img} alt="" style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
            <PlatformIcon platform={post.platform} size={9} />
            <span style={{ fontSize: '9px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--label-primary)' }}>{post.title}</span>
          </div>
        ))}
        {dayPosts.length > 2 && <span style={{ fontSize: '9px', color: 'var(--label-secondary)', fontWeight: 600 }}>+{dayPosts.length - 2} more</span>}
      </div>,
    );
  }

  const openPosts = openDate ? visible.filter((p) => p.date === openDate) : [];

  return (
    <div className="liquid-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: 'var(--blue)' }} />
          <button className="btn-icon" aria-label="Previous month" disabled={monthIdx === 0} onClick={() => setMonthIdx(0)} style={{ opacity: monthIdx === 0 ? 0.35 : 1 }}><ChevronLeft size={14} /></button>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, minWidth: '130px', textAlign: 'center' }}>{month.label}</h3>
          <button className="btn-icon" aria-label="Next month" disabled={monthIdx === MONTHS.length - 1} onClick={() => setMonthIdx(1)} style={{ opacity: monthIdx === MONTHS.length - 1 ? 0.35 : 1 }}><ChevronRight size={14} /></button>
          <span style={{ fontSize: '11px', color: 'var(--label-secondary)', marginLeft: '6px' }}>{monthCount} posts</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--fill-tertiary)', padding: '2px', borderRadius: '8px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: filter === f ? 'var(--bg-layer1)' : 'transparent', color: filter === f ? 'var(--blue)' : 'var(--label-secondary)', cursor: 'pointer' }}>{f === 'all' ? 'All' : f}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--label-secondary)', marginBottom: '10px', flexWrap: 'wrap' }}>
        {(['Published', 'Scheduled', 'Planned'] as const).map((s) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: statusColor(s) }} />{s}</span>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '720px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', textAlign: 'center', marginBottom: '6px', fontWeight: 700, fontSize: '11px', color: 'var(--label-tertiary)' }}>
            {weekdays.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px' }}>{cells}</div>
        </div>
      </div>

      {openDate && (
        <div className="spotlight-overlay" style={{ display: 'flex' }} onClick={() => setOpenDate(null)}>
          <div className="spotlight-panel" style={{ maxWidth: '520px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--separator)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} style={{ color: 'var(--blue)' }} /><span style={{ fontWeight: 700, fontSize: '14px' }}>{prettyDate(openDate)}</span></div>
              <button className="btn-icon" onClick={() => setOpenDate(null)}><X size={14} /></button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
              {openPosts.map((post) => (
                <div key={post.id} style={{ display: 'flex', gap: '14px' }}>
                  <img src={post.img} alt={post.title} style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', background: 'var(--bg-layer2)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>{post.title}</h4>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-blue" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><PlatformIcon platform={post.platform} size={10} />{post.platform} · {post.time}</span>
                      <span className={`badge ${post.status === 'Published' ? 'badge-green' : post.status === 'Scheduled' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: '10px' }}>{post.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--label-secondary)', marginTop: '6px' }}>{post.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--separator)' }}>
              <button className="btn-secondary" onClick={() => setOpenDate(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
