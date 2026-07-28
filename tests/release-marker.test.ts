import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertReleaseMarkerAbsent,
  parseReleaseMarker,
  parseReleaseMarkerCliArgs,
  readReleaseMarker,
  releaseMarkerPath,
  requireReleaseSha,
  runReleaseMarkerCli,
  serializeReleaseMarker,
  writeReleaseMarker
} from '../scripts/release-marker';

const commit = '0123456789abcdef0123456789abcdef01234567';
const temporaryDirectories: string[] = [];
const invalidCliArguments: string[][] = [
  [],
  ['--sha'],
  ['--sha='],
  ['--sha', commit, '--sha', commit],
  [`--sha=${commit}`, `--sha=${commit}`],
  ['--unknown', commit],
  [commit],
  ['--sha', commit.toUpperCase()],
  ['--sha', commit.slice(1)]
];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'root-release-marker-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('release marker format', () => {
  it('serializes the exact public provenance bytes and round-trips them', () => {
    const source = `{"commit":"${commit}"}\n`;
    expect(serializeReleaseMarker(commit)).toBe(source);
    expect(Buffer.from(source).toString('hex')).toBe(
      `7b22636f6d6d6974223a2230313233343536373839616263646566303132333435363738396162636465663031323334353637227d0a`
    );
    expect(parseReleaseMarker(source)).toEqual({ commit });
  });

  it.each([
    '',
    'not-json',
    'null',
    '[]',
    '{}',
    `{"commit":"${commit}","extra":true}\n`,
    `{"commit":"${commit}","commit":"${commit}"}\n`,
    `{"Commit":"${commit}"}\n`,
    `{"commit":123}\n`,
    ` {"commit":"${commit}"}\n`,
    `{"commit":"${commit}"}`,
    `{"commit": "${commit}"}\n`
  ])('rejects an invalid or non-canonical marker: %j', (source) => {
    expect(() => parseReleaseMarker(source)).toThrow();
  });

  it.each([
    '0123456789abcdef0123456789abcdef0123456',
    '0123456789abcdef0123456789abcdef012345678',
    '0123456789ABCDEF0123456789ABCDEF01234567',
    'g123456789abcdef0123456789abcdef01234567',
    '',
    123,
    null
  ])('rejects a non-release SHA: %j', (value) => {
    expect(() => requireReleaseSha(value)).toThrow(/40 lowercase hexadecimal/);
  });
});

describe('release marker file', () => {
  it('creates .well-known only below an existing build directory', () => {
    const root = temporaryDirectory();
    const path = writeReleaseMarker(commit, root);

    expect(path).toBe(join(root, '.well-known/release.json'));
    expect(readFileSync(path)).toEqual(Buffer.from(`{"commit":"${commit}"}\n`));
    expect(readReleaseMarker(path)).toEqual({ commit });
  });

  it('does not create a missing build directory', () => {
    const root = join(temporaryDirectory(), 'missing-build');
    expect(() => writeReleaseMarker(commit, root)).toThrow(/Build directory does not exist/);
    expect(() => readFileSync(releaseMarkerPath(root))).toThrow();
  });

  it('refuses to overwrite an existing marker', () => {
    const root = temporaryDirectory();
    const path = releaseMarkerPath(root);
    mkdirSync(join(root, '.well-known'));
    writeFileSync(path, 'existing artifact');

    expect(() => writeReleaseMarker(commit, root)).toThrow(/already exists/);
    expect(readFileSync(path, 'utf8')).toBe('existing artifact');
  });

  it('provides the pre-injection guard used by ordinary build verification', () => {
    const root = temporaryDirectory();
    expect(() => assertReleaseMarkerAbsent(root)).not.toThrow();

    writeReleaseMarker(commit, root);
    expect(() => assertReleaseMarkerAbsent(root)).toThrow(/must be injected after verification/);
  });

  it('rejects a non-directory .well-known path', () => {
    const root = temporaryDirectory();
    writeFileSync(join(root, '.well-known'), 'not a directory');
    expect(() => writeReleaseMarker(commit, root)).toThrow(/not a directory/);
  });
});

describe('release marker CLI', () => {
  it('accepts both supported SHA forms', () => {
    expect(parseReleaseMarkerCliArgs(['--sha', commit])).toEqual({ sha: commit });
    expect(parseReleaseMarkerCliArgs([`--sha=${commit}`])).toEqual({ sha: commit });
  });

  it.each(invalidCliArguments.map((args) => ({ args })))(
    'rejects missing, duplicate, unknown, or invalid arguments: $args',
    ({ args }) => {
      expect(() => parseReleaseMarkerCliArgs(args)).toThrow();
    }
  );

  it('returns null only for a standalone help flag', () => {
    expect(parseReleaseMarkerCliArgs(['--help'])).toBeNull();
    expect(parseReleaseMarkerCliArgs(['-h'])).toBeNull();
    expect(() => parseReleaseMarkerCliArgs(['--help', '--sha', commit])).toThrow(/Unknown argument/);
  });

  it('writes through the CLI runner and reports the exact path and SHA', () => {
    const root = temporaryDirectory();
    const messages: string[] = [];
    runReleaseMarkerCli(['--sha', commit], root, (message) => messages.push(message));

    expect(readReleaseMarker(releaseMarkerPath(root))).toEqual({ commit });
    expect(messages).toEqual([`Wrote ${releaseMarkerPath(root)} for ${commit}`]);
  });
});
