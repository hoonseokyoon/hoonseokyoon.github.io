import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildRoot } from './route-contract';

export const releaseMarkerRoute = '/.well-known/release.json';
export const releaseMarkerRelativePath = '.well-known/release.json';

export interface ReleaseMarker {
  commit: string;
}

const releaseShaPattern = /^[0-9a-f]{40}$/;
const usage = 'Usage: npm run write:release-marker -- --sha <lowercase-40-character-git-sha>';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requireReleaseSha(value: unknown): string {
  if (typeof value !== 'string' || !releaseShaPattern.test(value)) {
    throw new Error('Release commit must be exactly 40 lowercase hexadecimal characters');
  }
  return value;
}

export function serializeReleaseMarker(commit: string): string {
  return `${JSON.stringify({ commit: requireReleaseSha(commit) })}\n`;
}

export function parseReleaseMarker(source: string): ReleaseMarker {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch {
    throw new Error('Release marker must be valid JSON');
  }

  if (!isObject(parsed) || Object.keys(parsed).length !== 1 || !Object.hasOwn(parsed, 'commit')) {
    throw new Error('Release marker must contain exactly one commit key');
  }
  const commit = requireReleaseSha(parsed.commit);
  if (source !== serializeReleaseMarker(commit)) {
    throw new Error('Release marker must use the canonical byte representation');
  }
  return { commit };
}

export function releaseMarkerPath(root: string = buildRoot): string {
  return join(root, releaseMarkerRelativePath);
}

export function readReleaseMarker(path: string): ReleaseMarker {
  return parseReleaseMarker(readFileSync(path, 'utf8'));
}

export function assertReleaseMarkerAbsent(root: string = buildRoot): void {
  const path = releaseMarkerPath(root);
  if (existsSync(path)) {
    throw new Error('Build already contains a release marker; release provenance must be injected after verification');
  }
}

export function writeReleaseMarker(commit: string, root: string = buildRoot): string {
  const canonicalCommit = requireReleaseSha(commit);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Build directory does not exist: ${root}`);
  }

  const path = releaseMarkerPath(root);
  if (existsSync(path)) throw new Error(`Release marker already exists: ${path}`);

  const directory = dirname(path);
  if (existsSync(directory)) {
    if (!statSync(directory).isDirectory()) {
      throw new Error(`Release marker directory is not a directory: ${directory}`);
    }
  } else {
    mkdirSync(directory);
  }

  writeFileSync(path, serializeReleaseMarker(canonicalCommit), { encoding: 'utf8', flag: 'wx' });
  return path;
}

export function parseReleaseMarkerCliArgs(args: string[]): { sha: string } | null {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) return null;

  let sha: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    let candidate: string;
    if (argument === '--sha') {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('-')) throw new Error('--sha requires a value');
      candidate = value;
      index += 1;
    } else if (argument.startsWith('--sha=')) {
      candidate = argument.slice('--sha='.length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }

    if (sha !== undefined) throw new Error('--sha may only be provided once');
    sha = requireReleaseSha(candidate);
  }

  if (sha === undefined) throw new Error('--sha is required');
  return { sha };
}

export function runReleaseMarkerCli(
  args: string[],
  root: string = buildRoot,
  log: (message: string) => void = console.log
): void {
  const options = parseReleaseMarkerCliArgs(args);
  if (options === null) {
    log(usage);
    return;
  }
  const path = writeReleaseMarker(options.sha, root);
  log(`Wrote ${path} for ${options.sha}`);
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === pathToFileURL(fileURLToPath(import.meta.url)).href;

if (isMain) {
  try {
    runReleaseMarkerCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(usage);
    process.exitCode = 1;
  }
}
