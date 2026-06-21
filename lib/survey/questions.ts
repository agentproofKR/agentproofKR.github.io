import type { Persona, SurveyAnswerMap, SurveyDefinition, SurveyIntent, SurveyOption, SurveyQuestion } from "./types";

export const surveyVersion = "2026-06-21";
export const scoringVersion = "2026-06-21";

const roleOptions = [
  { value: "practitioner", label: "실무자" },
  { value: "executive", label: "대표·경영진" },
  { value: "ai_dx", label: "AI 도입·DX·기획 담당자" },
  { value: "security_policy", label: "보안·개인정보·정책 담당자" },
  { value: "other", label: "기타" },
] as const satisfies readonly SurveyOption[];

const orgSizeOptions = [
  { value: "1_10", label: "1–10명" },
  { value: "11_50", label: "11–50명" },
  { value: "51_300", label: "51–300명" },
  { value: "301_1000", label: "301–1,000명" },
  { value: "1001_plus", label: "1,001명 이상" },
  { value: "prefer_not", label: "응답하지 않음" },
] as const satisfies readonly SurveyOption[];

const industryOptions = [
  { value: "it_software", label: "IT·소프트웨어" },
  { value: "professional_services", label: "전문서비스" },
  { value: "manufacturing", label: "제조" },
  { value: "finance_insurance", label: "금융·보험" },
  { value: "commerce", label: "유통·커머스" },
  { value: "education", label: "교육" },
  { value: "public_nonprofit", label: "공공·비영리" },
  { value: "healthcare", label: "헬스케어" },
  { value: "media_content", label: "미디어·콘텐츠" },
  { value: "other", label: "기타" },
  { value: "prefer_not", label: "응답하지 않음" },
] as const satisfies readonly SurveyOption[];

const aiStageOptions = [
  { value: "none", label: "아직 사용하지 않음", score: 0 },
  { value: "personal", label: "개인 단위 사용", score: 1 },
  { value: "team", label: "팀 단위 사용", score: 2 },
  { value: "pilot", label: "파일럿 운영", score: 3 },
  { value: "formal_some", label: "일부 업무 정식 운영", score: 3 },
  { value: "companywide", label: "전사 확산", score: 4 },
  { value: "unknown", label: "모름", score: 0 },
] as const satisfies readonly SurveyOption[];

const aiTypeOptions = [
  { value: "gen_ai", label: "ChatGPT, Gemini, Claude 등 생성형 AI" },
  { value: "copilot", label: "Microsoft 365 Copilot 또는 유사 업무 Copilot" },
  { value: "internal_chatbot", label: "사내 AI 챗봇" },
  { value: "rag", label: "문서검색·RAG" },
  { value: "agent_automation", label: "AI Agent 또는 업무 자동화" },
  { value: "coding", label: "개발·코딩 도구" },
  { value: "media_generation", label: "이미지·영상 생성 도구" },
  { value: "none", label: "아직 없음" },
  { value: "other", label: "기타" },
] as const satisfies readonly SurveyOption[];

const desiredOutcomeOptions = [
  { value: "time_saving", label: "업무시간 절감" },
  { value: "quality", label: "품질 향상" },
  { value: "cost", label: "비용 절감" },
  { value: "customer_experience", label: "고객경험 개선" },
  { value: "decision_support", label: "의사결정 지원" },
  { value: "risk_management", label: "규정·보안 위험관리" },
  { value: "new_service", label: "신규 서비스 개발" },
  { value: "unclear", label: "아직 명확하지 않음" },
] as const satisfies readonly SurveyOption[];

const maturityOptions = [
  { value: "none", label: "없음", score: 0 },
  { value: "planning", label: "계획 중", score: 1 },
  { value: "partial", label: "일부 적용", score: 2 },
  { value: "mostly", label: "대부분 적용", score: 3 },
  { value: "established", label: "정착·정기점검", score: 4 },
  { value: "unknown", label: "모름", score: 0 },
  { value: "not_applicable", label: "해당 없음", score: null },
] as const satisfies readonly SurveyOption[];

