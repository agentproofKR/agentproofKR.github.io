import type { ConsentState } from "./types";

export const consentVersion = "2026-06-21";

export const consentTextHashes = {
  age14OrOlder: "sha256:age-2026-06-21-agentproof",
  surveyProcessing: "sha256:survey-processing-2026-06-21-agentproof",
  beta: "sha256:beta-reward-2026-06-21-agentproof",
  interview: "sha256:interview-2026-06-21-agentproof",
  pilot: "sha256:pilot-consultation-2026-06-21-agentproof",
} as const;

export function canSubmitSurvey(consents: ConsentState): { ok: true } | { ok: false; message: string } {
  if (!consents.age14OrOlder) {
    return { ok: false, message: "만 14세 이상 확인이 필요합니다." };
  }
  if (!consents.surveyProcessing) {
    return { ok: false, message: "필수 개인정보 수집·이용 동의가 필요합니다." };
  }
  return { ok: true };
}

export function isRewardEligible(input: {
  completed: boolean;
  duplicate: boolean;
  fraudulent: boolean;
  resultBand: string;
  pilotInterest: boolean;
}): boolean {
  void input.resultBand;
  void input.pilotInterest;
  return input.completed && !input.duplicate && !input.fraudulent;
}
