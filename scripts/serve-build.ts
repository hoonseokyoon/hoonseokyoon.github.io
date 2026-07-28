import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const buildRoot = resolve('build');

function argument(name: string, fallback: string) {
  const equals = process.argv.find((value) => value.startsWith(`${name}=`));
  if (equals) return equals.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const host = argument('--host', '127.0.0.1');
const port = Number(argument('--port', '4173'));

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8'
};

function resolveRequest(pathname: string) {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relativePath = decoded.replace(/^\/+/, '');
  const candidate = resolve(buildRoot, relativePath || 'index.html');
  if (candidate !== buildRoot && !candidate.startsWith(`${buildRoot}${sep}`)) return null;

  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const directoryIndex = resolve(candidate, 'index.html');
  if (directoryIndex.startsWith(`${buildRoot}${sep}`) && existsSync(directoryIndex)) return directoryIndex;
  if (!extname(candidate) && existsSync(`${candidate}.html`)) return `${candidate}.html`;
  return null;
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? host}`);
  const filePath = resolveRequest(requestUrl.pathname);
  const responsePath = filePath ?? resolve(buildRoot, '404.html');

  if (!existsSync(responsePath)) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(filePath ? 200 : 404, {
    'content-type': contentTypes[extname(responsePath)] ?? 'application/octet-stream'
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(responsePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Serving ${buildRoot} at http://${host}:${port}`);
});
