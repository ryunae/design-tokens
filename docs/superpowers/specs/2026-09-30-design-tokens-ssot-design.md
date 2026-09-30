# 디자인 토큰 SSOT — 설계

> 상태: 설계 승인 완료(2026-09-30). 구현 계획은 `docs/superpowers/plans/` 에 별도.
> 범위가 이 레포를 넘는다 — 소비자는 `GEO-maseuteo`(geo-master) · `review-gen` · `client-crawling` 셋이다.

## 왜

네 개가 같은 내부 프로그램인데 화면이 제각각이다. GEO-maseuteo 를 기준으로 통일하기로 했다.

그런데 통일의 방법이 문제다. **지금도 "통일"은 되어 있다 — 손으로 복사하는 방식으로.** 같은 토큰 블록이 세 레포에 각각 박혀 있고, client-crawling 의 `src/web/app.css` 주석은 이미 그 결과를 자백하고 있다:

> 다크 값은 geo-master 에서 가져왔다. **복사본이므로 갈라진다** — 갈라지면 눈으로 보고 고친다는 뜻이다. 출처를 여기 적어 두는 이유다.

"눈으로 보고 고친다"는 계획이 아니다. 아래 실측이 보여주듯 **이미 갈라졌다.**

### 측정한 사실 (2026-09-30)

**① 세 복사본이 같지 않다.**

| | 토큰 수 | geo-master 와 |
|---|---|---|
| geo-master `src/index.css` | 61 | (기준) |
| review-gen `src/index.css` | 19 | 값 같음 **1개**, 표기 다름 18개, **없음 42개** |
| client-crawling `src/web/app.css` | 25 + 앱 전용 12 | hex 로 변환된 별개 표기 |

**② review-gen 은 표기 규약이 반대다.** geo-master 는 맨 삼중항(`--primary: 252 87% 67%`)으로 저장하고 `@theme inline` 에서 `hsl(var(--primary))` 로 감싼다. review-gen 은 `:root` 에서 이미 감싸고(`hsl(252 87% 67%)`) `@theme` 에서는 그냥 `var(--primary)` 를 쓴다. **값은 우연히 같지만 합칠 수 없는 두 규약이다** — 한쪽 파일을 다른 쪽에 붙이면 `hsl(hsl(...))` 가 되거나 감싸기가 빠진다. 그리고 review-gen 에는 차트색·그림자·elevate·사이드바·서체 42개가 통째로 없다.

**③ client-crawling 의 변환은 중립색에서는 충실하다.** geo 의 HSL 을 hex 로 옮긴 것이고, RGB 거리로 재면 반올림 수준이다.

| geo | client-crawling | geo hex | cc hex | 거리 |
|---|---|---|---|---|
| `--background` | `--bg` | `#08080d` | `#08090f` | 2 |
| `--card` | `--card` | `#0e0f15` | `#10121c` | 8 |
| `--foreground` | `--ink` | `#f8fafc` | `#f4f6fb` | 6 |
| `--muted-foreground` | `--muted` | `#94a3b8` | `#98a1b8` | 4 |
| `--border` | `--line` | `#252837` | `#262a3b` | 5 |

**④ 그런데 주체 5색은 거리 29~65 로 멀다. 이건 갈라짐이 아니라 의도다** — hue 는 3~8° 안에 들어온다.

| cc 토큰 | hex | 실제 HSL | geo hue | hue 차이 |
|---|---|---|---|---|
| `--client` | `#8b7cf6` | 247 87% 73% | 252 | 5° |
| `--comp1` | `#e0a13c` | 37 73% 56% | 40 | 3° |
| `--comp2` | `#3ecfb2` | 168 60% 53% | 160 | 8° |
| `--comp3` | `#c084f0` | 273 78% 73% | 280 | 7° |
| `--comp4` | `#f4708f` | 346 86% 70% | 350 | 4° |

`app.css` 의 규칙 그대로다 — 「업체 색은 **색상(hue)을 지키고 명도만 올린다.** 「바른길은 어디서나 호박색」이 규칙이지 특정 hex 가 규칙이 아니다」. **즉 다섯 색에서 실제로 공유되는 것은 hue 다.** 명도·채도는 배경에 따라 다르고 달라야 한다.

