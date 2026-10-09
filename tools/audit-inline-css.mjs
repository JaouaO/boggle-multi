import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const roots = ['public'];
const extensions = new Set(['.html', '.js', '.mjs', '.ts', '.jsx', '.tsx']);
const ignoredParts = [
  'node_modules',
  '.wrangler',
  '.git',
  'dist',
  'build',
  '.generated.',
];

const patterns = [
  { name: 'html style attribute', regex: /\sstyle\s*=/g },
  { name: 'element.style access', regex: /\.style(?:\.|\[)/g },
  { name: 'style.setProperty', regex: /\.style\.setProperty\s*\(/g },
  { name: 'cssText', regex: /\.cssText\s*=/g },
  { name: 'create style element', regex: /createElement\s*\(\s*["'`]style["'`]\s*\)/g },
  { name: 'style tag', regex: /<style\b/g },
  { name: 'insertRule', regex: /\.insertRule\s*\(/g },
  { name: 'adoptedStyleSheets', regex: /adoptedStyleSheets/g },
  { name: 'innerHTML', regex: /\.innerHTML\s*=/g },
  { name: 'insertAdjacentHTML', regex: /\.insertAdjacentHTML\s*\(/g },
];

function hasIgnoredPart(path) {
  return ignoredParts.some((part) => path.includes(part));
}

function getExtension(path) {
  const match = path.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(process.cwd(), path).replaceAll('\\', '/');

    if (hasIgnoredPart(rel)) {
      continue;
    }

    const info = statSync(path);

    if (info.isDirectory()) {
      walk(path, files);
      continue;
    }

    if (extensions.has(getExtension(path))) {
      files.push(path);
    }
  }

  return files;
}

function getLineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

function getLine(text, lineNumber) {
  return text.split('\n')[lineNumber - 1]?.trim() || '';
}

const findings = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const rel = relative(process.cwd(), file).replaceAll('\\', '/');
    const text = readFileSync(file, 'utf8');

    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern.regex)) {
        const line = getLineNumber(text, match.index ?? 0);
        findings.push({
          file: rel,
          line,
          type: pattern.name,
          snippet: getLine(text, line).slice(0, 240),
        });
      }
    }
  }
}

const grouped = findings.reduce((acc, finding) => {
  acc[finding.file] ||= [];
  acc[finding.file].push(finding);
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  scannedRoots: roots,
  findingCount: findings.length,
  filesWithFindings: Object.keys(grouped).length,
  findingsByFile: grouped,
};

writeFileSync('audit-inline-css.generated.json', JSON.stringify(report, null, 2), 'utf8');

console.log(`Audit écrit dans audit-inline-css.generated.json`);
console.log(`${findings.length} occurrence(s) trouvée(s).`);
console.log(`${Object.keys(grouped).length} fichier(s) concerné(s).`);

for (const [file, items] of Object.entries(grouped)) {
  console.log(`\n${file}`);
  for (const item of items.slice(0, 20)) {
    console.log(`  L${item.line} [${item.type}] ${item.snippet}`);
  }
  if (items.length > 20) {
    console.log(`  ... ${items.length - 20} occurrence(s) supplémentaire(s)`);
  }
}