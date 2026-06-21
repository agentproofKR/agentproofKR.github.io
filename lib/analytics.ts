export type AnalyticsEvent =
  | "page_view"
  | "diagnostic_preview_click"
  | "diagnosis_start"
  | "diagnosis_submit"
  | "followup_checklist"
  | "followup_pilot"
  | "followup_sample_report"
  | "lead_modal_open"
  | "lead_form_start"
  | "lead_form_submit_attempt"
  | "lead_form_validation_error"
  | "lead_form_error"
  | "lead_form_success"
  | "lead_form_server_error"
  | "lead_static_handoff"
  | "nav_anchor_click"
  | "product_tab_select"
  | "role_problem_click"
  | "survey_landing_view"
  | "survey_start_click"
  | "persona_selected"
  | "privacy_notice_opened"
  | "required_consent_accepted"
  | "survey_started"
  | "survey_core_started"
  | "survey_section_completed"
  | "survey_completed"
  | "result_viewed"
  | "beta_optin"
  | "interview_optin"
  | "pilot_requested";

export type AnalyticsPayload = Record<string, string | number | boolean | string[]>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const allowedKeys = new Set([
  "persona",
  "survey_version",
  "scoring_version",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "question_count",
  "completion_time_band",
  "result_band",
]);

export function sanitizeAnalyticsPayload(payload: AnalyticsPayload = {}): AnalyticsPayload {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.has(key)),
  ) as AnalyticsPayload;
}

export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!Array.isArray(window.dataLayer)) {
    window.dataLayer = [];
  }
  window.dataLayer.push({ event, ...sanitizeAnalyticsPayload(payload) });
}
