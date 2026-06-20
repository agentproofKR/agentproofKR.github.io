"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";

import {
  followupEventByOption,
  followupOptions,
  landingVariant,
  leadConsentVersion,
  type ProblemOption,
  problemOptions,
  type RoleOption,
  roleOptions,
  stageOptions,
} from "@/components/landing/content";
import { leadSchema, type LeadInput } from "@/components/lead/leadSchema";
import { trackEvent } from "@/lib/analytics";
import { createLeadMailtoHref } from "@/lib/staticLeadFallback";
import { getStoredUtm } from "@/lib/utm";
import styles from "@/styles/landing.module.css";

export type LeadPlacement =
  | "header"
  | "hero"
  | "process"
  | "final"
  | "role_employee"
  | "role_business"
  | "role_security";

type LeadFormProps = {
  placement: LeadPlacement;
  initialRole?: RoleOption;
  initialProblem?: ProblemOption;
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "handoff"; message: string; href: string }
  | { kind: "error"; message: string };

const staticLeadRecipient = "agentproof.ai@gmail.com";

export function LeadForm({ placement, initialRole, initialProblem }: LeadFormProps) {
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
      role: initialRole,
      stage: undefined,
      problem: initialProblem,
      followup: undefined,
      email: "",
      focusArea: "",
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
    trackEvent("lead_form_start", { placement, role_if_known: initialRole ?? "" });
  };

  const onSubmit = async (data: LeadInput) => {
    const currentUtm = getStoredUtm(window.sessionStorage);
    const viewportGroup = window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
    setSubmitState({ kind: "submitting" });
    trackEvent("diagnosis_submit", {
      role: data.role,
      stage: data.stage,
      problem: data.problem,
      followup: data.followup,
      placement,
      utm_source: currentUtm.source ?? "",
      utm_medium: currentUtm.medium ?? "",
      utm_campaign: currentUtm.campaign ?? "",
      utm_content: currentUtm.content ?? "",
      viewport_group: viewportGroup,
    });

    const leadForHandoff: LeadInput = {
      ...data,
      utm: currentUtm,
      landingVariant,
      consentVersion: leadConsentVersion,
    };
    const href = createLeadMailtoHref(leadForHandoff, staticLeadRecipient);

    trackEvent(followupEventByOption[data.followup], {
      role: data.role,
      stage: data.stage,
      problem: data.problem,
      placement,
    });
    trackEvent("lead_static_handoff", {
      role: data.role,
      stage: data.stage,
      problem: data.problem,
      followup: data.followup,
      placement,
      utm_source: currentUtm.source ?? "",
      utm_medium: currentUtm.medium ?? "",
      utm_campaign: currentUtm.campaign ?? "",
      utm_content: currentUtm.content ?? "",
      viewport_group: viewportGroup,
    });
    setSubmitState({
      kind: "handoff",
      href,
      message:
        "GitHub Pages 정적 배포에서는 서버 저장이 연결되어 있지 않습니다. 아래 링크로 메일 앱을 열어 신청 내용을 보내주세요.",
    });
  };

  const onInvalid = () => {
    const fieldNames = Object.keys(errors);
    trackEvent("lead_form_error", { error_code: "VALIDATION_ERROR", field_names: fieldNames });
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
        <label>
          <span>나는</span>
          <select
            id="role"
            aria-describedby={errors.role ? "role-error" : undefined}
            {...register("role")}
          >
            <option value="">선택</option>
            {roleOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <FieldError id="role-error" message={errors.role?.message} />
        </label>
        <label>
          <span>현재 단계</span>
          <select
            id="stage"
            aria-describedby={errors.stage ? "stage-error" : undefined}
            {...register("stage")}
          >
            <option value="">선택</option>
            {stageOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <FieldError id="stage-error" message={errors.stage?.message} />
        </label>
      </div>

      <label>
        <span>가장 가까운 문제</span>
        <select
          aria-describedby={errors.problem ? "problem-error" : undefined}
          {...register("problem")}
        >
          <option value="">선택</option>
          {problemOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <FieldError id="problem-error" message={errors.problem?.message} />
      </label>

      <div className={styles.formGrid}>
        <label>
          <span>원하는 다음 단계</span>
          <select
            aria-describedby={errors.followup ? "followup-error" : undefined}
            {...register("followup")}
          >
            <option value="">선택</option>
            {followupOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <FieldError id="followup-error" message={errors.followup?.message} />
        </label>
        <label>
          <span>업무 이메일</span>
          <input
            type="email"
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </label>
      </div>

      <label>
        <span>
          적용하고 싶은 업무 <em className={styles.optionalField}>선택</em>
        </span>
        <textarea
          aria-describedby={errors.focusArea ? "focus-area-error focus-area-help" : "focus-area-help"}
          placeholder="예: 인사 규정 검색, 고객 문의 답변"
          {...register("focusArea")}
        />
        <FieldError id="focus-area-error" message={errors.focusArea?.message} />
      </label>
      <p id="focus-area-help" className={styles.fieldHelp}>
        기밀정보는 작성하지 마세요.
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
        <span>
          진단 결과와 파일럿 안내를 위한 개인정보 수집·이용에 동의합니다. 기밀정보는
          작성하지 마세요.
        </span>
      </label>
      <FieldError id="consent-error" message={errors.consent?.message} />

      <button
        className={`${styles.button} ${styles.buttonDark} ${styles.submitButton}`}
        type="submit"
        disabled={
          isSubmitting || submitState.kind === "submitting"
        }
      >
        {submitState.kind === "submitting" ? "신청 중…" : "진단 제출"}
      </button>

      <p className={styles.formHint}>Private beta 고객검증용 화면입니다.</p>

      {submitState.kind === "handoff" ? (
        <p className={styles.successMessage} role="status">
          {submitState.message}
          <a
            className={`${styles.button} ${styles.buttonDark} ${styles.mailtoLink}`}
            href={submitState.href}
          >
            업무 이메일로 신청 내용 보내기
          </a>
        </p>
      ) : null}
      {submitState.kind === "error" ? (
        <p className={styles.errorMessage} role="alert">
          {submitState.message}
        </p>
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
