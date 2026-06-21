"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { trackEvent } from "@/lib/analytics";
import { LEGAL_CONFIG } from "@/lib/legal";
import { consentTextHashes, consentVersion } from "@/lib/survey/consent";
import { getSurveyDefinition } from "@/lib/survey/questions";
import { submitContactRequestToEndpoint } from "@/lib/survey/submission";
import type { Persona, SurveyScoreResult } from "@/lib/survey/types";
import styles from "@/styles/survey.module.css";

type StoredResult = {
  sessionId: string;
  persona: Persona;
  result: SurveyScoreResult;
  completedAt: string;
  submissionMode: { mode: "live"; endpoint: string } | { mode: "disabled"; message: string };
};

type RequestType = "beta" | "interview" | "pilot";

let cachedResultRaw: string | null = null;
let cachedResultValue: StoredResult | null = null;

const requestLabels = {
  beta: {
    open: "체크리스트 받기",
    submit: "체크리스트 요청하기",
    consent: "[선택] AgentProof 초기 사용자 참여 안내 동의",
    event: "beta_optin",
  },
  interview: {
    open: "인터뷰하기",
    submit: "인터뷰 신청하기",
    consent: "[선택] 후속 고객 인터뷰 참여 안내 동의",
    event: "interview_optin",
  },
  pilot: {
    open: "우리 회사 상담하기",
    submit: "상담 요청하기",
    consent: "[선택] 파일럿 상담 요청",
    event: "pilot_requested",
  },
} as const;

