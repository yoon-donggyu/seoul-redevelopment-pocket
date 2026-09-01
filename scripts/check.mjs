import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const skipDirs = new Set(['node_modules', '.git', '.vercel']);
const jsFiles = [];
const jsonFiles = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (name.endsWith('.js') || name.endsWith('.mjs')) jsFiles.push(path);
    else if (name.endsWith('.json') || name.endsWith('.geojson')) jsonFiles.push(path);
  }
}

walk(root);

for (const file of jsFiles) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}

for (const file of jsonFiles) {
  JSON.parse(readFileSync(file, 'utf8'));
}

console.log(`OK: JS ${jsFiles.length}개, JSON/GeoJSON ${jsonFiles.length}개 문법 검사 완료`);
