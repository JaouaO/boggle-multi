// B1a — vérifie les images livrées, sans modifier les sources ni le jeu.
// Exemples : node tools/audit-b1-assets.mjs
//            node tools/audit-b1-assets.mjs --require scenes/salon-public.webp
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../public/images/', import.meta.url)));
const args = process.argv.slice(2);
const required = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--require' && args[i + 1]) required.push(args[++i]);
  else { console.error('Usage : node tools/audit-b1-assets.mjs [--require sous/dossier/image.ext]'); process.exit(2); }
}
let checked = 0;
let errors = 0;
let warnings = 0;
const issue = (kind, path, message) => {
  console[kind === 'erreur' ? 'error' : 'warn'](`[${kind}] ${path} : ${message}`);
  if (kind === 'erreur') errors++; else warnings++;
};
function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) { issue('erreur', path, 'lien symbolique non accepte'); return []; }
    if (entry.isDirectory()) return listFiles(path);
    return entry.isFile() ? [path] : [];
  });
}
const files = listFiles(root);
for (const path of files) {
  const short = relative(root, path).replaceAll(sep, '/');
  if (!/^[a-z0-9/_-]+\.(?:webp|png|svg)$/.test(short)) {
    issue('erreur', short, 'nom ou extension inattendus (utiliser minuscules ASCII et tirets)');
    continue;
  }
  const ext = short.slice(short.lastIndexOf('.')).toLowerCase();
  const size = statSync(path).size;
  const data = readFileSync(path);
  checked++;
  if (size > 4 * 1024 * 1024) issue('erreur', short, 'plus de 4 Mio : optimiser');
  else if (size > 600 * 1024) issue('avertissement', short, 'plus de 600 Kio : compression recommandee');
  if (ext === '.webp') {
    if (data.length < 16 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP')
      issue('erreur', short, 'signature WebP invalide');
  } else if (ext === '.png') {
    if (data.length < 24 || !data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')))
      issue('erreur', short, 'signature PNG invalide');
  } else if (ext === '.svg') {
    const svg = data.toString('utf8');
    if (!/<svg\b/i.test(svg) || !/\bviewBox\s*=/.test(svg))
      issue('erreur', short, 'SVG ou viewBox manquant');
    if (/<\s*(?:script|foreignObject|image)\b|\bon[a-z]+\s*=|(?:xlink:)?href\s*=\s*["'](?!#)|url\s*\(\s*["']?(?:https?:|data:)/i.test(svg))
      issue('erreur', short, 'contenu SVG a revoir : script, image integree, evenement ou ressource externe');
  }
}
for (const file of required) {
  const path = resolve(root, file);
  if (!path.startsWith(root + sep) || !/\.(svg|png|webp)$/i.test(file)) {
    issue('erreur', file, 'chemin --require invalide');
  } else if (!existsSync(path)) {
    issue('erreur', file, 'ressource requise absente');
  }
}
console.log(`[B1a] ${checked} image(s) inspectee(s), ${warnings} avertissement(s), ${errors} erreur(s).`);
if (errors) process.exitCode = 1;
