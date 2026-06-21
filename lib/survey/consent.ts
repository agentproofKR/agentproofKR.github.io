import type { ConsentState } from "./types";

export const consentVersion = "2026-06-21";

export const consentTextHashes = {
  age14OrOlder: "sha256:d39eed1321988754efc37dab031913f9d3c378a408a75bd2218139d7aa79ce7f",
  surveyProcessing: "sha256:c4d1e2bfc621188a300bdd22de2d94d9e5e4ca5c559dc55302202da1686618fa",
  beta: "sha256:166cfbbfc9c5d7bb40ab7affbcc39efc725ddd1519952e76711cdb593f7e6597",
  interview: "sha256:2cd9f947527029ef6a780871515cf289408d44526c3458daad866e4b5d49ac4c",
  pilot: "sha256:1315a75cb25ad92b09421da279e21d3351be684c23f10a878ecc588282161247",
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