const frequencyOptions = [
  { value: "none", label: "거의 사용하지 않음", score: 0 },
  { value: "monthly", label: "월 1–2회", score: 1 },
  { value: "weekly", label: "주 1–2회", score: 2 },
  { value: "several_weekly", label: "주 3회 이상", score: 3 },
  { value: "daily", label: "거의 매일", score: 4 },
  { value: "unknown", label: "모름", score: 0 },
] as const satisfies readonly SurveyOption[];

const yesPartialNoOptions = [
  { value: "yes", label: "예", score: 4 },
  { value: "partial", label: "부분적으로", score: 2 },
  { value: "no", label: "아니오", score: 0 },
  { value: "unknown", label: "모름", score: 0 },
  { value: "not_applicable", label: "해당 없음", score: null },
] as const satisfies readonly SurveyOption[];

const reverseIncidentOptions = [
  { value: "yes", label: "예", score: 0 },
  { value: "partial", label: "가끔 있음", score: 1 },
  { value: "no", label: "아니오", score: 4 },
  { value: "unknown", label: "모름", score: 0 },
] as const satisfies readonly SurveyOption[];

const accountOptions = [
  { value: "company", label: "회사 계정", score: 4 },
  { value: "mixed", label: "개인·회사 계정 혼용", score: 2 },
  { value: "personal", label: "개인 계정", score: 0 },
  { value: "unknown", label: "모름", score: 0 },
] as const satisfies readonly SurveyOption[];

const infoTypeOptions = [
  { value: "public", label: "공개 정보", score: 4 },
  { value: "internal_general", label: "일반 사내자료", score: 2 },
  { value: "customer_contract", label: "고객·계약 정보", score: 1 },
  { value: "personal_data", label: "개인정보", score: 0 },
  { value: "confidential", label: "회사 기밀", score: 0 },
  { value: "unknown", label: "모름", score: 0 },
] as const satisfies readonly SurveyOption[];

const budgetOptions = [
  { value: "none", label: "아직 예산 없음", score: 0 },
  { value: "under_1m", label: "100만원 미만", score: 1 },
  { value: "1m_3m", label: "100–300만원", score: 2 },
  { value: "3m_10m", label: "300–1,000만원", score: 3 },
  { value: "10m_plus", label: "1,000만원 이상", score: 4 },
  { value: "range_review", label: "도입 범위에 따라 검토", score: 2 },
  { value: "prefer_not", label: "응답하지 않음", score: null },
] as const satisfies readonly SurveyOption[];

const workflowOptions = [
  { value: "documents", label: "문서·보고서 작성" },
  { value: "research", label: "조사·요약" },
  { value: "customer_support", label: "고객응대" },
  { value: "internal_search", label: "사내 지식 검색" },
  { value: "code_data", label: "코드·데이터 분석" },
  { value: "external_action", label: "외부 발송·자동화" },
  { value: "other", label: "기타" },
] as const satisfies readonly SurveyOption[];

const barrierOptions = [
  { value: "security", label: "보안·개인정보 우려" },
  { value: "accuracy", label: "정확도와 근거 부족" },
  { value: "budget", label: "예산·비용 불확실성" },
  { value: "ownership", label: "책임자와 승인 기준 부재" },
  { value: "data", label: "데이터·문서 품질 부족" },
  { value: "change", label: "현업 변화관리 부담" },
  { value: "unknown", label: "모름" },
] as const satisfies readonly SurveyOption[];

const supportOptions = [
  { value: "checklist", label: "체크리스트" },
  { value: "policy_template", label: "사용 기준 템플릿" },
  { value: "priority_report", label: "도입 우선순위 리포트" },
  { value: "risk_review", label: "보안·정책 위험 검토" },
  { value: "pilot_plan", label: "파일럿 실행 계획" },
  { value: "unknown", label: "아직 명확하지 않음" },
] as const satisfies readonly SurveyOption[];

