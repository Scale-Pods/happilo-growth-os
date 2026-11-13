'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { INITIAL_CREATORS, inr, type Creator, type CreatorStatus } from '@/lib/mock/marketingCalendar';
import { labelStyle } from './shared';

const STATUSES: CreatorStatus[] = ['Active', 'Brief sent', 'Negotiating', 'Shoot scheduled', 'Content delivered', 'On hold'];
const badgeFor = (s: CreatorStatus) =>
  s === 'Active' ? 'badge-green' : s === 'On hold' ? 'badge-grey' : s === 'Negotiating' ? 'badge-orange' : s === 'Content delivered' ? 'badge-purple' : 'badge-blue';

const NEXT_ACTION: Record<CreatorStatus, { label: string; to: CreatorStatus; note: string } | null> = {
  'Active': { label: 'Send brief', to: 'Brief sent', note: 'Brief sent to' },
  'Brief sent': { label: 'Shoot booked', to: 'Shoot scheduled', note: 'Shoot booked with' },
  'Negotiating': { label: 'Confirm rate', to: 'Active', note: 'Rate confirmed with' },
  'Shoot scheduled': { label: 'Mark delivered', to: 'Content delivered', note: 'Content received from' },
  'Content delivered': { label: 'Back to active', to: 'Active', note: 'Marked active:' },
  'On hold': { label: 'Reactivate', to: 'Active', note: 'Reactivated' },
};

const fmtFollowers = (n: number) => (n >= 100000 ? (n / 100000).toFixed(2) + ' L' : (n / 1000).toFixed(1) + 'K');

export default function CreatorsTab({
  showToast,
  onUseInBrief,
}: {
  showToast: (m: string, t?: string) => void;
  onUseInBrief: (creatorName: string) => void;
}) {
  const [creators, setCreators] = useState<Creator[]>(INITIAL_CREATORS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CreatorStatus>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', handle: '', city: '', niche: '', followers: '', rate: '' });

  const list = useMemo(
    () =>
      creators
        .filter((c) => statusFilter === 'all' || c.status === statusFilter)
        .filter((c) => !query.trim() || (c.name + c.handle + c.niche + c.city).toLowerCase().includes(query.toLowerCase())),
    [creators, query, statusFilter],
  );

  const totalReach = creators.filter((c) => c.status !== 'On hold').reduce((a, c) => a + c.followers, 0);

  const advance = (c: Creator) => {
    const act = NEXT_ACTION[c.status];
    if (!act) return;
    setCreators((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: act.to } : x)));
    showToast(`${act.note} ${c.name.split(' ')[0]}.`, 'success');
  };

  const addCreator = () => {
    const followers = parseInt(form.followers.replace(/,/g, ''), 10);
    const rate = parseInt(form.rate.replace(/,/g, ''), 10);
    if (!form.name.trim() || !form.handle.trim() || !followers) {
      showToast('Name, handle and followers are needed.', 'error');
      return;
    }
    const handle = form.handle.trim().startsWith('@') ? form.handle.trim() : '@' + form.handle.trim();
    setCreators((prev) => [
      { id: `cr-${Date.now()}`, name: form.name.trim(), handle, city: form.city.trim() || '-', niche: form.niche.trim() || 'Food', followers, engagement: 0, ratePerReel: rate || 0, status: 'Negotiating', lastCampaign: '-', next: 'Intro call to be set up' },
      ...prev,
    ]);
    setForm({ name: '', handle: '', city: '', niche: '', followers: '', rate: '' });
    setShowAdd(false);
    showToast('Creator added to the roster.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="metrics-grid">
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--blue)' } as React.CSSProperties}>
          <span className="label">Creators on roster</span><span className="value">{creators.length}</span>
          <span className="trend up">{creators.filter((c) => c.status === 'Active').length} active now</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--teal)' } as React.CSSProperties}>
          <span className="label">Combined followers</span><span className="value">{fmtFollowers(totalReach)}</span>
          <span className="trend up">excluding creators on hold</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--orange)' } as React.CSSProperties}>
          <span className="label">Deliveries awaiting approval</span><span className="value">{creators.filter((c) => c.status === 'Content delivered').length}</span>
          <span className="trend down" style={{ color: 'var(--orange)' }}>review in Approvals</span>
        </div>
        <div className="metric-tile liquid-card" style={{ '--tile-accent-color': 'var(--green)' } as React.CSSProperties}>
          <span className="label">Avg rate per reel</span>
          <span className="value">{inr(creators.filter((c) => c.ratePerReel).reduce((a, c) => a + c.ratePerReel, 0) / Math.max(1, creators.filter((c) => c.ratePerReel).length))}</span>
          <span className="trend up">micro creators, 25K to 150K</span>
        </div>
      </div>

      <div className="liquid-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Creator roster</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--label-tertiary)' }} />
              <input className="input" placeholder="Search name, handle or city" value={query} onChange={(e) => setQuery(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px 7px 28px', width: '210px' }} />
            </div>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | CreatorStatus)} style={{ fontSize: '12px', padding: '7px 8px' }}>
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setShowAdd((v) => !v)}>
              {showAdd ? <X size={12} /> : <Plus size={12} />} {showAdd ? 'Cancel' : 'Add creator'}
            </button>
          </div>
        </div>

        {showAdd && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', background: 'var(--fill-quaternary)', padding: '12px', borderRadius: '10px', marginBottom: '14px', alignItems: 'end' }}>
            {([['name', 'Name'], ['handle', 'Instagram handle'], ['city', 'City'], ['niche', 'Niche'], ['followers', 'Followers'], ['rate', 'Rate per reel (₹)']] as const).map(([k, l]) => (
              <div key={k}>
                <label style={labelStyle}>{l}</label>
                <input className="input" style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <button className="btn-primary" style={{ fontSize: '12px', padding: '8px' }} onClick={addCreator}>Save creator</button>
          </div>
        )}

        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr><th>Creator</th><th>City</th><th>Niche</th><th>Followers</th><th>Engagement</th><th>Rate / reel</th><th>Status</th><th>Last campaign</th><th>Next</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const act = NEXT_ACTION[c.status];
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--label-secondary)' }}>{c.handle}</div>
                    </td>
                    <td>{c.city}</td>
                    <td style={{ maxWidth: '170px' }}>{c.niche}</td>
                    <td>{fmtFollowers(c.followers)}</td>
                    <td>{c.engagement ? c.engagement + '%' : '–'}</td>
                    <td>{c.ratePerReel ? inr(c.ratePerReel) : '–'}</td>
                    <td><span className={`badge ${badgeFor(c.status)}`}>{c.status}</span></td>
                    <td>{c.lastCampaign}</td>
                    <td style={{ maxWidth: '210px', fontSize: '12px', color: 'var(--label-secondary)' }}>{c.next}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}>
                        {act && <button className="btn-secondary btn-sm" onClick={() => advance(c)}>{act.label}</button>}
                        <button className="btn-secondary btn-sm" onClick={() => onUseInBrief(c.name)}>Write brief</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--label-secondary)' }}>No creators match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