export function SurveyResult() {
  const stored = useSyncExternalStore(subscribeStoredResult, readStoredResult, () => null);
  const [activeRequest, setActiveRequest] = useState<RequestType | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (stored) {
      trackEvent("result_viewed", {
        persona: stored.persona,
        survey_version: stored.result.surveyVersion,
        result_band: stored.result.displayRiskBand,
      });
    }
  }, [stored]);

  const definition = useMemo(
    () => (stored ? getSurveyDefinition(stored.persona) : null),
    [stored],
  );

  if (!stored || !definition) {
    return (
      <main className={styles.page}>
        <section className={styles.surveyPanel}>
          <h1>AI 안전 체크 결과</h1>
          <p>저장된 결과가 없습니다. 3분 체크를 먼저 완료해주세요.</p>
          <Link className={styles.primaryLink} href="/survey/">
            시작하기
          </Link>
        </section>
      </main>
    );
  }

  const result = stored.result;

  return (
    <main className={styles.page}>
      <section className={styles.resultHero} aria-labelledby="result-title">
        <Link className={styles.backLink} href="/survey/">
          새 체크 시작
        </Link>
        <p className={styles.eyebrow}>AI 안전 체크 결과</p>
        <h1 id="result-title">AI 안전 체크 결과</h1>
        <p className={styles.lead}>
          지금 먼저 막아야 할 위험과
          <br />
          이번 주 할 일을 정리했습니다.
          <br />
          보안 인증이나 법률 자문은 아닙니다.
        </p>
        <div className={styles.scorePanel}>
          <div>
            <span>점수</span>
            <strong>{result.displayRiskBand}</strong>
            <p>{getRiskSummary(result.displayRiskBand)}</p>
          </div>
        </div>
        {stored.submissionMode.mode === "disabled" ? (
          <p className={styles.warningBox}>{stored.submissionMode.message}</p>
        ) : (
          <p className={styles.successBox}>설문 저장소에 결과가 전송되었습니다.</p>
        )}
      </section>

      <section className={styles.resultGrid} aria-label="결과 세부 항목">
        <article className={styles.resultCard}>
          <h2>점수</h2>
          {Object.entries(result.dimensionScores).map(([dimension, score]) => (
            <div className={styles.scoreRow} key={dimension}>
              <span>{dimension}</span>
              <meter min={0} max={100} value={score} />
              <b>{score}</b>
            </div>
          ))}
        </article>
        <article className={styles.resultCard}>
          <h2>먼저 볼 위험</h2>
          <ol>
            {result.topRisks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ol>
        </article>
        <article className={styles.resultCard}>
          <h2>이번 주에 할 일</h2>
          <ol>
            {result.recommendedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </article>
        <article className={styles.resultCard}>
          <h2>AgentProof로 관리하기</h2>
          <ol>
            <li>답변 근거 / 출처 없는 답을 걸러냅니다.</li>
            <li>위험 테스트 / 오답·기밀·권한 문제를 찾습니다.</li>
            <li>승인 기록 / 누가 확인했는지 남깁니다.</li>
          </ol>
        </article>
      </section>

      <section className={styles.noticeBand} aria-labelledby="reward-title">
        <div>
          <h2 id="reward-title">이제 뭘 하면 될까요?</h2>
          <p>원하면 다음 단계로 이어갈 수 있어요.</p>
        </div>
        <div className={styles.inlineActions}>
          <button className={styles.secondaryButton} type="button" onClick={() => window.print()}>
            인쇄
          </button>
          <button className={styles.secondaryButton} type="button" onClick={() => downloadChecklist(stored)}>
            체크리스트 다운로드
          </button>
        </div>
      </section>

      <section className={styles.optinPanel} aria-labelledby="optional-actions-title">
        <h2 id="optional-actions-title">다음 단계</h2>
        <div className={styles.inlineActions}>
          {(Object.keys(requestLabels) as RequestType[]).map((requestType) => (
            <button
              className={styles.primaryButton}
              type="button"
              key={requestType}
              data-testid={`${requestType}-optin-open`}
              onClick={() => {
                setActiveRequest(requestType);
                setStatus("");
              }}
            >
              {requestLabels[requestType].open}
            </button>
          ))}
        </div>
        {activeRequest ? (
          <OptInForm
            requestType={activeRequest}
            sessionId={stored.sessionId}
            persona={stored.persona}
            resultBand={result.displayRiskBand}
            submissionMode={stored.submissionMode}
            onStatus={setStatus}
          />
        ) : null}
        {status ? (
          <p className={styles.successBox} role="status">
            {status}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function getRiskSummary(riskBand: SurveyScoreResult["displayRiskBand"]): string {
  if (riskBand === "즉시 점검 필요") {
    return "AI를 사용하고 있지만 정보 입력, 사람 검토, 사용 기준이 충분히 정리되지 않은 상태입니다.";
  }
  if (riskBand === "위험") {
    return "일부 업무는 실험할 수 있지만 회사 자료 입력과 승인 기준을 먼저 보완해야 합니다.";
  }
  if (riskBand === "주의") {
    return "기본 기준은 있으나 외부 제출 전 검토와 허용 도구 목록을 더 명확히 해야 합니다.";
  }
  return "AI 사용 기준이 비교적 정리되어 있으며 정기 점검과 승인 기록을 유지하면 좋습니다.";
}

function OptInForm({
  requestType,
  sessionId,
  persona,
  resultBand,
  submissionMode,
  onStatus,
}: {
  requestType: RequestType;
  sessionId: string;
  persona: Persona;
  resultBand: string;
  submissionMode: StoredResult["submissionMode"];
  onStatus: (status: string) => void;
}) {
  const labels = requestLabels[requestType];
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const consent = form.get("consent") === "on";
    const company = String(form.get("company") ?? "");

    if (!email.includes("@")) {
      setError("이메일 형식을 확인해주세요.");
      return;
    }
    if (!consent) {
      setError("선택 항목 기록을 위해 해당 동의가 필요합니다.");
      return;
    }

    if (submissionMode.mode === "live") {
      const saved = await submitContactRequestToEndpoint(submissionMode.endpoint, {
        kind: "contact_request",
        sessionId,
        idempotencyKey: crypto.randomUUID(),
        persona,
        consentVersion,
        consentTextHash: consentTextHashes[requestType],
        requestType,
        email,
        company: requestType === "pilot" ? company : undefined,
        role: persona,
        preferredContactPurpose: labels.open,
        honeypot: String(form.get("website") ?? ""),
      });
      if (!saved.ok) {
        setError(saved.message);
        return;
      }
    }

    trackEvent(labels.event, {
      persona,
      survey_version: "2026-06-21",
      result_band: resultBand,
    });
    setError("");
    onStatus(
      submissionMode.mode === "live"
        ? "선택 참여 요청이 별도 기록되었습니다."
        : "저장소가 연결되면 별도 기록됩니다. 현재 화면에서는 개인정보를 전송하지 않습니다.",
    );
    event.currentTarget.reset();
  };

  return (
    <form className={styles.optinForm} onSubmit={submit}>
      <input type="hidden" name="consentVersion" value={consentVersion} />
      <label>
        <span>이메일</span>
        <input name="email" type="email" autoComplete="email" />
      </label>
      {requestType === "pilot" ? (
        <label>
          <span>회사 또는 팀명</span>
          <input name="company" type="text" maxLength={120} />
        </label>
      ) : null}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" hidden />
      <p className={styles.fieldHint}>
        개인정보, 고객명, 회사 기밀, 접속정보 또는 실제 보안 취약점은 입력하지 마세요.
      </p>
      <label className={styles.checkboxLine}>
        <input name="consent" type="checkbox" />
        <span>{labels.consent}</span>
      </label>
      {error ? (
        <p className={styles.errorBox} role="alert">
          {error}
        </p>
      ) : null}
      <button className={styles.primaryButton} type="submit">
        {labels.submit}
      </button>
    </form>
  );
}

function downloadChecklist(stored: StoredResult) {
  const result = stored.result;
  const body = [
    "AgentProof 역할별 AI 자가점검 결과",
    `역할: ${getSurveyDefinition(stored.persona).title}`,
    `현재 상태: ${result.displayRiskBand}`,
    "",
    "이번 주에 할 일",
    ...result.recommendedActions.map((action, index) => `${index + 1}. ${action}`),
    "",
    `문의: ${LEGAL_CONFIG.contactEmail}`,
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agentproof-ai-readiness-checklist.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function readStoredResult(): StoredResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem("agentproof-survey-result");
  if (!raw) {
    cachedResultRaw = null;
    cachedResultValue = null;
    return null;
  }
  if (raw === cachedResultRaw) {
    return cachedResultValue;
  }

  try {
    cachedResultRaw = raw;
    cachedResultValue = JSON.parse(raw) as StoredResult;
    return cachedResultValue;
  } catch {
    window.sessionStorage.removeItem("agentproof-survey-result");
    cachedResultRaw = null;
    cachedResultValue = null;
    return null;
  }
}

function subscribeStoredResult(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: StorageEvent) => {
    if (event.key === "agentproof-survey-result") {
      callback();
    }
  };
  window.addEventListener("storage", listener);
  const timer = window.setTimeout(callback, 0);
  return () => {
    window.removeEventListener("storage", listener);
    window.clearTimeout(timer);
  };
}