const situationOptions = [
  { value: "direct_user", label: "내가 직접 AI를 업무에 쓰고 있다" },
  { value: "adoption_owner", label: "팀이나 회사에 AI 도입을 검토하고 있다" },
  { value: "security_owner", label: "AI 사용 기준, 보안, 개인정보가 걱정된다" },
  { value: "unclear", label: "아직 명확하지 않지만 AI 사용이 불안하다" },
] as const satisfies readonly SurveyOption[];

const concernOptions = [
  { value: "wrong_answer", label: "AI 답변이 틀릴까 봐 걱정된다", score: 1 },
  { value: "source_check", label: "근거와 출처를 확인하기 어렵다", score: 1 },
  { value: "data_leak", label: "개인정보나 회사 기밀이 들어갈까 봐 걱정된다", score: 0 },
  { value: "approval_gap", label: "누가 승인하고 책임지는지 기준이 없다", score: 0 },
  { value: "where_to_start", label: "어떤 업무부터 도입해야 할지 모르겠다", score: 1 },
  { value: "effect_cost", label: "비용 대비 효과를 설명하기 어렵다", score: 1 },
  { value: "unknown_usage", label: "직원들이 어떤 AI를 쓰는지 파악하기 어렵다", score: 0 },
] as const satisfies readonly SurveyOption[];

const dataInputOptions = [
  { value: "none", label: "없다", score: 4 },
  { value: "public_only", label: "공개 정보만 입력한다", score: 4 },
  { value: "internal_general", label: "일반 사내자료를 입력한 적이 있다", score: 2 },
  { value: "customer_contract", label: "고객·계약 정보를 입력한 적이 있다", score: 1 },
  { value: "personal_confidential", label: "개인정보나 회사 기밀을 입력한 적이 있다", score: 0 },
  { value: "unknown", label: "잘 모르겠다", score: 0 },
] as const satisfies readonly SurveyOption[];

const humanReviewOptions = [
  { value: "always", label: "항상 확인한다", score: 4 },
  { value: "important_only", label: "중요한 경우만 확인한다", score: 2 },
  { value: "rarely", label: "거의 확인하지 않는다", score: 0 },
  { value: "no_standard", label: "확인 기준이 없다", score: 0 },
  { value: "unknown", label: "잘 모르겠다", score: 0 },
] as const satisfies readonly SurveyOption[];

const policyOptions = [
  { value: "clear", label: "명확한 기준이 있고 안내되어 있다", score: 4 },
  { value: "partial", label: "일부 기준은 있다", score: 2 },
  { value: "verbal", label: "구두로만 안내되어 있다", score: 1 },
  { value: "none", label: "기준이 없다", score: 0 },
  { value: "unknown", label: "잘 모르겠다", score: 0 },
] as const satisfies readonly SurveyOption[];

const followupPreferenceOptions = [
  { value: "result_only", label: "결과만 확인하고 싶다" },
  { value: "checklist", label: "체크리스트를 받고 싶다" },
  { value: "interview", label: "20분 인터뷰에 참여할 수 있다" },
  { value: "pilot", label: "우리 회사 상황으로 파일럿 상담을 받고 싶다" },
  { value: "later", label: "나중에 다시 보고 싶다" },
] as const satisfies readonly SurveyOption[];

export const unifiedCoreQuestions = [
  { id: "U01", text: "지금 가장 가까운 상황은 무엇인가요?", type: "single", options: situationOptions, scored: false },
  { id: "U02", text: "조직 규모는 어느 정도인가요?", type: "single", options: orgSizeOptions, scored: false },
  { id: "U03", text: "현재 사용하거나 검토 중인 AI는 무엇인가요?", type: "multi", options: aiTypeOptions, maxSelections: 4, scored: false },
  { id: "U04", text: "AI를 주로 어떤 업무에 쓰거나 쓰고 싶나요?", type: "multi", options: workflowOptions, maxSelections: 3, scored: false },
  { id: "U05", text: "AI 사용에서 가장 불안한 점은 무엇인가요?", type: "single", options: concernOptions, scored: false },
  { id: "U06", text: "AI에 회사 자료나 고객 정보를 입력한 적이 있나요?", type: "single", options: dataInputOptions, scored: true, dimension: "정보 입력 위험" },
  { id: "U07", text: "AI 답변을 업무에 쓰기 전에 사람이 다시 확인하나요?", type: "single", options: humanReviewOptions, scored: true, dimension: "답변 검토 기준" },
  { id: "U08", text: "회사나 팀에 AI 사용 기준이 있나요?", type: "single", options: policyOptions, scored: true, dimension: "사용 기준 성숙도" },
  { id: "U09", text: "지금 가장 먼저 필요한 도움은 무엇인가요?", type: "single", options: supportOptions, scored: false },
  { id: "U10", text: "결과를 본 뒤 어떤 후속 참여가 가장 편한가요?", type: "single", options: followupPreferenceOptions, scored: false },
] as const satisfies readonly SurveyQuestion[];