**⑤ client-crawling 앱 안에서도 스케일이 흩어져 있다.**

- `border-radius` **9종**: `999px`×4 · `var(--radius)`×2 · `8px`×2 · `10px`×2 · `calc(var(--radius)+4px)` · `3px` · `16px` · `12px`(표에 하드코딩) · `0`
- `font-size` **14종**: 10 · 11 · 11.5 · 12 · 12.5 · 13 · 14 · 15 · 16 · 17 · 20 · 24 · 26 · 34px

**⑥ primary 버튼에 hover 피드백이 없다.**

```
button:hover     특정도 (0,1,1)   app.css:217
button.primary   특정도 (0,1,1)   app.css:225   ← 동률, 뒤에 있어서 이긴다
```

`button:hover { background: var(--hover) }` 를 `button.primary { background: var(--client) }` 가 되받아 덮는다. `.danger` 도 같다. **눌러도 손에 반응이 없다.**

## 목표

1. **값이 한 곳에만 있다.** 색을 바꾸면 세 프로젝트가 같이 바뀐다.
2. **원본도 소비자가 된다.** geo-master 가 자기 `:root` 를 지우고 패키지를 import 하지 않으면 그건 네 번째 복사본이지 SSOT 가 아니다.
3. **공유할 것과 로컬로 둘 것이 구분되어 있다.** 위 ④가 보여주듯 다섯 색에서 공유되는 건 hue 뿐이다. 이 구분이 토큰 계층에 드러나야 한다.
4. **갈라지면 테스트가 잡는다.** 사람 눈이 아니라.
5. **client-crawling 의 화면이 geo 와 같은 어휘를 쓴다** — 버튼·배지·모서리·글자 크기.

## 비목표

- **리포트 팔레트 변경.** `src/ui/tokens.css` 의 밝은 종이색은 그대로다 — A4 로 거래처에 나가는 인쇄물이고 다크 글래스모피즘은 거기서 그냥 틀리다. `src/report/style.css` 는 한 줄도 안 건드린다.
- **스택 통일.** client-crawling 은 Hono + 서버 렌더 문자열 + htmx 로 남는다. React 로 옮기지 않는다 — 이 앱은 Aside 가 도는 이 맥에 묶여 있고, 1308개 테스트가 서버 렌더 HTML 을 검사한다.
- **payattention-os.** 이번 범위 밖(별도 판단). 그쪽은 「팔레트 없음」이 아니라 **반대 방향으로 완성된 다른 시스템**이다 — 편집국·활판 컨셉, 각진 모서리 2/3/4px, Pretendard + 나눔명조, oklch 잉크 틴트, letterpress 버튼 물성. 452줄에 실측 근거가 주석으로 박혀 있다.
- **leels-os · leels-studio.** 내부 프로그램 넷에 들지 않는다. leels-studio 는 자체 디자인 시스템(A-3)을 갖고 있다.
- **리포트 계약(`client_crawling_run` 1.3.0) 변경.** 이 작업은 무엇을 말하는지 바꾸지 않고 어떻게 보이는지만 바꾼다.

## 결정 1 — 저장소와 배포 형태

**새 private 레포 `ryunae/design-tokens`**, 위치 `~/Documents/Dev/lib/design-tokens/`, SSH 리모트(전역 지침: 신규 레포는 SSH).

소비는 **git 태그를 가리키는 npm 의존성**으로 한다.

```json
"@ryunae/design-tokens": "github:ryunae/design-tokens#v1.0.0"
```

| 왜 이 형태인가 | |
|---|---|
| pnpm·npm 양쪽이 먹는다 | GEO-maseuteo·client-crawling 은 pnpm, review-gen 은 npm 이다. 레지스트리·서브모듈·워크스페이스 링크는 셋 중 하나가 못 먹는다 |
| **태그로 핀 한다** | 밑에서 값이 몰래 바뀌지 않는다. 올릴 때 올린다. 공유 토큰이 예고 없이 움직이면 복사본보다 나쁘다 |
| 런타임 의존이 없다 | CSS 파일과 woff2 뿐이다. 「서드파티 가용성에 기대지 말자」(client-crawling `app.ts` 주석)는 **설치 시점**에만 걸리고, 설치 후에는 `node_modules` 에서 읽는다 — `pnpm test` 의 네트워크 0 이 유지된다 |

