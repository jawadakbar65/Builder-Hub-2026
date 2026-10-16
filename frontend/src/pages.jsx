import React, { useEffect, useRef, useState } from 'react';
import { useApp } from './ctx';
import { CATALOG, GROUPS, TOOLS } from './tools/registry';
import { login, register, loginWithEmail, listProjects, deleteProject, loadShare, hasApi, googleStartUrl, completeLogin } from './store';
import Paper from './components/Paper';
import Logo from './components/Logo';
import { Icon, iconForRoute, iconForTool, GoogleIcon } from './components/Icons';
import { FitBox } from './components/ToolShell';

export function Home() {
  const { t } = useApp();
  const [q, setQ] = useState('');
  const ql = q.toLowerCase();
  const items = CATALOG.filter((c) => (c.name + ' ' + c.desc).toLowerCase().includes(ql) || t(c.name).includes(q));
  return (
    <div className="page">
      <section className="hero">
        <span className="hero-kicker"><Icon name="sparkles" className="sm" /> Your creative workspace</span>
        <h1>{t('Build documents, cards & photos in minutes')}</h1>
        <p>{t('Resume, ID cards, certificates, marksheets, passport photos and more — free to start.')}</p>
        <input className="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search tools…')} />
      </section>
      {GROUPS.map((g) => {
        const list = items.filter((i) => i.group === g);
        if (!list.length) return null;
        return (
          <section key={g}>
            <h2>{t(g)}</h2>
            <div className="grid">
              {list.map((i) => (
                <a key={i.route} className="tcard" href={'#' + i.route}>
                  <span className="ic"><Icon name={iconForRoute(i.route)} /></span>
                  <b>{t(i.name)}</b>
                  <small>{i.desc}</small>
                  {i.pro && <em>PRO</em>}
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function Pricing() {
  const { t, plan, activatePro, toast } = useApp();
  const rows = [
    ['Templates', 'Free templates', 'All premium templates ★'],
    ['Watermark', '“Made with BuilderHub” badge', 'No watermark'],
    ['Bulk generate (schools)', 'Up to 3 records per run', 'Unlimited records → one PDF'],
    ['Downloads', 'PNG / JPG / PDF', 'PNG / JPG / PDF'],
    ['Save projects & share links', 'Included', 'Included'],
  ];
  const go = async () => { try { await activatePro(); } catch (e) { toast(e.message); } };
  return (
    <div className="page narrow">
      <h1>{t('Pricing')}</h1>
      <table className="ptable">
        <thead><tr><th></th><th>Free</th><th>Pro ⭐</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
      </table>
      {plan === 'pro' ? <p className="badge"><Icon name="star" className="sm" /> You are on Pro</p> : <button className="btn" onClick={go}><Icon name="star" className="sm" /> {t('Upgrade to Pro')} (demo)</button>}
      <p className="muted">
        Demo mode: the button above unlocks Pro locally without payment. To charge real money, connect a payment gateway
        (Stripe, JazzCash, Easypaisa…) on the backend — see README.
        {hasApi ? '' : ' (Backend not configured.)'}
      </p>
    </div>
  );
}

function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);
  const chars = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const emit = (arr) => onChange(arr.slice(0, 6).join(''));
  const handle = (i, raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length > 1) {
      const merged = (chars.slice(0, i).join('') + digits).replace(/\D/g, '').slice(0, 6);
      emit(Array.from({ length: 6 }, (_, k) => merged[k] || ''));
      refs.current[Math.min(merged.length, 5)]?.focus();
      return;
    }
    const next = chars.slice();
    next[i] = digits;
    emit(next);
    if (digits && i < 5) refs.current[i + 1]?.focus();
  };
  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !chars[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="otp" dir="ltr">
      {chars.map((c, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} className="otp-cell" inputMode="numeric" autoComplete="one-time-code"
          maxLength={1} value={c} disabled={disabled} autoFocus={i === 0}
          onChange={(e) => handle(i, e.target.value)} onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => { e.preventDefault(); handle(i, e.clipboardData.getData('text')); }} />
      ))}
    </div>
  );
}

export function Login({ next, error }) {
  const { t, nav, refreshUser } = useApp();
  const done = next && next.startsWith('/') ? next : '/projects';
  const [mode, setMode] = useState('email'); // 'email' | 'password' | 'register'
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(error || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (error) setErr(error); }, [error]);

  const submitEmail = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await loginWithEmail(f.email);
      refreshUser(); nav(done);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  const submitPassword = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'register') await register(f.name, f.email, f.password);
      else await login(f.email, f.password);
      refreshUser(); nav(done);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <div className="page narrow">
      <div className="row" style={{ justifyContent: 'center', marginBottom: 18 }}><Logo large /></div>
      <div className="panel auth">
        <h2 className="auth-title">{t('Login')}</h2>
        <a className="btn google block" href={googleStartUrl()}><GoogleIcon size={18} /> {t('Continue with Google')}</a>
        <div className="divider"><span>or</span></div>

        {(mode === 'password' || mode === 'register') ? (
          <form onSubmit={submitPassword}>
            {mode === 'register' && <div className="field"><label>{t('Name')}</label><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>}
            <div className="field"><label>{t('Email')}</label><input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="field"><label>{t('Password')}</label><input type="password" required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
            {err && <div className="warn"><Icon name="xCircle" className="sm" /> {err}</div>}
            <button className="btn block" disabled={busy}>{busy ? <span className="spinner" /> : (mode === 'register' ? t('Register') : t('Login'))}</button>
            <p className="muted auth-links">
              <a href="#/login" onClick={(e) => { e.preventDefault(); setErr(''); setMode(mode === 'register' ? 'password' : 'register'); }}>
                {mode === 'register' ? 'Have an account? Login' : 'No account? Register'}
              </a>
              <a href="#/login" onClick={(e) => { e.preventDefault(); setErr(''); setMode('email'); }}>Use email only</a>
            </p>
          </form>
        ) : (
          <form onSubmit={submitEmail}>
            <div className="field"><label>{t('Email')}</label><input type="email" required autoComplete="email" autoFocus placeholder="you@example.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            {err && <div className="warn"><Icon name="xCircle" className="sm" /> {err}</div>}
            <button className="btn block" disabled={busy}>{busy ? <span className="spinner" /> : t('Continue')}</button>
            <p className="muted auth-links">
              <a href="#/login" onClick={(e) => { e.preventDefault(); setErr(''); setMode('password'); }}>Use a password instead</a>
            </p>
          </form>
        )}
      </div>
      <p className="muted" style={{ textAlign: 'center', marginTop: 14 }}>{t('No password needed — just enter your email to get started.')}</p>
    </div>
  );
}

export function AuthCallback({ token, next }) {
  const { nav, refreshUser } = useApp();
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!token) throw new Error('Missing sign-in token');
        await completeLogin(token);
        if (!alive) return;
        refreshUser();
        nav(next && next.startsWith('/') ? next : '/projects');
      } catch (x) { if (alive) setErr(x.message); }
    })();
    return () => { alive = false; };
  }, []);
  return (
    <div className="page narrow auth-done">
      {err ? (
        <>
          <div className="warn"><Icon name="xCircle" className="sm" /> {err}</div>
          <p style={{ marginTop: 14 }}><a className="btn" href="#/login">Back to login</a></p>
        </>
      ) : (
        <>
          <span className="spinner lg" />
          <p className="muted">Signing you in…</p>
        </>
      )}
    </div>
  );
}