const unifiedDimensions = ["정보 입력 위험", "답변 검토 기준", "사용 기준 성숙도"] as const;

const departmentOptions = [
  { value: "operations", label: "운영·관리" },
  { value: "sales_cs", label: "영업·고객지원" },
  { value: "hr", label: "인사·총무" },
  { value: "finance", label: "재무·회계" },
  { value: "product_it", label: "제품·IT" },
  { value: "companywide", label: "전사 공통" },
  { value: "unknown", label: "모름" },
] as const satisfies readonly SurveyOption[];

const timingOptions = [
  { value: "within_1m", label: "1개월 이내", score: 4 },
  { value: "within_3m", label: "3개월 이내", score: 3 },
  { value: "within_6m", label: "6개월 이내", score: 2 },
  { value: "this_year", label: "올해 안", score: 1 },
  { value: "not_decided", label: "정해지지 않음", score: 0 },
  { value: "unknown", label: "모름", score: 0 },
] as const satisfies readonly SurveyOption[];

const commonQuestions = [
  {
    id: "C01",
    text: "현재 역할과 가장 가까운 것은 무엇인가요?",
    type: "single",
    options: roleOptions,
    scored: false,
  },
  {
    id: "C02",
    text: "조직 규모는 어느 정도인가요?",
    type: "single",
    options: orgSizeOptions,
    scored: false,
  },
  {
    id: "C03",
    text: "조직의 업종은 무엇인가요?",
    type: "single",
    options: industryOptions,
    scored: false,
  },
  {
    id: "C04",
    text: "현재 AI 활용·도입 단계는 어디에 가깝나요?",
    type: "single",
    options: aiStageOptions,
    scored: false,
  },
  {
    id: "C05",
    text: "사용하거나 검토 중인 AI 유형은 무엇인가요?",
    type: "multi",
    options: aiTypeOptions,
    maxSelections: 4,
    scored: false,
  },
  {
    id: "C06",
    text: "AI를 통해 가장 먼저 얻고 싶은 결과는 무엇인가요?",
    type: "single",
    options: desiredOutcomeOptions,
    scored: false,
  },
] as const satisfies readonly SurveyQuestion[];

const practitionerDimensions = [
  "업무 적합성",
  "답변 신뢰성",
  "정보보호",
  "정책 인지도",
  "안전한 활용 준비도",
] as const;

const leaderDimensions = [
  "도입 목적 명확성",
  "업무 우선순위",
  "데이터·프로세스 준비",
  "위험관리",
  "파일럿 실행 준비도",
] as const;

const securityDimensions = [
  "AI 사용 현황",
  "정책 성숙도",
  "데이터·접근통제",
  "검증·모니터링",
  "공급자·사고대응",
] as const;

