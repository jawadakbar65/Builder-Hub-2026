import React, { useEffect, useState, useCallback } from 'react';
import { AppCtx } from './ctx';
import { makeT } from './i18n';
import { getSession, getPlan, logout, upgradePlan } from './store';
import ToolShell from './components/ToolShell';
import Logo from './components/Logo';
import Footer from './components/Footer';
import { Icon } from './components/Icons';
import PhotoStudio from './tools/PhotoStudio';
import Students from './tools/Students';
import Bulk from './tools/Bulk';
import ImageGen from './tools/ImageGen';
import LinkedIn from './tools/LinkedIn';
import { Home, Pricing, Login, Projects, SharedView, AuthCallback } from './pages';

const ls = (k, d) => localStorage.getItem(k) || d;

function useHash() {
  const [h, setH] = useState(location.hash || '#/');
  useEffect(() => {
    const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return h.slice(1) || '/';
}

export default function App() {
  const [lang, setLang] = useState(ls('bh_lang', 'en'));
  const [theme, setTheme] = useState(ls('bh_theme', 'dark'));
  const [user, setUser] = useState(getSession());
  const [plan, setPlan] = useState(getPlan());
  const [msg, setMsg] = useState('');
  const route = useHash();

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-theme', theme);
    el.setAttribute('lang', lang);
    el.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    localStorage.setItem('bh_theme', theme);
    localStorage.setItem('bh_lang', lang);
  }, [theme, lang]);

  const toast = useCallback((m) => { setMsg(m); clearTimeout(window.__bhT); window.__bhT = setTimeout(() => setMsg(''), 3500); }, []);
  const nav = useCallback((p) => { location.hash = '#' + p; }, []);
  const refreshUser = useCallback(() => { setUser(getSession()); setPlan(getPlan()); }, []);
  const activatePro = async () => { await upgradePlan(); setPlan('pro'); toast('🎉 Pro activated'); };
  const doLogout = () => { logout(); refreshUser(); nav('/'); };

  const ctx = { t: makeT(lang), lang, plan, user, toast, nav, refreshUser, activatePro };
  const [pathPart, queryPart] = route.split('?');
  const [a, b, c] = pathPart.split('/').filter(Boolean);
  const query = new URLSearchParams(queryPart || '');

  // Private pages: send signed-out visitors to login, remembering where they were headed.
  useEffect(() => {
    if (a === 'projects' && !user) nav('/login?next=' + encodeURIComponent('/' + a));
  }, [a, user]);

  let page;
  if (!a) page = <Home />;
  else if (a === 'tool') page = <ToolShell key={b + (c || '')} toolId={b} projectId={c} />;
  else if (a === 'photo') page = <PhotoStudio />;
  else if (a === 'students') page = <Students />;
  else if (a === 'bulk') page = <Bulk />;
  else if (a === 'imagegen') page = <ImageGen />;
  else if (a === 'linkedin') page = <LinkedIn />;
  else if (a === 'projects') page = <Projects />;
  else if (a === 'pricing') page = <Pricing />;
  else if (a === 'login') page = <Login next={query.get('next')} error={query.get('error')} />;
  else if (a === 'auth' && b === 'callback') page = <AuthCallback token={query.get('token')} next={query.get('next')} />;
  else if (a === 'share') page = <SharedView key={b} token={route.slice('/share/'.length)} />;
  else page = <Home />;

  const { t } = ctx;
  const active = (name) => (route === name ? 'active' : '');

  return (
    <AppCtx.Provider value={ctx}>
      <header className="nav">
        <a className="logo" href="#/" aria-label="BuilderHub home"><Logo /></a>
        <nav>
          <a className={route === '/' ? 'active' : ''} href="#/">{t('Home')}</a>
          <a className={active('/projects')} href="#/projects">{t('Projects')}</a>
          <a className={active('/pricing')} href="#/pricing">{t('Pricing')}</a>
        </nav>
        <div className="row">
          {plan === 'pro'
            ? <span className="badge"><Icon name="star" className="sm" /> PRO</span>
            : <a className="btn sm" href="#/pricing"><Icon name="star" className="sm" /> {t('Upgrade to Pro')}</a>}
          <button className="btn ghost sm" onClick={() => setLang(lang === 'en' ? 'ur' : 'en')} title="Language">
            <Icon name="globe" className="sm" /> {lang === 'en' ? 'اردو' : 'English'}
          </button>
          <button className="btn ghost sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="sm" /> {theme === 'dark' ? t('Light') : t('Dark')}
          </button>
          {user
            ? <button className="btn ghost sm" onClick={doLogout}><Icon name="user" className="sm" /> {user.name} · {t('Logout')}</button>
            : <a className="btn sm" href="#/login"><Icon name="logOut" className="sm" /> {t('Login')}</a>}
        </div>
      </header>
      {page}
      <Footer />
      {msg && <div className="toast">{msg}</div>}
    </AppCtx.Provider>
  );
}
