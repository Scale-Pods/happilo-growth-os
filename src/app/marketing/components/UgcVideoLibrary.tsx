'use client';

import React, { useState } from 'react';
import { Play, X, Film } from 'lucide-react';
import { UGC_VIDEOS, type UgcVideo } from '@/lib/mock/ugcVideos';
import { sectionLabel } from './shared';

const STATUS_BADGE: Record<UgcVideo['status'], string> = {
  'Raw footage': 'badge-grey',
  'In edit': 'badge-orange',
  Approved: 'badge-green',
  Live: 'badge-blue',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Grid of creator videos served from /public/ugc. Slots with no file are hidden. */
export default function UgcVideoLibrary() {
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<UgcVideo | null>(null);
  const visible = UGC_VIDEOS.filter((v) => !missing[v.id]);

  return (
    <div className="liquid-card" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ ...sectionLabel, marginBottom: '2px' }}>Creator videos</div>
          <div style={{ fontSize: '11.5px', color: 'var(--label-secondary)' }}>
            Footage received from creators. Replace any file in the <b>public/ugc</b> folder (ugc-1.mp4 to ugc-6.mp4) and it shows up here.
          </div>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--label-tertiary)' }}>{visible.length} video{visible.length === 1 ? '' : 's'}</span>
      </div>

      {visible.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--label-tertiary)', fontSize: '12px', padding: '14px 4px' }}>
          <Film size={18} /> No videos uploaded yet. Add .mp4 files to public/ugc to see them here.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
          {visible.map((v) => (
            <div key={v.id} style={{ border: '1px solid var(--separator)', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
              <div onClick={() => setOpen(v)} style={{ position: 'relative', aspectRatio: '9 / 16', maxHeight: '300px', background: '#0C3E33', cursor: 'pointer' }}>
                <video
                  src={`${v.file}#t=0.5`}
                  muted
                  playsInline
                  preload="metadata"
                  onError={() => setMissing((m) => ({ ...m, [v.id]: true }))}
                  onMouseEnter={(e) => { e.currentTarget.play().catch(() => {}); }}
                  onMouseLeave={(e) => { e.currentTarget.pause(); }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ position: 'absolute', right: '8px', bottom: '8px', background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '999px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={13} />
                </div>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--label-secondary)', marginTop: '3px' }}>{v.creator} <span style={{ color: 'var(--label-tertiary)' }}>{v.handle}</span></div>
                <div style={{ fontSize: '10.5px', color: 'var(--label-tertiary)', marginTop: '2px' }}>{v.product}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span className={`badge ${STATUS_BADGE[v.status]}`} style={{ fontSize: '9.5px' }}>{v.status}</span>
                  <span style={{ fontSize: '10px', color: 'var(--label-tertiary)' }}>{v.platform} · {fmtDate(v.uploaded)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(12,30,24,0.78)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', background: '#fff', borderRadius: '14px', padding: '12px', maxHeight: '92vh', maxWidth: '420px', width: '100%' }}>
            <button onClick={() => setOpen(null)} aria-label="Close" style={{ position: 'absolute', top: '-12px', right: '-12px', width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#00523B', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            <video src={open.file} controls autoPlay playsInline style={{ width: '100%', maxHeight: '76vh', borderRadius: '8px', background: '#000', display: 'block' }} />
            <div style={{ padding: '10px 4px 2px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{open.title}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--label-secondary)' }}>{open.creator} {open.handle} · {open.product}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
