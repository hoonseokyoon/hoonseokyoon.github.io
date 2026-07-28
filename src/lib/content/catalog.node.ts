import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCatalog } from './parse';

const contentRoot = fileURLToPath(new URL('.', import.meta.url));

function readCollection(directory: string): Array<[string, string]> {
  const root = join(contentRoot, directory);
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => name.endsWith('.yml'))
    .sort()
    .map((name) => [`src/lib/content/${directory}/${name}`, readFileSync(join(root, name), 'utf8')]);
}

export function loadCatalogFromDisk() {
  return parseCatalog(
    readFileSync(join(contentRoot, 'person.yml'), 'utf8'),
    readCollection('timeline'),
    readCollection('projects'),
    readCollection('outputs')
  );
}
