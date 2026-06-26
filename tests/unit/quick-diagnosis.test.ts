import { describe, expect, it } from "vitest";

import {
  calculateQuickDiagnosisResult,
  quickDiagnosisSteps,
  quickDiagnosisVersion,
  workspaceMap,
  type QuickDiagnosisAnswers,
} from "../../lib/survey/quickDiagnosis";

describe("quick diagnosis premium mobile content", () => {
  it("keeps the start screen short and useful", () => {
    const intro = quickDiagnosisSteps[0];

    expect(intro).toMatchObject({
      id: "intro",
      title: "AI로 만든 답변,\n그냥 보내도 될까요?",
      helperText: "3분이면 먼저 해볼 일과\n조심할 점이 나옵니다.",
      previewTitle: "오늘 확인할 것",
      previewItems: ["먼저 해볼 일", "조심할 표현", "마지막 확인 방식"],
      primaryCta: "시작하기",
      trustNote: "회사명·이메일·고객정보 입력 없음",
    });
    expect("body" in intro).toBe(false);
  });

  it("uses useful compact labels and subtitles for all answer options", () => {
    const options = quickDiagnosisSteps
      .slice(1)
      .flatMap((step) =>
        "options" in step
          ? step.options.map((option) => ({
              label: option.label,
              subtitle: option.subtitle,
            }))
          : [],
      );

    expect(options).toEqual([
      { label: "직접 쓰고 있어요", subtitle: "내가 만든 답변이 괜찮은지 보고 싶어요" },
      { label: "팀원들이 쓰기 시작했어요", subtitle: "어디까지 허용할지 고민돼요" },
      { label: "대표 입장에서 보고 있어요", subtitle: "막을지, 허용할지 판단해야 해요" },
      { label: "개인정보가 걱정돼요", subtitle: "고객정보나 내부자료가 신경 쓰여요" },
      { label: "제출 문서를 준비 중이에요", subtitle: "사업계획서나 지원사업 문서가 필요해요" },
      { label: "고객 문의 답변", subtitle: "보내기 전 표현 확인" },
      { label: "사업계획서 문장", subtitle: "과장·근거 확인" },
      { label: "마케팅 문구", subtitle: "오해·과장 확인" },
      { label: "회의록 요약", subtitle: "공유 범위 확인" },
      { label: "제안서 문장", subtitle: "가격·보장 표현 확인" },
      { label: "고객", subtitle: "답변·안내·상담 메시지" },
      { label: "기관·심사위원", subtitle: "지원사업·심사·공식 문서" },
      { label: "대표·팀장", subtitle: "내부 의사결정 자료" },
      { label: "내부 팀원", subtitle: "팀 공유·정리용" },
      { label: "아직 모름", subtitle: "일단 써보고 정하려고요" },
      { label: "개인정보", subtitle: "고객정보가 섞일까 봐" },
      { label: "틀린 답변", subtitle: "잘못된 말을 보낼까 봐" },
      { label: "과장된 표현", subtitle: "너무 세게 말할까 봐" },
      { label: "기준 없음", subtitle: "어디까지 써도 되는지 몰라서" },
      { label: "남는 기록 없음", subtitle: "나중에 설명하기 어려워서" },
      { label: "잘 모르겠음", subtitle: "뭐가 위험한지도 애매해서" },
      { label: "항상 사람이 봅니다", subtitle: "보내기 전 확인해요" },
      { label: "중요한 것만 봅니다", subtitle: "민감한 건 따로 봐요" },
      { label: "각자 알아서 봅니다", subtitle: "정해진 방식은 없어요" },
      { label: "거의 안 봅니다", subtitle: "만든 사람이 바로 써요" },
      { label: "기준이 없습니다", subtitle: "아직 정해둔 게 없어요" },
    ]);
  });

  it("uses short product-like questions for the quick flow", () => {
    const questions = quickDiagnosisSteps
      .slice(1)
      .map((step) => ("question" in step ? step.question : ""));

    expect(questions).toEqual([
      "지금 상황은?",
      "먼저 해볼 일은?",
      "누가 보게 되나요?",
      "가장 신경 쓰이는 건?",
      "마지막엔 누가 보나요?",
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
    expect(result.statusPill).toBe("기준 먼저");
    expect(result.resultHeadline).toBe("쓰기 전에 기준부터 잡는 게 좋습니다.");
    expect(result.bandMessage).toBe(
      "어떤 일에 쓰고, 누가 마지막에 볼지 먼저 정하는 편이 좋습니다.",
    );
    expect(result.watchOut).toEqual([
      "개인정보가 섞일 수 있어요",
      "고객에게 보내기 전 확인이 필요해요",
      "확인 방식이 사람마다 달라질 수 있어요",
    ]);
    expect(result.workspaceCta).toBe("고객답변 1건 확인해보기");
    expect(result.valueTitle).toBe("AgentProof에서 하면 좋은 점");
    expect(result.valueBullets).toEqual([
      "어떻게 고쳤는지",
      "실제로 썼는지",
      "사람이 봤는지",
    ]);
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
    expect(result.statusPill).toBe("시작 가능");
    expect(result.resultHeadline).toBe("작은 일부터 시작하기 좋아 보여요.");
    expect(result.bandMessage).toBe(
      "내부용이거나 확인 방식이 있는 업무부터 써볼 수 있습니다.",
    );
    expect(result.workspaceCta).toBe("회의록 요약 확인해보기");
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
    expect(result.workspaceCta).toBe("사업계획서 문장 확인해보기");
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
    expect(result.statusPill).toBe("먼저 확인");
    expect(result.resultHeadline).toBe("바로 넓게 쓰기엔 아직 이릅니다.");
    expect(result.watchOut).toEqual([
      "뭐가 위험한지 애매한 상태예요",
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
