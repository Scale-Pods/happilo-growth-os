'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Send, RefreshCw, Copy } from 'lucide-react';
import { CATALOG, type CatalogItem, type CatalogCategory } from '@/lib/mock/catalog';
import { INITIAL_CREATORS } from '@/lib/mock/marketingCalendar';
import { labelStyle, sectionLabel } from './shared';
import UgcVideoLibrary from './UgcVideoLibrary';

export interface UgcResult {
  product: CatalogItem;
  platform: string;
  angle: string;
  creator: string;
  hooks: string[];
  shots: string[];
  voiceover: string;
  caption: string;
  notes: string[];
}

const PLATFORMS = ['Instagram Reels', 'YouTube Shorts', 'Meta Ads', 'Pinterest', 'WhatsApp Broadcast'];
const ANGLES = ['Everyday snacking', 'Winter evenings', 'Gifting', 'Fitness and protein', 'Kids and lunchbox', 'Office desk'];

const PLATFORM_SPEC: Record<string, { spec: string; cta: string }> = {
  'Instagram Reels': { spec: '9:16, 20 to 30 seconds, natural audio, no stock music.', cta: 'Tap the product tag or the link in bio.' },
  'YouTube Shorts': { spec: '9:16, under 45 seconds, face in the first 2 seconds.', cta: 'Link is in the description.' },
  'Meta Ads': { spec: '9:16 and 4:5 cuts, 15 seconds, price on screen in the first 3 seconds.', cta: 'Shop now on happilo.com.' },
  'Pinterest': { spec: 'Vertical 2:3 still or 8-second loop, text overlay under 8 words.', cta: 'Save this and shop on happilo.com.' },
  'WhatsApp Broadcast': { spec: 'One image and under 60 words. No more than one link.', cta: 'Order on happilo.com.' },
};

const CATEGORY: Record<CatalogCategory, { sensory: string; shot: string; hook: string; avoid: string }> = {
  'Nuts': { sensory: 'the crunch', shot: 'Pour into a steel bowl so the size and shape of each piece shows.', hook: 'Open the pack and listen to it.', avoid: 'No medical or weight-loss claims. Stick to what is on the pack.' },
  'Dry Fruits': { sensory: 'soft, chewy and not sticky', shot: 'Hold one piece to the light, then tear it open.', hook: 'Squeeze one and see what happens.', avoid: 'Do not call it sugar-free. Dried fruit is naturally sweet.' },
  'Dates': { sensory: 'soft and caramel-like', shot: 'Split a date open, pit out, a spoon of ghee or a walnut half inside if you like.', hook: 'Two of these and warm milk is a proper dessert.', avoid: 'Do not call dates sugar-free or suggest they cure anything. Fasting mentions only in Ramadan content.' },
  'Trail Mixes': { sensory: 'a mix of crunchy, chewy and a bit sweet', shot: 'Pour in slow motion, then pick out your favourite piece.', hook: 'I picked out the best piece. Guess which.', avoid: 'Do not name individual ingredient percentages. Say what is in the pack.' },
  'Seeds': { sensory: 'light, nutty and easy to add to anything', shot: 'Sprinkle over curd, a salad or a smoothie bowl, one clean overhead shot.', hook: 'This goes on everything I eat now.', avoid: 'No protein or health numbers unless they are printed on the pack.' },
  'Makhana': { sensory: 'light and crisp', shot: 'Shake the pack, pour into a bowl, show how light it is.', hook: 'Bag of chips or this. You choose.', avoid: 'Do not compare directly with another brand by name.' },
  'Combos': { sensory: 'a big pack for the whole month', shot: 'Open the box on the counter and line everything up.', hook: 'One box, a month of snacking sorted.', avoid: 'Give the per-100g maths only if you checked it against the pack.' },
};

const ANGLE: Record<string, { hook: string; scene: string; line: string }> = {
  'Everyday snacking': { hook: 'The snack drawer rule at my house: nothing goes in unless we finish it.', scene: 'Evening at home, sofa, TV on mute.', line: 'Something I can open at 5 pm without feeling bad about it.' },
  'Winter evenings': { hook: 'It is 7 pm, it is cold, and the biscuit tin is empty. Again.', scene: 'Blanket, chai, soft lamp light.', line: 'Winter snacking should be warm, simple and a little indulgent.' },
  'Gifting': { hook: 'I stopped buying sweets for gifts three years ago. This is what I give instead.', scene: 'Table with a ribbon, gift bag and a handwritten tag.', line: 'It looks good in a box and people actually finish it.' },
  'Fitness and protein': { hook: 'My gym bag has no powder in it. Just this.', scene: 'Bag unzipped on a bench, post-workout.', line: 'Easy to carry, easy to portion, no prep.' },
  'Kids and lunchbox': { hook: 'The only snack that comes back from school with an empty box.', scene: 'Morning rush in the kitchen, lunchbox open.', line: 'Small handful, no mess in the school bag.' },
  'Office desk': { hook: 'The 4 pm slump is not a personality trait. It is a snack problem.', scene: 'Desk, laptop, a half-finished spreadsheet.', line: 'Keeps in the drawer, no crumbs on the keyboard.' },
};

