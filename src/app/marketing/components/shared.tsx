'use client';

import React from 'react';
import { Share2, MessageCircle } from 'lucide-react';
import type { CalPlatform } from '@/lib/mock/marketingCalendar';

interface IconProps extends React.SVGProps<SVGSVGElement> { size?: number; }

export const InstagramIcon = ({ size = 16, ...p }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
export const YoutubeIcon = ({ size = 16, ...p }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);
export const LinkedinIcon = ({ size = 16, ...p }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);

/** Maps a draft platform label ("Instagram Reels") to the calendar platform key. */
export function toCalPlatform(label: string): CalPlatform {
  const l = label.toLowerCase();
  if (l.includes('instagram')) return 'Instagram';
  if (l.includes('youtube')) return 'YouTube';
  if (l.includes('linkedin')) return 'LinkedIn';
  if (l.includes('pinterest')) return 'Pinterest';
  if (l.includes('whatsapp')) return 'WhatsApp';
  return 'Meta Ads';
}

export function PlatformIcon({ platform, size = 11 }: { platform: string; size?: number }) {
  switch (toCalPlatform(platform)) {
    case 'Instagram': return <InstagramIcon size={size} style={{ color: '#C13584', flexShrink: 0 }} />;
    case 'YouTube': return <YoutubeIcon size={size} style={{ color: '#D93025', flexShrink: 0 }} />;
    case 'LinkedIn': return <LinkedinIcon size={size} style={{ color: '#0A66C2', flexShrink: 0 }} />;
    case 'WhatsApp': return <MessageCircle size={size} style={{ color: '#1E9E5F', flexShrink: 0 }} />;
    case 'Pinterest': return <Share2 size={size} style={{ color: '#C8232C', flexShrink: 0 }} />;
    default: return <Share2 size={size} style={{ color: '#1877F2', flexShrink: 0 }} />;
  }
}

export function nowLabel(): string {
  const d = new Date();
  const mon = d.toLocaleString('en-IN', { month: 'short' });
  const t = d.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  return `${d.getDate()} ${mon}, ${t}`;
}

export const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--label-secondary)' };
export const sectionLabel: React.CSSProperties = { fontSize: '10px', fontWeight: 700, color: 'var(--label-tertiary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' };
