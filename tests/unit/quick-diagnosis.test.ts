import { describe, expect, it } from "vitest";

import {
  calculateQuickDiagnosisResult,
  quickDiagnosisVersion,
  workspaceMap,
  type QuickDiagnosisAnswers,
} from "../../lib/survey/quickDiagnosis";

describe("quick diagnosis scoring", () => {
  it("scores privacy-heavy customer replies as needing criteria first", () => {
    const result = calculateQuickDiagnosisResult({
      persona: "worker",
      selectedJob: "customer_reply",
      audience: "customer",
      concern: "privacy",
      review: "no_standard",
    });

    expect(result.riskScore).toBe(66);
    expect(result.assuranceScore).toBe(34);
    expect(result.band).toBe("hold");
    expect(result.watchOut).toEqual([
      "개인정보나 고객정보가 섞일 수 있습니다.",
      "고객에게 보내기 전 확인 기준이 필요합니다.",
      "사람마다 확인 방식이 달라질 수 있습니다.",
    ]);
    expect(result.workspaceCta).toBe("고객답변 1건 체험하기");
    expect(result.personaValue).toBe(
      "오늘 바로 쓸 때, 어떤 문장을 조심해야 하는지 확인할 수 있습니다.",
    );
  });

  it("scores internal summaries with owner persona as ready", () => {
    const result = calculateQuickDiagnosisResult({
      persona: "owner",
      selectedJob: "internal_summary",
      audience: "internal",
      concern: "no_evidence",
      review: "always",
    });

    expect(result.riskScore).toBe(19);
    expect(result.assuranceScore).toBe(81);
    expect(result.band).toBe("ready");
    expect(result.workspaceCta).toBe("업무요약 AI 체험하기");
    expect(result.personaValue).toContain("어떤 일부터 허용할지");
  });

  it("keeps grant writing result practical and evidence-oriented", () => {
    const result = calculateQuickDiagnosisResult({
      persona: "grant_writer",
      selectedJob: "grant_doc",
      audience: "institution",
      concern: "exaggeration",
      review: "important_only",
    });

    expect(result.riskScore).toBe(46);
    expect(result.assuranceScore).toBe(54);
    expect(result.band).toBe("needs_verification");
    expect(result.watchOut).toEqual([
      "과장되거나 근거가 부족한 문장이 나올 수 있습니다.",
      "제출 전 과장·근거·표현을 확인해야 합니다.",
      "지원사업 문서는 근거 없는 성과 표현을 조심해야 합니다.",
    ]);
    expect(result.workspaceCta).toBe("사업계획서 문장 검수해보기");
  });

  it("keeps unknown proposal risk helpful instead of judgmental", () => {
    const result = calculateQuickDiagnosisResult({
      persona: "policy_manager",
      selectedJob: "proposal_doc",
      audience: "customer",
      concern: "unknown_risk",
      review: "individual",
    });

    expect(result.assuranceScore).toBe(46);
    expect(result.band).toBe("needs_verification");
    expect(result.watchOut).toEqual([
      "무엇이 위험한지 모르는 상태 자체가 조심할 부분입니다.",
      "사람마다 확인 방식이 달라질 수 있습니다.",
      "제안서·견적 문장은 가격·계약·보장 표현을 조심해야 합니다.",
    ]);
    expect(result.personaValue).toContain("개인정보, 외부 발송");
  });
});

describe("quick diagnosis workspace mapping", () => {
  it("has a working workspace CTA for every selected job", () => {
    const jobs: QuickDiagnosisAnswers["selectedJob"][] = [
      "customer_reply",
      "grant_doc",
      "marketing_copy",
      "internal_summary",
      "proposal_doc",
    ];

    for (const selectedJob of jobs) {
      const result = calculateQuickDiagnosisResult({
        persona: "worker",
        selectedJob,
        audience: "internal",
        concern: "wrong_answer",
        review: "important_only",
      });

      expect(result.recommendedJob).toBe(selectedJob);
      expect(result.workspaceTitle).toBe(workspaceMap[selectedJob].title);
      expect(result.workspaceCta).toBe(workspaceMap[selectedJob].cta);
      expect(workspaceMap[selectedJob].path).toBe(`/workspace/?job=${selectedJob}`);
    }
  });

  it("uses the required scoring version", () => {
    expect(quickDiagnosisVersion).toBe(
      "2026-06-AgentProof-human-quick-diagnosis-v2",
    );
  });
});