`~/Documents/Dev/lib/` 는 새 분류다. 전역 `CLAUDE.md` 의 디렉토리 지형도에 한 줄을 추가한다(앱도 자동화도 플러그인도 아닌 공유 라이브러리).

## 결정 2 — 무엇이 공유되고 무엇이 로컬인가

측정 ③·④가 답을 정해 준다. **두 층으로 나눈다.**

**1층 이름에는 전부 `--ds-` 가 붙는다.** 접두어 없이 내보내면 소비자의 어휘와 충돌한다. client-crawling 에서 실측한 두 건:

- **`--card` — 뜻은 같지만 형식이 다르다.** 1층은 삼중항 `230 20% 7%`, 2층은 색 `#10121c`. 2층이 `--card: hsl(var(--card))` 라고 쓰면 **자기 참조**라 CSS 가 그 속성을 통째로 무효화한다. 커스텀 프로퍼티는 소스 순서가 아니라 최종값으로 치환되므로 `:root` 를 두 블록으로 쪼개도 순환은 그대로다.
- **`--muted` — 뜻이 다르다.** geo 는 흐린 *배경*(`230 20% 10%`), client-crawling 은 흐린 *글자*(`#98a1b8`, geo 로 치면 `--muted-foreground`). 덮기가 한 번 어긋나면 **흐린 글자가 어두운 배경색이 되어 글자가 사라진다.** CSS 는 에러를 안 낸다.

**1층 (패키지가 준다 — 값 그대로):** 중립·의미 토큰. 세 프로젝트에서 이미 사실상 동일하다.

```
--ds-background --ds-foreground --ds-card --ds-card-foreground
--ds-border --ds-input --ds-ring
--ds-primary --ds-primary-foreground --ds-secondary --ds-secondary-foreground
--ds-muted --ds-muted-foreground --ds-accent --ds-accent-foreground
--ds-destructive --ds-destructive-foreground
--ds-radius --ds-radius-sm|md|lg|xl --ds-shadow-*
--ds-elevate-1 --ds-elevate-2 --ds-button-outline --ds-badge-outline
--ds-glass --ds-glass-line
--ds-font-sans --ds-font-display --ds-font-mono --ds-font-serif
```

**1층 (패키지가 준다 — hue 만):** 주체·차트 색상환. 실제로 공유되는 불변량이다.

```css
--ds-hue-1: 252;  /* 보라 */
--ds-hue-2: 280;  /* 자주 */
--ds-hue-3: 160;  /* 에메랄드 */
--ds-hue-4:  40;  /* 호박 */
--ds-hue-5: 350;  /* 장미 */
```

**2층 (각 프로젝트가 정한다):** 그 hue 에 어떤 명도·채도를 입힐지, 그리고 **어느 hue 를 누구에게 배정할지.** client-crawling 은 거래처 = `--ds-hue-1`, 경쟁사1 = `--ds-hue-4`(호박)… 로 스펙 §2.3(색은 주체 순서에 고정)을 따른다. geo-master 는 `--chart-1..5` 로 다르게 배정한다. **같은 색상환, 다른 배정 — 그게 맞다.**

`--comp1-bg` 같은 **어두운 짝 12개는 2층에 남기고 손으로 맞춘 값을 유지한다.** 육안 검증(`43c77c6` 「육안 검증이 찾은 다섯 가지」)으로 잡은 대비다. `hsl(from …)` 로 자동 유도하면 그 작업이 날아간다.

## 결정 3 — 값 표기는 맨 삼중항

`--ds-primary: 252 87% 67%` 로 저장한다(geo-master 규약). review-gen 의 `hsl(...)` 감싼 표기를 버린다.

