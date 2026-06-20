import { z } from "zod";

import {
  followupOptions,
  landingVariant,
  leadConsentVersion,
  problemOptions,
  roleOptions,
  stageOptions,
} from "@/components/landing/content";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(1000).optional(),
);

export const leadSchema = z.object({
  role: z.enum(roleOptions, { message: "담당 역할을 선택해주세요." }),
  stage: z.enum(stageOptions, { message: "현재 도입 단계를 선택해주세요." }),
  problem: z.enum(problemOptions, { message: "가장 가까운 문제를 선택해주세요." }),
  followup: z.enum(followupOptions, { message: "원하는 다음 단계를 선택해주세요." }),
  email: z.string().trim().toLowerCase().email("업무 이메일 형식을 확인해주세요.").max(254),
  focusArea: optionalString,
  consent: z.boolean().refine((value) => value === true, "개인정보 수집·이용 동의가 필요합니다."),
  consentVersion: z.literal(leadConsentVersion),
  utm: z
    .object({
      source: optionalString,
      medium: optionalString,
      campaign: optionalString,
      content: optionalString,
    })
    .default({}),
  landingVariant: z.string().trim().default(landingVariant),
  honeypot: z.string().max(120).optional().default(""),
});

export type LeadInput = z.infer<typeof leadSchema>;

export function parseLeadInput(input: unknown): LeadInput {
  return leadSchema.parse(input);
}

export function leadFieldErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
  );
}
