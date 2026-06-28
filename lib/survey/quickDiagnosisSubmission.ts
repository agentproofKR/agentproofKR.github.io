import type {
  AdoptionScope,
  Exposure,
  MonthlyVolume,
  ProjectScale,
  QuickWorkType,
  TimePerCase,
} from "./quickDiagnosis";

export type QuickDiagnosisPayload = {
  kind: "quick_diagnosis";
  sessionId: string;
  idempotencyKey: string;
  quickDiagnosisVersion: string;
  honeypot?: string;
  selections: {
    workType: QuickWorkType;
    monthlyVolume: MonthlyVolume;
    timePerCase: TimePerCase;
    adoptionScope: AdoptionScope;
    exposure: Exposure;
  };
  result: {
    aiAdoptionScore: number;
    resultBand: string;
    savingRateMin: number;
    savingRateMax: number;
    savingHoursMin: number;
    savingHoursMax: number;
    savingMoneyMin: number;
    savingMoneyMax: number;
    supportReviewAverage: number | null;
    supportReviewMin: number | null;
    supportReviewMax: number | null;
    projectScale: ProjectScale;
    hourlyCost: number;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
};

export type QuickDiagnosisSubmissionMode =
  | { mode: "live"; endpoint: string }
  | { mode: "disabled" };

export type QuickDiagnosisSubmitResult =
  | {
      ok: true;
      status: "quick_diagnosis_stored" | "duplicate";
      sessionId: string;
    }
  | { ok: false; code: string; message: string };

export function getQuickDiagnosisSubmissionMode(
  publicApiUrl?: string | null,
): QuickDiagnosisSubmissionMode {
  const endpoint = publicApiUrl?.trim();
  if (!endpoint) {
    return { mode: "disabled" };
  }
  return { mode: "live", endpoint };
}

export async function submitQuickDiagnosisToEndpoint(
  endpoint: string,
  payload: QuickDiagnosisPayload,
): Promise<QuickDiagnosisSubmitResult> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      code: "NETWORK_ERROR",
      message: "익명 진단 결과를 저장하지 못했습니다.",
    };
  }

  const body = await safeJson(response);
  if (
    response.ok &&
    body?.ok === true &&
    (body.status === "quick_diagnosis_stored" || body.status === "duplicate")
  ) {
    return {
      ok: true,
      status: body.status,
      sessionId: String(body.sessionId ?? payload.sessionId),
    };
  }

  return {
    ok: false,
    code: String(body?.code ?? response.status),
    message: "익명 진단 결과를 저장하지 못했습니다.",
  };
}

async function safeJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
