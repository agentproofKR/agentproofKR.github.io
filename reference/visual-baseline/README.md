# AgentProof V4 시각 검수 기준 이미지

이 폴더의 이미지는 직전에 확정한 **AgentProof V4 최종 캡처를 변경 없이 사용한 기준선**입니다.

## 기준 우선순위

1. `pc/00_pc_full_1440x3159.png`
2. `mobile/00_mobile_full_390x3759.png`
3. 구간별 캡처
4. 설계문서의 기능·데이터 요구사항

화면 문구, 줄바꿈, 섹션 순서, 밝은 영역과 다크 영역의 비율이 문서나 기존 HTML과 다르면 **이 기준 이미지가 우선**입니다.

## 이미지 구성

### PC

- `00_pc_full_1440x3159.png`: 전체 페이지 원본 기준
- `01_pc_hero_product_1440x1200.png`: 헤더, 히어로, 진단 화면 상단
- `02_pc_product_roles_1440x1200.png`: 진단 화면 하단, 역할별 가치, 판단 흐름
- `03_pc_flow_process_footer_1440x1200.png`: 판단 흐름 하단, 진행 방식, CTA, 푸터

### 모바일

- `00_mobile_full_390x3759.png`: 전체 페이지 원본 기준
- `01_mobile_hero_product_390x1200.png`
- `02_mobile_product_roles_390x1200.png`
- `03_mobile_roles_flow_390x1200.png`
- `04_mobile_process_footer_390x1200.png`

구간별 파일은 전체 원본에서 자른 **사람 검수용 이미지**입니다. 중간 구간에는 sticky header가 반복되지 않습니다. 자동 비교는 반드시 전체 페이지 원본으로 수행합니다.

## Codex / Playwright 자동 비교 권장값

```ts
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await expect(page).toHaveScreenshot('agentproof-pc-full.png', {
  fullPage: true,
  animations: 'disabled',
  caret: 'hide',
  maxDiffPixelRatio: 0.015,
});

await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await expect(page).toHaveScreenshot('agentproof-mobile-full.png', {
  fullPage: true,
  animations: 'disabled',
  caret: 'hide',
  maxDiffPixelRatio: 0.015,
});
```

초기 폰트 환경 차이 때문에 1.5%까지 허용하되, 레이아웃이 안정되면 0.5% 이하로 낮춥니다.

## 즉시 실패 조건

- PC H1이 기준과 다른 줄로 줄바꿈됨
- 모바일 H1 또는 CTA가 첫 화면에서 잘림
- 진단 화면의 비율·색상·카드 위계가 크게 달라짐
- 역할 3개가 PC에서 한 줄로 정렬되지 않음
- 모바일 역할 카드와 판단 흐름이 기준 순서와 다름
- 다크 섹션 시작 위치와 대비가 크게 달라짐
- 카피를 임의로 축약하거나 다른 표현으로 교체함
- 가로 스크롤 발생

`capture-manifest.json`에는 각 기준 이미지의 크기, 원본 crop 위치, SHA-256이 들어 있습니다.
