import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const themePath = join(root, "public/js/ui/theme-styles.js");
const source = readFileSync(themePath, "utf8");

function lineOf(index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function extractFunctionBlock(name) {
  const startIndex = source.indexOf("function " + name);
  if (startIndex === -1) {
    return null;
  }

  const openIndex = source.indexOf("{", startIndex);
  let depth = 0;
  let mode = null;
  let escaped = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1] || "";

    if (mode) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === mode) {
        mode = null;
      }
      continue;
    }

    if (char === "`" || char === '"' || char === "'") {
      mode = char;
    } else if (char === "/" && nextChar === "/") {
      const nextLine = source.indexOf("\n", index);
      index = nextLine === -1 ? source.length : nextLine;
    } else if (char === "/" && nextChar === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      index = commentEnd === -1 ? source.length : commentEnd + 1;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return {
          name,
          startIndex,
          line: lineOf(startIndex),
          block: source.slice(startIndex, index + 1),
        };
      }
    }
  }

  return null;
}

function extractCss(block) {
  const match = block.match(/style\.textContent\s*=\s*`([\s\S]*?)`;/);
  return match ? match[1] : "";
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function lineOfCss(css, index) {
  return css.slice(0, index).split(/\r?\n/).length;
}

function normalizeSelector(selector) {
  return selector.trim().replace(/\s+/g, " ");
}

function splitSelectorList(selectorText) {
  return selectorText
    .split(",")
    .map(normalizeSelector)
    .filter(Boolean);
}

function parseRules(css, layerName, layerLine) {
  const cssWithoutComments = stripComments(css);
  const rulePattern = /([^{}@][^{}]*)\{([^{}]*)\}/g;
  const rules = [];
  let match;

  while ((match = rulePattern.exec(cssWithoutComments))) {
    const selectorText = match[1];
    const body = match[2];
    const selectors = splitSelectorList(selectorText);
    const normalizedBody = body.trim();

    if (!selectors.length) {
      continue;
    }

    rules.push({
      layer: layerName,
      approxLine: layerLine + lineOfCss(cssWithoutComments, match.index),
      selectors,
      body: normalizedBody,
      isEmpty: normalizedBody.length === 0,
      isOnlyWhitespace: body.length > 0 && normalizedBody.length === 0,
    });
  }

  return rules;
}

const functionNames = [...source.matchAll(/function\s+(inject[A-Za-z0-9_$]+)\s*\(/g)].map(
  (match) => match[1]
);

const layers = functionNames
  .map((name) => extractFunctionBlock(name))
  .filter(Boolean)
  .map((fn, index) => {
    const css = extractCss(fn.block);
    const rules = parseRules(css, fn.name, fn.line);

    return {
      order: index + 1,
      name: fn.name,
      line: fn.line,
      cssChars: css.length,
      ruleCount: rules.length,
      emptyRuleCount: rules.filter((rule) => rule.isEmpty).length,
      whitespaceOnlyRuleCount: rules.filter((rule) => rule.isOnlyWhitespace).length,
      rules,
    };
  });

const emptyRules = layers.flatMap((layer) =>
  layer.rules
    .filter((rule) => rule.isEmpty)
    .map((rule) => ({
      layer: layer.name,
      approxLine: rule.approxLine,
      selectors: rule.selectors,
      whitespaceOnly: rule.isOnlyWhitespace,
    }))
);

const suspiciousBlankGaps = [];
for (const layer of layers) {
  const css = extractCss(extractFunctionBlock(layer.name).block);
  const lines = css.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (/^\s*$/.test(line) && /^\s*$/.test(lines[index + 1] || "") && /^\s*$/.test(lines[index + 2] || "")) {
      suspiciousBlankGaps.push({
        layer: layer.name,
        approxLine: layer.line + index + 1,
      });
    }
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  source: "public/js/ui/theme-styles.js",
  layerCount: layers.length,
  layers: layers.map(({ rules, ...layer }) => layer),
  emptyRuleCount: emptyRules.length,
  emptyRules,
  suspiciousBlankGapCount: suspiciousBlankGaps.length,
  suspiciousBlankGaps: suspiciousBlankGaps.slice(0, 200),
  notes: [
    "Cet audit ne modifie aucun fichier.",
    "Les règles vides peuvent généralement être supprimées sans impact visuel, mais il faut conserver les blocs @keyframes et les media queries contenant encore des règles utiles.",
    "Les lignes sont approximatives car elles sont calculées depuis les chaînes CSS injectées.",
  ],
};

writeFileSync("audit-css-empty.generated.json", JSON.stringify(report, null, 2));

console.log("Audit écrit dans audit-css-empty.generated.json");
console.log(`${report.layerCount} couche(s) CSS analysées.`);
console.log(`${report.emptyRuleCount} règle(s) CSS vide(s) détectée(s).`);
console.log(`${report.suspiciousBlankGapCount} groupe(s) de lignes vides suspect(s).`);
