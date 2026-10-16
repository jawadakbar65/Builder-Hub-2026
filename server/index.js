import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '30d';
const FILE = process.env.DB_FILE || './db.json';
const APP_URL = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const SERVER_URL = (process.env.SERVER_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, '');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${SERVER_URL}/api/auth/google/callback`;

if (process.env.NODE_ENV === 'production' && SECRET === 'change-me-in-production') {
  console.warn('WARNING: JWT_SECRET is not set. Refusing to start in production with the default secret.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
// Comma-separated list of allowed browser origins; falls back to reflecting any origin when unset.
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : true, credentials: false }));
app.use(express.json({ limit: '16mb' }));

const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true, index: true },
  hash: { type: String, default: '' }, plan: { type: String, default: 'free' },
  avatar: { type: String, default: '' }, emailVerified: { type: Boolean, default: false },
  providers: { type: [String], default: [] },
}, { timestamps: true }));
const Project = mongoose.model('Project', new mongoose.Schema({
  id: { type: String, required: true }, owner: { type: String, required: true, index: true }, tool: String, name: String,
  data: mongoose.Schema.Types.Mixed, tpl: String, updated: { type: Number, default: Date.now },
}, { timestamps: true }).index({ id: 1, owner: 1 }, { unique: true }));
const Share = mongoose.model('Share', new mongoose.Schema({
  id: { type: String, required: true, unique: true }, tool: String, data: mongoose.Schema.Types.Mixed, tpl: String,
  brand: Boolean, created: { type: Number, default: Date.now },
}, { timestamps: true }));
const StudentData = mongoose.model('StudentData', new mongoose.Schema({
  owner: { type: String, required: true, unique: true, index: true }, rows: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true }));

const emptyDb = () => ({ users: {}, projects: [], shares: {} });
const loadFileDb = () => { try { return { ...emptyDb(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }; } catch { return emptyDb(); } };
const saveFileDb = (db) => fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
// The JSON file is used until MongoDB is connected, so the API can start serving immediately.
let mongoReady = false;
const mongoEnabled = () => mongoReady;

async function migrateJsonData() {
  const legacy = loadFileDb();
  for (const user of Object.values(legacy.users)) {
    if (!user?.email) continue;
    await User.updateOne({ email: user.email.toLowerCase() }, { $setOnInsert: { ...user, email: user.email.toLowerCase() } }, { upsert: true });
  }
  for (const project of legacy.projects) {
    if (!project?.id || !project?.owner) continue;
    await Project.updateOne({ id: project.id, owner: project.owner }, { $setOnInsert: project }, { upsert: true });
  }
  for (const [id, share] of Object.entries(legacy.shares)) {
    await Share.updateOne({ id }, { $setOnInsert: { ...share, id } }, { upsert: true });
  }
}

const store = {
  async getUser(email) {
    const key = email.toLowerCase();
    if (mongoEnabled()) return User.findOne({ email: key }).lean();
    return loadFileDb().users[key] || null;
  },
  async createUser(user) {
    const item = { ...user, email: user.email.toLowerCase() };
    if (mongoEnabled()) return User.create(item);
    const db = loadFileDb(); db.users[item.email] = item; saveFileDb(db); return item;
  },
  async updateUser(email, patch) {
    const key = email.toLowerCase();
    if (mongoEnabled()) { await User.updateOne({ email: key }, { $set: patch }); return; }
    const db = loadFileDb(); if (db.users[key]) { db.users[key] = { ...db.users[key], ...patch }; saveFileDb(db); }
  },
  // Links a federated / passwordless identity to an existing account instead of duplicating it.
  async findOrCreateUser({ email, name, avatar, provider, emailVerified }) {
    const key = email.toLowerCase();
    const existing = await store.getUser(key);
    if (!existing) {
      await store.createUser({
        name: name || key.split('@')[0], email: key, hash: '', plan: 'free',
        avatar: avatar || '', emailVerified: !!emailVerified, providers: provider ? [provider] : [],
      });
      return { user: await store.getUser(key), created: true };
    }
    const providers = new Set([...(existing.providers || []), ...(provider ? [provider] : [])]);
    const patch = { providers: [...providers] };
    if (!existing.avatar && avatar) patch.avatar = avatar;
    if (emailVerified && !existing.emailVerified) patch.emailVerified = true;
    if (!existing.name && name) patch.name = name;
    await store.updateUser(key, patch);
    return { user: await store.getUser(email), created: false };
  },
  async setPlan(email, plan) {
    if (mongoEnabled()) { await User.updateOne({ email }, { $set: { plan } }); return; }
    const db = loadFileDb(); if (db.users[email]) { db.users[email].plan = plan; saveFileDb(db); }
  },
  async listProjects(owner) {
    if (mongoEnabled()) return Project.find({ owner }).sort({ updated: -1 }).lean();
    return loadFileDb().projects.filter((p) => p.owner === owner).sort((a, b) => b.updated - a.updated);
  },
  async saveProject(owner, payload) {
    const item = { ...payload, id: payload.id || crypto.randomBytes(5).toString('hex'), owner, updated: Date.now() };
    if (mongoEnabled()) return Project.findOneAndUpdate({ id: item.id, owner }, { $set: item }, { upsert: true, new: true, lean: true });
    const db = loadFileDb();
    const at = db.projects.findIndex((p) => p.id === item.id && p.owner === owner);
    if (at < 0) db.projects.push(item); else db.projects[at] = { ...db.projects[at], ...item };
    saveFileDb(db); return item;
  },
  async deleteProject(owner, id) {
    if (mongoEnabled()) { await Project.deleteOne({ id, owner }); return; }
    const db = loadFileDb(); db.projects = db.projects.filter((p) => !(p.id === id && p.owner === owner)); saveFileDb(db);
  },
  async createShare(share) {
    const item = { ...share, id: crypto.randomBytes(5).toString('hex'), created: Date.now() };
    if (mongoEnabled()) await Share.create(item);
    else { const db = loadFileDb(); db.shares[item.id] = item; saveFileDb(db); }
    return item;
  },
  async getShare(id) {
    if (mongoEnabled()) return Share.findOne({ id }).lean();
    return loadFileDb().shares[id] || null;
  },
  async getStudents(owner) {
    if (mongoEnabled()) return StudentData.findOne({ owner }).lean().then((d) => d?.rows || []);
    return loadFileDb().students?.[owner] || [];
  },
  async saveStudents(owner, rows) {
    if (mongoEnabled()) { await StudentData.updateOne({ owner }, { $set: { rows } }, { upsert: true }); return; }
    const db = loadFileDb(); db.students = db.students || {}; db.students[owner] = rows; saveFileDb(db);
  },
};

/* ---------- auth helpers ---------- */
const signToken = (email) => jwt.sign({ email }, SECRET, { expiresIn: TOKEN_TTL });
const pub = (user) => ({
  name: user.name, email: user.email, plan: user.plan || 'free',
  avatar: user.avatar || '', emailVerified: !!user.emailVerified, token: signToken(user.email),
});
const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try { req.user = jwt.verify(token, SECRET); next(); } catch { res.status(401).json({ error: 'Please login' }); }
};

const normalizeEmail = (s) => String(s || '').trim().toLowerCase();
const isEmail = (s) => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map((p) => {
  const i = p.indexOf('='); return i < 0 ? [p.trim(), ''] : [p.slice(0, i).trim(), decodeURIComponent(p.slice(i + 1).trim())];
}).filter(([k]) => k));

// Turns "ali.khan@example.com" into a friendly display name.
const nameFromEmail = (email) => email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ---------- password auth ---------- */
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { name, password } = req.body || {};
    if (!String(name || '').trim() || !isEmail(email) || String(password || '').length < 6) {
      return res.status(400).json({ error: 'Enter a name, a valid email, and a password of at least 6 characters' });
    }
    if (await store.getUser(email)) return res.status(409).json({ error: 'Account already exists' });
    const user = { name: String(name).trim(), email, hash: await bcrypt.hash(password, 10), plan: 'free', providers: ['password'] };
    await store.createUser(user);
    res.json(pub(await store.getUser(email)));
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Account already exists' });
    next(e);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const user = await store.getUser(email);
    // Users created via Google / email-only have no password hash and can't use password login.
    if (!user || !user.hash || !(await bcrypt.compare(password, user.hash))) {
      return res.status(401).json({ error: 'Wrong email or password' });
    }
    res.json(pub(user));
  } catch (e) { next(e); }
});

// Returns the signed-in user's profile; also validates the token on page refresh.
app.get('/api/auth/me', auth, async (req, res, next) => {
  try {
    const user = await store.getUser(req.user.email);
    if (!user) return res.status(401).json({ error: 'Session expired' });
    res.json(pub(user));
  } catch (e) { next(e); }
});

/* ---------- Google OAuth 2.0 / OpenID Connect ---------- */
const googleClient = () => new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

app.get('/api/auth/google/start', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ error: 'Google sign-in is not configured on the server' });
  }
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = crypto.randomBytes(24).toString('hex');
  // Signed state stored in an httpOnly cookie: signed = tamper-proof, cookie = bound to this browser (anti login-CSRF).
  const signed = jwt.sign({ state, nonce }, SECRET, { expiresIn: '10m' });
  res.cookie('g_state', signed, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000, path: '/api/auth/google',
  });
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI, response_type: 'code',
    scope: 'openid email profile', state, nonce, access_type: 'online', prompt: 'select_account',
  });
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
});

app.get('/api/auth/google/callback', async (req, res) => {
  const fail = (msg) => res.redirect(`${APP_URL}/#/login?error=${encodeURIComponent(msg)}`);
  try {
    const { code, state, error } = req.query;
    if (error) return fail('Google sign-in was cancelled');
    if (!code || !state) return fail('Invalid Google response');
    const signed = parseCookies(req.headers.cookie).g_state;
    if (!signed) return fail('Your sign-in session expired. Please try again.');
    let claims;
    try { claims = jwt.verify(signed, SECRET); } catch { return fail('Your sign-in session expired. Please try again.'); }
    if (!safeEqual(claims.state, String(state))) return fail('Security check failed. Please try again.');

    const client = googleClient();
    const { tokens } = await client.getToken(String(code));
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) return fail('Your Google email is not verified');
    if (claims.nonce && payload.nonce && claims.nonce !== payload.nonce) return fail('Security check failed. Please try again.');

    const { user } = await store.findOrCreateUser({
      email: normalizeEmail(payload.email), name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture || '', emailVerified: true, provider: 'google',
    });
    res.clearCookie('g_state', { path: '/api/auth/google' });
    res.redirect(`${APP_URL}/#/auth/callback?token=${encodeURIComponent(signToken(user.email))}`);
  } catch (e) {
    console.error('Google callback error:', e.message);
    fail('Could not complete Google sign-in');
  }
});