const priceLine = (p: CatalogItem) => `${p.pack}, ₹${p.price.toLocaleString('en-IN')}${p.mrp > p.price ? ` (MRP ₹${p.mrp.toLocaleString('en-IN')})` : ''}`;

export function buildUgc(p: CatalogItem, platform: string, angle: string, creator: string, tone: string, variant: number): UgcResult {
  const cat = CATEGORY[p.category];
  const ang = ANGLE[angle] ?? ANGLE['Everyday snacking'];
  const spec = PLATFORM_SPEC[platform] ?? PLATFORM_SPEC['Instagram Reels'];
  const isCracker = p.name.includes('Nut Cracker');
  const short = p.name.replace(/ with Free Nut Cracker$/, '');
  const saving = p.mrp - p.price;

  const priceHook = saving > 0
    ? `${short}, ${p.pack}, ₹${p.price.toLocaleString('en-IN')}. That is ₹${saving} off the MRP.`
    : `${short}, ${p.pack}, ₹${p.price.toLocaleString('en-IN')}. Worth a look.`;
  const productHook = isCracker ? 'The nut cracker is already in the box. Free.' : cat.hook;
  const pool = [ang.hook, productHook, priceHook];
  const hooks = pool.map((_, i) => pool[(i + variant) % pool.length]).map((h) => `"${h}"`);

  const shots = [
    `Shot 1 (0-3s): ${ang.scene} ${hooks[0].replace(/"/g, '')} Say it straight to camera.`,
    `Shot 2: ${isCracker ? 'Crack one walnut in close-up, natural sound only. Kernel drops into a bowl, show it whole.' : cat.shot}`,
    `Shot 3: Taste it on camera. Say one honest thing about ${cat.sensory}. If you do not like something, say that too.`,
    `Shot 4: Pack in frame with the Happilo logo visible. Price on screen: ${priceLine(p)}.`,
  ];
  if (platform === 'Pinterest') shots.splice(2, 1, 'Shot 3: Hero still of the pack and the food together, daylight, no props that hide the label.');
  if (platform === 'WhatsApp Broadcast') shots.splice(1, 3, `Image: ${p.name} pack on a plain table, daylight, one handful beside it.`);

  const voiceover = `${ang.line} ${short} is ${cat.sensory}${isCracker ? ', and the nut cracker comes free in the pack' : ''}. ${priceLine(p)}. ${spec.cta} Kholo, Khalo, Happilo.`;

  const caption =
    platform === 'WhatsApp Broadcast'
      ? `Hi {first_name}, ${ang.line.toLowerCase()}\n\n${p.name}, ${priceLine(p)}.\n${spec.cta}`
      : `${short}, ${priceLine(p)}. ${ang.line}${tone.trim() ? ' ' + tone.trim().replace(/\.$/, '') + '.' : ''}\n\n#happilo #healthysnacking #${p.category.toLowerCase().replace(/ /g, '')} #kholokhalohappilo`;

  const notes = [
    `Format: ${spec.spec}`,
    `Avoid: ${cat.avoid}`,
    'Pack must show the Happilo logo and the pack size. Price only as listed on happilo.com on the day of posting.',
    'Share the raw footage within 5 days of shoot. One round of edits is included in the fee.',
  ];
  if (creator) notes.unshift(`Creator: ${creator}. Write it in your own words, use this as a guide not a script.`);

  return { product: p, platform, angle, creator, hooks, shots, voiceover, caption, notes };
}

export function ugcToScriptText(u: UgcResult): string {
  return `Product: ${u.product.name} (${priceLine(u.product)})\nAngle: ${u.angle}${u.creator ? `\nCreator: ${u.creator}` : ''}\n\nHooks:\n${u.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\nShots:\n${u.shots.join('\n')}\n\nVoiceover:\n"${u.voiceover}"\n\nCaption:\n${u.caption}\n\nNotes:\n${u.notes.map((n) => '- ' + n).join('\n')}`;
}