export function Projects() {
  const { t, user, nav } = useApp();
  const [list, setList] = useState(null);
  const load = () => listProjects().then(setList).catch(() => setList([]));
  useEffect(() => { if (user) load(); }, [user]);
  if (!user) return <div className="page narrow"><p>Please <a href="#/login">{t('Login')}</a> to see your saved projects.</p></div>;
  return (
    <div className="page">
      <h1>{t('Projects')}</h1>
      {list && !list.length && <p className="muted">Nothing saved yet — open any tool and press “Save”.</p>}
      <div className="grid">
        {(list || []).map((p) => (
          <div className="tcard" key={p.id}>
            <span className="ic"><Icon name={iconForTool(p.tool)} /></span>
            <b>{p.name}</b>
            <small>{TOOLS[p.tool] ? t(TOOLS[p.tool].name) : p.tool} · {new Date(p.updated).toLocaleDateString()}</small>
            <div className="row">
              <button className="btn sm" onClick={() => nav(`/tool/${p.tool}/${p.id}`)}><Icon name="arrowRight" className="sm" /> {t('Open')}</button>
              <button className="btn ghost sm" onClick={async () => { await deleteProject(p.id); load(); }}><Icon name="trash" className="sm" /> {t('Delete')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SharedView({ token }) {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { loadShare(token).then(setS).catch((e) => setErr(e.message || 'Invalid link')); }, [token]);
  if (err) return <div className="page"><p className="warn"><Icon name="xCircle" className="sm" /> {err}</p></div>;
  if (!s) return <div className="page"><p>Loading…</p></div>;
  const tool = TOOLS[s.tool];
  if (!tool) return <div className="page"><p className="warn"><Icon name="xCircle" className="sm" /> Unknown document type.</p></div>;
  const [W, H] = tool.size(s.data, s.tpl);
  return (
    <div className="page shared">
      <div className="preview">
        <FitBox w={W} h={H}><Paper tool={tool} data={s.data} tpl={s.tpl} brand={s.brand !== false} /></FitBox>
      </div>
      <p style={{ textAlign: 'center' }}><a className="btn" href="#/"><Icon name="sparkles" className="sm" /> Create your own with BuilderHub</a></p>
    </div>
  );
}
