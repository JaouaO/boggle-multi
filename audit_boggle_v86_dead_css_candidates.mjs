import { readFileSync, writeFileSync } from 'node:fs';

const cssPath = 'public/css/style.css';
const outPath = 'audit-v86-dead-css-candidates.generated.md';

const css = readFileSync(cssPath, 'utf8');

const watchedProperties = new Set([
  'display',
  'position',
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-column',
  'grid-row',
  'flex',
  'flex-direction',
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
  'margin-bottom',
  'margin-inline',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-inline',
  'gap',
  'overflow',
  'overflow-x',
  'overflow-y',
  'font-size',
  'line-height',
  'white-space',
  'text-overflow',
  'word-break',
  'overflow-wrap',
]);

const importantSelectors = [
  '#boggle-shell',
  '#boggle-layout',
  '#boggle-left',
  '#boggle-center',
  '#boggle-right',
  '#launch-panel',
  '#welcome-panel',
  '#mode-controls',
  '#play-status-panel',
  '#game-status',
  '#timer',
  '#end-game',
  '#help-panel',
  '#rules-summary',
  '#board',
  '#found-words-panel',
  '#found-words',
  '#players-panel',
  '#players-list',
];

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function normalizeSelector(selector) {
  return selector.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
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
    return 'Sans commentaire proche';
  }

  const commentEnd = source.indexOf('*/', commentStart);

  if (commentEnd === -1 || commentEnd > index) {
    return 'Sans commentaire proche';
  }

  return source
    .slice(commentStart, commentEnd + 2)
    .replace(/\/\*|\*\//g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 220);
}

function selectorIsImportant(selector) {
  return importantSelectors.some((needle) => selector.includes(needle));
}

const rules = [];
const blockRegex = /([^{}@][^{}]*)\{([^{}]*)\}/gs;

for (const match of css.matchAll(blockRegex)) {
  const selector = normalizeSelector(match[1]);
  const body = match[2];

  if (!selectorIsImportant(selector)) {
    continue;
  }

  const declarations = parseDeclarations(body).filter((declaration) =>
    watchedProperties.has(declaration.property)
  );

  if (!declarations.length) {
    continue;
  }

  const line = lineNumberAt(css, match.index);
  const context = nearestCommentBefore(css, match.index);

  rules.push({
    selector,
    line,
    context,
    declarations,
  });
}

const groups = new Map();

for (const rule of rules) {
  for (const declaration of rule.declarations) {
    const key = `${rule.selector}|||${declaration.property}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push({
      ...rule,
      property: declaration.property,
      value: declaration.value,
    });
  }
}

const overridden = [];

for (const [key, occurrences] of groups.entries()) {
  if (occurrences.length < 2) {
    continue;
  }

  const winner = occurrences[occurrences.length - 1];

  for (const loser of occurrences.slice(0, -1)) {
    overridden.push({
      selector: loser.selector,
      property: loser.property,
      oldValue: loser.value,
      oldLine: loser.line,
      oldContext: loser.context,
      winnerValue: winner.value,
      winnerLine: winner.line,
      winnerContext: winner.context,
    });
  }
}

const byContext = new Map();

for (const item of overridden) {
  if (!byContext.has(item.oldContext)) {
    byContext.set(item.oldContext, []);
  }

  byContext.get(item.oldContext).push(item);
}

const contextSummary = [...byContext.entries()]
  .map(([context, items]) => ({
    context,
    items,
    count: items.length,
    selectors: new Set(items.map((item) => item.selector)),
    properties: new Set(items.map((item) => item.property)),
  }))
  .sort((a, b) => b.count - a.count);

const report = [];

report.push('# Audit v86 — candidats CSS morts ou surchargés');
report.push('');
report.push('Cet audit ne supprime rien.');
report.push('');
report.push('Il liste les anciennes déclarations de layout qui sont redéfinies plus bas par une règle gagnante sur le même sélecteur et la même propriété.');
report.push('');
report.push('## Résumé');
report.push('');
report.push(`- Règles importantes analysées : ${rules.length}`);
report.push(`- Déclarations potentiellement surchargées : ${overridden.length}`);
report.push(`- Contextes anciens concernés : ${contextSummary.length}`);
report.push('');

report.push('## Contextes les plus surchargés');
report.push('');

for (const group of contextSummary.slice(0, 30)) {
  report.push(`### ${group.count} déclaration(s) surchargée(s)`);
  report.push(`Contexte : ${group.context}`);
  report.push(`- Sélecteurs concernés : ${group.selectors.size}`);
  report.push(`- Propriétés concernées : ${group.properties.size}`);
  report.push('');

  for (const item of group.items.slice(0, 12)) {
    report.push(`- L${item.oldLine} — \`${item.selector}\` / \`${item.property}\``);
    report.push(`  - Ancienne valeur : \`${item.oldValue}\``);
    report.push(`  - Gagnant plus bas : L${item.winnerLine} — \`${item.winnerValue}\``);
    report.push(`  - Contexte gagnant : ${item.winnerContext}`);
  }

  if (group.items.length > 12) {
    report.push(`- … ${group.items.length - 12} autre(s) déclaration(s)`);
  }

  report.push('');
}

report.push('## Lecture recommandée');
report.push('');
report.push('- Un contexte avec beaucoup de déclarations surchargées est un bon candidat au nettoyage.');
report.push('- Ne pas supprimer automatiquement : certaines règles anciennes peuvent encore contenir des styles visuels utiles.');
report.push('- Priorité : nettoyer d’abord layout général et accueil/options.');
report.push('- Ne pas toucher au plateau tant que le rendu est bon.');

writeFileSync(outPath, report.join('\n'), 'utf8');

console.log(`[ok] audit écrit dans ${outPath}`);
console.log(`[info] ${overridden.length} déclaration(s) potentiellement surchargée(s)`);
console.log('[next] run: Get-Content audit-v86-dead-css-candidates.generated.md -TotalCount 260');