const practitionerQuestions = [
  { id: "P07", text: "업무에서 AI를 얼마나 자주 사용하나요?", type: "single", options: frequencyOptions, scored: false },
  { id: "P08", text: "AI를 사용하는 업무를 최대 3개 선택해주세요.", type: "multi", options: workflowOptions, maxSelections: 3, scored: false },
  { id: "P09", text: "사용하는 AI 도구는 회사가 승인한 도구인가요?", type: "single", options: yesPartialNoOptions, scored: true, dimension: "정책 인지도" },
  { id: "P10", text: "개인 계정과 회사 계정 중 무엇을 주로 사용하나요?", type: "single", options: accountOptions, scored: true, dimension: "정보보호" },
  { id: "P11", text: "AI에 주로 입력하는 정보 유형은 무엇인가요?", type: "multi", options: infoTypeOptions, maxSelections: 3, scored: true, dimension: "정보보호" },
  { id: "P12", text: "개인정보나 회사 기밀을 입력해도 되는지 고민한 적이 있나요?", type: "single", options: yesPartialNoOptions, scored: true, dimension: "정보보호" },
  { id: "P13", text: "AI에 입력하면 안 되는 정보 기준을 알고 있나요?", type: "single", options: yesPartialNoOptions, scored: true, dimension: "정책 인지도" },
  { id: "P14", text: "AI 답변의 사실 여부를 별도로 확인하나요?", type: "single", options: maturityOptions, scored: true, dimension: "답변 신뢰성" },
  { id: "P15", text: "답변의 출처와 문서 버전을 확인하나요?", type: "single", options: maturityOptions, scored: true, dimension: "답변 신뢰성" },
  { id: "P16", text: "외부 제출 전 사람이 최종 검토하나요?", type: "single", options: maturityOptions, scored: true, dimension: "안전한 활용 준비도" },
  { id: "P17", text: "같은 질문에 답이 달라질 때 처리 기준이 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "답변 신뢰성" },
  { id: "P18", text: "중요한 업무의 질문과 답변을 기록해두나요?", type: "single", options: maturityOptions, scored: true, dimension: "안전한 활용 준비도" },
  { id: "P19", text: "AI 결과물을 승인하거나 책임지는 사람이 정해져 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "안전한 활용 준비도" },
  { id: "P20", text: "회사의 AI 사용 가이드나 교육을 받은 적이 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "정책 인지도" },
  { id: "P21", text: "AI 답변 때문에 오류·재작업·보고 지연을 경험했나요?", type: "single", options: reverseIncidentOptions, scored: true, dimension: "답변 신뢰성" },
  { id: "P22", text: "AI 사용으로 실제 절감된 시간을 체감하고 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "업무 적합성" },
  { id: "P23", text: "현재 가장 큰 방해요인을 최대 2개 선택해주세요.", type: "multi", options: barrierOptions, maxSelections: 2, scored: false },
  { id: "P24", text: "가장 먼저 필요한 지원은 무엇인가요?", type: "single", options: supportOptions, scored: false },
] as const satisfies readonly SurveyQuestion[];

const leaderQuestions = [
  { id: "L07", text: "AI 도입을 가장 먼저 검토하는 부서는 어디인가요?", type: "single", options: departmentOptions, scored: false },
  { id: "L08", text: "우선 검토 중인 업무는 무엇인가요?", type: "multi", options: workflowOptions, maxSelections: 3, scored: false },
  { id: "L09", text: "도입 업무의 우선순위를 정하는 기준이 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "업무 우선순위" },
  { id: "L10", text: "도입 전 현재 소요시간·비용·오류율을 측정하고 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "도입 목적 명확성" },
  { id: "L11", text: "AI 도입으로 기대하는 성과를 최대 3개 선택해주세요.", type: "multi", options: desiredOutcomeOptions, maxSelections: 3, scored: false },
  { id: "L12", text: "경영진 또는 임원 후원자가 지정되어 있나요?", type: "single", options: yesPartialNoOptions, scored: true, dimension: "도입 목적 명확성" },
  { id: "L13", text: "업무별 책임자와 AI 운영 책임자가 정해져 있나요?", type: "single", options: yesPartialNoOptions, scored: true, dimension: "위험관리" },
  { id: "L14", text: "대상 업무의 절차가 문서화되어 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "데이터·프로세스 준비" },
  { id: "L15", text: "필요한 데이터와 문서의 품질·접근권한이 준비되어 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "데이터·프로세스 준비" },
  { id: "L16", text: "기존 시스템과의 연동 범위가 정의되어 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "파일럿 실행 준비도" },
  { id: "L17", text: "사용할 모델·솔루션·구축방식이 결정되어 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "파일럿 실행 준비도" },
  { id: "L18", text: "개인정보·보안·법무 검토를 진행했나요?", type: "single", options: maturityOptions, scored: true, dimension: "위험관리" },
  { id: "L19", text: "AI 결과를 사람이 검토해야 하는 업무가 정의되어 있나요?", type: "single", options: yesPartialNoOptions, scored: true, dimension: "위험관리" },
  { id: "L20", text: "정확도·근거·오류율 등 통과 기준이 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "위험관리" },
  { id: "L21", text: "파일럿의 범위와 종료 조건이 정해져 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "파일럿 실행 준비도" },
  { id: "L22", text: "AI 도입에 사용할 예산 범위가 있나요?", type: "single", options: budgetOptions, scored: false },
  { id: "L23", text: "목표 도입 시점은 언제인가요?", type: "single", options: timingOptions, scored: false },
  { id: "L24", text: "가장 큰 도입 장벽을 최대 2개 선택해주세요.", type: "multi", options: barrierOptions, maxSelections: 2, scored: false },
  { id: "L25", text: "가장 필요한 결과물은 무엇인가요?", type: "single", options: supportOptions, scored: false },
] as const satisfies readonly SurveyQuestion[];

const securityQuestions = [
  { id: "S07", text: "조직에서 사용하는 AI 도구 목록이 관리되고 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "AI 사용 현황" },
  { id: "S08", text: "승인된 AI 도구 목록이 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "AI 사용 현황" },
  { id: "S09", text: "미승인 AI 사용을 파악할 방법이 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "AI 사용 현황" },
  { id: "S10", text: "공식 AI 사용정책이 마련되어 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "정책 성숙도" },
  { id: "S11", text: "데이터 등급별 AI 입력 기준이 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "정책 성숙도" },
  { id: "S12", text: "금지정보와 허용정보가 직원에게 명확히 안내되나요?", type: "single", options: maturityOptions, scored: true, dimension: "정책 성숙도" },
  { id: "S13", text: "기업용 계정, SSO, MFA를 적용하고 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "데이터·접근통제" },
  { id: "S14", text: "사용자·Agent별 최소권한 원칙이 적용되나요?", type: "single", options: maturityOptions, scored: true, dimension: "데이터·접근통제" },
  { id: "S15", text: "개인정보·기밀의 업로드를 차단하거나 탐지할 수 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "데이터·접근통제" },
  { id: "S16", text: "질문, 답변, 파일, 실행행위가 기록되나요?", type: "single", options: maturityOptions, scored: true, dimension: "검증·모니터링" },
  { id: "S17", text: "로그와 AI 입력자료의 보유·삭제기간이 정해져 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "검증·모니터링" },
  { id: "S18", text: "AI 공급자와 개인정보 처리위탁·보안 조건을 검토했나요?", type: "single", options: maturityOptions, scored: true, dimension: "공급자·사고대응" },
  { id: "S19", text: "데이터 저장국, 국외 이전, 모델 학습 사용 여부를 확인했나요?", type: "single", options: maturityOptions, scored: true, dimension: "공급자·사고대응" },
  { id: "S20", text: "환각·근거 정확성 테스트를 수행하나요?", type: "single", options: maturityOptions, scored: true, dimension: "검증·모니터링" },
  { id: "S21", text: "프롬프트 인젝션·권한우회·오남용 테스트를 수행하나요?", type: "single", options: maturityOptions, scored: true, dimension: "검증·모니터링" },
  { id: "S22", text: "외부 발송·수정·결제 같은 행동 전에 사람 승인이 필요한가요?", type: "single", options: yesPartialNoOptions, scored: true, dimension: "데이터·접근통제" },
  { id: "S23", text: "AI 관련 사고대응 절차와 담당자가 정해져 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "공급자·사고대응" },
  { id: "S24", text: "정기 감사·재검증 주기가 정해져 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "정책 성숙도" },
  { id: "S25", text: "직원 교육과 위반 신고 절차가 있나요?", type: "single", options: maturityOptions, scored: true, dimension: "정책 성숙도" },
  { id: "S26", text: "가장 먼저 필요한 보안·정책 결과물은 무엇인가요?", type: "single", options: supportOptions, scored: false },
] as const satisfies readonly SurveyQuestion[];

export const personaDefinitions = {
  practitioner: {
    persona: "practitioner",
    title: "실무자 AI 업무활용 진단",
    description: "AI를 업무에 안전하게 활용하기 위한 답변 신뢰성, 정보보호, 사용 기준을 점검합니다.",
    questionCount: 24,
    estimatedMinutes: "약 7–10분",
    dimensions: practitionerDimensions,
    questions: withCommonDimensions(commonQuestions, "업무 적합성").concat(practitionerQuestions),
  },
  leader: {
    persona: "leader",
    title: "대표·도입 담당자 AI 도입 준비도 진단",
    description: "도입 목적, 업무 우선순위, 데이터·프로세스 준비와 파일럿 실행 기준을 점검합니다.",
    questionCount: 25,
    estimatedMinutes: "약 7–10분",
    dimensions: leaderDimensions,
    questions: withCommonDimensions(commonQuestions, "도입 목적 명확성").concat(leaderQuestions),
  },
  security: {
    persona: "security",
    title: "보안·정책 담당자 AI 통제 성숙도 진단",
    description: "AI 사용 현황, 정책, 접근통제, 검증·모니터링, 공급자·사고대응을 점검합니다.",
    questionCount: 26,
    estimatedMinutes: "약 7–10분",
    dimensions: securityDimensions,
    questions: withCommonDimensions(commonQuestions, "AI 사용 현황").concat(securityQuestions),
  },
} as const satisfies Record<Persona, SurveyDefinition>;

const unifiedDefinition = {
  persona: "practitioner",
  title: "AI 업무 위험도 3분 점검",
  description:
    "ChatGPT, Copilot, Claude, 사내 챗봇, AI Agent 사용 중 생길 수 있는 오답, 기밀 유출, 승인 책임, 보안 기준 문제를 점검합니다.",
  questionCount: 10,
  estimatedMinutes: "약 3분",
  dimensions: unifiedDimensions,
  questions: unifiedCoreQuestions,
} as const satisfies SurveyDefinition;

export function getSurveyDefinition(persona: Persona): SurveyDefinition {
  return {
    ...unifiedDefinition,
    persona,
  };
}

export function getUnifiedSurveyDefinition(): SurveyDefinition {
  return unifiedDefinition;
}

export function getAllQuestionIds(): Set<string> {
  return new Set(unifiedCoreQuestions.map((question) => question.id));
}

export function getQuestionById(persona: Persona, id: string): SurveyQuestion | undefined {
  return getSurveyDefinition(persona).questions.find((question) => question.id === id);
}

export function getPersonaPath(persona: Persona): string {
  return `/survey/${persona}/`;
}

export function inferPersonaFromAnswers(answers: SurveyAnswerMap): Persona {
  if (answers.U01 === "direct_user") {
    return "practitioner";
  }
  if (answers.U01 === "adoption_owner") {
    return "leader";
  }
  if (answers.U01 === "security_owner") {
    return "security";
  }

  if (answers.U05 === "where_to_start" || answers.U05 === "effect_cost") {
    return "leader";
  }
  if (
    answers.U05 === "data_leak" ||
    answers.U05 === "approval_gap" ||
    answers.U05 === "unknown_usage"
  ) {
    return "security";
  }
  return "practitioner";
}

export function inferIntentFromAnswers(answers: SurveyAnswerMap): SurveyIntent {
  if (answers.U05 === "where_to_start" || answers.U05 === "effect_cost") {
    return "adoption";
  }
  if (
    answers.U05 === "data_leak" ||
    answers.U05 === "approval_gap" ||
    answers.U05 === "unknown_usage"
  ) {
    return "security";
  }
  if (answers.U05 === "wrong_answer" || answers.U05 === "source_check") {
    return "trust";
  }
  return "unknown";
}

function withCommonDimensions(
  questions: readonly SurveyQuestion[],
  dimension: string,
): SurveyQuestion[] {
  return questions.map((question) => (question.scored ? { ...question, dimension } : question));
}
