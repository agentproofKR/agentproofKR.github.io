# 개인정보 데이터 맵

## 필수 설문 데이터

- 역할, 조직 규모, 업종
- AI 활용·도입 단계
- 사용 도구 및 업무 유형
- 정책·보안·운영 수준에 관한 설문 응답
- 설문 세션 식별자, 제출 시각, UTM

목적: 역할별 결과 산출, 고객군과 수요 분석, 기능·진단 기준 개선, 중복 제출과 오남용 방지.

보유: 설문 제출일로부터 6개월.

## 선택 연락 데이터

- beta: 이메일, 역할, 결과 등급, 관심 기능
- interview: 이메일, 역할, 주요 결과, 인터뷰 가능 여부
- pilot: 이메일, 선택 회사명, 역할, 선호 연락 목적

회사명은 선택이며 결과 확인 전에는 요청하지 않는다.

## 금지 데이터

주민등록번호, 생년월일, 개인 전화번호, 건강·금융·범죄·생체 등 민감정보, 고객명, 실제 내부 시스템명, credential, source code, 계약서, 실제 취약점 경로, 실제 개인정보 문서.

## 분석 이벤트

허용: persona, survey_version, utm_source, utm_campaign, question_count, completion_time_band, result_band.

금지: email, company name, free text, individual answer, incident detail, document name, vulnerability detail.
