'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, RefreshCw, ChevronDown, X, Star, Building2, Clock, UploadCloud, FileSpreadsheet } from 'lucide-react';
import { useAppContext } from '../../ClientWrapper';
import { isWithinDateRange } from '@/lib/dateRangeFilter';
import type { Lead } from '@/lib/data/b2bCrm';
import { categoryLabel } from '@/lib/data/b2bCrm';

/** Sample build: searches and uploads are simulated on this device. */
const demoRequest = async (): Promise<{ ok: boolean; status: number }> => {
  await new Promise((r) => setTimeout(r, 600));
  return { ok: true, status: 200 };
};

const QUERY_OPTIONS = [
  'Dry Fruit Shop',
  'Gifting Store',
  'Supermarket',
  'Kirana Store',
  'Wholesale Dry Fruits',
  'Corporate Gift Supplier',
  'Hotel & Resort',
  'Cafe & Bakery',
  'FMCG Distributor',
];

interface RunGroup {
  key: string;
  region: string;
  date: string; // yyyy-mm-dd
  leads: Lead[];
  latestCreatedAt: string;
  categories: Record<string, number>;
  avgRating: number | null;
}

function groupIntoRuns(leads: Lead[]): RunGroup[] {
  const groups = new Map<string, RunGroup>();

  for (const s of leads) {
    const day = s.created_at ? s.created_at.slice(0, 10) : 'unknown';
    const region = s.region || 'Unknown city';
    const week = s.created_at ? Math.floor(new Date(s.created_at).getTime() / (7 * 86_400_000)) : 0;
    const key = `${region}__${week}`;

    let group = groups.get(key);
    if (!group) {
      group = { key, region, date: day, leads: [], latestCreatedAt: s.created_at, categories: {}, avgRating: null };
      groups.set(key, group);
    }
    group.leads.push(s);
    if (s.created_at > group.latestCreatedAt) {
      group.latestCreatedAt = s.created_at;
      group.date = day;
    }
    const cat = s.category || 'other';
    group.categories[cat] = (group.categories[cat] || 0) + 1;
  }

  for (const group of groups.values()) {
    const rated = group.leads.filter((s) => s.google_rating != null);
    group.avgRating = rated.length > 0 ? rated.reduce((sum, s) => sum + (s.google_rating || 0), 0) / rated.length : null;
  }

  return Array.from(groups.values()).sort((a, b) => (b.latestCreatedAt > a.latestCreatedAt ? 1 : -1));
}