export default function UgcTab({
  showToast,
  onSave,
  presetCreator,
}: {
  showToast: (m: string, t?: string) => void;
  onSave: (u: UgcResult) => void;
  presetCreator: string;
}) {
  const [sku, setSku] = useState('Happilo_Californian_walnuts_200g_1PK');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [angle, setAngle] = useState('Winter evenings');
  const [creator, setCreator] = useState('');
  const [tone, setTone] = useState('');
  const [variant, setVariant] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UgcResult | null>(null);

  useEffect(() => { if (presetCreator) setCreator(presetCreator); }, [presetCreator]);

  const grouped = useMemo(() => {
    const m = new Map<string, CatalogItem[]>();
    CATALOG.forEach((c) => m.set(c.category, [...(m.get(c.category) ?? []), c]));
    return Array.from(m.entries());
  }, []);
  const product = CATALOG.find((c) => c.sku === sku) ?? CATALOG[0];

  const generate = (nextVariant: number) => {
    setBusy(true);
    setVariant(nextVariant);
    window.setTimeout(() => {
      setResult(buildUgc(product, platform, angle, creator, tone, nextVariant));
      setBusy(false);
      showToast('Brief ready. Read it through before sending to the pipeline.', 'success');
    }, 500);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(ugcToScriptText(result));
      showToast('Brief copied.', 'success');
    } catch {
      showToast('Could not copy. Select the text and copy it manually.', 'error');
    }
  };

  return (
    <>
    <UgcVideoLibrary />
    <div className="split-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
      <div className="liquid-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} style={{ color: 'var(--brand-gold)' }} /> Creator brief builder
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--label-secondary)', margin: '0 0 14px' }}>Pick a product from the catalogue and get hooks, a shot list and a caption you can send to a creator.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--fill-quaternary)', padding: '8px', borderRadius: '8px' }}>
            <img src={product.image ?? '/brand/happilo-mark.png'} alt="" style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', background: '#fff' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.3 }}>{product.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--label-secondary)' }}>{priceLine(product)}</div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Product</label>
            <select className="input" style={{ width: '100%', padding: '7px 8px', fontSize: '12px' }} value={sku} onChange={(e) => setSku(e.target.value)}>
              {grouped.map(([cat, items]) => (
                <optgroup key={cat} label={cat}>
                  {items.map((i) => <option key={i.sku} value={i.sku}>{i.name} ({i.pack})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Platform</label>
            <select className="input" style={{ width: '100%', padding: '7px 8px', fontSize: '12px' }} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Angle</label>
            <select className="input" style={{ width: '100%', padding: '7px 8px', fontSize: '12px' }} value={angle} onChange={(e) => setAngle(e.target.value)}>
              {ANGLES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Creator (optional)</label>
            <select className="input" style={{ width: '100%', padding: '7px 8px', fontSize: '12px' }} value={creator} onChange={(e) => setCreator(e.target.value)}>
              <option value="">Not assigned</option>
              {INITIAL_CREATORS.map((c) => <option key={c.id} value={c.name}>{c.name} ({c.handle})</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Extra line for the caption (optional)</label>
            <input className="input" style={{ width: '100%', padding: '7px 10px', fontSize: '12px' }} value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. Free nut cracker inside" />
          </div>
          <button className="btn-primary" onClick={() => generate(0)} disabled={busy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}>
            {busy ? <><RefreshCw size={13} className="animate-spin" /> Writing...</> : <><Sparkles size={13} /> Write the brief</>}
          </button>
        </div>
      </div>

      {result ? (
        <div className="liquid-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <img src={result.product.image ?? '/brand/happilo-mark.png'} alt="" style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', background: '#fff', border: '1px solid var(--separator)' }} />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>{result.product.name}</h3>
                <span className="badge badge-blue" style={{ fontSize: '10px' }}>{result.platform}</span>{' '}
                <span className="badge badge-grey" style={{ fontSize: '10px' }}>{result.angle}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ fontSize: '12px', display: 'flex', gap: '5px', alignItems: 'center' }} onClick={copy}><Copy size={12} /> Copy</button>
              <button className="btn-secondary" style={{ fontSize: '12px', display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => generate(variant + 1)} disabled={busy}><RefreshCw size={12} /> Another take</button>
              <button className="btn-primary" style={{ fontSize: '12px', display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => { onSave(result); setResult(null); }}><Send size={12} /> Save to pipeline</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={sectionLabel}>Hook options</div>
              {result.hooks.map((h, i) => (
                <div key={i} style={{ background: 'var(--fill-quaternary)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '6px', borderLeft: '3px solid var(--brand-gold)' }}>{h}</div>
              ))}
            </div>
            <div>
              <div style={sectionLabel}>Shot list</div>
              {result.shots.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '6px', alignItems: 'flex-start' }}>
                  <span style={{ background: 'var(--blue)', color: '#fff', borderRadius: '4px', padding: '1px 6px', fontSize: '9px', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>{i + 1}</span>
                  <span style={{ color: 'var(--label-secondary)', lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={sectionLabel}>Voiceover</div>
              <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '8px', fontSize: '12px', lineHeight: 1.6, color: 'var(--label-secondary)', borderLeft: '3px solid var(--green)' }}>&ldquo;{result.voiceover}&rdquo;</div>
            </div>
            <div>
              <div style={sectionLabel}>Caption</div>
              <div style={{ background: 'var(--fill-quaternary)', padding: '14px', borderRadius: '8px', fontSize: '12px', lineHeight: 1.6, color: 'var(--label-secondary)', whiteSpace: 'pre-line' }}>{result.caption}</div>
            </div>
            <div>
              <div style={sectionLabel}>Brief notes</div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--label-secondary)', lineHeight: 1.6 }}>
                {result.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="liquid-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--label-tertiary)', minHeight: '300px', gap: '12px' }}>
          <Sparkles size={32} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: '13px', margin: 0, textAlign: 'center' }}>Choose a product, platform and angle, then write the brief.</p>
        </div>
      )}
    </div>
    </>
  );
}
