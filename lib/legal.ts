const legalOperatorName = process.env.LEGAL_OPERATOR_NAME?.trim() || null;

export const LEGAL_CONFIG = {
  serviceName: "AgentProof",
  contactEmail: "agentproof.ai@gmail.com",
  operatorType: "개인 운영 프로젝트",
  operatorName: legalOperatorName,
  privacyManager: legalOperatorName,
  operatorIdentityStatus: legalOperatorName ? "verified" : "missing",
} as const;

export const legalReviewItems = [
  {
    priority: "P0",
    title: "운영자 식별정보 법무 검토",
    body:
      "확장된 공개 수집 전에 개인정보처리자의 법적 표시명과 고지 형식을 검토해야 합니다. 검증된 법적 이름이 제공되기 전까지 공개 UI에 임의 이름을 표시하지 않습니다.",
  },
] as const;
