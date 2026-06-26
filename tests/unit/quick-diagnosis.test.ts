import { describe, expect, it } from "vitest";

import {
  calculateQuickDiagnosisResult,
  quickDiagnosisSteps,
  quickDiagnosisVersion,
  workspaceMap,
  type QuickDiagnosisAnswers,
} from "../../lib/survey/quickDiagnosis";

describe("quick diagnosis ultra-short content", () => {
  it("keeps the start screen short", () => {
    const intro = quickDiagnosisSteps[0];

    expect(intro).toMatchObject({
      id: "intro",
      title: "AI로 만든 답변,\n바로 보내도 될까요?",
      helperText: "3분만 체크하고 먼저 맡길 일을 찾아보세요.",
      primaryCta: "시작하기",
      trustNote: "회사명·이메일·고객정보 입력 없음",
    });
    expect("body" in intro).toBe(false);
  });

  it("uses short labels for all answer options", () => {
    const optionLabels = quickDiagnosisSteps
      .slice(1)
      .flatMap((step) => ("options" in step ? step.options.map((option) => option.label) : []));

    expect(optionLabels).toEqual([
      "직접 AI를 쓰고 있어요",
      "팀원들이 쓰기 시작했어요",
      "대표 입장에서 고민 중이에요",
      "개인정보가 걱정돼요",
      "지원사업 문서를 준비 중이에요",
      "고객 문의 답변",
      "사업계획서 문장",
      "마케팅 문구",
      "회의록 요약",
      "제안서 문장",
      "고객",
      "기관·심사위원",
      "대표·팀장",
      "내부 팀원",
      "아직 모름",
      "개인정보",
      "틀린 답변",
      "과장된 표현",
      "기준 없음",
      "설명할 기록 없음",
      "뭐가 위험한지 모름",
      "항상 사람이 봐요",
      "중요한 것만 봐요",
      "각자 알아서 봐요",
      "거의 안 봐요",
      "기준이 없어요",
    ]);
  });
});

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
    expect(result.bandLabel).toBe("기준 정리가 먼저 필요한 상태");
    expect(result.bandMessage).toBe(
      "지금은 어떤 일에 쓰고 누가 확인할지 먼저 정하는 게 좋습니다.",
    );
    expect(result.watchOut).toEqual([
      "개인정보가 섞일 수 있어요",
      "고객에게 보내기 전 확인이 필요해요",
      "확인 방식이 사람마다 달라질 수 있어요",
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
    expect(result.workspaceTitle).toBe("회의록 요약");
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
      "말이 과장될 수 있어요",
      "제출 전 표현을 한 번 더 봐야 해요",
      "근거 없는 성과 표현을 조심해야 해요",
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
      "뭐가 위험한지 모르는 상태예요",
      "확인 방식이 사람마다 달라질 수 있어요",
      "가격·보장 표현을 조심해야 해요",
    ]);
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
