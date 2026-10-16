import React, { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useApp } from '../ctx';
import { Icon } from '../components/Icons';
import { fileToDataUrl, loadImage } from '../utils/image';
import { saveBlob } from '../utils/export';

// Pixel sizes at 300 dpi where a print size is involved.
const PRESETS = [
  { id: 'passport', name: 'Passport / CNIC 35×45 mm', w: 413, h: 531 },
  { id: 'us', name: 'US / Visa 2×2 in', w: 600, h: 600 },
  { id: 'stamp', name: 'Stamp size 20×25 mm', w: 236, h: 295 },
  { id: 'ig', name: 'Instagram Post 1080×1080', w: 1080, h: 1080 },
  { id: 'igs', name: 'Instagram Story 1080×1920', w: 1080, h: 1920 },
  { id: 'li', name: 'LinkedIn Profile 800×800', w: 800, h: 800 },
  { id: 'lib', name: 'LinkedIn Banner 1584×396', w: 1584, h: 396 },
  { id: 'fb', name: 'Facebook Profile 720×720', w: 720, h: 720 },
  { id: 'fbc', name: 'Facebook Cover 1640×624', w: 1640, h: 624 },
  { id: 'wa', name: 'WhatsApp DP 640×640', w: 640, h: 640 },
];
const COLORS = ['#ffffff', '#cfe8ff', '#1e5aa8', '#c62828', '#d9d9d9', '#f5e6d3'];

