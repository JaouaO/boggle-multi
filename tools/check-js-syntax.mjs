import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["public/js", "tools"];
const files = [];

function collect(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) {
      continue;
    }

    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      collect(fullPath);
      continue;
    }

    if (stats.isFile() && /\.(js|mjs)$/.test(entry)) {
      files.push(fullPath);
    }
  }
}

for (const root of roots) {
  try {
    collect(root);
  } catch {
    // optional root
  }
}

let hasError = false;

for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.status !== 0) {
    hasError = true;
    console.error(`\n[JS syntax error] ${relative(process.cwd(), file)}`);
    if (result.stderr) {
      console.error(result.stderr.trim());
    }
    if (result.stdout) {
      console.error(result.stdout.trim());
    }
  } else {
    console.log(`[ok] ${relative(process.cwd(), file)}`);
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`\n${files.length} fichier(s) JS vérifié(s).`);
