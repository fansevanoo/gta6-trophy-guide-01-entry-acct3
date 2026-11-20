import { cpSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
mkdirSync(destination, { recursive: true });
for (const folder of ['app', 'screenshots']) {
  if (!statSync(resolve(projectRoot, folder)).isDirectory()) {
    throw new Error(`Required package folder is missing: ${folder}`);
  }
  cpSync(resolve(projectRoot, folder), resolve(destination, folder), { recursive: true });
}
const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(resolve(destination, 'dossier.json'), dossier);
JSON.parse(new TextDecoder().decode(dossier));
console.log(`The Platinum Vault packaged: ${statSync(resolve(destination, 'dossier.json')).size} dossier bytes.`);
