import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../ctx';
import { hasApi } from '../store';
import { Icon } from '../components/Icons';
import { saveBlob } from '../utils/export';

const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const PALETTES = {
  Ocean: ['#0ea5e9', '#2563eb', '#1e3a8a', '#e0f2fe'], Sunset: ['#f97316', '#ef4444', '#a21caf', '#fde68a'],
  Forest: ['#16a34a', '#065f46', '#a3e635', '#ecfccb'], Candy: ['#ec4899', '#8b5cf6', '#06b6d4', '#fdf2f8'], Mono: ['#111827', '#4b5563', '#9ca3af', '#f3f4f6'],
};
const STYLES = ['Gradient', 'Mesh', 'Geometric', 'Waves', 'Dots', 'Rings'];
const SIZES = { 'Square 1080×1080': [1080, 1080], 'Wide 1920×1080': [1920, 1080], 'Story 1080×1920': [1080, 1920], 'Banner 1200×630': [1200, 630] };

function draw(ctx, W, H, style, pal, seed, text) {
  const r = rng(seed);
  ctx.clearRect(0, 0, W, H);
  const pick = () => pal[Math.floor(r() * 3)];
  if (style === 'Gradient') {
    const a = r() * Math.PI * 2, cx = W / 2, cy = H / 2, L = Math.hypot(W, H) / 2;
    const g = ctx.createLinearGradient(cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
    g.addColorStop(0, pal[0]); g.addColorStop(0.5, pal[1]); g.addColorStop(1, pal[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (style === 'Mesh') {
    ctx.fillStyle = pal[3]; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 7; i++) {
      const x = r() * W, y = r() * H, rad = (0.3 + r() * 0.5) * Math.max(W, H), c = pick();
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, c + 'dd'); g.addColorStop(1, c + '00');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  } else if (style === 'Geometric') {
    ctx.fillStyle = pal[3]; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 45; i++) {
      const x = r() * W, y = r() * H, s = (0.05 + r() * 0.2) * Math.min(W, H);
      ctx.fillStyle = pick() + 'cc'; ctx.beginPath();
      const k = Math.floor(r() * 3);
      if (k === 0) { ctx.moveTo(x, y); ctx.lineTo(x + s, y); ctx.lineTo(x + s / 2, y - s); ctx.closePath(); }
      else if (k === 1) ctx.rect(x, y, s, s);
      else ctx.arc(x, y, s / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'Waves') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[3]); g.addColorStop(1, pal[0]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let l = 0; l < 6; l++) {
      const base = H * (0.3 + l * 0.12), amp = 30 + r() * 60, f = 0.002 + r() * 0.004, ph = r() * 6;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base + Math.sin(x * f + ph) * amp);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = pal[l % 3] + '99'; ctx.fill();
    }
  } else if (style === 'Dots') {
    ctx.fillStyle = pal[2]; ctx.fillRect(0, 0, W, H);
    const step = Math.max(W, H) / 22;
    for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
      ctx.fillStyle = [pal[0], pal[1], pal[3]][Math.floor(r() * 3)]; ctx.beginPath(); ctx.arc(x, y, r() * step * 0.42, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    ctx.fillStyle = pal[3]; ctx.fillRect(0, 0, W, H);
    for (let c = 0; c < 4; c++) {
      const x = r() * W, y = r() * H; ctx.lineWidth = 6 + r() * 10; ctx.strokeStyle = pick() + 'cc';
      for (let i = 1; i < 12; i++) { ctx.beginPath(); ctx.arc(x, y, i * Math.min(W, H) * 0.06, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
  if (text) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(Math.min(W, H) / 8)}px Inter, sans-serif`; ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 20; ctx.fillText(text, W / 2, H / 2, W * 0.9); ctx.restore();
  }
}

export default function ImageGen() {
  const { t, toast } = useApp();
  const [tab, setTab] = useState('design');
  const [style, setStyle] = useState('Mesh');
  const [pal, setPal] = useState('Ocean');
  const [size, setSize] = useState('Square 1080×1080');
  const [seed, setSeed] = useState(7);
  const [text, setText] = useState('');
  const cv = useRef(null);


  const [prompt, setPrompt] = useState('A cozy classroom with warm sunlight, watercolor style');
  const [look, setLook] = useState('digital art');
  const [engine, setEngine] = useState('pollinations');
  const [aiUrl, setAiUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'design') return;
    const [W, H] = SIZES[size]; const c = cv.current; c.width = W; c.height = H;
    draw(c.getContext('2d'), W, H, style, PALETTES[pal], seed, text);
  }, [tab, style, pal, size, seed, text]);

  const dlDesign = async (type) => {
    const blob = await new Promise((r) => cv.current.toBlob(r, type === 'jpg' ? 'image/jpeg' : 'image/png', 0.95));
    saveBlob(blob, `design-${style.toLowerCase()}-${seed}.${type}`);
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setAiUrl('');
    const [W, H] = SIZES[size];
    try {
      if (engine === 'backend') {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const r = await fetch(base + '/api/ai/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `${prompt}, ${look}`, size: `${W}x${H}` }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'AI request failed');
        setAiUrl(j.b64 ? 'data:image/png;base64,' + j.b64 : j.url);
      } else {
        // Free third-party service, no key, runs straight from the browser.
        setAiUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', ' + look)}?width=${W}&height=${H}&seed=${seed}&nologo=true`);
      }
    } catch (e) { toast(e.message); setLoading(false); }
  };

  const dlAi = async () => {
    try { saveBlob(await (await fetch(aiUrl)).blob(), `ai-image-${seed}.png`); }
    catch { window.open(aiUrl, '_blank'); }
  };

  return (
    <div className="page studio">
      <aside className="panel form">
        <h2><Icon name="sparkles" /> {t('AI Image Generator')}</h2>
        <div className="row" style={{ marginBottom: 8 }}>
          <button className={'btn sm' + (tab === 'design' ? '' : ' ghost')} onClick={() => setTab('design')}>Designs</button>
          <button className={'btn sm' + (tab === 'ai' ? '' : ' ghost')} onClick={() => setTab('ai')}>AI from prompt</button>
        </div>
        <div className="field"><label>Size</label><select value={size} onChange={(e) => setSize(e.target.value)}>{Object.keys(SIZES).map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="field"><label>Seed</label>
          <div className="row"><input type="number" value={seed} onChange={(e) => setSeed(+e.target.value || 0)} /><button className="btn ghost sm" onClick={() => setSeed(Math.floor(Math.random() * 99999))} title="Random seed"><Icon name="shuffle" className="sm" /></button></div>
        </div>
        {tab === 'design' ? (
          <>
            <div className="field"><label>Design</label><select value={style} onChange={(e) => setStyle(e.target.value)}>{STYLES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Palette</label><select value={pal} onChange={(e) => setPal(e.target.value)}>{Object.keys(PALETTES).map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Text on image (optional)</label><input value={text} onChange={(e) => setText(e.target.value)} /></div>
          </>
        ) : (
          <>
            <div className="field"><label>Describe the image</label><textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></div>
            <div className="field"><label>Look</label><select value={look} onChange={(e) => setLook(e.target.value)}>{['digital art', 'photo, realistic', 'anime', '3D render', 'flat vector illustration', 'logo design'].map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Engine</label>
              <select value={engine} onChange={(e) => setEngine(e.target.value)}>
                <option value="pollinations">Free (pollinations.ai — browser only)</option>
                {hasApi && <option value="backend">My backend (private API key)</option>}
              </select>
            </div>
            <button className="btn block" disabled={loading} onClick={generate}>{loading ? 'Generating…' : <><Icon name="sparkles" className="sm" /> {t('Generate')}</>}</button>
            <div className="muted">The free engine sends your prompt to pollinations.ai. Quality and availability aren’t guaranteed.</div>
          </>
        )}
      </aside>
      <main className="stage">
        {tab === 'design' ? (
          <>
            <div className="actions"><button className="btn" onClick={() => dlDesign('png')}><Icon name="download" className="sm" /> PNG</button><button className="btn ghost" onClick={() => dlDesign('jpg')}><Icon name="download" className="sm" /> JPG</button><button className="btn ghost" onClick={() => setSeed(Math.floor(Math.random() * 99999))}><Icon name="shuffle" className="sm" /> Shuffle</button></div>
            <div className="preview" style={{ textAlign: 'center' }}><canvas ref={cv} /></div>
          </>
        ) : (
          <>
            {aiUrl && <div className="actions"><button className="btn" onClick={dlAi}><Icon name="download" className="sm" /> Download</button></div>}
            <div className="preview" style={{ textAlign: 'center', minHeight: 200 }}>
              {aiUrl ? <img src={aiUrl} alt="AI result" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 10 }} onLoad={() => setLoading(false)} onError={() => { setLoading(false); toast('Image failed to load — try again'); }} /> : <p className="muted">Your AI image will appear here.</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
