// Starts the BuilderHub backend (:4000) and the Vite frontend (:5173) together
// with one command, from either the repo root or the frontend folder.
// No extra dependencies required.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const children = [];
let closing = false;

function run(name, command, args, { cwd = repo, shell = false } = {}) {
  const child = spawn(command, args, { cwd, shell });
  const tag = `[${name}]`;
  const forward = (stream) => stream.on('data', (buf) => {
    const text = buf.toString().replace(/\s+$/, '');
    if (text) process.stdout.write(text.split('\n').map((line) => `${tag} ${line}`).join('\n') + '\n');
  });
  forward(child.stdout);
  forward(child.stderr);
  child.on('error', (e) => console.log(`${tag} failed to start: ${e.message}`));
  child.on('exit', (code) => {
    if (closing) return;
    console.log(`${tag} stopped (exit ${code}). The other process keeps running — press Ctrl+C to stop everything.`);
  });
  children.push(child);
}

function shutdown() {
  if (closing) return;
  closing = true;
  for (const child of children) {
    try {
      if (isWin && child.pid) {
        spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch { /* ignore */ }
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('BuilderHub → backend http://127.0.0.1:4000  +  frontend http://127.0.0.1:5173');
console.log('Press Ctrl+C to stop both.');

// Backend: run node directly.
run('server', process.execPath, [path.join(repo, 'server', 'index.js')]);
// Frontend: use the vite-only script so this launcher can be called from `dev` anywhere.
run('web', npm, ['--prefix', 'frontend', 'run', 'dev:web'], { shell: isWin });
