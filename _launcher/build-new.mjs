// Finds every Vite (Google AI Studio) site without a dist build, installs once and builds it.
// Calls vite through node directly, so folder names with "&" or "—" work.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--all');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

for (const name of fs.readdirSync(ROOT)) {
  const dir = path.join(ROOT, name);
  if (!fs.statSync(dir).isDirectory() || name.startsWith('_')) continue;
  const isVite = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'].some((f) => fs.existsSync(path.join(dir, f)));
  if (!isVite) continue;
  if (!force && fs.existsSync(path.join(dir, 'dist', 'index.html'))) { console.log('ok      ' + name); continue; }
  try {
    if (!fs.existsSync(path.join(dir, 'node_modules', 'vite'))) {
      console.log('install ' + name);
      execFileSync(npm, ['install', '--no-audit', '--no-fund', '--loglevel=error', '--legacy-peer-deps'], { cwd: dir, stdio: 'inherit', shell: true });
    }
    console.log('build   ' + name);
    execFileSync(process.execPath, [path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--base', './'], { cwd: dir, stdio: 'inherit' });
    console.log('done    ' + name);
  } catch (e) {
    console.log('FAILED  ' + name + ' : ' + e.message);
  }
}
