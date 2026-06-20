import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const required = ["SUPABASE_ACCESS_TOKEN", "SUPABASE_PROJECT_REF"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Create a Supabase project in the Seoul region, then rerun with credentials.");
  process.exit(1);
}

const migration = join(process.cwd(), "supabase", "migrations", "202606210001_role_based_assessment.sql");
const functionDir = join(process.cwd(), "supabase", "functions", "survey-submit");

if (!existsSync(migration) || !existsSync(functionDir)) {
  console.error("Supabase migration or Edge Function artifact is missing.");
  process.exit(1);
}

run("supabase", ["link", "--project-ref", process.env.SUPABASE_PROJECT_REF]);
run("supabase", ["db", "push"]);
run("supabase", ["functions", "deploy", "survey-submit"]);

console.log("Supabase schema and survey-submit function deployment requested.");
console.log("Configure NEXT_PUBLIC_SURVEY_API_URL to the deployed Edge Function URL after verifying it.");

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
