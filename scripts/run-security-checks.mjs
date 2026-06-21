import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const sourceRoots = ["app", "components", "lib", "supabase/functions"];
const clientRoots = ["app", "components", "lib"];
const requiredEdgeStrings = [
  "https://agentproofkr.github.io",
  "PAYLOAD_TOO_LARGE",
  "RATE_LIMITED",
  "DUPLICATE_IDEMPOTENCY_KEY",
  "corsRejectedStatus",
];
const forbiddenClientPatterns = [
  { label: "Supabase service role key", pattern: /SUPABASE_SERVICE_ROLE_KEY/ },
  { label: "Supabase access token", pattern: /SUPABASE_ACCESS_TOKEN/ },
  { label: "Supabase DB password", pattern: /SUPABASE_DB_PASSWORD/ },
  { label: "Contact encryption key", pattern: /CONTACT_ENCRYPTION_KEY/ },
  { label: "Meta Pixel", pattern: /fbq\(|connect\.facebook\.net|Meta Pixel/i },
];
const forbiddenAnalyticsKeys = [
  "email",
  "company",
  "memo",
  "message",
  "raw_answer",
  "free_text",
  "field_names",
  "individualAnswer",
  "lead_id",
];

const failures = [
  ...scanClientSources(),
  ...checkAnalyticsAllowlist(),
  ...checkEdgeFunctionContract(),
];

if (failures.length > 0) {
  console.error("Security checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    checkedSourceFiles: collectTextFiles(sourceRoots).length,
    checkedClientFiles: collectTextFiles(clientRoots).length,
  }),
);

function scanClientSources() {
  return collectTextFiles(clientRoots).flatMap((file) => {
    const body = read(file);
    return forbiddenClientPatterns
      .filter(({ pattern }) => pattern.test(body))
      .map(({ label }) => `${file}: ${label} must not appear in client code`);
  });
}

function checkAnalyticsAllowlist() {
  const file = "lib/analytics.ts";
  const body = read(file);
  return forbiddenAnalyticsKeys
    .filter((key) => body.includes(`"${key}"`) || body.includes(`'${key}'`))
    .map((key) => `${file}: analytics allowlist must not include ${key}`);
}

function checkEdgeFunctionContract() {
  const functionFile = "supabase/functions/survey-submit/index.ts";
  const verifierFile = "scripts/verify-production-supabase.mjs";
  const body = `${read(functionFile)}\n${read(verifierFile)}`;
  return requiredEdgeStrings
    .filter((value) => !body.includes(value))
    .map((value) => `${functionFile}: missing security contract marker ${value}`);
}

function collectTextFiles(roots) {
  return roots
    .flatMap((entry) => walk(entry))
    .filter((file) => /\.(?:css|js|json|mjs|ts|tsx)$/.test(file));
}

function walk(entry) {
  const absolute = resolve(root, entry);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((dirent) => {
    const child = join(entry, dirent.name);
    if (dirent.isDirectory()) return walk(child);
    return relative(root, resolve(root, child)).replace(/\\/g, "/");
  });
}

function read(file) {
  return readFileSync(resolve(root, file), "utf8");
}
