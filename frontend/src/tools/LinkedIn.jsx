import React, { useState } from 'react';
import { useApp } from '../ctx';
import { Icon } from '../components/Icons';

const CTA = /(contact|reach|connect|email|message|dm|let's talk|open to)/i;

function analyze(f) {
  const checks = [];
  const add = (ok, label, tip, pts) => checks.push({ ok, label, tip, pts: ok ? pts : 0, max: pts });
  const h = f.headline.trim(), a = f.about.trim();
  const role = f.role.trim().toLowerCase();
  const skills = f.skills.split(',').map((s) => s.trim()).filter(Boolean);

  add(h.length >= 60, `Headline length (${h.length}/220)`, 'Use 60+ characters: role | specialty | value you deliver.', 15);
  add(/[|•·\-–—]/.test(h), 'Headline has separators', 'Structure it like “Role | Skill | Result”.', 5);
  add(!!role && h.toLowerCase().includes(role), 'Headline contains your target role keyword', 'Include the exact job title recruiters search for.', 15);
  add(a.length >= 600, `About length (${a.length} chars, aim 600–2000)`, 'Write at least 3 short paragraphs.', 15);
  add(/\b(I|my|I'm|I’ve|I've)\b/.test(a), 'About is written in first person', 'Use “I” — it reads more personal.', 5);
  add((a.match(/\d+/g) || []).length >= 2, 'About includes numbers / results', 'Add 2+ measurable results (e.g. “grew traffic 3×”).', 10);
  add(CTA.test(a), 'About ends with a call to action', 'End with how to reach you (“Connect with me or email …”).', 10);
  add(a.split(/\n\s*\n/).length >= 3, 'About has short paragraphs', 'Break the text into 3+ paragraphs.', 5);
  add(skills.length >= 10, `Skills listed (${skills.length}/10+)`, 'Add at least 10 relevant skills and pin the top 3.', 10);
  add(!!role && a.toLowerCase().includes(role), 'About mentions your target role', 'Repeat your target role once in the About section.', 10);
  const score = Math.round((checks.reduce((x, c) => x + c.pts, 0) / checks.reduce((x, c) => x + c.max, 0)) * 100);
  return { score, checks };
}

export default function LinkedIn() {
  const { t } = useApp();
  const [f, setF] = useState({
    role: 'Frontend Developer', headline: 'Student at University of Balochistan', skills: 'React, JavaScript, HTML, CSS',
    about: 'I like building websites. Looking for a job.', years: '3', strength: 'React and performance', result: 'cut load time by 40%', industry: 'fintech',
  });
  const [r, setR] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const color = r ? (r.score >= 75 ? 'var(--ok)' : r.score >= 50 ? '#d97706' : 'var(--bad)') : 'inherit';

  const headlines = [
    `${f.role} | ${f.strength} | Helping ${f.industry} teams ${f.result}`,
    `${f.role} • ${f.skills.split(',').slice(0, 3).map((s) => s.trim()).join(' • ')} • Open to opportunities`,
    `${f.role} with ${f.years}+ years experience | I ${f.result}`,
  ];
  const aboutTpl = `I'm a ${f.role} with ${f.years}+ years of experience in ${f.industry}, specializing in ${f.strength}.\n\nRecently, I ${f.result}. I enjoy turning complex problems into simple, reliable products and working closely with designers, product managers and customers.\n\nWhat I bring: ${f.skills}.\n\nI'm open to new opportunities — connect with me or send a message to talk about how I can help your team.`;

  return (
    <div className="page shell">
      <aside className="panel form">
        <h2><Icon name="briefcase" /> {t('LinkedIn Optimizer')}</h2>
        <div className="field"><label>Target role</label><input value={f.role} onChange={set('role')} /></div>
        <div className="field"><label>Current headline</label><textarea rows={2} value={f.headline} onChange={set('headline')} /></div>
        <div className="field"><label>Current About section</label><textarea rows={7} value={f.about} onChange={set('about')} /></div>
        <div className="field"><label>Skills (comma separated)</label><textarea rows={2} value={f.skills} onChange={set('skills')} /></div>
        <hr />
        <p className="muted">Used for the suggestions:</p>
        <div className="field"><label>Years of experience</label><input value={f.years} onChange={set('years')} /></div>
        <div className="field"><label>Main strength</label><input value={f.strength} onChange={set('strength')} /></div>
        <div className="field"><label>Best result (e.g. “cut load time by 40%”)</label><input value={f.result} onChange={set('result')} /></div>
        <div className="field"><label>Industry</label><input value={f.industry} onChange={set('industry')} /></div>
        <button className="btn block" onClick={() => setR(analyze(f))}><Icon name="target" className="sm" /> Analyze profile</button>
      </aside>
      <main className="stage">
        {r && (
          <div className="panel">
            <div className="row"><div className="score" style={{ color }}>{r.score}<small style={{ fontSize: 16 }}>/100</small></div><div className="muted">Profile strength estimate (rule-based)</div></div>
            {r.checks.map((c) => (
              <div className="check" key={c.label}>
                <Icon name={c.ok ? 'checkCircle' : 'xCircle'} className={c.ok ? '' : 'bad'} />
                <div><b>{c.label}</b>{!c.ok && <div className="muted">{c.tip}</div>}</div>
              </div>
            ))}
          </div>
        )}
        <div className="panel">
          <h3>Headline ideas</h3>
          {headlines.map((h, i) => (
            <div className="check" key={i}><div style={{ flex: 1 }}>{h}</div><button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(h)}><Icon name="copy" className="sm" /> Copy</button></div>
          ))}
        </div>
        <div className="panel">
          <h3>About section draft</h3>
          <textarea rows={11} readOnly value={aboutTpl} />
          <button className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => navigator.clipboard?.writeText(aboutTpl)}><Icon name="copy" className="sm" /> Copy</button>
        </div>
      </main>
    </div>
  );
}
