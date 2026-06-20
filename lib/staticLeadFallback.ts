import type { LeadInput } from "@/components/lead/leadSchema";

const subject = "AgentProof AI 준비도 진단 신청";

export function createLeadMailtoHref(lead: LeadInput, recipient: string): string {
  const bodyLines = [
    "AgentProof AI 준비도 진단 신청",
    "",
    `역할: ${lead.role}`,
    `현재 단계: ${lead.stage}`,
    `가장 가까운 문제: ${lead.problem}`,
    `원하는 다음 단계: ${lead.followup}`,
    `업무 이메일: ${lead.email}`,
    `적용하고 싶은 업무: ${lead.focusArea ?? "없음"}`,
    "",
    `개인정보 동의 버전: ${lead.consentVersion}`,
    `랜딩 버전: ${lead.landingVariant}`,
    `UTM source: ${lead.utm.source ?? ""}`,
    `UTM medium: ${lead.utm.medium ?? ""}`,
    `UTM campaign: ${lead.utm.campaign ?? ""}`,
    `UTM content: ${lead.utm.content ?? ""}`,
  ];

  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
}
