# @ryunae/design-tokens

내부 프로그램 공용 디자인 토큰. **값은 여기에만 있다.**

## 소비자

| 레포 | 경로 | 의존성 선언 | 토큰 import |
|---|---|---|---|
| GEO-maseuteo | `~/Documents/Dev/app/GEO-maseuteo` | `artifacts/geo-master/package.json` | `artifacts/geo-master/src/index.css` (기준 출처) |
| review-gen | `~/Documents/Dev/app/review-gen` | `package.json` | `src/index.css` |
| crawler (옛 client-crawling) | `~/Documents/Dev/crawler` | `package.json` | `src/web/app.css` |
| payattention-os | `~/Documents/Dev/app/payattention-os` | `package.json` | `src/app/globals.css` |

새 소비자를 붙이면 이 표에 한 줄 더한다. **태그를 달면 같은 작업 안에서 이 표의 전부를 새 태그로 올리고, 아래가 전부 ok 인 걸 본 뒤에 끝낸다.** 소비자는 태그가 있어야 핀을 올릴 수 있으니 태그가 먼저, 끝은 전부 ok 다:

```bash
node scripts/consumers.mjs   # 각 레포 origin/main 의 핀이 최신 태그인지. 하나라도 아니면 실패
```

상태·결정·인계는 볼트 `600. Developments/lib/design-tokens/` 에 있다.

## 쓰는 법

```bash
pnpm add "@ryunae/design-tokens@github:ryunae/design-tokens#v1.0.0"
```

```css
@import "@ryunae/design-tokens/tokens.css";
@import "@ryunae/design-tokens/fonts.css";
```

## 이름공간

모든 토큰에 `--ds-` 가 붙는다. 소비자의 어휘와 충돌하지 않게 하려는 것이다.

- crawler 는 `--muted` 를 「흐린 **글자**」로 쓰는데 shadcn 은 「흐린 **배경**」으로 쓴다. 같은 이름이 다른 뜻이면 덮기가 어긋나는 순간 글자가 사라지고, CSS 는 에러를 안 낸다.
- `--card` 는 뜻이 같아도 형식이 다르다(1층 삼중항 · 2층 색). 접두어가 없으면 `--card: hsl(var(--card))` 가 **자기 참조**가 되어 속성이 통째로 무효화된다. 커스텀 프로퍼티는 소스 순서가 아니라 최종값으로 치환되므로 `:root` 를 쪼개도 순환은 그대로다.

## 2층 — 여기 없는 것

`tokens.css` 는 1층이다. 아래는 각 프로젝트가 정한다.

- **어느 hue 를 누구에게 배정할지.** crawler 는 거래처=`--ds-hue-1` · 경쟁사1=`--ds-hue-4`(호박). geo-master 는 `--ds-chart-1..5` 순서.
- **배경별 명도·채도.** 어두운 배경에서 읽히려면 올려야 한다. hue 만 지키면 된다.
- **어두운 짝**(`--comp1-bg` 류). 눈으로 맞춘 대비라 자동 유도하지 않는다.
- **한글 폴백.** `pretendard-ext` 도 못 덮는 글자(옛한글·한자).
- **Tailwind `@theme inline` 배선.** 값이 아니라 배선이다.

## 갈라짐 검사

소비자는 자기 빌드에 이걸 끼운다. 1층 이름을 다시 선언하거나 없는 이름을 쓰면 실패한다.

```bash
node node_modules/@ryunae/design-tokens/scripts/check-consumer.mjs src/index.css
```

검사기 자신은 `scripts/self-check.sh` 가 검사한다(정상·재선언·오타 세 픽스처).

## 고칠 때

`tokens.json` 은 **생성물**이다. 손으로 고치지 말고 `tokens.css` 를 고친 뒤 다시 만든다:

```bash
node -e 'const fs=require("fs");const css=fs.readFileSync("tokens.css","utf8");
const names=[...css.matchAll(/^\s*--ds-([\w-]+)\s*:/gm)].map(m=>m[1]);
const hue=Object.fromEntries([...css.matchAll(/^\s*--ds-hue-(\d)\s*:\s*(\d+)/gm)].map(m=>[m[1],Number(m[2])]));
fs.writeFileSync("tokens.json",JSON.stringify({prefix:"ds",hue,names},null,2)+"\n")'
```

서체 재생성은 `scripts/subset.sh`.

인쇄용(PDF·Typst) 정적 TTF 는 `fonts/print/` — `PA Sans`(Pretendard 파생, 현대 한글 11,172자 전부, 나누지 않음)·`PA Display`(Outfit 파생), 굵기 400·500·600·700·800. Typst 가 가변 글꼴·woff2 를 못 읽어서 따로 싣는다. 이름에 원래 이름이 없는 건 OFL 예약 이름(Pretendard) 때문이다. 소비자는 `fontPaths: [<패키지>/fonts/print]` 하나만 넘긴다. 재생성은 `node scripts/build-print-fonts.mjs`(원본 `.src/` 는 `subset.sh` 의 받는 명령으로), 확인은 `node scripts/verify-fonts.mjs`.

## 설계 근거

`docs/superpowers/specs/2026-09-30-design-tokens-ssot-design.md` (구현 계획은 `docs/superpowers/plans/`). 원래 client-crawling 레포에서 썼고 2026-09-30 이리로 옮겼다.
