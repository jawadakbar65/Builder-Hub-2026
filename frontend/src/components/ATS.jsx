import React, { useState } from 'react';
import { useApp } from '../ctx';
import { atsScore } from '../tools/ats';
import { Icon } from './Icons';

export default function ATS({ data }) {
  const { t } = useApp();
  const [jd, setJd] = useState('');
  const [r, setR] = useState(null);
  const color = r ? (r.score >= 75 ? 'var(--ok)' : r.score >= 50 ? '#d97706' : 'var(--bad)') : 'inherit';
  return (
    <div className="panel">
      <h3><Icon name="target" /> {t('ATS Score Checker')}</h3>
      <p className="muted">Paste a job description for keyword matching (optional), then check your resume.</p>
      <textarea rows={5} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description here…" />
      <button className="btn" style={{ marginTop: 8 }} onClick={() => setR(atsScore(data, jd))}><Icon name="target" className="sm" /> Check ATS score</button>
      {r && (
        <div style={{ marginTop: 14 }}>
          <div className="row" style={{ gap: 14 }}>
            <div className="score" style={{ color }}>{r.score}<small style={{ fontSize: 16 }}>/100</small></div>
            <div className="muted">{r.hasJd ? 'Structure (60%) + keyword match (40%)' : 'Structure score — add a job description to include keyword matching'}</div>
          </div>
          {r.checks.map((c) => (
            <div className="check" key={c.label}>
              <Icon name={c.ok ? 'checkCircle' : 'xCircle'} className={c.ok ? '' : 'bad'} />
              <div><b>{c.label}</b>{!c.ok && <div className="muted">{c.tip}</div>}</div>
            </div>
          ))}
          {r.hasJd && (
            <>
              <h4>Matched keywords</h4>
              {r.matched.map((w) => <span key={w} className="chip ok">{w}</span>)}
              <h4>Missing keywords — add the ones that are true for you</h4>
              {r.missing.map((w) => <span key={w} className="chip bad">{w}</span>)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