// Google Identity Services (optional): verify a client-side ID token credential.
app.post('/api/auth/google', async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(501).json({ error: 'Google sign-in is not configured' });
    const credential = req.body?.credential;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential' });
    const ticket = await new OAuth2Client(GOOGLE_CLIENT_ID).verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) return res.status(401).json({ error: 'Google email is not verified' });
    const { user } = await store.findOrCreateUser({
      email: normalizeEmail(payload.email), name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture || '', emailVerified: true, provider: 'google',
    });
    res.json(pub(user));
  } catch (e) {
    console.error('Google credential verification failed:', e.message);
    res.status(401).json({ error: 'Google verification failed' });
  }
});

/* ---------- simple email sign-in (no password, no verification) ---------- */
// Enter any email to sign in; a new account is created automatically on first use.
app.post('/api/auth/email', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    const name = String(req.body?.name || '').trim() || nameFromEmail(email);
    const { user } = await store.findOrCreateUser({ email, name, provider: 'email' });
    res.json(pub(user));
  } catch (e) { next(e); }
});

/* ---------- projects / students / shares / ai / plan ---------- */
app.get('/api/projects', auth, async (req, res, next) => {
  try { res.json({ projects: await store.listProjects(req.user.email) }); } catch (e) { next(e); }
});
app.post('/api/projects', auth, async (req, res, next) => {
  try {
    const { id, tool, name, data, tpl } = req.body || {};
    if (!tool || !data) return res.status(400).json({ error: 'tool and data are required' });
    res.json({ project: await store.saveProject(req.user.email, { id, tool, name, data, tpl }) });
  } catch (e) { next(e); }
});
app.delete('/api/projects/:id', auth, async (req, res, next) => {
  try { await store.deleteProject(req.user.email, req.params.id); res.json({ ok: true }); } catch (e) { next(e); }
});
app.get('/api/students', auth, async (req, res, next) => {
  try { res.json({ students: await store.getStudents(req.user.email) }); } catch (e) { next(e); }
});
app.put('/api/students', auth, async (req, res, next) => {
  try {
    const students = req.body?.students;
    if (!Array.isArray(students)) return res.status(400).json({ error: 'students must be an array' });
    await store.saveStudents(req.user.email, students);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.post('/api/share', async (req, res, next) => {
  try {
    const { tool, data, tpl, brand } = req.body || {};
    if (!tool || !data) return res.status(400).json({ error: 'tool and data are required' });
    res.json({ id: (await store.createShare({ tool, data, tpl, brand })).id });
  } catch (e) { next(e); }
});
app.get('/api/share/:id', async (req, res, next) => {
  try {
    const share = await store.getShare(req.params.id);
    if (!share) return res.status(404).json({ error: 'Link not found' });
    const { tool, data, tpl, brand } = share;
    res.json({ tool, data, tpl, brand });
  } catch (e) { next(e); }
});

app.post('/api/ai/image', async (req, res) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(501).json({ error: 'AI is not configured on the server (set OPENAI_API_KEY)' });
  try {
    const sz = String(req.body?.size || '1024x1024');
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt: String(req.body?.prompt || '').slice(0, 1000), size: ['1024x1024', '1024x1536', '1536x1024'].includes(sz) ? sz : '1024x1024' }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: j.error?.message || 'AI provider error' });
    res.json({ b64: j.data?.[0]?.b64_json, url: j.data?.[0]?.url });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/api/plan/upgrade', auth, async (req, res, next) => {
  try {
    if (process.env.ALLOW_FAKE_UPGRADE !== 'true') return res.status(402).json({ error: 'Payment gateway not configured yet' });
    await store.setPlan(req.user.email, 'pro');
    res.json({ plan: 'pro' });
  } catch (e) { next(e); }
});

app.get('/api/health', (_, res) => res.json({ ok: true, database: mongoEnabled() ? 'mongodb' : 'json', google: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message });
});

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    console.log(`MONGODB_URI not set; using local JSON storage at ${FILE}`);
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || 8000),
    });
    await migrateJsonData();
    mongoReady = true;
    console.log(`MongoDB connected${mongoose.connection.name ? ` (${mongoose.connection.name})` : ''}`);
  } catch (e) {
    mongoReady = false;
    await mongoose.disconnect().catch(() => {});
    console.warn(`MongoDB unavailable (${e.message}); using local JSON storage at ${FILE}`);
  }
}

// Start listening right away so the frontend never hits "connection refused" while MongoDB connects.
app.listen(PORT, () => console.log(`BuilderHub API on http://localhost:${PORT}`));
connectMongo().catch((e) => console.warn('MongoDB connection error:', e.message));