이유는 기준이 geo-master 라서만이 아니다. 맨 삼중항이라야 **알파 합성**이 된다 — `hsl(var(--ds-primary) / 0.36)`. client-crawling 의 `--focus-ring: 0 0 0 3px rgba(139, 124, 246, 0.36)` 이 지금 hex 를 rgba 로 손으로 푼 이유가 이거고, 삼중항을 받으면 그 손풀이가 사라진다.

**Tailwind 의 `@theme inline` 블록은 패키지에 넣지 않는다.** 그건 값이 아니라 **배선**이다 — geo-master·review-gen 이 각자 갖는다. client-crawling 은 Tailwind 를 안 쓰므로 아예 없다.

## 결정 4 — 서체는 패키지가 싣는다 (한글 포함, CDN 을 뗀다)

네 프로젝트가 한글에 서로 다른 답을 갖고 있었다.

| | 본문 라틴 | 한글 | 받는 곳 |
|---|---|---|---|
| geo-master | Inter | Noto Sans KR 지정했으나 **안 받아온다** → 시스템 | Google Fonts CDN |
| review-gen | Pretendard | Pretendard | jsdelivr CDN (dynamic-subset) + Google Fonts CDN |
| client-crawling | Inter | Apple SD Gothic Neo (맥 시스템) | 자체 서빙 woff2 |

화면의 95%가 한글인 앱들이다. **한글이 제각각이면 모서리와 그림자를 맞춰도 「제각각」이 그대로 남는다.** 그리고 이미 둘이 Pretendard 를 골랐다.

**Pretendard 가 본문을 맡는다. 패키지가 싣고, 세 프로젝트가 자기 도메인에서 서빙한다. CDN `@import` 를 전부 뗀다.**

**Inter 를 뺀다** — Pretendard 의 라틴은 Inter 에서 파생된 것이라 둘을 같이 실을 이유가 없다. Outfit(디스플레이, 제목 전용)은 남는다.

### 실측 (2026-09-30)

먼저 공식 릴리스의 `PretendardStd`(7.2MB zip)를 서브셋 판본으로 짐작했는데 **틀렸다** — 열어 보니 라틴·키릴 전용이고 **한글이 0자**다. 한글은 전체판에만 있다.

전체판 `PretendardVariable.woff2` 는 2,009KB 다. 그대로 실으면 무겁고, 상용 2350자만 실으면 **거래처 이름의 희귀 음절에서 글자가 깨진다** — 업체 이름을 띄우는 앱에서 그건 못 쓴다.

**`unicode-range` 2단으로 나눈다.** `pyftsubset` 으로 실제로 떠서 잰 값:

| 파일 | 내용 | 크기 | 언제 받나 |
|---|---|---|---|
| `pretendard-ks.woff2` | KS X 1001 상용 2350자 + 라틴 + 구두점 | **449 KB** | 사실상 모든 쪽 |
| `pretendard-ext.woff2` | 나머지 현대 한글 8,822자 | 1,317 KB | **그 쪽에 희귀 음절이 있을 때만** |
| `outfit-latin.woff2` | 디스플레이(제목) | 32 KB | 모든 쪽 |

보통 한 쪽이 받는 양은 **481KB**(현재 80KB). 희귀 음절이 나오면 브라우저가 알아서 둘째 파일을 받는다 — 글자가 깨지지 않고 요청이 한 번 더 갈 뿐이다. dynamic-subset(파일 300개)과 같은 효과를 **파일 2개**로 낸다.

**선언 순서가 이 효과를 만든다 — `ext` 를 먼저, `ks` 를 나중에 적는다.** 같은 family 안에서 `unicode-range` 가 겹치면 **나중 선언이 먼저 검사된다**. `ks` 를 먼저 적으면 브라우저가 매 쪽마다 `ext`(1,317KB)를 골라 받고, 글리프가 없는 것을 확인한 뒤에야 `ks` 로 떨어진다 — 481KB 가 아니라 **1.78MB** 를 받는다.

브라우저로 실측했다(헤드리스 크롬, CDP `Network.requestWillBeSent`, 실제 woff2):

