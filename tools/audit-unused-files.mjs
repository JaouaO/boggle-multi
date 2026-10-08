import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", ".wrangler", ".idea", ".vscode"]);
const ignoredFiles = new Set([
  "audit-css-js.generated.json",
  "audit-unused-files.generated.json",
  "package-lock.json",
  "worker-configuration.d.ts",
  "src/engine/generated-dictionary.ts",
  "data/dico_3_16.json",
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) {
      continue;
    }

    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      walk(full, out);
    } else if (stat.isFile()) {
      const rel = relative(root, full).replaceAll("\\", "/");
      if (
        !ignoredFiles.has(rel) &&
        !rel.startsWith("docs/") &&
        !/^audit-.*\.json$/u.test(rel)
      ) {
        out.push(rel);
      }
    }
  }

  return out;
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function isTextCandidate(rel) {
  return /\.(html|css|js|mjs|ts|json|md|jsonc)$/.test(rel);
}

function isAuditedCandidate(rel) {
  return /^(public\/js\/|public\/css\/|tools\/).+\.(js|mjs|css)$/.test(rel);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function possibleReferences(rel) {
  const fileName = basename(rel);
  const noPublicPrefix = rel.replace(/^public\//, "");
  const dotSlash = "./" + rel.split("/").slice(2).join("/");
  const sibling = "./" + fileName;
  const withoutExt = rel.replace(/\.(js|mjs|css)$/u, "");
  const noPublicWithoutExt = noPublicPrefix.replace(/\.(js|mjs|css)$/u, "");

  return [...new Set([
    rel,
    noPublicPrefix,
    dotSlash,
    sibling,
    withoutExt,
    noPublicWithoutExt,
    fileName,
  ].filter(Boolean))];
}

const allFiles = walk(root);
const textFiles = allFiles.filter(isTextCandidate);
const candidates = allFiles.filter(isAuditedCandidate);
const fileTexts = new Map();

for (const rel of textFiles) {
  try {
    fileTexts.set(rel, read(rel));
  } catch {
    // Ignore les fichiers non lisibles en texte.
  }
}

const results = candidates.map((candidate) => {
  const refs = [];
  const patterns = possibleReferences(candidate);

  for (const [rel, text] of fileTexts) {
    if (rel === candidate) {
      continue;
    }

    const hits = patterns.filter((pattern) => new RegExp(escapeRegExp(pattern), "u").test(text));

    if (hits.length) {
      refs.push({ file: rel, via: hits });
    }
  }

  return {
    file: candidate,
    referenceCount: refs.length,
    references: refs,
    probableUnused: refs.length === 0,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  auditedCandidateCount: candidates.length,
  probableUnused: results.filter((item) => item.probableUnused),
  referenced: results.filter((item) => !item.probableUnused),
  notes: [
    "Audit heuristique : vérifier manuellement avant suppression.",
    "Un fichier peut être utile même s'il n'est pas référencé par un import direct, par exemple s'il est chargé dynamiquement.",
    "Les gros fichiers générés et package-lock sont ignorés volontairement."
  ]
};

writeFileSync("audit-unused-files.generated.json", JSON.stringify(report, null, 2));
console.log("Audit écrit dans audit-unused-files.generated.json");
console.log(`${report.probableUnused.length} fichier(s) probablement inutilisé(s) sur ${candidates.length} candidat(s).`);

for (const item of report.probableUnused) {
  console.log(`- ${item.file}`);
}
