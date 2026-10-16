// Storage layer. Accounts, projects and share links go through the Express backend.
// VITE_API_URL is only needed when the API lives on a different domain; otherwise the
// relative /api path is used (proxied by Vite in dev, same-origin in production).
const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, '');
export const hasApi = true;

const J = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const S = (k, v) => localStorage.setItem(k, JSON.stringify(v));

async function api(path, opt = {}) {
  const s = J('bh_session', null);
  let r;
  try {
    r = await fetch(API + path, {
      ...opt,
      headers: { 'Content-Type': 'application/json', ...(s?.token ? { Authorization: 'Bearer ' + s.token } : {}), ...(opt.headers || {}) },
    });
  } catch {
    // Network / server unreachable — callers may fall back to browser-only storage.
    const err = new Error('Cannot reach the server. Please check your connection and try again.');
    err.offline = true;
    throw err;
  }
  const type = r.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    // e.g. the dev/preview server returned index.html because the API wasn't proxied/reachable.
    const err = new Error('The API is not reachable. Make sure the backend server is running (npm run server).');
    err.offline = true;
    throw err;
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Request failed'); e.status = r.status; throw e; }
  return j;
}

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/* ---------- auth ---------- */
export const getSession = () => J('bh_session', null);
export const getPlan = () => J('bh_plan', 'free');

const saveSession = (j) => { S('bh_session', j); if (j.plan) S('bh_plan', j.plan); return j; };

export async function register(name, email, password) {
  email = email.trim().toLowerCase();
  if (password.length < 6) throw new Error('Password must be at least 6 characters');
  try {
    return saveSession(await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }));
  } catch (e) {
    if (!e.offline) throw e;
    const users = J('bh_users', {});
    if (users[email]) throw new Error('Account already exists');
    users[email] = { name, h: await sha(password) };
    S('bh_users', users);
    return saveSession({ name, email });
  }
}

export async function login(email, password) {
  email = email.trim().toLowerCase();
  try {
    return saveSession(await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }));
  } catch (error) {
    // A browser-only account from the old local mode: migrate it (and its projects) into
    // the backend on first login, or log in locally while the server is unreachable.
    const localUser = J('bh_users', {})[email];
    if (!localUser || localUser.h !== await sha(password)) throw error;
    if (error.offline) return saveSession({ name: localUser.name, email });
    const j = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: localUser.name, email, password }) });
    const projects = J('bh_projects_' + email, []);
    for (const project of projects) await api('/api/projects', { method: 'POST', body: JSON.stringify(project) });
    return saveSession(j);
  }
}

/* ---------- Google sign-in ---------- */
export const googleStartUrl = () => API + '/api/auth/google/start';

// Verifies a Google Identity Services credential (if the client-side button is used).
export async function authWithGoogleCredential(credential) {
  return saveSession(await api('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }));
}

// Called by the OAuth callback page: stores the token, then loads the full profile.
export async function completeLogin(token) {
  S('bh_session', { ...(J('bh_session', null) || {}), token });
  const user = await api('/api/auth/me');
  return saveSession(user);
}

/* ---------- simple email sign-in (no password, no verification) ---------- */
// Sign in (or create an account) with just an email address.
export async function loginWithEmail(email, name) {
  email = email.trim().toLowerCase();
  return saveSession(await api('/api/auth/email', { method: 'POST', body: JSON.stringify({ email, name }) }));
}

// Refreshes the signed-in profile from the backend; returns null when not signed in.
export async function me() {
  if (!J('bh_session', null)?.token) return null;
  try {
    const user = await api('/api/auth/me');
    return saveSession(user);
  } catch { return null; }
}

export const logout = () => { localStorage.removeItem('bh_session'); };

export async function upgradePlan() {
  if (hasApi) {
    if (!getSession()) throw new Error('Please login first');
    try {
      await api('/api/plan/upgrade', { method: 'POST' });
    } catch (e) {
      // Demo mode: no payment gateway is connected yet (402), so unlock Pro locally
      // as documented in the README. Any other error (offline, server down) still surfaces.
      if (e.status !== 402) throw e;
    }
  }
  S('bh_plan', 'pro');
}

/* ---------- saved profile (smart defaults) ---------- */
// Reusable details (school, company, logo, address, bank…) so new documents are pre-filled.
export const getProfile = () => J('bh_profile', {});
export function saveProfile(patch) {
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== '' && v != null));
  if (!Object.keys(clean).length) return;
  S('bh_profile', { ...J('bh_profile', {}), ...clean });
}

/* ---------- projects ---------- */
const pkey = () => 'bh_projects_' + (getSession()?.email || 'guest');

export async function listProjects() {
  if (hasApi && getSession()) return (await api('/api/projects')).projects;
  return J(pkey(), []);
}

export async function saveProject(p) {
  if (!getSession()) throw new Error('LOGIN');
  if (hasApi) return (await api('/api/projects', { method: 'POST', body: JSON.stringify(p) })).project;
  const list = J(pkey(), []);
  const now = Date.now();
  let item;
  if (p.id && list.some((x) => x.id === p.id)) {
    item = { ...list.find((x) => x.id === p.id), ...p, updated: now };
    list[list.findIndex((x) => x.id === p.id)] = item;
  } else {
    item = { ...p, id: Math.random().toString(36).slice(2, 10), updated: now };
    list.unshift(item);
  }
  S(pkey(), list);
  return item;
}

export async function getProject(id) { return (await listProjects()).find((x) => x.id === id); }

export async function deleteProject(id) {
  if (hasApi && getSession()) { await api('/api/projects/' + id, { method: 'DELETE' }); return; }
  S(pkey(), J(pkey(), []).filter((x) => x.id !== id));
}

/* ---------- share links ---------- */
const b64u = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64u = (str) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const s = atob(str); const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
};
async function pipe(bytes, stream) {
  const w = stream.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
const pack = async (o) => b64u(await pipe(new TextEncoder().encode(JSON.stringify(o)), new CompressionStream('gzip')));
const unpack = async (s) => JSON.parse(new TextDecoder().decode(await pipe(unb64u(s), new DecompressionStream('gzip'))));

// Without a backend the whole document is packed (gzip + base64) into the URL itself.
// With a backend we store it and return a short link.
export async function createShare(tool, payload) {
  const base = location.origin + location.pathname;
  if (hasApi) {
    const j = await api('/api/share', { method: 'POST', body: JSON.stringify({ tool, ...payload }) });
    return `${base}#/share/s:${j.id}`;
  }
  return `${base}#/share/h:${await pack({ tool, ...payload })}`;
}

export async function loadShare(token) {
  const kind = token.slice(0, 1), v = token.slice(2);
  if (kind === 's') return api('/api/share/' + v);
  return unpack(v);
}

/* ---------- student table ---------- */
export const getStudents = () => J('bh_students', []);
let studentSaveQueue = Promise.resolve();
export const setStudents = (rows) => {
  S('bh_students', rows);
  if (hasApi && getSession()) {
    studentSaveQueue = studentSaveQueue.catch(() => {}).then(() => api('/api/students', { method: 'PUT', body: JSON.stringify({ students: rows }) }));
  }
};
export async function syncStudents() {
  if (!hasApi || !getSession()) return getStudents();
  const local = getStudents();
  const remote = (await api('/api/students')).students || [];
  if (!remote.length && local.length) {
    await api('/api/students', { method: 'PUT', body: JSON.stringify({ students: local }) });
    return local;
  }
  S('bh_students', remote);
  return remote;
}
