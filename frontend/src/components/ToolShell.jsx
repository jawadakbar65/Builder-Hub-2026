import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../ctx';
import { TOOLS } from '../tools/registry';
import Paper from './Paper';
import { FieldsForm } from './Fields';
import { Icon, iconForTool } from './Icons';
import { nodeToCanvas, saveCanvas, saveBlob } from '../utils/export';
import { saveProject, getProject, createShare, getProfile, saveProfile } from '../store';

// Scales a fixed-size sheet down to fit its container (display only).
export function FitBox({ w, h, children }) {
  const ref = useRef(null);
  const [s, setS] = useState(1);
  useEffect(() => {
    const el = ref.current;
    const f = () => setS(Math.min(1, (el.clientWidth || w) / w));
    f();
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} style={{ width: '100%', height: h * s, direction: 'ltr' }}>
      <div style={{ width: w, height: h, transform: `scale(${s})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

export default function ToolShell({ toolId, projectId }) {
  const { t, plan, user, toast, nav } = useApp();
  const tool = TOOLS[toolId];
  const [data, setData] = useState(() => (tool ? { ...tool.demo } : {}));
  const [tpl, setTpl] = useState(tool?.templates[0].id);
  const [pid, setPid] = useState(projectId || null);
  const [name, setName] = useState('');
  const [over, setOver] = useState(false);
  const [tab, setTab] = useState('form');
  const paper = useRef(null);
  const remember = (tool && tool.remember) || [];

  useEffect(() => {
    if (projectId) getProject(projectId).then((p) => { if (p) { setData(p.data); setTpl(p.tpl); setName(p.name); } });
  }, [projectId]);

  // Smart defaults: prefill saved school / company / logo / details for new documents.
  useEffect(() => {
    if (!remember.length || projectId) return;
    const p = getProfile();
    setData((d) => {
      const patch = {};
      remember.forEach((k) => { if (p[k]) patch[k] = p[k]; });
      return Object.keys(patch).length ? { ...d, ...patch } : d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  // Remember the reusable values the user edits (skip untouched demo values).
  useEffect(() => {
    if (!remember.length) return;
    const patch = {};
    remember.forEach((k) => { if (data[k] && data[k] !== tool.demo[k]) patch[k] = data[k]; });
    if (Object.keys(patch).length) saveProfile(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId, JSON.stringify(remember.map((k) => data[k]))]);

  useEffect(() => {
    const n = paper.current?.firstChild;
    if (n && n.scrollHeight) setOver(n.scrollHeight > n.clientHeight + 3 || n.scrollWidth > n.clientWidth + 3);
  });

  if (!tool) return <div className="page"><p>Tool not found.</p></div>;

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const [W, H] = tool.size(data, tpl);
  const brand = plan === 'pro' ? !!data.__brand : true;
  const slug = String(data.name || data.org || data.school || data.customer || 'document').replace(/\W+/g, '-').slice(0, 24);
  const missing = tool.fields.filter((f) => f.req && !String(data[f.key] || '').trim());
  const validate = () => {
    if (missing.length) { toast('Please fill: ' + missing.map((m) => t(m.label)).join(', ')); return false; }
    return true;
  };

  const dl = async (type) => {
    if (!validate()) return;
    try {
      const c = await nodeToCanvas(paper.current);
      await saveCanvas(c, type, `${tool.id}-${slug}`, W, H);
    } catch (e) { toast('Export failed: ' + e.message); }
  };

  const printDoc = async () => {
    if (!validate()) return;
    try {
      const c = await nodeToCanvas(paper.current);
      const url = c.toDataURL('image/png');
      const w = window.open('', '_blank');
      if (!w) { toast('Please allow pop-ups to print'); return; }
      w.document.write('<!doctype html><html><head><title>' + t(tool.name) + '</title><style>@page{size:auto;margin:0}html,body{margin:0;padding:0}img{display:block;width:100%;height:auto}</style></head><body><img src="' + url + '" onload="window.print()" /></body></html>');
      w.document.close();
    } catch (e) { toast('Could not open print view: ' + e.message); }
  };

  const pickTpl = (id) => {
    const x = tool.templates.find((z) => z.id === id);
    if (x.pro && plan !== 'pro') { toast('★ Premium template — upgrade to Pro to use it'); return; }
    setTpl(id);
  };

  const save = async () => {
    if (!user) { toast('Please login to save projects'); nav('/login'); return; }
    if (!validate()) return;
    try {
      const p = await saveProject({ id: pid, tool: tool.id, name: name || `${t(tool.name)} – ${slug}`, data, tpl });
      setPid(p.id); toast('✅ Saved to My Projects');
    } catch (e) { toast(e.message); }
  };

  const share = async () => {
    try {
      const url = await createShare(tool.id, { data, tpl, brand });
      try { await navigator.clipboard.writeText(url); toast('🔗 Share link copied'); }
      catch { window.prompt('Copy your share link:', url); }
    } catch (e) { toast('Could not create link: ' + e.message); }
  };

  return (
    <div className={`page shell mtabs-on show-${tab}`}>
      <div className="mtabs">
        <button type="button" className={tab === 'form' ? 'on' : ''} onClick={() => setTab('form')}><Icon name="edit" className="sm" /> {t('Edit')}</button>
        <button type="button" className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}><Icon name="fileText" className="sm" /> {t('Preview')}</button>
      </div>

      <aside className="panel form">
        <div className="row between">
          <h2><Icon name={iconForTool(tool.id)} /> {t(tool.name)}</h2>
          <div className="row">
            <button className="btn ghost sm" onClick={() => setData({ ...tool.demo })}><Icon name="sparkles" className="sm" /> {t('Demo data')}</button>
            <button className="btn ghost sm" onClick={() => setData({ ...tool.blank })}><Icon name="trash" className="sm" /> {t('Clear')}</button>
          </div>
        </div>
        {tool.actions?.map((a) => (
          <button key={a.label} className="btn sm block" onClick={() => setData((d) => ({ ...d, ...a.run(d) }))}><Icon name="zap" className="sm" /> {t(a.label)}</button>
        ))}
        <FieldsForm fields={tool.fields} data={data} set={set} />
      </aside>

      <main className="stage">
        <div className="panel toolbar">
          <label>{t('Template')}
            <select value={tpl} onChange={(e) => pickTpl(e.target.value)}>
              {tool.templates.map((x) => <option key={x.id} value={x.id}>{x.pro ? '★ ' : ''}{x.name}{x.pro && plan !== 'pro' ? ' (Pro)' : ''}</option>)}
            </select>
          </label>
          <label>{t('Accent color')}
            <input type="color" value={data.accent || '#2563eb'} onChange={(e) => set('accent', e.target.value)} />
          </label>
          <label>{t('Watermark text')}
            <input type="text" value={data.__wmText || ''} placeholder="e.g. SAMPLE" onChange={(e) => set('__wmText', e.target.value)} />
          </label>
          <label className="chk">
            <input type="checkbox" checked={!!data.__rtl} onChange={(e) => set('__rtl', e.target.checked)} /> {t('Right-to-left (Urdu) document')}
          </label>
          <label className="chk">
            <input type="checkbox" checked={brand} disabled={plan !== 'pro'} onChange={(e) => set('__brand', e.target.checked)} /> BuilderHub watermark
            {plan !== 'pro' && <a href="#/pricing"> <Icon name="lock" className="sm" /> Remove (Pro)</a>}
          </label>
        </div>

        <div className="actions">
          <button className="btn" onClick={save}><Icon name="save" className="sm" /> {t('Save')}</button>
          <button className="btn ghost" onClick={share}><Icon name="share" className="sm" /> {t('Share link')}</button>
          <button className="btn ghost" onClick={printDoc}><Icon name="printer" className="sm" /> {t('Print')}</button>
          {!tool.noImageExport && (
            <>
              <button className="btn ghost" onClick={() => dl('png')}><Icon name="download" className="sm" /> {t('Download PNG')}</button>
              <button className="btn ghost" onClick={() => dl('jpg')}><Icon name="download" className="sm" /> {t('Download JPG')}</button>
              <button className="btn ghost" onClick={() => dl('pdf')}><Icon name="download" className="sm" /> {t('Download PDF')}</button>
            </>
          )}
          {tool.exportHtml && (
            <button className="btn ghost" onClick={() => saveBlob(new Blob([tool.exportHtml(data, tpl, brand)], { type: 'text/html' }), `${slug || 'portfolio'}.html`)}><Icon name="code" className="sm" /> {t('Download HTML')}</button>
          )}
        </div>

        {over && <div className="warn"><Icon name="xCircle" className="sm" /> Content is larger than the page — shorten the text or remove rows so everything fits.</div>}

        <div className="preview">
          {/* ref = the sheet node the exporter clones; FitBox only scales it for display */}
          <FitBox w={W} h={H}><Paper ref={paper} tool={tool} data={data} tpl={tpl} brand={brand} /></FitBox>
        </div>

        {tool.Extra && <tool.Extra data={data} />}
      </main>
    </div>
  );
}
