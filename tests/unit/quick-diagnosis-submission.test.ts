import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getQuickDiagnosisSubmissionMode,
  submitQuickDiagnosisToEndpoint,
  type QuickDiagnosisPayload,
} from "../../lib/survey/quickDiagnosisSubmission";

const payload: QuickDiagnosisPayload = {
  kind: "quick_diagnosis",
  sessionId: "018f62b1-723f-4a2e-9f87-0c9bdc612345",
  idempotencyKey: "quick-018f62b1-723f-4a2e-9f87-0c9bdc612345",
  quickDiagnosisVersion: "2026-06-AgentProof-quick-diagnosis-storage-v1",
  honeypot: "",
  selections: {
    workType: "customer_reply",
    monthlyVolume: "low",
    timePerCase: "short",
    adoptionScope: "reviewed_use",
    exposure: "internal",
  },
  result: {
    aiAdoptionScore: 75,
    resultBand: "조건부 시작",
    savingRateMin: 0.1,
    savingRateMax: 0.25,
    savingHoursMin: 0.0083,
    savingHoursMax: 0.4167,
    savingMoneyMin: 250,
    savingMoneyMax: 12_500,
    supportReviewAverage: 3_400_000,
    supportReviewMin: 1_200_000,
    supportReviewMax: 5_600_000,
    projectScale: "low",
    hourlyCost: 30_000,
  },
  utm: {
    source: "linkedin",
    medium: "organic_social",
    campaign: "ai_readiness",
    content: "quick",
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("quick diagnosis anonymous submission helper", () => {
  it("is disabled when the public API URL is missing", () => {
    expect(getQuickDiagnosisSubmissionMode()).toEqual({ mode: "disabled" });
    expect(getQuickDiagnosisSubmissionMode("")).toEqual({ mode: "disabled" });
  });

  it("uses live mode when an endpoint exists", () => {
    expect(
      getQuickDiagnosisSubmissionMode(
        "https://example.supabase.co/functions/v1/survey-submit",
      ),
    ).toEqual({
      mode: "live",
      endpoint: "https://example.supabase.co/functions/v1/survey-submit",
    });
  });

  it("posts anonymous quick diagnosis payloads", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          status: "quick_diagnosis_stored",
          sessionId: payload.sessionId,
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await submitQuickDiagnosisToEndpoint(
      "https://example.supabase.co/functions/v1/survey-submit",
      payload,
    );

    expect(result).toEqual({
      ok: true,
      status: "quick_diagnosis_stored",
      sessionId: payload.sessionId,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0];
    expect(request?.method).toBe("POST");
    expect(JSON.parse(String(request?.body))).toMatchObject({
      kind: "quick_diagnosis",
      sessionId: payload.sessionId,
      selections: {
        workType: "customer_reply",
        monthlyVolume: "low",
      },
    });
  });

  it("treats duplicate responses as successful", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, status: "duplicate", sessionId: payload.sessionId }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      submitQuickDiagnosisToEndpoint(
        "https://example.supabase.co/functions/v1/survey-submit",
        payload,
      ),
    ).resolves.toEqual({
      ok: true,
      status: "duplicate",
      sessionId: payload.sessionId,
    });
  });

  it("returns controlled errors without throwing", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("network"));

    await expect(
      submitQuickDiagnosisToEndpoint(
        "https://example.supabase.co/functions/v1/survey-submit",
        payload,
      ),
    ).resolves.toMatchObject({
      ok: false,
      code: "NETWORK_ERROR",
    });
  });
});