| 선언 순서 | 쪽 내용 | 실제로 받은 것 |
|---|---|---|
| ks → ext (틀림) | 「바른길 요양병원 김민수 서울 강남」(전부 상용) | **ext + ks 둘 다** |
| ext → ks (맞음) | 같음 | **ks 만** |
| ext → ks (맞음) | 「쒧쭅 뷁 똠방각하」(희귀 포함) | ks + ext — 설계대로 |

`tnum`(고정폭 숫자) 지원을 확인했다 — client-crawling 의 `font-variant-numeric: tabular-nums` 가 그대로 산다. 가변 축은 `wght 45–930` 으로 전 굵기를 덮는다.

Pretendard·Outfit 모두 SIL OFL 1.1 이다. **`LICENSE-fonts.txt` 를 패키지에 동봉한다.**

### 리포트는 영향받지 않는다

`src/report/style.css` 는 `@font-face` 를 선언하지 않고 시스템 폰트 스택만 쓴다. 웹폰트는 선언한 문서에만 걸리므로 **리포트 PDF 는 지금 그대로 Apple SD Gothic Neo 로 나간다.** 비목표 1이 지켜진다.

### 한글 폴백은 2층으로 남는다

`pretendard-ext.woff2` 도 못 덮는 글자(옛한글·한자)는 각 프로젝트의 폴백이 맡는다. 거기까지 통일하지 않는다.

## 패키지 내용

```
design-tokens/
  package.json              exports: "./tokens.css" · "./tokens.json" · "./fonts.css" · "./fonts/*"
  tokens.css                :root { … }  — 1층 전부
  tokens.json               같은 값의 기계 판독본. 드리프트 테스트가 읽는다
  fonts.css                 @font-face 3벌 + unicode-range 2단 분할
  fonts/pretendard-ks.woff2    449 KB  상용 2350자 + 라틴
  fonts/pretendard-ext.woff2  1317 KB  나머지 한글 8822자
  fonts/outfit-latin.woff2      32 KB  디스플레이
  LICENSE-fonts.txt         SIL OFL 1.1 (Pretendard · Outfit)
  README.md                 2층 구조 · 소비자 목록 · 이 스펙으로 가는 링크 · 서브셋 재생성 명령
```

`fonts.css` 가 따로 있는 이유: `@font-face` 의 `src` URL 은 소비자마다 다르다(client-crawling 은 `/static/`, Vite 프로젝트는 번들러가 해결). 소비자가 이 파일을 쓰거나, 안 맞으면 자기 `@font-face` 를 쓰고 woff2 만 가져간다.

`tokens.json` 이 따로 있는 이유: 테스트가 CSS 를 정규식으로 긁으면 그 정규식이 또 하나의 갈라질 물건이 된다.

## 소비자별 계약

### geo-master — 기준이자 첫 소비자

`src/index.css` 의 `:root` 블록과 1행의 Google Fonts `@import url(...)` 을 지우고 `@import "@ryunae/design-tokens/tokens.css"` + 로컬 `@font-face` 로 바꾼다. `@theme inline` 블록과 `@layer utilities` 는 그대로.

**완료 증거: 색 · 간격 · 모서리 변화 0.** 값이 안 바뀌니 안 바뀌어야 한다. 바뀌면 옮기다 흘린 것이다.

라틴 글자 폭은 예외다 — 결정 4로 서체 출처가 CDN 에서 로컬 woff2 로 바뀐다. 굵기는 덮인다(패키지의 가변 폰트가 Inter 400–700 · Outfit 500–800 이고, geo-master 가 쓰는 건 Inter 400/500/600 · Outfit 500/600/700/800 이다). 그래도 버전이 다르면 자간이 미세하게 움직일 수 있으므로 **육안 확인 대상**이다.

### review-gen

같은 교체. 갈라진 데가 셋 더 있다.

