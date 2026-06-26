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
      title: "그대로 써도\n괜찮을까요?",
      helperText: "답변·문장·문서를 쓰기 전에\n확인할 내용만 빠르게 보여드려요.",
      previewTitle: "1분 체크",
      previewItems: ["어디에 쓰는지", "무엇이 걱정되는지", "마지막에 누가 보는지"],
      primaryCta: "바로 확인하기",
      trustNote: "회사명·이메일·고객정보는 묻지 않아요.",
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
      { label: "직접 쓰고 있어요", subtitle: "내가 쓴 문장이 괜찮은지 보고 싶어요" },
      { label: "팀에서 쓰고 있어요", subtitle: "어디까지 허용할지 정해야 해요" },
      { label: "대표·관리자예요", subtitle: "회사 기준을 정해야 해요" },
      { label: "개인정보가 걱정돼요", subtitle: "고객정보나 내부자료가 신경 쓰여요" },
      { label: "제출 문서가 필요해요", subtitle: "사업계획서나 지원사업 문서예요" },
      { label: "고객 답변", subtitle: "안내·상담 메시지" },
      { label: "사업계획서 문장", subtitle: "지원사업·심사용 문장" },
      { label: "광고·홍보 문구", subtitle: "SNS·상세페이지 문구" },
      { label: "회의록 요약", subtitle: "내부 공유용 정리" },
      { label: "제안서 문장", subtitle: "가격·조건·보장 표현" },
      { label: "고객에게 보냅니다", subtitle: "답변·안내·상담 메시지" },
      { label: "기관에 제출합니다", subtitle: "지원사업·심사 문서" },
      { label: "대표·팀장에게 보고합니다", subtitle: "내부 의사결정 자료" },
      { label: "팀 안에서만 봅니다", subtitle: "내부 공유·정리용" },
      { label: "아직 정하지 않았습니다", subtitle: "먼저 확인해보고 싶어요" },
      { label: "개인정보", subtitle: "고객정보가 섞일 수 있어서" },
      { label: "틀린 내용", subtitle: "잘못 안내할 수 있어서" },
      { label: "과한 표현", subtitle: "너무 세게 보일 수 있어서" },
      { label: "기준이 없음", subtitle: "어디까지 써도 될지 몰라서" },
      { label: "남는 기록이 없음", subtitle: "나중에 설명하기 어려워서" },
      { label: "잘 모르겠음", subtitle: "무엇을 조심해야 할지 몰라서" },
      { label: "항상 확인합니다", subtitle: "쓰기 전에 사람이 봐요" },
      { label: "중요한 것만 확인합니다", subtitle: "민감한 내용만 따로 봐요" },
      { label: "각자 확인합니다", subtitle: "정해진 방식은 없어요" },
      { label: "거의 확인하지 않습니다", subtitle: "만든 사람이 바로 써요" },
      { label: "기준이 없습니다", subtitle: "아직 정해둔 게 없어요" },
    ]);
  });

  it("uses short product-like questions for the quick flow", () => {
    const questions = quickDiagnosisSteps
      .slice(1)
      .map((step) => ("question" in step ? step.question : ""));

    expect(questions).toEqual([
      "어떤 입장인가요?",
      "무엇을 확인할까요?",
      "어디에 쓰이나요?",
      "무엇이 가장 걱정되나요?",
      "마지막 확인은 어떻게 하나요?",
    ]);
  });

  it("does not use awkward or AI-heavy visible quick-copy phrases", () => {
    const visibleCopy = JSON.stringify(quickDiagnosisSteps);
    const forbidden = [
      "답변 보내기 전",
      "해볼 일",
      "걸리는 부분",
      "AI에게 맡길 일",
      "AI 활용 진단",
      "업무용 AI",
      "정밀검증 리포트",
      "가장 찝찝한 건",
      "조심할 점",
    ];

    for (const phrase of forbidden) {
      expect(visibleCopy).not.toContain(phrase);
    }
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
    expect(result.bandLabel).toBe("기준이 먼저 필요한 상태");
    expect(result.statusPill).toBe("기준 필요");
    expect(result.resultHeadline).toBe("쓰기 전에 기준부터 정하는 게 좋겠어요.");
    expect(result.watchOut).toEqual([
      "개인정보가 섞였는지",
      "고객에게 보내기 전에 한 번 더 봤는지",
      "사람마다 다르게 확인하고 있지 않은지",
    ]);
    expect(result.workspaceCta).toBe("고객 답변 확인하기");
    expect(result.valueTitle).toBe("AgentProof에서 확인하면");
    expect(result.valueBullets).toEqual([
      "어떻게 고쳤는지",
      "실제로 썼는지",
      "사람이 확인했는지",
    ]);
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
    expect(result.resultHeadline).toBe("작은 문서부터 시작해도 괜찮아 보여요.");
    expect(result.bandLabel).toBe("시작하기 좋은 상태");
    expect(result.workspaceCta).toBe("회의록 요약 확인하기");
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
      "표현이 과하지 않은지",
      "제출 전 표현을 다시 봤는지",
      "근거 없는 성과 표현은 없는지",
    ]);
    expect(result.workspaceCta).toBe("사업계획서 문장 확인하기");
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
    expect(result.statusPill).toBe("확인 필요");
    expect(result.resultHeadline).toBe("바로 쓰기엔 확인할 부분이 있어요.");
    expect(result.watchOut).toEqual([
      "무엇을 확인해야 할지 정해졌는지",
      "사람마다 다르게 확인하고 있지 않은지",
      "가격·보장 표현은 괜찮은지",
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
