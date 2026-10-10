import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const cssPath = 'public/css/style.css';
const jsRoot = 'public/js';
const outPath = 'audit-v86-technical-debt.generated.md';

const css = readFileSync(cssPath, 'utf8');

const layoutProperties = new Set([
  'display',
  'position',
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-column',
  'grid-row',
  'flex',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'justify-content',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'gap',
  'row-gap',
  'column-gap',
  'overflow',
  'overflow-x',
  'overflow-y',
  'font-size',
  'line-height',
  'white-space',
  'text-overflow',
]);

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function normalizeSelector(selector) {
  return selector
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function parseDeclarations(body) {
  return body
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colonIndex = part.indexOf(':');

      if (colonIndex === -1) {
        return null;
      }

      return {
        property: part.slice(0, colonIndex).trim(),
        value: part.slice(colonIndex + 1).trim(),
      };
    })
    .filter(Boolean);
}

function nearestCommentBefore(source, index) {
  const before = source.slice(0, index);
  const commentStart = before.lastIndexOf('/*');

  if (commentStart === -1) {
    return '';
  }

  const commentEnd = before.indexOf('*/', commentStart);

  if (commentEnd === -1 || commentEnd > before.length) {
    return '';
  }

  const comment = before
    .slice(commentStart, commentEnd + 2)
    .replace(/\/\*|\*\//g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ');

  return comment.slice(0, 180);
}

function auditCss() {
  const blockRegex = /([^{}@][^{}]*)\{([^{}]*)\}/gs;
  const declarationsBySelectorProperty = new Map();
  const blocks = [];

  for (const match of css.matchAll(blockRegex)) {
    const selector = normalizeSelector(match[1]);
    const body = match[2];
    const line = lineNumberAt(css, match.index);
    const declarations = parseDeclarations(body);

    if (!declarations.length) {
      continue;
    }

    blocks.push({ selector, line, declarations });

    for (const declaration of declarations) {
      const key = `${selector}|||${declaration.property}`;

      if (!declarationsBySelectorProperty.has(key)) {
        declarationsBySelectorProperty.set(key, []);
      }

      declarationsBySelectorProperty.get(key).push({
        line,
        value: declaration.value,
        context: nearestCommentBefore(css, match.index),
      });
    }
  }

  const repeated = [...declarationsBySelectorProperty.entries()]
    .map(([key, occurrences]) => {
      const [selector, property] = key.split('|||');
      const distinctValues = [...new Set(occurrences.map((item) => item.value))];

      return {
        selector,
        property,
        occurrences,
        count: occurrences.length,
        distinctValueCount: distinctValues.length,
        isLayout: layoutProperties.has(property),
      };
    })
    .filter((item) => item.count >= 2)
    .sort((a, b) => {
      if (a.isLayout !== b.isLayout) {
        return a.isLayout ? -1 : 1;
      }

      return b.count - a.count || b.distinctValueCount - a.distinctValueCount;
    });

  const conflicting = repeated.filter((item) => item.distinctValueCount >= 2);
  const layoutConflicting = conflicting.filter((item) => item.isLayout);

  return {
    blockCount: blocks.length,
    repeated,
    conflicting,
    layoutConflicting,
  };
}

function listFiles(dir, extension) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...listFiles(fullPath, extension));
    } else if (entry.endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

function auditJs() {
  const files = listFiles(jsRoot, '.js');
  const functions = [];
  const functionNameIndex = new Map();

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const lines = source.split(/\r?\n/);
    const rel = relative('.', file);

    const patterns = [
      {
        type: 'function',
        regex: /\bfunction\s+([A-Za-z0-9_$]+)\s*\(/g,
      },
      {
        type: 'arrow',
        regex: /\b(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/g,
      },
      {
        type: 'method',
        regex: /^\s*([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/gm,
      },
    ];

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern.regex)) {
        const name = match[1];

        if (!name || ['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
          continue;
        }

        const line = lineNumberAt(source, match.index);
        const startLineIndex = line - 1;

        let endLineIndex = startLineIndex;
        let depth = 0;
        let hasOpened = false;

        for (let index = startLineIndex; index < lines.length; index += 1) {
          const current = lines[index];

          for (const char of current) {
            if (char === '{') {
              depth += 1;
              hasOpened = true;
            } else if (char === '}') {
              depth -= 1;
            }
          }

          if (hasOpened && depth <= 0) {
            endLineIndex = index;
            break;
          }
        }

        const length = Math.max(1, endLineIndex - startLineIndex + 1);

        const item = {
          file: rel,
          name,
          type: pattern.type,
          line,
          length,
        };

        functions.push(item);

        if (!functionNameIndex.has(name)) {
          functionNameIndex.set(name, []);
        }

        functionNameIndex.get(name).push(item);
      }
    }
  }

  const longFunctions = functions
    .filter((item) => item.length >= 80)
    .sort((a, b) => b.length - a.length);

  const duplicatedNames = [...functionNameIndex.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));

  return {
    fileCount: files.length,
    functionCount: functions.length,
    longFunctions,
    duplicatedNames,
  };
}

const cssAudit = auditCss();
const jsAudit = auditJs();

const report = [];

report.push('# Audit v86 — dette technique CSS/JS');
report.push('');
report.push('## Résumé');
report.push('');
report.push(`- Blocs CSS analysés : ${cssAudit.blockCount}`);
report.push(`- Propriétés CSS répétées : ${cssAudit.repeated.length}`);
report.push(`- Propriétés CSS contradictoires : ${cssAudit.conflicting.length}`);
report.push(`- Propriétés CSS de layout contradictoires : ${cssAudit.layoutConflicting.length}`);
report.push(`- Fichiers JS analysés : ${jsAudit.fileCount}`);
report.push(`- Fonctions JS détectées : ${jsAudit.functionCount}`);
report.push(`- Fonctions JS longues, 80 lignes et plus : ${jsAudit.longFunctions.length}`);
report.push(`- Noms de fonctions répétés : ${jsAudit.duplicatedNames.length}`);
report.push('');

report.push('## CSS — contradictions de layout prioritaires');
report.push('');

for (const item of cssAudit.layoutConflicting.slice(0, 80)) {
  report.push(`### ${item.count}× — \`${item.selector}\` / \`${item.property}\``);

  for (const occurrence of item.occurrences.slice(0, 12)) {
    report.push(`- L${occurrence.line} : \`${occurrence.value}\``);

    if (occurrence.context) {
      report.push(`  - Contexte : ${occurrence.context}`);
    }
  }

  if (item.occurrences.length > 12) {
    report.push(`- … ${item.occurrences.length - 12} autre(s) occurrence(s)`);
  }

  report.push('');
}

report.push('## CSS — autres contradictions fréquentes');
report.push('');

for (const item of cssAudit.conflicting.filter((item) => !item.isLayout).slice(0, 60)) {
  report.push(`### ${item.count}× — \`${item.selector}\` / \`${item.property}\``);

  for (const occurrence of item.occurrences.slice(0, 8)) {
    report.push(`- L${occurrence.line} : \`${occurrence.value}\``);
  }

  if (item.occurrences.length > 8) {
    report.push(`- … ${item.occurrences.length - 8} autre(s) occurrence(s)`);
  }

  report.push('');
}

report.push('## JS — fonctions longues');
report.push('');

for (const item of jsAudit.longFunctions.slice(0, 80)) {
  report.push(`- \`${item.name}\` — ${item.length} lignes — ${item.file}:L${item.line}`);
}

report.push('');
report.push('## JS — noms de fonctions répétés');
report.push('');

for (const item of jsAudit.duplicatedNames.slice(0, 80)) {
  report.push(`### \`${item.name}\` — ${item.items.length} occurrence(s)`);

  for (const occurrence of item.items) {
    report.push(`- ${occurrence.file}:L${occurrence.line} — ${occurrence.type}, ${occurrence.length} lignes`);
  }

  report.push('');
}

writeFileSync(outPath, report.join('\n'), 'utf8');

console.log(`[ok] audit écrit dans ${outPath}`);
console.log(`[css] contradictions layout : ${cssAudit.layoutConflicting.length}`);
console.log(`[js] fonctions longues : ${jsAudit.longFunctions.length}`);
console.log(`[js] noms répétés : ${jsAudit.duplicatedNames.length}`);