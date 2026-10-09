import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const mainPath = path.join(rootDir, "public", "js", "main.js");
const outputPath = path.join(rootDir, "audit-main-js.generated.json");
const source = fs.readFileSync(mainPath, "utf8");
const lineStarts = buildLineStarts(source);

const functions = collectFunctionDeclarations(source).map((item) => {
  const body = source.slice(item.openBraceIndex, item.closeBraceIndex + 1);
  const startLine = getLineNumber(item.index);
  const endLine = getLineNumber(item.closeBraceIndex);
  const length = endLine - startLine + 1;
  const category = categorizeFunction(item.name);
  const coupling = getFunctionCoupling(body);

  return {
    name: item.name,
    category,
    line: startLine,
    endLine,
    length,
    coupling,
    extractionRisk: getExtractionRisk(coupling),
  };
});

const categories = countBy(functions, "category");
const extractionRisk = countBy(functions, "extractionRisk");
const longestFunctions = [...functions]
  .sort((a, b) => b.length - a.length || a.line - b.line)
  .slice(0, 25);
const lowRiskUtilityCandidates = functions
  .filter((item) => item.extractionRisk === "low" && item.length >= 8)
  .sort((a, b) => b.length - a.length || a.line - b.line)
  .slice(0, 25)
  .map(({ name, category, line, endLine, length }) => ({
    name,
    category,
    line,
    endLine,
    length,
  }));

const report = {
  generatedAt: new Date().toISOString(),
  file: "public/js/main.js",
  summary: {
    lineCount: source.split(/\r?\n/).length,
    functionCount: functions.length,
    longFunctionThreshold: 80,
    longFunctionCount: functions.filter((item) => item.length >= 80).length,
    stateCoupledFunctionCount: functions.filter((item) => item.coupling.state).length,
    socketCoupledFunctionCount: functions.filter((item) => item.coupling.socket).length,
    domCoupledFunctionCount: functions.filter((item) => item.coupling.dom).length,
    lowRiskUtilityCandidateCount: lowRiskUtilityCandidates.length,
  },
  categories,
  extractionRisk,
  longestFunctions,
  lowRiskUtilityCandidates,
  notes: [
    "Les fonctions high sont à éviter pour les prochains découpages sans tests dédiés.",
    "Les fonctions lowRiskUtilityCandidates sont de meilleurs candidats pour un nettoyage progressif.",
  ],
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("Audit écrit dans audit-main-js.generated.json");
console.log(`${report.summary.functionCount} fonction(s) analysée(s) dans main.js.`);
console.log(`${report.summary.longFunctionCount} fonction(s) de ${report.summary.longFunctionThreshold} lignes ou plus.`);
console.log(`${report.summary.lowRiskUtilityCandidateCount} candidat(s) utilitaire(s) à faible risque.`);

function collectFunctionDeclarations(text) {
  const results = [];
  const functionRegex = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let match;

  while ((match = functionRegex.exec(text))) {
    const openBraceIndex = text.indexOf("{", match.index);

    if (openBraceIndex === -1) {
      continue;
    }

    const closeBraceIndex = findMatchingBrace(text, openBraceIndex);

    if (closeBraceIndex === -1) {
      continue;
    }

    results.push({
      name: match[1],
      index: match.index,
      openBraceIndex,
      closeBraceIndex,
    });
  }

  return results;
}

function findMatchingBrace(text, openBraceIndex) {
  let depth = 0;
  let mode = "normal";

  for (let index = openBraceIndex; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];
    const previousChar = text[index - 1];

    if (mode === "line-comment") {
      if (char === "\n") {
        mode = "normal";
      }
      continue;
    }

    if (mode === "block-comment") {
      if (char === "*" && nextChar === "/") {
        mode = "normal";
        index += 1;
      }
      continue;
    }

    if (mode === "single-quote") {
      if (char === "'" && previousChar !== "\\") {
        mode = "normal";
      }
      continue;
    }

    if (mode === "double-quote") {
      if (char === '"' && previousChar !== "\\") {
        mode = "normal";
      }
      continue;
    }

    if (mode === "template") {
      if (char === "`" && previousChar !== "\\") {
        mode = "normal";
      }
      continue;
    }

    if (char === "/" && nextChar === "/") {
      mode = "line-comment";
      index += 1;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      mode = "block-comment";
      index += 1;
      continue;
    }

    if (char === "'") {
      mode = "single-quote";
      continue;
    }

    if (char === '"') {
      mode = "double-quote";
      continue;
    }

    if (char === "`") {
      mode = "template";
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function getFunctionCoupling(body) {
  return {
    state: /\bstate\./.test(body),
    socket: /\bstate\.socket\b|\bsend\s*\(|\bcreateRoomSocket\b/.test(body),
    dom: /\bdocument\b|\bwindow\b|\.querySelector\b|\.classList\b|\.append\b|\.hidden\b|\.textContent\b|\.style\b/.test(body),
    storage: /\blocalStorage\b|\bsessionStorage\b|readLocal|saveLocal|readSession|saveSession/.test(body),
    effects: /AudioContext|confetti|setTimeout|setInterval|requestAnimationFrame/.test(body),
  };
}

function getExtractionRisk(coupling) {
  if (coupling.socket || (coupling.state && coupling.dom)) {
    return "high";
  }

  if (coupling.state || coupling.dom || coupling.storage || coupling.effects) {
    return "medium";
  }

  return "low";
}

function categorizeFunction(name) {
  if (/^(render|refresh|update)/.test(name)) {
    return "rendering";
  }

  if (/^(handle|bind|setup|connect|start|submit|send)/.test(name)) {
    return "interaction";
  }

  if (/^(create|build|make)/.test(name)) {
    return "factory";
  }

  if (/^(get|is|can|has|normalize|calculate|compute|rank|format|clamp|score|sanitize)/.test(name)) {
    return "utility";
  }

  if (/^(play|stop|schedule|clear|trigger|show|hide)/.test(name)) {
    return "runtime-effect";
  }

  if (/^(read|save|load|forget)/.test(name)) {
    return "storage";
  }

  return "other";
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key];
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function buildLineStarts(text) {
  const starts = [0];

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      starts.push(index + 1);
    }
  }

  return starts;
}

function getLineNumber(index) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);

    if (lineStarts[middle] <= index) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return high + 1;
}