1. `@theme inline` 의 `var(--primary)` → `hsl(var(--primary))` (결정 3 — `:root` 가 맨 삼중항이 되므로 감싸는 쪽이 옮겨 간다).
2. **모서리 스케일이 곱셈이다** — `--radius-sm: calc(var(--radius) * 0.6)` (7.2px) 등. geo-master 는 덧셈(`calc(var(--radius) - 4px)` = 8px)이다. **덧셈으로 맞춘다.** `--radius-2xl`·`3xl`·`4xl` 은 geo-master 에 없으므로 쓰는 곳이 없으면 지우고, 있으면 그대로 둔다.
3. CDN `@import` 두 줄(Google Fonts · jsdelivr Pretendard)을 지우고 패키지 서체를 쓴다(결정 4).

추가로 **42개가 새로 생긴다**(차트색·그림자·elevate·사이드바). 새로 생기는 것은 쓰지 않으면 아무 일도 안 일어난다 — 이번엔 안 쓴다.

### client-crawling

- `src/ui/tokens.css`(밝은 종이) — **안 건드린다.**
- `src/web/app.css` 의 `:root` 다크 블록 → 패키지 import + 2층 별칭:
  ```css
  --bg:   hsl(var(--ds-background));
  --ink:  hsl(var(--ds-foreground));
  --client: hsl(var(--ds-hue-1) 87% 73%);
  --comp1:  hsl(var(--ds-hue-4) 73% 56%);
  ```
  업체 5색의 색상이 1층 hue 로 **3~8° 수렴한다**(실측: client 247→252 · comp1 37→40 · comp2 168→160 · comp3 273→280 · comp4 346→350). 명도·채도는 그대로라 밝기는 안 변한다.
- `--focus-ring` 은 `0 0 0 3px hsl(var(--ds-hue-1) 87% 73% / 0.36)` 로 — rgba 손풀이 제거.
- woff2 3개를 패키지에서 `dist/web/static/` 으로 복사(build 스크립트). `@font-face` 의 `/static/` URL 규약은 그대로다.
- 레포의 `src/web/static/inter-latin.woff2` 는 제거한다(Pretendard 가 라틴을 덮는다). `outfit-latin.woff2` 는 패키지로 옮겨 간다.
- `font-family` 스택에서 `"Inter"` 를 `"Pretendard"` 로 바꾸고, 한글 폴백 `Apple SD Gothic Neo` 는 `pretendard-ext` 뒤로 물러난다.
- `layout()` 이 이어 붙이는 CSS 에 패키지 파일이 먼저 들어간다.

## client-crawling 컴포넌트 어휘

토큰 위에 얹는다. **여섯 가지.**

**1. hover/active 를 배경 교체에서 오버레이로.** geo 의 `hover-elevate` 방식(`::after` + `--elevate-1/2`). 측정 ⑥의 primary 버튼 무반응이 **이걸로 구조적으로 사라진다** — 오버레이는 버튼 자기 배경과 무관하게 얹히므로 특정도 싸움이 애초에 안 생긴다.

**2. 버튼 variant.** 기본·primary·danger 3종 → geo 의 default · primary · destructive · outline · ghost · link.

**3. 배지.** 알약(`999px`) → `--ds-radius-sm` + 테두리 + 12px/600 (geo 모양).

**4. 모서리 스케일.** 9종 → 1층의 4단.
```css
--ds-radius-sm: calc(var(--ds-radius) - 4px);   /*  8px */
--ds-radius-md: calc(var(--ds-radius) - 2px);   /* 10px */
--ds-radius-lg: var(--ds-radius);               /* 12px */
--ds-radius-xl: calc(var(--ds-radius) + 4px);   /* 16px */
```
표의 하드코딩 `12px` → `--ds-radius-lg`, `pre` 의 `10px` → `--ds-radius-md`, `.sheet` 의 `16px` → `--ds-radius-xl`. **`999px` 은 남긴다**(진행 막대·알약).

**예외 둘은 근거를 적고 남긴다.** 규칙을 지키려고 화면을 망가뜨리지 않는다.
- `.legend i` 의 `3px` — **10×10px 색 점**이다. 4단의 최소값(8px)을 주면 거의 원이 된다.
- `.matrix td .tri` 의 `10px` — 숫자 옆 **삼각형 장식**이지 글이 아니다. 12px 로 올리면 20% 커져 비교표의 밀도가 바뀐다.