export default function PhotoStudio() {
  const { t, plan, toast } = useApp();
  const [orig, setOrig] = useState(null);
  const [img, setImg] = useState(null);
  const [bg, setBg] = useState('#ffffff');
  const [preset, setPreset] = useState('passport');
  const [zoom, setZoom] = useState(1);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [mode, setMode] = useState('single');
  const [copies, setCopies] = useState(6);
  const [wm, setWm] = useState('');
  const [info, setInfo] = useState({ org: 'Green Valley School', name: 'Ayesha Khan', role: 'Student — Class 10', idNo: '2026-0145' });
  const [busy, setBusy] = useState('');
  const cv = useRef(null);
  const P = PRESETS.find((p) => p.id === preset);

  const tile = (W, H) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    if (img) {
      const s = Math.max(W / img.width, H / img.height) * zoom;
      const w = img.width * s, h = img.height * s;
      x.drawImage(img, (W - w) / 2 + ox * W, (H - h) / 2 + oy * H, w, h);
    }
    return c;
  };

  const build = () => {
    let out;
    if (mode === 'single') {
      out = tile(P.w, P.h);
    } else if (mode === 'sheet') {
      // 4x6 inch print sheet at 300 dpi with N copies of the chosen photo
      const [pw, ph] = P.w <= 1100 && P.h <= 1700 ? [P.w, P.h] : [413, 531];
      out = document.createElement('canvas'); out.width = 1200; out.height = 1800;
      const x = out.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1200, 1800);
      const gap = 20;
      const cols = Math.max(1, Math.floor((1200 - 40 + gap) / (pw + gap)));
      const rows = Math.max(1, Math.floor((1800 - 40 + gap) / (ph + gap)));
      const n = Math.min(copies, cols * rows);
      const usedCols = Math.min(cols, n), usedRows = Math.ceil(n / cols);
      const sx = (1200 - (usedCols * pw + (usedCols - 1) * gap)) / 2;
      const sy = (1800 - (usedRows * ph + (usedRows - 1) * gap)) / 2;
      const t0 = tile(pw, ph);
      for (let i = 0; i < n; i++) {
        const cx = sx + (i % cols) * (pw + gap), cy = sy + Math.floor(i / cols) * (ph + gap);
        x.drawImage(t0, cx, cy);
        x.strokeStyle = '#bbb'; x.lineWidth = 1; x.strokeRect(cx, cy, pw, ph);
      }
    } else {
      // photo inside an ID-card layout (85.6 x 54 mm at 300 dpi)
      out = document.createElement('canvas'); out.width = 1011; out.height = 638;
      const x = out.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, 1011, 638);
      x.fillStyle = '#1d4ed8'; x.fillRect(0, 0, 1011, 110);
      x.fillStyle = '#fff'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.fillText(info.org, 505, 70);
      x.drawImage(tile(330, 424), 50, 150);
      x.strokeStyle = '#1d4ed8'; x.lineWidth = 6; x.strokeRect(50, 150, 330, 424);
      x.textAlign = 'left'; x.fillStyle = '#111';
      x.font = 'bold 56px sans-serif'; x.fillText(info.name, 420, 250);
      x.fillStyle = '#1d4ed8'; x.font = '600 38px sans-serif'; x.fillText(info.role, 420, 315);
      x.fillStyle = '#475569'; x.font = '36px sans-serif'; x.fillText('ID: ' + info.idNo, 420, 385);
      x.fillStyle = '#1d4ed8'; x.fillRect(0, 618, 1011, 20);
    }
    const ctx = out.getContext('2d');
    if (wm) {
      ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
      ctx.font = `bold ${Math.round(out.width / 9)}px sans-serif`; ctx.textAlign = 'center';
      ctx.translate(out.width / 2, out.height / 2); ctx.rotate(-Math.PI / 6); ctx.fillText(wm, 0, 0); ctx.restore();
    }
    if (plan !== 'pro') {
      const fs = Math.max(14, Math.round(out.width / 40));
      ctx.font = `${fs}px sans-serif`; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillText('Made with BuilderHub', out.width - 10, out.height - 10);
    }
    return out;
  };

  useEffect(() => {
    const c = build(); const o = cv.current;
    o.width = c.width; o.height = c.height; o.getContext('2d').drawImage(c, 0, 0);
  }, [img, bg, preset, zoom, ox, oy, mode, copies, wm, info, plan]);

  const onFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const url = await fileToDataUrl(file, 1600);
    const im = await loadImage(url);
    setOrig(im); setImg(im); setZoom(1); setOx(0); setOy(0);
  };

  const removeBg = async () => {
    if (!orig) return;
    try {
      setBusy('Removing background… the first run downloads an AI model (~40 MB), then it works offline.');
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await (await fetch(orig.src)).blob();
      const out = await removeBackground(blob);
      setImg(await loadImage(URL.createObjectURL(out)));
    } catch (e) { toast('Background removal failed: ' + (e.message || e)); } finally { setBusy(''); }
  };

  const download = async (type) => {
    const c = cv.current; const name = `photo-${mode}-${preset}`;
    if (type === 'pdf') {
      const w = (c.width / 300) * 25.4, h = (c.height / 300) * 25.4;
      const pdf = new jsPDF({ unit: 'mm', format: [w, h], orientation: w > h ? 'l' : 'p' });
      pdf.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
      pdf.save(name + '.pdf'); return;
    }
    const blob = await new Promise((r) => c.toBlob(r, type === 'jpg' ? 'image/jpeg' : 'image/png', 0.95));
    saveBlob(blob, `${name}.${type}`);
  };

  return (
    <div className="page studio">
      <aside className="panel form">
        <h2><Icon name="image" /> {t('Photo Studio')}</h2>
        <div className="field"><label>1. Upload photo</label><input type="file" accept="image/*" onChange={onFile} /></div>

        <div className="field">
          <label>2. Background</label>
          <div className="row">
            <button className="btn sm" disabled={!orig || !!busy} onClick={removeBg}><Icon name="scissors" className="sm" /> Remove background</button>
            <button className="btn ghost sm" disabled={!orig} onClick={() => setImg(orig)}><Icon name="undo" className="sm" /> Original</button>
          </div>
          {busy && <div className="muted">{busy}</div>}
          <div className="swatches" style={{ marginTop: 6 }}>
            {COLORS.map((c) => <div key={c} className={'swatch' + (bg === c ? ' on' : '')} style={{ background: c }} onClick={() => setBg(c)} />)}
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
          </div>
          <div className="muted">Pick the background color; it shows through wherever the background was removed.</div>
        </div>

        <div className="field">
          <label>3. Size</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>{PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </div>
        <div className="field"><label>Zoom</label><input type="range" min="0.5" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(+e.target.value)} /></div>
        <div className="field"><label>Move left / right</label><input type="range" min="-0.5" max="0.5" step="0.005" value={ox} onChange={(e) => setOx(+e.target.value)} /></div>
        <div className="field"><label>Move up / down</label><input type="range" min="-0.5" max="0.5" step="0.005" value={oy} onChange={(e) => setOy(+e.target.value)} /></div>

        <div className="field">
          <label>4. Output</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="single">Single image</option>
            <option value="sheet">Passport print sheet (4×6 in, multiple copies)</option>
            <option value="id">Photo → ID card layout</option>
          </select>
        </div>
        {mode === 'sheet' && <div className="field"><label>Copies: {copies}</label><input type="range" min="1" max="12" value={copies} onChange={(e) => setCopies(+e.target.value)} /></div>}
        {mode === 'id' && ['org', 'name', 'role', 'idNo'].map((k) => (
          <div className="field" key={k}><label>{k}</label><input value={info[k]} onChange={(e) => setInfo({ ...info, [k]: e.target.value })} /></div>
        ))}

        <div className="field"><label>5. {t('Watermark text')}</label><input value={wm} onChange={(e) => setWm(e.target.value)} placeholder="e.g. COPY" /></div>
        {plan !== 'pro' && <div className="muted">“Made with BuilderHub” is added on the Free plan — <a href="#/pricing">remove with Pro</a>.</div>}
      </aside>

      <main className="stage">
        <div className="actions">
          <button className="btn" onClick={() => download('png')}><Icon name="download" className="sm" /> PNG</button>
          <button className="btn ghost" onClick={() => download('jpg')}><Icon name="download" className="sm" /> JPG</button>
          <button className="btn ghost" onClick={() => download('pdf')}><Icon name="download" className="sm" /> PDF</button>
        </div>
        {!img && <div className="warn"><Icon name="upload" className="sm" /> Upload a photo to start. Everything runs in your browser — the photo is not uploaded anywhere.</div>}
        <div className="preview" style={{ textAlign: 'center' }}><canvas ref={cv} /></div>
        <div className="muted">Output: {cv.current ? `${cv.current.width}×${cv.current.height}px` : ''}</div>
      </main>
    </div>
  );
}
