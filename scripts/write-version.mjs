import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outputPath = resolve(root, "public", "version.json");

const commitSha = process.env.GITHUB_SHA || readGitSha();
const buildTimestamp = process.env.BUILD_TIMESTAMP || new Date().toISOString();
const surveyVersion = await readSurveyVersion();

const version = {
  commitSha,
  buildTimestamp,
  privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || "2026-06-21",
  surveyVersion,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(`${outputPath}`, `${JSON.stringify(version, null, 2)}\n`, "utf8");

function readGitSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

async function readSurveyVersion() {
  const source = await readFile(resolve(root, "lib", "survey", "questions.ts"), "utf8");
  const match = source.match(/export const surveyVersion = "([^"]+)"/);
  return match?.[1] || "unknown";
}