**5. 글자 크기.** 14종 → **본문 5단**(12 · 13 · 14 · **15 기본** · 17px) + **제목 3단**(h2 20 · `.sheet h1` 24 · h1 34px). 없애는 것은 0.5px 단위(11.5 · 12.5)와 11 · 16px 이다. 모바일 h1 26px 은 반응형 재정의, `.matrix td .tri` 의 10px 은 위 예외라 남는다.

**6. 로그인 화면.** `.sheet` 단색 카드 → glass-panel + 그라데이션 제목. 세 프로그램 중 사람이 가장 먼저 보는 화면이다.

### geo 와 다르게 두는 것 — 우리 쪽이 맞다

| | geo | client-crawling | 왜 |
|---|---|---|---|
| 터치 대상 | `min-h-9` (36px) | **44px** (`--touch`) | 직원이 폰으로 쓴다. 44px 은 접근성 최소값이고 `web_style.test.ts` 가 이미 지키고 있다 |
| focus ring | `ring-1` (1px) | **3px** | 다크 배경에서 1px 은 안 보인다 |

## 갈라짐 방지

각 소비자가 **1층 계약 검사**를 자기 빌드에 끼운다. 검사기는 패키지가 들고 있고(`scripts/check-consumer.mjs`, 의존성 0), `tokens.json` 을 읽어 두 가지를 본다 — 소비자가 `--ds-*` 를 **다시 선언**했는지, 그리고 1층에 **없는 `--ds-*` 를 참조**하는지. 둘 다 조용한 실패다(값이 둘이 되거나, `var()` 가 무효가 되어 색이 사라진다).

검사기를 패키지가 드는 이유: 세 소비자 중 CSS 를 검사할 테스트 러너가 있는 건 client-crawling 뿐이다. geo-master·review-gen 은 Vite 앱이고 `test` 스크립트가 없다 — 그쪽에 vitest 를 새로 얹는 것은 이 작업의 범위가 아니다.

client-crawling 은 그 위에 vitest 로 세 가지를 더 본다: `:root` 의 hex 가 2층이 소유한다고 선언한 것뿐인지 · 업체 5색이 `--ds-hue-N` 을 쓰는지 · 리포트 팔레트(`src/ui/tokens.css`)에 `--ds-` 가 새어 들어가지 않았는지.

client-crawling 에는 이미 같은 모양의 규칙이 있다 — `web_style.test.ts` 의 「색은 `:root` 에서만 정의한다 — 규칙 안에 하드코딩된 색이 없다」. **그 규칙을 `:root` 안까지 넓히는 것**이다. 지금은 `:root` 안이 면제라 복사본이 거기 산다.

## 검증

1. `pnpm test` — 세 레포 전부 초록. client-crawling 1308개 유지.
2. `pnpm check:print` — 리포트 인쇄가 안 변했음(비목표 1의 증거).
3. **육안:** geo-master 를 교체 전후로 띄워 픽셀 변화 0 확인.
4. **육안:** client-crawling 의 로그인 · 거래처 목록 · 비교 · 관리 네 화면.
5. 리포트 PDF 를 받아 **밝은 종이 팔레트가 그대로인지** 확인.

## 위험

| 위험 | 대응 |
|---|---|
| 태그를 올린 뒤 소비자가 따라오지 않아 버전이 갈라진다 | 태그는 세 소비자를 다 고친 뒤에만 올린다. 레포 README 에 소비자 목록을 둔다 |
| private 레포라 설치에 SSH 키가 필요하다 | 두 맥 모두 이미 키가 있다. 맥북프로 클론 때 확인 항목에 넣는다 |
| client-crawling 의 CSS 인라인 방식(`layout()` 이 파일을 읽어 `<style>` 에 넣음)이 `node_modules` 경로를 탄다 | build 스크립트가 이미 CSS 를 `dist/` 로 복사한다. 패키지 파일도 같은 방식으로 복사한다 — 런타임에 `node_modules` 를 읽지 않는다 |
| 2층 별칭이 늘어 오히려 읽기 어려워진다 | 별칭은 한 블록에 모으고 1층 이름을 주석으로 단다. 지금도 복사본 25줄이 같은 자리에 있다 |
