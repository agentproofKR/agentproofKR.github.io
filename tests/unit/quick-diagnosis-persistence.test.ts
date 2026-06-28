import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/202606280001_quick_diagnosis_submissions.sql";
const functionPath = "supabase/functions/survey-submit/index.ts";

describe("quick diagnosis Supabase persistence contract", () => {
  it("defines the quick diagnosis table, constraints, indexes, RLS, and retention hooks", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table if not exists public.quick_diagnosis_submissions");
    expect(sql).toContain("session_id uuid not null unique");
    expect(sql).toContain("ai_adoption_score integer not null check");
    expect(sql).toContain("saving_rate_min numeric not null");
    expect(sql).toContain("support_review_average integer");
    expect(sql).toContain("project_scale text not null");
    expect(sql).toContain("quick_diagnosis_work_type_check");
    expect(sql).toContain("quick_diagnosis_monthly_volume_check");
    expect(sql).toContain("quick_diagnosis_time_per_case_check");
    expect(sql).toContain("quick_diagnosis_adoption_scope_check");
    expect(sql).toContain("quick_diagnosis_exposure_check");
    expect(sql).toContain("quick_diagnosis_project_scale_check");
    expect(sql).toContain("quick_diagnosis_created_at_idx");
    expect(sql).toContain("alter table public.quick_diagnosis_submissions enable row level security");
    expect(sql).toContain("service_role_only_quick_diagnosis");
    expect(sql).toContain("contact_requests_request_type_check");
    expect(sql).toContain("delete from public.quick_diagnosis_submissions where expires_at < now()");
    expect(sql).toContain("'quick_diagnosis_submissions'");
    expect(sql).toContain("public.agentproof_rls_status()");
  });

  it("routes quick_diagnosis payloads to a dedicated Edge Function handler", () => {
    const source = readFileSync(functionPath, "utf8");

    expect(source).toContain('kind: "quick_diagnosis"');
    expect(source).toContain("type QuickDiagnosisPayload");
    expect(source).toContain('if (payload.kind === "quick_diagnosis")');
    expect(source).toContain("handleQuickDiagnosis");
    expect(source).toContain("quick_diagnosis_submissions");
    expect(source).toContain("quick_diagnosis_stored");
    expect(source).toContain("status: \"duplicate\"");
    expect(source).toContain("quick_diagnosis_completed");
    expect(source).toContain("INVALID_QUICK_DIAGNOSIS_SCORE");
  });
});
