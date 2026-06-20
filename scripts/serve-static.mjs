import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("-")) ?? "out";
const root = resolve(process.cwd(), rootArg);
const hostname = readArg("--hostname") ?? process.env.HOSTNAME ?? "127.0.0.1";
const port = Number(readArg("--port") ?? readArg("-p") ?? process.env.PORT ?? 3000);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json"],
  [".xml", "application/xml; charset=utf-8"],
]);

if (!existsSync(root)) {
  console.error(`Static root does not exist: ${root}`);
  process.exit(1);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${hostname}:${port}`);
  const filePath = resolvePath(url.pathname);

  if (!filePath) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes.get(extname(filePath)) ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, hostname, () => {
  console.log(`Serving ${root} at http://${hostname}:${port}`);
});

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function resolvePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const safePath = normalize(decoded).replace(/^([/\\])+/, "");
  const candidates = [];

  if (safePath === "" || decoded.endsWith("/")) {
    candidates.push(join(root, safePath, "index.html"));
  } else {
    candidates.push(join(root, safePath));
    candidates.push(join(root, safePath, "index.html"));
  }

  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (!resolved.startsWith(`${root}${sep}`) && resolved !== root) {
      continue;
    }
    if (existsSync(resolved) && statSync(resolved).isFile()) {
      return resolved;
    }
  }

  return null;
}
