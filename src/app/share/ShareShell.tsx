import React from 'react';

export const SHARE_FONT = '"Montserrat", "Gotham", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

/** Page frame for the public read-only share links: pale page, white card, green header with the Happilo logo. */
export function ShareShell({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100vh',
        background: '#F3F6F2',
        color: 'rgba(0,0,0,0.88)',
        fontFamily: SHARE_FONT,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '20px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: '740px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(60,60,67,0.12)',
            borderRadius: '18px',
            boxShadow: '0 4px 18px rgba(12,62,51,0.08)',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#00523B',
              padding: '14px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/happilo-logo-white.png" alt="Happilo" style={{ height: '28px', width: 'auto', display: 'block' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Shared conversation
            </span>
          </div>
          {children}
        </div>
        {footer && (
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: 'rgba(60,60,67,0.6)', flexShrink: 0 }}>
            Read-only view shared by the Happilo B2B team · care@happilo.com · +91 88844 84000
          </div>
        )}
      </div>
    </div>
  );
}

/** Friendly "nothing here" state for a share link that cannot be resolved. */
export function ShareNotFound({ title, message }: { title: string; message: string }) {
  return (
    <ShareShell footer={false}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '380px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0C3E33', marginBottom: '8px' }}>{title}</div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(60,60,67,0.75)', margin: 0 }}>{message}</p>
          <p style={{ fontSize: '12px', color: 'rgba(60,60,67,0.55)', marginTop: '16px', marginBottom: 0 }}>
            Need help? Write to care@happilo.com or call +91 88844 84000.
          </p>
        </div>
      </div>
    </ShareShell>
  );
}
