import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const mainPath = join(root, "public/js/main.js");
const main = readFileSync(mainPath, "utf8");
const lines = main.split(/\r?\n/);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineOf(index) {
  return main.slice(0, index).split(/\r?\n/).length;
}

function collectFiles(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      collectFiles(full, predicate, out);
    } else if (stat.isFile() && predicate(full)) {
      out.push(full);
    }
  }

  return out;
}

function count(values) {
  const map = {};
  for (const value of values) {
    map[value] = (map[value] || 0) + 1;
  }
  return map;
}

function sortCount(a, b) {
  return b[1] - a[1] || a[0].localeCompare(b[0]);
}

const injectionCalls = [...main.matchAll(/\b(inject[A-Za-z0-9_$]+)\s*\(\s*\)\s*;/g)]
  .map((match) => ({
    name: match[1],
    line: lineOf(match.index),
  }));

const functionDeclarations = [...main.matchAll(/function\s+([A-Za-z0-9_$]+)\s*\(/g)]
  .map((match) => {
    const name = match[1];
    const references = (main.match(new RegExp("\\b" + escapeRegExp(name) + "\\b", "g")) || []).length;

    return {
      name,
      line: lineOf(match.index),
      references,
    };
  });

const injectionFunctions = [];
for (const decl of functionDeclarations.filter((item) => item.name.startsWith("inject"))) {
  const startIndex = main.indexOf("function " + decl.name);
  const nextFunction = main.indexOf("\nfunction ", startIndex + 10);
  const endIndex = nextFunction === -1 ? main.length : nextFunction;
  const block = main.slice(startIndex, endIndex);
  const cssMatch = block.match(/style\.textContent\s*=\s*`([\s\S]*?)`;/);
  const css = cssMatch ? cssMatch[1] : "";
  const idSelectors = [...css.matchAll(/#[A-Za-z0-9_-]+/g)].map((m) => m[0]);
  const classSelectors = [...css.matchAll(/\.[A-Za-z0-9_-]+/g)].map((m) => m[0]);

  injectionFunctions.push({
    name: decl.name,
    line: decl.line,
    blockChars: block.length,
    cssChars: css.length,
    idSelectorCount: idSelectors.length,
    classSelectorCount: classSelectors.length,
    topIdSelectors: Object.entries(count(idSelectors)).sort(sortCount).slice(0, 12),
    topClassSelectors: Object.entries(count(classSelectors)).sort(sortCount).slice(0, 12),
  });
}

const imports = [...main.matchAll(/import\s+\{([^}]+)\}\s+from\s+"([^"]+)";/g)]
  .flatMap((match) =>
    match[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((symbol) => ({
        symbol: symbol.includes(" as ") ? symbol.split(/\s+as\s+/).pop() : symbol,
        source: match[2],
      }))
  )
  .map((item) => ({
    ...item,
    references: (main.match(new RegExp("\\b" + escapeRegExp(item.symbol) + "\\b", "g")) || []).length,
  }));

const jsFiles = collectFiles(join(root, "public/js"), (file) => file.endsWith(".js"))
  .map((file) => relative(root, file).replaceAll("\\", "/"));

const importedSources = new Set(
  [...main.matchAll(/from\s+"([^"]+)";/g)]
    .map((match) => match[1])
    .filter((source) => source.startsWith("./"))
    .map((source) => "public/js/" + source.replace(/^\.\//, ""))
);

const report = {
  generatedAt: new Date().toISOString(),
  main: {
    path: "public/js/main.js",
    lines: lines.length,
    chars: main.length,
  },
  injectionCalls,
  injectionFunctions,
  imports,
  functionDeclarations: functionDeclarations.sort((a, b) => a.references - b.references || a.line - b.line),
  publicJsFiles: jsFiles.map((file) => ({
    file,
    importedByMain: file === "public/js/main.js" || importedSources.has(file),
  })),
  recommendations: [
    "Ne supprimer que les fonctions avec references=1 après vérification manuelle.",
    "Consolider les injections CSS de la plus récente vers l'ancienne, pas l'inverse.",
    "Priorité de fusion CSS : boutons, plateau/saisie, panneaux gauche/droite, popup fin.",
    "Garder une version committée avant chaque suppression de couche CSS."
  ]
};

writeFileSync("audit-css-js.generated.json", JSON.stringify(report, null, 2));
console.log("Audit écrit dans audit-css-js.generated.json");
console.log(`${report.injectionFunctions.length} couche(s) CSS injectées analysées.`);
console.log(`${report.functionDeclarations.length} fonction(s) dans main.js.`);
