"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";

import {
  concernOptions,
  landingVariant,
  leadConsentVersion,
  roleOptions,
  stageOptions,
} from "@/components/landing/content";
import { leadSchema, type LeadInput } from "@/components/lead/leadSchema";
import { trackEvent } from "@/lib/analytics";
import { createLeadMailtoHref } from "@/lib/staticLeadFallback";
import { getStoredUtm } from "@/lib/utm";
import styles from "@/styles/landing.module.css";

type LeadFormProps = {
  placement: "header" | "hero" | "process";
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "handoff"; message: string; href: string };

const leadRecipient = "contact@agentproof.kr";

export function LeadForm({ placement }: LeadFormProps) {
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const hasStarted = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema) as unknown as Resolver<LeadInput>,
    defaultValues: {
      role: undefined,
      stage: undefined,
      concern: undefined,
      company: "",
      email: "",
      memo: "",
      consent: false,
      consentVersion: leadConsentVersion,
      utm: {},
      landingVariant,
      honeypot: "",
    },
  });

  const markFormStart = () => {
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;
    trackEvent("lead_form_start", { role_if_known: "" });
  };

  const onSubmit = (data: LeadInput) => {
    const currentUtm = getStoredUtm(window.sessionStorage);
    setSubmitState({ kind: "submitting" });
    trackEvent("lead_form_submit_attempt", {
      role: data.role,
      stage: data.stage,
      concern: data.concern,
      placement,
      utm_source: currentUtm.source ?? "",
      utm_medium: currentUtm.medium ?? "",
      utm_campaign: currentUtm.campaign ?? "",
      utm_content: currentUtm.content ?? "",
    });

    const href = createLeadMailtoHref(
      {
        ...data,
        utm: currentUtm,
        landingVariant,
        consentVersion: leadConsentVersion,
      },
      leadRecipient,
    );

    setSubmitState({
      kind: "handoff",
      href,
      message:
        "GitHub Pages 정적 배포에서는 서버 저장이 연결되어 있지 않습니다. 아래 버튼으로 업무 이메일에서 신청 내용을 발송해주세요.",
    });
  };

  const onInvalid = () => {
    const fieldNames = Object.keys(errors);
    trackEvent("lead_form_validation_error", { field_names: fieldNames });
    const first = fieldNames[0] as keyof LeadInput | undefined;
    if (first) {
      setFocus(first);
    }
  };

  return (
    <form
      className={styles.leadForm}
      onChange={markFormStart}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
    >
      <div className={styles.formGrid}>
        <FieldError id="role-error" message={errors.role?.message} />
        <label>
          <span>역할</span>
          <select
            id="role"
            aria-describedby={errors.role ? "role-error" : undefined}
            {...register("role")}
          >
            <option value="">선택해주세요</option>
            {roleOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <FieldError id="stage-error" message={errors.stage?.message} />
        <label>
          <span>현재 단계</span>
          <select
            aria-describedby={errors.stage ? "stage-error" : undefined}
            {...register("stage")}
          >
            <option value="">선택해주세요</option>
            {stageOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <FieldError id="concern-error" message={errors.concern?.message} />
      <label>
        <span>가장 걱정되는 문제</span>
        <select
          aria-describedby={errors.concern ? "concern-error" : undefined}
          {...register("concern")}
        >
          <option value="">선택해주세요</option>
          {concernOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <div className={styles.formGrid}>
        <FieldError id="company-error" message={errors.company?.message} />
        <label>
          <span>회사/팀명</span>
          <input
            autoComplete="organization"
            aria-describedby={errors.company ? "company-error" : undefined}
            placeholder="예: QA 테스트 팀"
            {...register("company")}
          />
        </label>
        <FieldError id="email-error" message={errors.email?.message} />
        <label>
          <span>업무 이메일</span>
          <input
            type="email"
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="name@company.com"
            {...register("email")}
          />
        </label>
      </div>

      <FieldError id="memo-error" message={errors.memo?.message} />
      <label>
        <span>상황 설명</span>
        <textarea
          aria-describedby={errors.memo ? "memo-error memo-help" : "memo-help"}
          placeholder="예: 직원들이 ChatGPT를 쓰고 있는데 회사 기준이 없습니다."
          {...register("memo")}
        />
      </label>
      <p id="memo-help" className={styles.fieldHelp}>
        실제 기밀자료, 고객 데이터, 주민등록번호 등 민감정보는 입력하지 않습니다.
      </p>
      <input
        type="text"
        aria-label="website"
        tabIndex={-1}
        autoComplete="off"
        className={styles.honeypot}
        {...register("honeypot")}
      />
      <input type="hidden" value={leadConsentVersion} {...register("consentVersion")} />
      <input type="hidden" value={landingVariant} {...register("landingVariant")} />

      <label className={styles.consentLabel}>
        <input type="checkbox" {...register("consent")} />
        <span>개인정보 동의 및 고객검증 안내 수신에 동의합니다.</span>
      </label>
      <FieldError id="consent-error" message={errors.consent?.message} />

      <button
        className={`${styles.button} ${styles.buttonDark} ${styles.submitButton}`}
        type="submit"
        disabled={isSubmitting || submitState.kind === "submitting"}
      >
        {submitState.kind === "submitting" ? "신청 중…" : "신청하기"}
      </button>

      {submitState.kind === "handoff" ? (
        <div className={styles.handoffMessage} role="status">
          <p>{submitState.message}</p>
          <a className={styles.handoffLink} href={submitState.href}>
            업무 이메일로 신청 내용 보내기
          </a>
        </div>
      ) : null}
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className={styles.fieldError}>
      {message}
    </p>
  );
}
