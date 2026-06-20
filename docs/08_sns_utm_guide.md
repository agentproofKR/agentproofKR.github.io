# SNS And UTM Guide

## Direct role links

- `https://agentproofkr.github.io/survey/practitioner/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=ai_readiness&utm_content=practitioner_01`
- `https://agentproofkr.github.io/survey/leader/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=ai_readiness&utm_content=leader_01`
- `https://agentproofkr.github.io/survey/security/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=ai_readiness&utm_content=security_01`

## Rules

- Answers and email must never be placed in query parameters.
- UTM is preserved in sessionStorage and submitted only as non-sensitive attribution.
- Do not load Meta Pixel or advertising retargeting scripts.
- Do not send survey answers to third-party analytics.

## First-party events

`survey_landing_view`, `persona_selected`, `privacy_notice_opened`, `required_consent_accepted`, `survey_started`, `survey_section_completed`, `survey_completed`, `result_viewed`, `beta_optin`, `interview_optin`, `pilot_requested`.
