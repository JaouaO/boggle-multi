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

function splitSelectorList(selectorsText) {
  return selectorsText
    .split(",")
    .map((selector) => selector.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function parseDeclarations(body) {
  const declarations = [];
  for (const raw of body.split(";")) {
    const index = raw.indexOf(":");
    if (index === -1) {
      continue;
    }

    const property = raw.slice(0, index).trim();
    const value = raw.slice(index + 1).trim();

    if (!property || !value || property.startsWith("@")) {
      continue;
    }

    declarations.push({
      property,
      value,
    });
  }

  return declarations;
}

function parseRules(css, layerName) {
  const clean = stripComments(css);
  const rules = [];
  const rulePattern = /([^{}@][^{}]*)\{([^{}]*)\}/g;
  let match;

  while ((match = rulePattern.exec(clean))) {
    const selectors = splitSelectorList(match[1]);
    const declarations = parseDeclarations(match[2]);

    if (selectors.every((selector) => /^(?:from|to|\d+(?:\.\d+)?%)$/.test(selector))) {
      continue;
    }

    if (!selectors.length || !declarations.length) {
      continue;
    }

    for (const selector of selectors) {
      for (const declaration of declarations) {
        rules.push({
          layer: layerName,
          selector,
          property: declaration.property,
          value: declaration.value,
        });
      }
    }
  }

  return rules;
}

const functionNames = [...source.matchAll(/function\s+(inject[A-Za-z0-9_$]+)\s*\(/g)]
  .map((match) => match[1]);

const layers = functionNames
  .map((name) => extractFunctionBlock(name))
  .filter(Boolean)
  .map((fn, index) => {
    const css = extractCss(fn.block);
    const rules = parseRules(css, fn.name);

    return {
      order: index + 1,
      name: fn.name,
      line: fn.line,
      cssChars: css.length,
      ruleCount: rules.length,
      rules,
    };
  });

const latestBySelectorProperty = new Map();
const overridden = [];

for (const layer of layers) {
  for (const rule of layer.rules) {
    const key = `${rule.selector}\u0000${rule.property}`;
    const previous = latestBySelectorProperty.get(key);

    if (previous) {
      overridden.push({
        selector: rule.selector,
        property: rule.property,
        previousLayer: previous.layer,
        previousValue: previous.value,
        overridingLayer: rule.layer,
        overridingValue: rule.value,
        valueChange: classifyValueChange(previous.value, rule.value),
      });
    }

    latestBySelectorProperty.set(key, rule);
  }
}

const pairCounts = new Map();
const selectorCounts = new Map();
const propertyCounts = new Map();

for (const item of overridden) {
  const pairKey = `${item.previousLayer} -> ${item.overridingLayer}`;
  pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
  selectorCounts.set(item.selector, (selectorCounts.get(item.selector) || 0) + 1);
  propertyCounts.set(item.property, (propertyCounts.get(item.property) || 0) + 1);
}

function topEntries(map, limit = 30) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function normalizeCssValue(value) {
  return value
    .replace(/!important/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyValueChange(previousValue, overridingValue) {
  return normalizeCssValue(previousValue) === normalizeCssValue(overridingValue)
    ? "same-normalized-value"
    : "changed-value";
}

const finalLayerNames = new Set([
  "injectTopLaunchEndScreenLayoutV39",
  "injectRulesHelpOptionsPanelV38",
  "injectFoundWordsPanelV37",
  "injectFinalBoardInputV36",
  "injectFinalButtonsV34",
]);

const legacyOverriddenByFinalAll = overridden.filter((item) =>
  item.previousLayer === "injectLegacyThemeFoundationV42" &&
  finalLayerNames.has(item.overridingLayer)
);

const report = {
  generatedAt: new Date().toISOString(),
  source: "public/js/ui/theme-styles.js",
  layerCount: layers.length,
  layers: layers.map(({ rules, ...layer }) => layer),
  overrideCount: overridden.length,
  sameValueOverrideCount: overridden.filter((item) => item.valueChange === "same-normalized-value").length,
  changedValueOverrideCount: overridden.filter((item) => item.valueChange === "changed-value").length,
  overridePairs: topEntries(pairCounts, 50),
  hotSelectors: topEntries(selectorCounts, 50),
  hotProperties: topEntries(propertyCounts, 50),
  legacyOverriddenByFinalCount: legacyOverriddenByFinalAll.length,
  legacyOverriddenByFinalSameValueCount: legacyOverriddenByFinalAll.filter((item) =>
    item.valueChange === "same-normalized-value"
  ).length,
  legacyOverriddenByFinalChangedValueCount: legacyOverriddenByFinalAll.filter((item) =>
    item.valueChange === "changed-value"
  ).length,
  legacyOverriddenByFinal: legacyOverriddenByFinalAll.slice(0, 250),
  notes: [
    "Cet audit est indicatif : il repère les mêmes couples sélecteur/propriété redéfinis plus tard dans la cascade.",
    "Les étapes de keyframes from/to/0%/100% sont exclues pour éviter les faux positifs entre animations différentes.",
    "valueChange ignore uniquement !important et les variations d'espaces, afin de distinguer les valeurs vraiment changées des renforcements de priorité.",
    "Il ne prouve pas seul qu'une règle peut être supprimée : media queries, spécificité et états pseudo-classes doivent être relus.",
    "Les meilleurs candidats de suppression sont les règles legacy écrasées par les couches finales V34 à V39."
  ],
};

writeFileSync("audit-css-overrides.generated.json", JSON.stringify(report, null, 2));

console.log("Audit écrit dans audit-css-overrides.generated.json");
console.log(`${report.layerCount} couche(s) CSS analysées.`);
console.log(`${report.overrideCount} redéfinition(s) sélecteur/propriété détectée(s).`);
console.log(`${report.legacyOverriddenByFinalCount} redéfinition(s) legacy -> couches finales.`);
