import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  canSubmitSurvey,
  consentTextHashes,
  isRewardEligible,
} from "../../lib/survey/consent";
import { calculateContactExpiry, calculateSurveySourceExpiry } from "../../lib/survey/retention";

describe("survey consent gating", () => {
  it("requires age and survey-processing consent but not optional consents", () => {
    expect(
      canSubmitSurvey({
        age14OrOlder: true,
        surveyProcessing: true,
        personalInfoCollection: true,
        beta: false,
        interview: false,
        pilot: false,
      }),
    ).toEqual({ ok: true });

    expect(
      canSubmitSurvey({
        age14OrOlder: false,
        surveyProcessing: true,
        personalInfoCollection: true,
        beta: true,
        interview: true,
        pilot: true,
      }).ok,
    ).toBe(false);
  });

  it("keeps each consent purpose backed by a real source-text SHA-256 digest", () => {
    expect(Object.keys(consentTextHashes)).toEqual([
      "age14OrOlder",
      "surveyProcessing",
      "personalInfoCollection",
      "beta",
      "interview",
      "pilot",
    ]);
    expect(new Set(Object.values(consentTextHashes)).size).toBe(6);

    const filesByConsent = {
      age14OrOlder: "age-confirmation-ko-2026-06-21.md",
      surveyProcessing: "survey-processing-ko-2026-06-21.md",
      personalInfoCollection: "personal-info-collection-ko-2026-06-22.md",
      beta: "beta-ko-2026-06-21.md",
      interview: "interview-ko-2026-06-21.md",
      pilot: "pilot-ko-2026-06-21.md",
    } as const;

    for (const [consentType, fileName] of Object.entries(filesByConsent)) {
      const source = readFileSync(resolve("legal", "consent", fileName), "utf8");
      const normalized = source
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/g, ""))
        .join("\n")
        .trimEnd();
      const digest = createHash("sha256").update(normalized, "utf8").digest("hex");
      expect(consentTextHashes[consentType as keyof typeof consentTextHashes]).toBe(
        `sha256:${digest}`,
      );
    }
  });

  it("does not tie reward eligibility to score, purchase intent, or pilot interest", () => {
    expect(
      isRewardEligible({
        completed: true,
        duplicate: false,
        fraudulent: false,
        resultBand: "기준 정립 필요",
        pilotInterest: false,
      }),
    ).toBe(true);

    expect(
      isRewardEligible({
        completed: true,
        duplicate: true,
        fraudulent: false,
        resultBand: "운영 고도화 단계",
        pilotInterest: true,
      }),
    ).toBe(false);
  });
});

describe("retention calculations", () => {
  const submittedAt = new Date("2026-06-21T00:00:00.000Z");

  it("deletes survey source data after six months", () => {
    expect(calculateSurveySourceExpiry(submittedAt).toISOString()).toBe(
      "2026-12-21T00:00:00.000Z",
    );
  });

  it("calculates optional contact retention by request type", () => {
    expect(calculateContactExpiry("survey_followup", submittedAt).toISOString()).toBe(
      "2026-08-21T00:00:00.000Z",
    );
    expect(calculateContactExpiry("interview", submittedAt).toISOString()).toBe(
      "2026-09-19T00:00:00.000Z",
    );
    expect(calculateContactExpiry("pilot", submittedAt).toISOString()).toBe(
      "2027-06-21T00:00:00.000Z",
    );
    expect(
      calculateContactExpiry("beta", submittedAt, new Date("2026-08-01T00:00:00.000Z")).toISOString(),
    ).toBe("2026-10-30T00:00:00.000Z");
    expect(calculateContactExpiry("beta", submittedAt).toISOString()).toBe(
      "2027-06-21T00:00:00.000Z",
    );
  });
});
