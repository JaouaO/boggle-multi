import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUTPUT_PATH = join(ROOT, 'audit-inline-css.generated.json');

const INCLUDED_DIRS = [
  'public/js',
];

const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.wrangler',
  'dist',
  'build',
]);

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDED_DIR_NAMES.has(entry)) {
        files.push(...walk(fullPath));
      }

      continue;
    }

    if (stat.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function getLineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function getLineAt(source, index) {
  const lineStart = source.lastIndexOf('\n', index) + 1;
  const lineEnd = source.indexOf('\n', index);

  return source
    .slice(lineStart, lineEnd === -1 ? source.length : lineEnd)
    .trim();
}

function addFinding(findings, file, source, index, type) {
  findings.push({
    file,
    line: getLineNumber(source, index),
    type,
    snippet: getLineAt(source, index),
  });
}

function findAll(source, pattern) {
  const matches = [];

  for (const match of source.matchAll(pattern)) {
    matches.push(match.index ?? 0);
  }

  return matches;
}

function analyzeFile(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const file = relative(ROOT, filePath).replaceAll('\\', '/');
  const findings = [];

  for (const index of findAll(source, /\b\w+\.style\.[A-Za-z_$][\w$]*\s*=/g)) {
    addFinding(findings, file, source, index, 'element.style access');
  }

  for (const index of findAll(source, /\b\w+\.style\.setProperty\s*\(/g)) {
    addFinding(findings, file, source, index, 'style.setProperty');
  }

  for (const index of findAll(source, /\b\w+\.style\.cssText\s*=/g)) {
    addFinding(findings, file, source, index, 'style.cssText');
  }

  for (const index of findAll(source, /\.setAttribute\s*\(\s*["']style["']/g)) {
    addFinding(findings, file, source, index, 'html style attribute');
  }

  for (const index of findAll(source, /document\.createElement\s*\(\s*["']style["']\s*\)/g)) {
    addFinding(findings, file, source, index, 'create style element');
  }

  for (const index of findAll(source, /createStyleElementOnce\s*\(/g)) {
    addFinding(findings, file, source, index, 'create style element helper');
  }

  return findings.sort((a, b) => a.line - b.line || a.type.localeCompare(b.type));
}

const files = INCLUDED_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
const findingsByFile = {};
let findingCount = 0;

for (const filePath of files) {
  const findings = analyzeFile(filePath);

  if (!findings.length) {
    continue;
  }

  const file = relative(ROOT, filePath).replaceAll('\\', '/');
  findingsByFile[file] = findings;
  findingCount += findings.length;
}

const result = {
  generatedAt: new Date().toISOString(),
  findingCount,
  filesWithFindings: Object.keys(findingsByFile).length,
  findingsByFile,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n', 'utf8');

console.log('Audit écrit dans audit-inline-css.generated.json');
console.log(result.findingCount + ' occurrence(s) trouvée(s).');
console.log(result.filesWithFindings + ' fichier(s) concerné(s).');

for (const [file, findings] of Object.entries(findingsByFile)) {
  console.log('');
  console.log(file);

  const visibleFindings = findings.slice(0, 20);

  for (const finding of visibleFindings) {
    console.log('  L' + finding.line + ' [' + finding.type + '] ' + finding.snippet);
  }

  if (findings.length > visibleFindings.length) {
    console.log('  ... ' + (findings.length - visibleFindings.length) + ' occurrence(s) supplémentaire(s)');
  }
}
