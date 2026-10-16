import React from 'react';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Builds a complete standalone HTML page (also used for the live preview and export).
export function portfolioHtml(d, tpl, brand) {
  const ac = d.accent || '#2563eb';
  const dark = tpl !== 'light';
  const skills = (d.skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const projects = (d.projects || []).filter((p) => p.title);
  const hero = tpl === 'gradient' ? `linear-gradient(135deg,${ac},#111827)` : dark ? '#0b1020' : '#f8fafc';
  const link = (u) => (u ? (/^https?:/.test(u) ? u : 'https://' + u) : '');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.name)} — Portfolio</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;background:${dark ? '#0b1020' : '#fff'};color:${dark ? '#e5e7eb' : '#111827'};line-height:1.6}
a{color:${ac}}.wrap{max-width:960px;margin:auto;padding:0 24px}
header.hero{background:${hero};color:${dark || tpl === 'gradient' ? '#fff' : '#111827'};padding:70px 0 60px;text-align:center}
.hero img{width:130px;height:130px;border-radius:50%;object-fit:cover;border:4px solid ${ac};margin-bottom:12px}
.hero h1{margin:0;font-size:42px}.hero p{font-size:18px;opacity:.85;margin:6px 0 0}
.btn{display:inline-block;margin:18px 6px 0;padding:10px 22px;border-radius:99px;background:${ac};color:#fff;text-decoration:none;font-weight:600}
section{padding:40px 0}h2{border-left:5px solid ${ac};padding-left:12px}
.chips span{display:inline-block;margin:4px;padding:4px 14px;border-radius:99px;background:${dark ? '#1c2540' : '#eef2ff'}}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{background:${dark ? '#141b33' : '#f8fafc'};border:1px solid ${dark ? '#243055' : '#e5e7eb'};border-radius:14px;padding:18px}
.card h3{margin:0 0 6px}footer{text-align:center;padding:26px;opacity:.6;font-size:13px}
</style></head><body>
<header class="hero"><div class="wrap">${d.photo ? `<img src="${d.photo}" alt="">` : ''}
<h1>${esc(d.name)}</h1><p>${esc(d.title)}</p>
${d.email ? `<a class="btn" href="mailto:${esc(d.email)}">Contact me</a>` : ''}
${d.github ? `<a class="btn" href="${esc(link(d.github))}">GitHub</a>` : ''}
${d.linkedin ? `<a class="btn" href="${esc(link(d.linkedin))}">LinkedIn</a>` : ''}</div></header>
<div class="wrap">
<section><h2>About</h2><p>${esc(d.about)}</p></section>
${skills.length ? `<section><h2>Skills</h2><div class="chips">${skills.map((s) => `<span>${esc(s)}</span>`).join('')}</div></section>` : ''}
${projects.length ? `<section><h2>Projects</h2><div class="cards">${projects.map((p) => `<div class="card"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${p.link ? `<a href="${esc(link(p.link))}">View project →</a>` : ''}</div>`).join('')}</div></section>` : ''}
</div>
<footer>© ${new Date().getFullYear()} ${esc(d.name)}${brand ? ' · Made with BuilderHub' : ''}</footer>
</body></html>`;
}

export function PortfolioPreview({ data, tpl, brand }) {
  return <iframe className="doc" title="portfolio" srcDoc={portfolioHtml(data, tpl, brand)} style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} />;
}