export default function ScraperClient({ initialLeads }: { initialLeads: Lead[] }) {
  const { showToast, dateRange } = useAppContext();

  const [region, setRegion] = useState('');
  const [queries, setQueries] = useState<string[]>([]);
  const [maxResults, setMaxResults] = useState(20);
  const [queryDropdownOpen, setQueryDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // Position the fixed dropdown from the trigger's viewport rect. Recomputed
  // on open, and on scroll/resize while open.
  useLayoutEffect(() => {
    if (!queryDropdownOpen) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = Math.min(Math.max(r.width, 220), window.innerWidth - 16);
      const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
      setMenuRect({ top: r.bottom + 6, left, width: w });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [queryDropdownOpen]);

  useEffect(() => {
    if (!queryDropdownOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQueryDropdownOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [queryDropdownOpen]);

  const toggleQuery = (q: string) => {
    setQueries((prev) => (prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]));
  };

  const canSubmit = region.trim().length > 0 && queries.length > 0 && maxResults > 0 && !submitting;

  const runScraper = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await demoRequest();
      if (!res.ok) throw new Error(`Request returned ${res.status}`);
      showToast(
        `Search started for "${region}" with ${queries.length} ${queries.length === 1 ? 'search' : 'searches'}, up to ${maxResults} places each. New leads will show up below once it finishes.`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not start the search. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('data', file, file.name);
      formData.append('region', region.trim() || 'csv_upload');

      const res = await demoRequest();
      if (!res.ok) throw new Error(`Request returned ${res.status}`);
      showToast(`"${file.name}" uploaded. The leads will show up here shortly.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not upload that file. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const dateFilteredLeads = useMemo(
    () => initialLeads.filter((s) => isWithinDateRange(s.created_at, dateRange)),
    [initialLeads, dateRange]
  );

  const runs = useMemo(() => groupIntoRuns(dateFilteredLeads), [dateFilteredLeads]);

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Google Maps Lead Finder</h2>
        <p style={{ fontSize: '13px', color: 'var(--label-secondary)', marginTop: '4px', marginBottom: 0 }}>
          Find shops, hotels, cafes and gifting businesses near a locality. Pick an area, choose what to search for and how many places you want, then start the search.
        </p>
      </div>

      <div className="liquid-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px' }}>
              Area or city
            </label>
            <input
              type="text"
              className="input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Koramangala, Bengaluru"
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px' }}>
              What to search for
            </label>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setQueryDropdownOpen((v) => !v)}
              className="input"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                background: queryDropdownOpen ? 'var(--fill-tertiary)' : undefined,
              }}
            >
              <span style={{ color: queries.length === 0 ? 'var(--label-tertiary)' : 'var(--label-primary)' }}>
                {queries.length === 0 ? 'Choose one or more...' : `${queries.length} chosen`}
              </span>
              <ChevronDown size={14} style={{ transform: queryDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease', flexShrink: 0 }} />
            </button>

            {queries.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {queries.map((q) => (
                  <span
                    key={q}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: 'rgba(31, 175, 116, 0.14)',
                      color: 'var(--blue)',
                    }}
                  >
                    {q}
                    <button
                      type="button"
                      onClick={() => toggleQuery(q)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', display: 'flex', padding: 0 }}
                      aria-label={`Remove ${q}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {queryDropdownOpen &&
            menuRect &&
            createPortal(
              <>
                <div
                  onClick={() => setQueryDropdownOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 4000 }}
                />
                <div
                  role="listbox"
                  aria-multiselectable
                  style={{
                    position: 'fixed',
                    top: menuRect.top,
                    left: menuRect.left,
                    width: menuRect.width,
                    minWidth: '220px',
                    zIndex: 4001,
                    padding: '6px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    borderRadius: '12px',
                    background: 'var(--bg-layer1, #ffffff)',
                    border: '1px solid var(--separator)',
                    boxShadow: '0 20px 50px rgba(12,62,51,0.22)',
                  }}
                >
                  {QUERY_OPTIONS.map((q) => {
                    const checked = queries.includes(q);
                    return (
                      <button
                        key={q}
                        type="button"
                        role="option"
                        aria-selected={checked}
                        onClick={() => toggleQuery(q)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '10px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: checked ? 700 : 500,
                          textAlign: 'left',
                          border: 'none',
                          userSelect: 'none',
                          color: 'var(--label-primary)',
                          background: checked ? 'rgba(31, 175, 116, 0.16)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!checked) e.currentTarget.style.background = 'var(--fill-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = checked ? 'rgba(31, 175, 116, 0.16)' : 'transparent';
                        }}
                      >
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            flexShrink: 0,
                            borderRadius: '5px',
                            border: `1.5px solid ${checked ? 'var(--blue)' : 'var(--separator-opaque, #888)'}`,
                            background: checked ? 'var(--blue)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        {q}
                      </button>
                    );
                  })}
                </div>
              </>,
              document.body
            )}

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-secondary)', display: 'block', marginBottom: '6px' }}>
              Places to find (for each search)
            </label>
            <input
              type="number"
              min={1}
              max={500}
              className="input"
              value={maxResults}
              onChange={(e) => setMaxResults(Math.max(1, parseInt(e.target.value) || 0))}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <button
              className="btn-primary"
              onClick={runScraper}
              disabled={!canSubmit}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 20px', width: '100%' }}
            >
              {submitting ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
              {submitting ? 'Starting...' : 'Find leads'}
            </button>
          </div>
        </div>

        {queries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--separator)' }}>
            {queries.map((q) => (
              <span
                key={q}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(31, 175, 116, 0.1)',
                  color: 'var(--blue)',
                  border: '1px solid rgba(31, 175, 116, 0.2)',
                }}
              >
                {q}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => toggleQuery(q)} />
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--separator)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={16} style={{ color: 'var(--label-tertiary)' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--label-primary)' }}>Upload your own list (Excel or CSV)</div>
              <div style={{ fontSize: '11.5px', color: 'var(--label-tertiary)' }}>
                Any sheet with company name and phone columns works. New leads get the same follow-up messages, and repeats are matched by phone number.
              </div>
            </div>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelected}
              style={{ display: 'none' }}
            />
            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px' }}
            >
              {uploading ? <RefreshCw className="animate-spin" size={14} /> : <UploadCloud size={14} />}
              {uploading ? 'Uploading...' : 'Upload file'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--label-primary)', margin: 0 }}>Earlier searches</h3>
        <span style={{ fontSize: '12px', color: 'var(--label-tertiary)' }}>
          {runs.length} {runs.length === 1 ? 'search' : 'searches'} · {dateFilteredLeads.length} leads found, for the dates picked at the top
        </span>
      </div>

      {runs.length === 0 ? (
        <div className="liquid-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '13px' }}>
          No searches in the selected dates yet.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {runs.map((run) => {
            const topCategories = Object.entries(run.categories)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);
            return (
              <div key={run.key} className="liquid-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(0, 82, 59, 0.08)', padding: '8px', borderRadius: '10px', color: 'var(--brand)' }}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--label-primary)', }}>{run.region}</div>
                      <div style={{ fontSize: '11px', color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={10} />
                        {new Date(run.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-blue" style={{ fontSize: '10px', padding: '4px 10px' }}>
                    {run.leads.length} {run.leads.length === 1 ? 'lead' : 'leads'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', padding: '10px 0', borderTop: '1px solid var(--separator)', borderBottom: '1px solid var(--separator)', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={13} style={{ color: 'var(--label-tertiary)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>{Object.keys(run.categories).length} business types</span>
                  </div>
                  {run.avgRating != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star size={13} style={{ color: 'var(--yellow)' }} />
                      <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>{run.avgRating.toFixed(1)} average rating</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {topCategories.map(([cat, count]) => (
                    <span
                      key={cat}
                      style={{
                        fontSize: '10.5px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        background: 'var(--fill-quaternary)',
                        color: 'var(--label-secondary)',
                      }}
                    >
                      {categoryLabel(cat)} · {count}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
