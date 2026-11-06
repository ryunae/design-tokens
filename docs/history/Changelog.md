---
maturity: seed
type: dev-doc
doc_type: changelog
parent: "[[design-tokens]]"
created: 2026-09-30
modified: 2026-10-27
aliases: []
tags:
  - 인프라
related:
  - "[[design-tokens]]"
---

# Changelog

> **역할:** 릴리스·변경 요약의 SSOT. [Keep a Changelog](https://keepachangelog.com/) 형식 + Semantic Versioning, 최신이 위. Added/Changed/Fixed/Removed.
> `Tasks`·`Error-Log` 가 없는 프로젝트는 확정 결정("결정:")과 해결한 오류(Fixed)도 여기에 적는다 (`600. Developments/CLAUDE.md` 문서 라우팅 결정표).

## v1.6.0 — 2026-10-27 (PR 6)
**작성:** [클로드코드]
- Added: 채움용 자주 `--ds-accent-solid`(L50%, 흰 글자 5.13:1)를 더했다(D-010). 그라데이션 단추의 양 끝을 solid로 쓴다.
- 소비자 다섯 모두 반영했다. crawler PR 89, reviewgen PR 40, geomaster PR 110, adreview PR 12, paos PR 560이고, `consumers.mjs`는 전부 ok다.

## v1.5.0 — 2026-10-27 (태그 afc2c68)
**작성:** [클로드코드]
- Added: check-consumer 갈라짐 경고 3종(실패 아님). 직접 적은 움직임 시간, `text-white/` 50 미만, 채운 빨강 위 흰 글자를 경고한다. self-check `fixtures/drift.tsx`를 더했고, README와 version 1.5.0도 올렸다(ERR-001 재발 방지).
- Added: 채움용 보라 `--ds-primary-solid`(L62%, 흰 글자 5.15:1)와 `--ds-primary-solid-border`를 더했다(D-009).
- 소비자: crawler·reviewgen·adreview·geomaster는 v1.5.0을 main에 반영했다. **paos PR 558은 머지 대기**라 `consumers.mjs`에서 paos가 FAIL이다.

## v1.4.0 — 2026-10-27
**작성:** [클로드코드]
- Added: 움직임·조작 요소 토큰 — `--ds-duration-fast`·`--ds-duration`·`--ds-duration-enter`·`--ds-ease`·`--ds-enter-distance`·`--ds-control-h`(36px)·`--ds-glass-hover`·`--ds-glass-line-hover`. `utilities.css`에 `.page-enter`·`.motion-colors`·`.glass-panel-hover`를 더했다(움직임은 전부 reduced-motion 블록 안). PR 4 → 태그 `v1.4.0`(1d8d808).
- 소비자 다섯 판올림 → `consumers.mjs` 전부 ok. crawler는 하드코딩 값을 토큰으로 바꿨다(crawler PR 86). 나머지 넷은 핀만 올렸다(화면 변화 없음).
- Fixed: 첫 태그가 `package.json` version 1.3.0 커밋에 달려 있었다 → 버전 커밋 뒤 태그를 다시 달았다(소비자 0곳일 때, 사용자 승인). 12. Error-Log 참고.

## 2026-10-15 [클로드코드] 소비자 추가·경로 정리
**작성:** [클로드코드]
- 새 소비자 adreview(심의 마스터, `artifacts/web` v1.3.0) — README 소비자 표에 추가(PR #2 `fd5e4ec`).
- 표의 옛 경로 셋(GEO-maseuteo·review-gen·payattention-os → geomaster·reviewgen·paos, 2026-10-06 이전) 정리 → `consumers.mjs` 다섯 곳 전부 ok.

## v1.3.0 (PR #1 머지 대기) — 2026-10-02
**작성:** [클로드코드]
- Added: 인쇄용 정적 TTF `fonts/print/` — `PA Sans`(Pretendard 파생, 한글 11,172자 한 벌, ks/ext 미분할)·`PA Display`(Outfit 파생 — 이름은 OFL 예약 이름 회피) × 굵기 400~800, `scripts/build-print-fonts.mjs`, `verify-fonts.mjs` 정적·이름·굵기 검사. client-crawling 리포트 PDF(Typst) 용. 태그는 머지 뒤.

## 2026-09-30 — 태그 규칙 문구 수정 (`80289a2`)
**작성:** [클로드코드]
- Changed: README·CLAUDE.md 「소비자 다 고친 뒤 태그」 → 「태그 먼저, 같은 작업 안에서 소비자 전부 올리고 `consumers.mjs` 전부 ok 로 끝」(D-006).

## v1.2.2 — 2026-09-30
**작성:** [클로드코드] (태그는 세션 client-crawling-ff)
- Fixed: 배경층이 body 배경에 덮여 화면이 완전 평면이 됐다(`6498b49`). **함정:** `.bg-layer` 의 `z-index` 를 `-1` 로 두면 body 의 불투명 배경이 나중에 칠해져 층을 덮는다 — 에러 없이 평면(실측 배경 픽셀 평균=최댓값=8.1). `0` 으로 두고 내용을 `position: relative; z-index: 1` 로.

## v1.2.1 — 2026-09-30
- Fixed: 배경 그림이 그라데이션에 묻혀 거의 안 보였다 — 두 겹으로(`::before` 질감 이미지 `mix-blend-mode: screen`, `::after` 그라데이션)(`2556773`).

## v1.2.0 — 2026-09-30
- Added: 배경 질감을 1층으로 — `utilities.css` `.bg-layer` + `images/glass-bg.webp`(46KB)·`.png`(1.2MB 폴백), exports `./images/*`(`4a85646`). 기존 토큰·유틸 값 변경 0.
- 소비자 CSS 합성 순서: 앱 자체 CSS 가 **맨 뒤**여야 한다 — 1층 유틸이 뒤에 오면 이미지 주소 덮기가 되돌아간다.
- ⚠️ 이 세 태그는 client-crawling 만 올린 채 달렸다(D-006 위반, 태그한 세션이 스스로 보고). 뒤따라 GEO PR 61·review-gen PR 10 으로 v1.2.2 머지·배포(review-gen CSS 해시 동일 — 값 변화 없음 확인). payattention-os 는 os 세션에 요청.

## 2026-09-30 — 공식 프로젝트 등록 · 소비자 버전 맞춤
**작성:** [클로드코드]
- Added: 볼트 `600. Developments/lib/design-tokens/` 신설(scaffold `--full`), 코드 repo `CLAUDE.md`/`AGENTS.md` 페어. `lib` 카테고리를 전역 지형도와 볼트 스크립트 5곳에 등록.
- Added: `scripts/consumers.mjs` — README 소비자 표의 각 레포 origin/main 핀이 최신 태그인지 검사(D-006).
- Changed: README 소비자 표에 경로·의존성 선언 열 추가, payattention-os 추가. 설계·계획 문서를 client-crawling 레포에서 이 repo `docs/superpowers/` 로 복사.
- 결정: 흩어져 있던 패키지 결정을 [[600. Developments/lib/design-tokens/03. Decisions]] D-001~D-007 로 모음.
- Fixed: v1.1.1 태그가 review-gen(v1.0.3)·GEO(v1.1.0)를 두고 달려 앱마다 버전이 달랐다 → 두 앱을 v1.1.1 로(세부는 각 앱 볼트).

## v1.1.1 — 2026-09-30
- Fixed: 로그인용 아이콘이 없어 `log-out` 을 쓰게 됐다 — `log-in` 추가.

## v1.1.0 — 2026-09-30
- Added: 합성 유틸(`utilities.css`)과 아이콘 스프라이트(`icons.svg`) — 값 위의 조합.

## v1.0.3 — 2026-09-30
- Fixed: 검사기가 주석의 `var(--ds-*)` 와일드카드를 참조로 읽던 것.

## v1.0.2 — 2026-09-30
- Fixed: 검사기가 파일별로 따로 봐서 오탐을 냈다 — 정의를 전체에서 모은다.

## v1.0.1 — 2026-09-30
- Fixed: 서체 선언 순서가 뒤집혀 매 쪽이 두 파일을 다 받았다(페이지당 ~1.3MB) · 검사기 오탐 제외.

## v1.0.0 — 2026-09-30
- Added: 1층 디자인 토큰(색상환 hue · 의미색 · 형태 · 층위), 서체(Pretendard 2단 서브셋 · Outfit), 갈라짐 검사기 `check-consumer.mjs`.
- 첫 소비자 전환은 세션 client-crawling-fa 가 GEO·review-gen·client-crawling 에서 진행(경위: [[600. Developments/reviewgen/12. Error-Log]] ERR-006).
