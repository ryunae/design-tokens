# 디자인 토큰 SSOT 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 세 내부 프로그램(geo-master · review-gen · client-crawling)이 손으로 복사한 디자인 토큰 대신 한 패키지를 소비하게 하고, client-crawling 의 화면 어휘를 GEO 기준에 맞춘다.

**Architecture:** 새 private 레포 `ryunae/design-tokens` 가 1층(중립·의미 토큰 값 + 색상환 hue + 서체 woff2)을 갖는다. 각 소비자는 git 태그로 핀 한 npm 의존성으로 그것을 받고, 2층(hue 배정 · 명도 조정 · 어두운 짝 · 폴백)은 자기 레포에 남긴다. 갈라짐은 소비자마다 드리프트 테스트 하나가 막는다.

**Tech Stack:** 순수 CSS 커스텀 프로퍼티 · npm git 의존성(pnpm·npm 공통) · woff2 (`pyftsubset` 으로 생성) · vitest(client-crawling) · Tailwind 4 `@theme inline`(geo-master·review-gen)

**Spec:** `docs/superpowers/specs/2026-09-30-design-tokens-ssot-design.md`

## Global Constraints

- **리포트 팔레트 불변.** `src/report/style.css` 와 `src/ui/tokens.css` 는 한 줄도 바꾸지 않는다. A4 로 거래처에 나가는 인쇄물이다.
- **스택 불변.** client-crawling 은 Hono + 서버 렌더 문자열 + htmx 로 남는다. React 로 옮기지 않는다.
- **`pnpm test` 는 네트워크 0.** 토큰·서체는 `node_modules` 에서 읽는다. 테스트가 GitHub 나 CDN 을 치면 안 된다.
- **CDN `@import` 금지.** 서체는 세 프로젝트 모두 자기 도메인에서 서빙한다.
- **값 표기는 맨 삼중항.** `--primary: 252 87% 67%` — `hsl()` 로 감싸지 않는다. 알파 합성(`hsl(var(--primary) / 0.36)`)이 되어야 한다.
- **터치 대상 44px 유지**(`--touch`). geo 의 `min-h-9`(36px)를 따르지 않는다.
- **focus ring 3px 유지.** geo 의 `ring-1`(1px)을 따르지 않는다.
- **감사 행은 지우지 않는다.** `audit_log.login_id` 컬럼은 이름도 값도 그대로 둔다.
- **버전은 태그로 핀.** 소비자는 `github:ryunae/design-tokens#v1.0.0` 처럼 태그를 가리킨다. 브랜치를 가리키지 않는다.
- **커밋은 레포별로.** 이 계획은 레포 4개를 건드린다. 태스크마다 어느 레포에서 도는지 명시되어 있다.
- **client-crawling 작업은 `claude/design-tokens` 브랜치에서.** main 직접 커밋 금지(큰 변경).

## Review Focus

스펙이 함의하지만 어느 태스크의 테스트도 짚지 않는 것들. 각 줄의 테스트를 담당 태스크에 넣었다.

1. **`@font-face` 가 걸린 문서와 안 걸린 문서가 섞인다** — 앱은 Pretendard, 리포트는 시스템 폰트다. 리포트 HTML 에 웹폰트가 새어 들어가면 거래처 PDF 가 조용히 바뀐다. → Task 7 이 리포트 HTML 에 `@font-face` 가 없음을 검사한다.
2. **희귀 한글 음절** — 거래처 이름에 `pretendard-ks` 에 없는 글자가 오면 `unicode-range` 가 둘째 파일로 넘겨야 한다. 범위 선언이 틀리면 글자가 통째로 폴백으로 떨어진다. → Task 3 이 두 파일의 `unicode-range` 가 겹치지도 비지도 않음을 검사한다.
3. **토큰 이름이 1층에서 사라졌는데 2층이 아직 참조한다** — 패키지에서 토큰을 지우면 소비자의 `var()` 가 조용히 무효가 되고 색이 사라진다(CSS 는 에러를 안 낸다). → Task 6 의 드리프트 테스트가 `app.css` 가 쓰는 모든 1층 이름이 `tokens.json` 에 있는지 검사한다.
4. **이메일 대소문자** — `Fusdofls@iCloud.com` 으로 가입하고 `fusdofls@icloud.com` 으로 로그인하면 들어가야 한다. → Task 1 이 정규화를 검사한다.
5. **`button.primary` 말고 다른 특정도 동률** — 오버레이로 바꿔도 `.btn.primary` 나 `button.danger:disabled` 같은 다른 조합이 같은 함정에 빠질 수 있다. → Task 8 이 variant 전부에 hover 반응이 있음을 검사한다.

---

## 파일 구조

**새 레포 `~/Documents/Dev/lib/design-tokens/`**

| 파일 | 책임 |
|---|---|
| `package.json` | 이름·버전·`exports` 맵. 런타임 의존 0 |
| `tokens.css` | 1층 전부. `:root` 블록 하나 |
| `tokens.json` | 같은 값의 기계 판독본. 드리프트 테스트가 읽는다 |
| `fonts.css` | `@font-face` 3벌 + `unicode-range` 2단 |
| `fonts/*.woff2` | 서체 자산 3개 |
| `LICENSE-fonts.txt` | SIL OFL 1.1 |
| `README.md` | 2층 구조 · 소비자 목록 · 서브셋 재생성 명령 |
| `scripts/subset.sh` | woff2 재생성. 서체 판올림 때만 돈다 |

**client-crawling 수정**

| 파일 | 바뀌는 것 |
|---|---|
| `src/db/schema.sql` | `users.login_id` → `users.email` |
| `src/db/index.ts` | v8 → v9 마이그레이션 |
| `src/db/users.ts` | 필드·쿼리 이름 |
| `src/web/auth.ts` · `login_pages.ts` · `admin_pages.ts` · `admin_app.ts` | 폼 필드·라벨 |
| `src/cli/user.ts` | `--login-id` → `--email` |
| `src/web/app.css` | `:root` 를 2층 별칭으로 · 컴포넌트 어휘 |
| `package.json` | 의존성 추가 · build 스크립트의 자산 복사 |
| `tests/web_style.test.ts` | 드리프트 테스트 · 어휘 테스트 |

---

### Task 1: 이메일 로그인 (client-crawling)

로그인 화면을 Task 10 에서 다시 연다. 먼저 식별자를 바꿔 두면 그 파일을 두 번 고치지 않는다.

**레포:** client-crawling · **브랜치:** `claude/design-tokens` 를 여기서 만든다

**Files:**
- Modify: `src/db/schema.sql:56` · `src/db/index.ts:130-132` · `src/db/users.ts` · `src/web/auth.ts:119,192` · `src/web/login_pages.ts:11` · `src/web/admin_pages.ts:192,220,237` · `src/web/admin_app.ts:181,197` · `src/cli/user.ts:47,72,100,105`
- Test: `tests/db_users.test.ts` · `tests/auth_middleware.test.ts` · `tests/admin_manage.test.ts` · `tests/helpers/auth.ts`

**Interfaces:**
- Produces: `users.email` 컬럼 · `getUserByEmail(db, email)` · `createUser({ email, name, role, ... })` · 폼 필드 이름 `email`
- 건드리지 않음: `audit_log.login_id` 컬럼(이름·값 모두). 감사 기록은 그때 시도한 식별자를 그대로 보존한다

- [ ] **Step 1: 브랜치를 만든다**

```bash
cd ~/Documents/Dev/client-crawling
git checkout -b claude/design-tokens
```

- [ ] **Step 2: 실 DB 를 백업한다**

WAL 모드라 `cp` 는 최신 쓰기를 잃는다. 반드시 `.backup` 을 쓴다.

```bash
sqlite3 data/app.db ".backup data/app.db.bak-$(date +%Y%m%d-%H%M)"
ls -la data/app.db.bak-*
```

- [ ] **Step 3: 실패하는 테스트를 쓴다**

`tests/db_users.test.ts` 에 추가:

```ts
it("이메일로 사람을 찾는다", () => {
  const db = memoryDb();
  createUser(db, {
    email: "someone@example.com",
    name: "홍길동",
    role: "staff",
    password: "temp-password-1",
  });
  expect(getUserByEmail(db, "someone@example.com")?.name).toBe("홍길동");
});

it("대소문자가 달라도 같은 사람이다 — 이메일은 소문자로 저장한다", () => {
  const db = memoryDb();
  createUser(db, {
    email: "Someone@Example.COM",
    name: "홍길동",
    role: "staff",
    password: "temp-password-1",
  });
  expect(getUserByEmail(db, "someone@example.com")?.name).toBe("홍길동");
  expect(getUserByEmail(db, "SOMEONE@EXAMPLE.COM")?.name).toBe("홍길동");
});

it("이메일이 아니면 거절한다", () => {
  const db = memoryDb();
  expect(() =>
    createUser(db, { email: "fusdofls", name: "홍길동", role: "staff", password: "temp-password-1" }),
  ).toThrow(/이메일/);
});
```

- [ ] **Step 4: 실패를 확인한다**

```bash
pnpm vitest run tests/db_users.test.ts
```

Expected: FAIL — `getUserByEmail is not defined`

- [ ] **Step 5: 스키마를 바꾼다**

`src/db/schema.sql:56` 에서 `login_id text not null unique` 를 `email text not null unique` 로 바꾼다. `audit_log` 의 80행 `login_id text` 는 **그대로 둔다**.

- [ ] **Step 6: 마이그레이션을 더한다**

`src/db/index.ts` 의 `db.pragma("user_version = 8")` 바로 앞에 넣는다:

```ts
    // v8→9: users.login_id → users.email. 이름이 거짓말하지 않게 칸 자체를 바꾼다.
    // audit_log.login_id 는 건드리지 않는다 — 그 칸의 뜻은 "그때 로그인에 쓴 식별자"라
    // 이메일이 들어가도 거짓이 아니고, 감사 기록은 다시 쓰지 않는 것이 이 프로젝트 규칙이다.
    if (v >= 7 && v < 9) {
      const cols = (db.pragma("table_info(users)") as { name: string }[]).map((c) => c.name);
      if (cols.includes("login_id") && !cols.includes("email")) {
        db.exec("alter table users rename column login_id to email");
      }
    }
```

그리고 `db.pragma("user_version = 8")` 을 `db.pragma("user_version = 9")` 로 바꾼다.

`alter table ... rename column` 은 SQLite 3.25+ 기능이고 better-sqlite3 가 싣는 SQLite 는 그보다 높다. 위 `if` 는 schema.sql 재적용보다 **먼저** 와야 한다 — `create table if not exists` 는 이미 있는 표에 아무 일도 안 하므로, 이름을 먼저 바꾸지 않으면 옛 컬럼이 남는다.

- [ ] **Step 7: users.ts 를 고친다**

`src/db/users.ts` 에서 `login_id` 를 `email` 로 바꾸고(타입 14·38행, insert 46·50행, select 60·64행, join 124행), `createUser` 와 `getUserByEmail` 에 정규화·검증을 넣는다:

```ts
/** 이메일은 소문자로 저장하고 찾는다 — 사람은 대소문자를 섞어 친다. */
const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();

/** 가벼운 형태 검사. 전달 가능성은 우리가 보장하지 않는다(코드를 보내지 않으므로). */
function assertEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("이메일 주소 형식이 아닙니다.");
  }
}
```

`createUser` 는 `const email = normalizeEmail(o.email); assertEmail(email);` 를 먼저 하고 그 `email` 을 넣는다. `getUserByEmail` 은 `normalizeEmail` 을 거친 값으로 조회한다. 함수 이름 `getUserByLoginId` → `getUserByEmail`.

- [ ] **Step 8: 테스트 통과를 확인한다**

```bash
pnpm vitest run tests/db_users.test.ts
```

Expected: PASS

- [ ] **Step 9: 화면·CLI 를 고친다**

- `src/web/login_pages.ts:11` — `<label>아이디</label><input name="login_id" ...>` 를
  `<label>이메일</label><input name="email" type="email" required autofocus autocomplete="username">` 로.
- `src/web/auth.ts:119` — `f.login_id` → `f.email`, 변수 `loginId` → `email`.
- `src/web/auth.ts:192` — `getUserByLoginId(db, user.login_id)` → `getUserByEmail(db, user.email)`.
- `src/web/admin_pages.ts:192,220` — `r.login_id`/`u.login_id` → `.email`. 237행 라벨 「아이디」 → 「이메일」, `name="login_id"` → `name="email" type="email"`.
- `src/web/admin_app.ts:181,197` — `f.login_id` → `f.email`.
- `src/cli/user.ts` — 플래그 `--login-id` → `--email`, 변수·출력 문구 전부.
- `src/web/audit.ts:232,270` 과 `audit_humanize.ts:146` 은 **그대로 둔다**(감사 컬럼).

- [ ] **Step 10: 전체 테스트를 고치고 돌린다**

테스트 픽스처의 `login_id` 를 `email` 로 바꾸고(`tests/helpers/auth.ts` 포함) 전부 돌린다.

```bash
pnpm test 2>&1 | tail -20
```

Expected: 전부 통과. 실패하면 남은 `login_id` 참조다 — `grep -rn "login_id" tests/ src/` 로 찾는다(감사 관련 `src/db/audit.ts`·`src/web/audit*.ts` 는 남아 있는 게 정상).

- [ ] **Step 11: 실 계정을 옮긴다**

마이그레이션은 컬럼 이름만 바꾼다. 값은 `fusdofls` 그대로이므로 이메일로 갱신한다.

```bash
sqlite3 data/app.db "update users set email='fusdofls@icloud.com' where email='fusdofls';"
sqlite3 data/app.db "select user_id, email, name, role from users;"
```

Expected: `email` 이 `fusdofls@icloud.com`

- [ ] **Step 12: 커밋**

```bash
git add -A
git commit -m "feat(auth): 로그인 식별자를 이메일로 — users.login_id → users.email (schema v9)

감사 로그의 login_id 컬럼은 이름도 값도 그대로 둔다. 그 칸의 뜻은 '그때 로그인에
쓴 식별자'라 이메일이 들어가도 거짓이 아니고, 감사 행은 다시 쓰지 않는다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: design-tokens 패키지 뼈대

**레포:** 새 레포 `~/Documents/Dev/lib/design-tokens/`

**Files:**
- Create: `package.json` · `tokens.css` · `tokens.json` · `README.md` · `.gitignore`

**Interfaces:**
- Produces: `@ryunae/design-tokens` 패키지. `exports` 로 `./tokens.css` · `./tokens.json` · `./fonts.css` · `./fonts/*` 를 낸다. Task 3 이 `fonts.css`·`fonts/*` 를 채우고, Task 4~6 이 소비한다.

- [ ] **Step 1: 레포를 만든다**

```bash
mkdir -p ~/Documents/Dev/lib/design-tokens/fonts ~/Documents/Dev/lib/design-tokens/scripts
cd ~/Documents/Dev/lib/design-tokens
git init -b main
printf 'node_modules/\n.DS_Store\n' > .gitignore
```

- [ ] **Step 2: package.json 을 쓴다**

```json
{
  "name": "@ryunae/design-tokens",
  "version": "1.0.0",
  "private": true,
  "description": "내부 프로그램 공용 디자인 토큰 — geo-master · review-gen · client-crawling",
  "license": "UNLICENSED",
  "type": "module",
  "exports": {
    "./tokens.css": "./tokens.css",
    "./tokens.json": "./tokens.json",
    "./fonts.css": "./fonts.css",
    "./fonts/*": "./fonts/*"
  },
  "files": ["tokens.css", "tokens.json", "fonts.css", "fonts", "LICENSE-fonts.txt"]
}
```

`dependencies` 가 없는 것이 의도다 — CSS 와 woff2 뿐이다.

- [ ] **Step 3: tokens.css 를 쓴다**

geo-master `src/index.css` 의 `:root` 값을 그대로 옮기되, **모든 이름에 `--ds-` 를 붙이고** 색상환을 hue 로 드러내고 `--app-font-sans` 를 Pretendard 로 바꾼다.

**이름공간이 왜 필요한가.** 접두어 없이 내보내면 소비자의 어휘와 충돌한다. client-crawling 에서 실측한 두 건:

- `--card` — 뜻은 같지만 형식이 다르다(1층은 삼중항 `230 20% 7%`, 2층은 색 `#10121c`). 2층이 `--card: hsl(var(--card))` 라고 쓰면 **자기 참조**라 CSS 가 그 속성을 통째로 무효화한다. 커스텀 프로퍼티는 소스 순서가 아니라 최종값으로 치환되므로 `:root` 를 두 블록으로 쪼개도 순환은 그대로다.
- `--muted` — **뜻이 다르다.** geo 는 흐린 *배경*(`230 20% 10%`), client-crawling 은 흐린 *글자*(`#98a1b8`, geo 로 치면 `--muted-foreground`). 덮기가 한 번 어긋나면 흐린 글자가 어두운 배경색이 되어 **글자가 사라진다.** CSS 는 에러를 안 낸다.

```css
/* 내부 프로그램 공용 디자인 토큰 — 1층.
 *
 * 이 파일이 값의 유일한 출처다. 모든 이름에 --ds- 가 붙는다. 소비자의 어휘와 충돌하지
 * 않게 하려는 것이다 — client-crawling 은 --muted 를 "흐린 글자"로 쓰는데 shadcn 은
 * "흐린 배경"으로 쓴다. 같은 이름이 다른 뜻이면 덮기가 어긋나는 순간 글자가 사라진다.
 *
 * 색은 맨 삼중항으로 저장한다 — hsl() 로 감싸지 않아야 알파 합성이 된다:
 *   color: hsl(var(--ds-primary));
 *   box-shadow: 0 0 0 3px hsl(var(--ds-primary) / 0.36);
 */
:root {
  /* --- 색상환. 실제로 공유되는 불변량은 hue 다.
   *     명도·채도는 배경에 따라 다르고 달라야 한다(어두운 배경에서는 올려야 읽힌다).
   *     어느 hue 를 누구에게 배정할지도 소비자가 정한다 — client-crawling 은
   *     거래처=1 · 경쟁사1=4(호박), geo-master 는 chart-1..5 순서다. --- */
  --ds-hue-1: 252; /* 보라 */
  --ds-hue-2: 280; /* 자주 */
  --ds-hue-3: 160; /* 에메랄드 */
  --ds-hue-4: 40;  /* 호박 */
  --ds-hue-5: 350; /* 장미 */

  /* --- 바탕과 글자 --- */
  --ds-background: 230 25% 4%;
  --ds-foreground: 210 40% 98%;
  --ds-card: 230 20% 7%;
  --ds-card-foreground: 210 40% 98%;
  --ds-card-border: 230 20% 15%;
  --ds-popover: 230 20% 7%;
  --ds-popover-foreground: 210 40% 98%;
  --ds-popover-border: 230 20% 15%;

  /* --- 의미색 --- */
  --ds-primary: var(--ds-hue-1) 87% 67%;
  --ds-primary-foreground: 210 40% 98%;
  --ds-secondary: 230 20% 15%;
  --ds-secondary-foreground: 210 40% 98%;
  --ds-muted: 230 20% 10%;
  --ds-muted-foreground: 215 20% 65%;
  --ds-accent: var(--ds-hue-2) 87% 65%;
  --ds-accent-foreground: 210 40% 98%;
  --ds-destructive: var(--ds-hue-5) 84% 60%;
  --ds-destructive-foreground: 210 40% 98%;

  --ds-border: 230 20% 18%;
  --ds-input: 230 20% 18%;
  --ds-ring: var(--ds-hue-1) 87% 67%;

  /* --- 차트. geo-master 의 배정이다(소비자가 달리 배정해도 된다). --- */
  --ds-chart-1: var(--ds-hue-1) 87% 67%;
  --ds-chart-2: var(--ds-hue-2) 87% 65%;
  --ds-chart-3: var(--ds-hue-3) 84% 55%;
  --ds-chart-4: var(--ds-hue-4) 90% 60%;
  --ds-chart-5: var(--ds-hue-5) 84% 60%;

  /* --- 사이드바 --- */
  --ds-sidebar: 230 25% 5%;
  --ds-sidebar-foreground: 210 40% 98%;
  --ds-sidebar-border: 230 20% 15%;
  --ds-sidebar-primary: var(--ds-hue-1) 87% 67%;
  --ds-sidebar-primary-foreground: 210 40% 98%;
  --ds-sidebar-accent: 230 20% 12%;
  --ds-sidebar-accent-foreground: 210 40% 98%;
  --ds-sidebar-ring: var(--ds-hue-1) 87% 67%;

  /* --- 테두리 파생. 바탕보다 9% 밝은 선. --- */
  --ds-primary-border: hsl(from hsl(var(--ds-primary)) h s calc(l + 9));
  --ds-secondary-border: hsl(from hsl(var(--ds-secondary)) h s calc(l + 9));
  --ds-muted-border: hsl(from hsl(var(--ds-muted)) h s calc(l + 9));
  --ds-accent-border: hsl(from hsl(var(--ds-accent)) h s calc(l + 9));
  --ds-destructive-border: hsl(from hsl(var(--ds-destructive)) h s calc(l + 9));
  --ds-sidebar-primary-border: hsl(from hsl(var(--ds-sidebar-primary)) h s calc(l + 9));
  --ds-sidebar-accent-border: hsl(from hsl(var(--ds-sidebar-accent)) h s calc(l + 9));

  /* --- 상호작용. 배경을 갈아끼우지 않고 위에 얹는 알파다 —
   *     그래야 버튼 자기 배경과 무관하게 반응이 보인다. --- */
  --ds-elevate-1: rgba(255, 255, 255, 0.04);
  --ds-elevate-2: rgba(255, 255, 255, 0.09);
  --ds-button-outline: rgba(255, 255, 255, 0.1);
  --ds-badge-outline: rgba(255, 255, 255, 0.05);
  --ds-glass: rgba(255, 255, 255, 0.04);
  --ds-glass-line: rgba(255, 255, 255, 0.08);

  /* --- 형태 --- */
  --ds-radius: 0.75rem;
  --ds-radius-sm: calc(var(--ds-radius) - 4px);
  --ds-radius-md: calc(var(--ds-radius) - 2px);
  --ds-radius-lg: var(--ds-radius);
  --ds-radius-xl: calc(var(--ds-radius) + 4px);
  --ds-spacing: 0.25rem;
  --ds-tracking-normal: 0em;

  /* --- 층위 --- */
  --ds-shadow-2xs: 0px 2px 4px 0px rgba(0, 0, 0, 0.3);
  --ds-shadow-xs: 0px 2px 4px 0px rgba(0, 0, 0, 0.3);
  --ds-shadow-sm: 0px 2px 4px 0px rgba(0, 0, 0, 0.3), 0px 1px 2px -1px rgba(0, 0, 0, 0.3);
  --ds-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.3), 0px 1px 2px -1px rgba(0, 0, 0, 0.3);
  --ds-shadow-md: 0px 6px 12px 0px rgba(0, 0, 0, 0.3), 0px 2px 4px -1px rgba(0, 0, 0, 0.3);
  --ds-shadow-lg: 0px 10px 20px 0px rgba(0, 0, 0, 0.3), 0px 4px 6px -1px rgba(0, 0, 0, 0.3);
  --ds-shadow-xl: 0px 16px 32px 0px rgba(0, 0, 0, 0.3), 0px 8px 10px -1px rgba(0, 0, 0, 0.3);
  --ds-shadow-2xl: 0px 24px 48px 0px rgba(0, 0, 0, 0.4);

  /* --- 서체. 한글은 Pretendard 가 덮는다(fonts.css 의 unicode-range 2단).
   *     그마저 못 덮는 글자(옛한글·한자)의 폴백은 소비자가 정한다. --- */
  --ds-font-sans: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --ds-font-display: "Outfit", "Pretendard", sans-serif;
  --ds-font-serif: Georgia, serif;
  --ds-font-mono: Menlo, monospace;
}
```

- [ ] **Step 4: tokens.json 을 쓴다**

`tokens.css` 와 같은 값의 기계 판독본. 드리프트 검사가 이걸 읽는다 — CSS 를 정규식으로 긁으면 그 정규식이 또 하나의 갈라질 물건이 된다. 이름은 `--ds-` 를 뗀 채로 적는다.

```json
{
  "prefix": "ds",
  "hue": { "1": 252, "2": 280, "3": 160, "4": 40, "5": 350 },
  "names": [
    "hue-1", "hue-2", "hue-3", "hue-4", "hue-5",
    "background", "foreground", "card", "card-foreground", "card-border",
    "popover", "popover-foreground", "popover-border",
    "primary", "primary-foreground", "secondary", "secondary-foreground",
    "muted", "muted-foreground", "accent", "accent-foreground",
    "destructive", "destructive-foreground",
    "border", "input", "ring",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
    "sidebar", "sidebar-foreground", "sidebar-border",
    "sidebar-primary", "sidebar-primary-foreground",
    "sidebar-accent", "sidebar-accent-foreground", "sidebar-ring",
    "primary-border", "secondary-border", "muted-border",
    "accent-border", "destructive-border",
    "sidebar-primary-border", "sidebar-accent-border",
    "elevate-1", "elevate-2", "button-outline", "badge-outline", "glass", "glass-line",
    "radius", "radius-sm", "radius-md", "radius-lg", "radius-xl",
    "spacing", "tracking-normal",
    "shadow-2xs", "shadow-xs", "shadow-sm", "shadow", "shadow-md",
    "shadow-lg", "shadow-xl", "shadow-2xl",
    "font-sans", "font-display", "font-serif", "font-mono"
  ]
}
```

- [ ] **Step 5: tokens.css 와 tokens.json 이 일치하는지 검사한다**

```bash
cd ~/Documents/Dev/lib/design-tokens
node -e '
const fs=require("fs");
const css=[...fs.readFileSync("tokens.css","utf8").matchAll(/^\s*--ds-([\w-]+)\s*:/gm)].map(m=>m[1]).sort();
const json=JSON.parse(fs.readFileSync("tokens.json","utf8")).names.slice().sort();
const only=(a,b)=>a.filter(x=>!b.includes(x));
console.log("css 에만:", only(css,json).join(", ")||"없음");
console.log("json 에만:", only(json,css).join(", ")||"없음");
process.exit(only(css,json).length||only(json,css).length?1:0);
'
```

Expected: `css 에만: 없음` · `json 에만: 없음`, 종료 코드 0

- [ ] **Step 6: 소비자 검사 스크립트를 쓴다**

세 소비자 중 CSS 를 검사할 테스트 러너가 있는 건 client-crawling 뿐이다(geo-master·review-gen 은 Vite 앱이고 test 스크립트가 없다). 검사를 **패키지가 들고** 소비자가 자기 스크립트에 끼워 넣게 한다. 의존성 0, 20줄.

`scripts/check-consumer.mjs`:

```js
#!/usr/bin/env node
// 소비자 CSS 가 1층을 다시 선언하지 않는지 본다. 인자는 검사할 .css 파일들.
//   node check-consumer.mjs src/index.css
// 다시 선언하면 값이 둘이 되고, 그 순간부터 갈라진다 — 이 패키지가 없애려는 바로 그것.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { names } = JSON.parse(fs.readFileSync(path.join(here, "../tokens.json"), "utf8"));
const layer1 = new Set(names.map((n) => `--ds-${n}`));
let bad = 0;

for (const file of process.argv.slice(2)) {
  const css = fs.readFileSync(file, "utf8");
  const redeclared = [...css.matchAll(/^\s*(--ds-[\w-]+)\s*:/gm)]
    .map((m) => m[1])
    .filter((n) => layer1.has(n));
  const unknown = [...css.matchAll(/var\(\s*(--ds-[\w-]+)/g)]
    .map((m) => m[1])
    .filter((n) => !layer1.has(n));
  for (const n of new Set(redeclared)) {
    console.error(`${file}: ${n} 을 다시 선언했다 — 1층 값이 둘이 된다`);
    bad++;
  }
  for (const n of new Set(unknown)) {
    console.error(`${file}: ${n} 은 1층에 없다 — var() 가 조용히 무효가 된다`);
    bad++;
  }
}
console.log(bad ? `${bad}건 걸림` : "1층 계약 이상 없음");
process.exit(bad ? 1 : 0);
```

`package.json` 의 `files` 에 `"scripts"` 를 더하고 `exports` 에 한 줄 더한다:

```json
    "./check-consumer": "./scripts/check-consumer.mjs"
```

- [ ] **Step 7: README 를 쓴다**

```markdown
# @ryunae/design-tokens

내부 프로그램 공용 디자인 토큰. **값은 여기에만 있다.**

## 소비자

| 레포 | 경로 |
|---|---|
| GEO-maseuteo | `artifacts/geo-master/src/index.css` (기준 출처) |
| review-gen | `src/index.css` |
| client-crawling | `src/web/app.css` |

새 소비자를 붙이면 이 표에 한 줄 더한다. **판올림 태그는 이 표의 전부를 고친 뒤에만 단다.**

## 쓰는 법

```bash
pnpm add "@ryunae/design-tokens@github:ryunae/design-tokens#v1.0.0"
```

```css
@import "@ryunae/design-tokens/tokens.css";
@import "@ryunae/design-tokens/fonts.css";
```

## 2층 — 여기 없는 것

`tokens.css` 는 1층이다. 아래는 각 프로젝트가 정한다.

- **어느 hue 를 누구에게 배정할지.** client-crawling 은 거래처=`--ds-hue-1` · 경쟁사1=`--ds-hue-4`(호박). geo-master 는 `--ds-chart-1..5` 순서.
- **배경별 명도·채도.** 어두운 배경에서 읽히려면 올려야 한다. hue 만 지키면 된다.
- **어두운 짝**(`--comp1-bg` 류). 눈으로 맞춘 대비라 자동 유도하지 않는다.
- **한글 폴백.** `pretendard-ext` 도 못 덮는 글자(옛한글·한자).
- **Tailwind `@theme inline` 배선.** 값이 아니라 배선이다.

## 이름공간

모든 토큰에 `--ds-` 가 붙는다. 소비자의 어휘와 충돌하지 않게 하려는 것이다 —
client-crawling 은 `--muted` 를 「흐린 글자」로 쓰는데 shadcn 은 「흐린 배경」으로 쓴다.
같은 이름이 다른 뜻이면 덮기가 어긋나는 순간 글자가 사라지고, CSS 는 에러를 안 낸다.

## 갈라짐 검사

소비자는 자기 빌드에 이걸 끼운다. 1층 이름을 다시 선언하거나 없는 이름을 쓰면 실패한다.

```bash
node node_modules/@ryunae/design-tokens/scripts/check-consumer.mjs src/index.css
```

## 설계 근거

`~/Documents/Dev/client-crawling/docs/superpowers/specs/2026-09-30-design-tokens-ssot-design.md`
```

- [ ] **Step 8: 커밋**

```bash
cd ~/Documents/Dev/lib/design-tokens
git add -A
git commit -m "feat: 1층 디자인 토큰 — 색상환 hue · 의미색 · 형태 · 층위

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 서체 자산

**레포:** `~/Documents/Dev/lib/design-tokens/`

**Files:**
- Create: `fonts/pretendard-ks.woff2` · `fonts/pretendard-ext.woff2` · `fonts/outfit-latin.woff2` · `fonts.css` · `LICENSE-fonts.txt` · `scripts/subset.sh`

**Interfaces:**
- Consumes: Task 2 의 `package.json` `exports`
- Produces: `@ryunae/design-tokens/fonts.css` — `Pretendard`(2단) 와 `Outfit` 의 `@font-face`. `src` 는 `./fonts/*.woff2` 상대 경로. client-crawling 은 이걸 안 쓰고 `/static/` URL 로 자기 `@font-face` 를 쓴다(Task 7).

- [ ] **Step 1: 원본을 받는다**

Pretendard 전체판에만 한글이 있다. 공식 릴리스의 `PretendardStd` 는 라틴·키릴 전용이라 **쓰면 안 된다**(실측: 한글 0자).

```bash
cd ~/Documents/Dev/lib/design-tokens
mkdir -p .src && cd .src
curl -sL -o pretendard.zip \
  "https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip"
unzip -o -q pretendard.zip "web/variable/woff2/PretendardVariable.woff2" "LICENSE.txt"
ls -la web/variable/woff2/PretendardVariable.woff2
```

Expected: 약 2,009 KB

- [ ] **Step 2: 서브셋 생성 스크립트를 쓴다**

`scripts/subset.sh`:

```bash
#!/usr/bin/env bash
# Pretendard 를 unicode-range 2단으로 나눈다. 서체를 판올림할 때만 돈다.
#   ks  — KS X 1001 상용 2350자 + 라틴 + 구두점 (449 KB, 사실상 모든 쪽이 받는다)
#   ext — 나머지 현대 한글 8,822자 (1,317 KB, 그 쪽에 희귀 음절이 있을 때만)
# 거래처 이름에는 상용 밖 음절이 온다. 2350자만 실으면 그 글자가 깨진다.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=.src/web/variable/woff2/PretendardVariable.woff2
COMMON="U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20A9,U+20AC,U+2122,U+2212,U+3000-303F,U+FF01-FF60"

python3 - <<'PY'
ks = []
for lead in range(0xB0, 0xC9):
    for trail in range(0xA1, 0xFF):
        try:
            ks.append(ord(bytes([lead, trail]).decode("euc-kr")))
        except Exception:
            pass
ks = sorted(c for c in ks if 0xAC00 <= c <= 0xD7A3)
rest = [c for c in range(0xAC00, 0xD7A4) if c not in set(ks)]
assert len(ks) == 2350, len(ks)
open(".src/ks.txt", "w").write(",".join("U+%04X" % c for c in ks))
open(".src/ext.txt", "w").write(",".join("U+%04X" % c for c in rest))
print("ks", len(ks), "ext", len(rest))
PY

uvx --from fonttools --with brotli pyftsubset "$SRC" \
  --unicodes="$COMMON,$(cat .src/ks.txt)" --layout-features='*' \
  --flavor=woff2 --output-file=fonts/pretendard-ks.woff2
uvx --from fonttools --with brotli pyftsubset "$SRC" \
  --unicodes="$(cat .src/ext.txt)" --layout-features='*' \
  --flavor=woff2 --output-file=fonts/pretendard-ext.woff2
ls -la fonts/
```

```bash
chmod +x scripts/subset.sh && ./scripts/subset.sh
```

Expected: `pretendard-ks.woff2` 약 449 KB, `pretendard-ext.woff2` 약 1,317 KB

- [ ] **Step 3: Outfit 을 옮긴다**

client-crawling 이 이미 갖고 있는 것을 쓴다(이미 라틴 서브셋이다).

```bash
cp ~/Documents/Dev/client-crawling/src/web/static/outfit-latin.woff2 fonts/
ls -la fonts/outfit-latin.woff2
```

Expected: 약 32 KB

- [ ] **Step 4: 서브셋이 실제로 맞는지 검사한다**

이건 「돌려 보니 되더라」가 아니라 계약이다 — `unicode-range` 선언이 파일 내용과 어긋나면 글자가 조용히 폴백으로 떨어진다.

```bash
uvx --quiet --from fonttools --with brotli python - <<'PY'
from fontTools.ttLib import TTFont
ks  = set(TTFont("fonts/pretendard-ks.woff2").getBestCmap())
ext = set(TTFont("fonts/pretendard-ext.woff2").getBestCmap())
syl = set(range(0xAC00, 0xD7A4))
ks_h, ext_h = ks & syl, ext & syl
print("ks 한글", len(ks_h), "| ext 한글", len(ext_h))
assert len(ks_h) == 2350, "ks 가 상용 2350자가 아니다"
assert ks_h | ext_h == syl, "둘을 합쳐도 현대 한글이 다 안 된다"
assert not (ks_h & ext_h), "두 파일이 겹친다 — 받지 않아도 될 파일을 받게 된다"
assert 0x41 in ks and 0x30 in ks, "ks 에 라틴·숫자가 없다"
f = TTFont("fonts/pretendard-ks.woff2")
feats = {fr.FeatureTag for t in ("GSUB", "GPOS") if t in f for fr in f[t].table.FeatureList.FeatureRecord}
assert "tnum" in feats, "tabular-nums 가 빠졌다 — 숫자 열이 흔들린다"
assert [(a.axisTag, a.minValue, a.maxValue) for a in f["fvar"].axes] == [("wght", 45.0, 930.0)]
print("모두 통과")
PY
```

Expected: `ks 한글 2350 | ext 한글 8822` 그리고 `모두 통과`

- [ ] **Step 5: fonts.css 를 쓴다**

```css
/* 서체. 한글은 2단으로 나눠 싣는다 — 보통 쪽은 ks(449KB)만 받고,
 * 상용 밖 음절(거래처 이름에 온다)이 있는 쪽만 ext(1,317KB)를 더 받는다.
 * 두 범위는 겹치지 않고 합치면 현대 한글 전체다(scripts/subset.sh 가 검사한다).
 *
 * src 경로가 안 맞는 소비자는 이 파일을 쓰지 말고 woff2 만 가져가 자기 @font-face 를 쓴다
 * (client-crawling 이 그렇게 한다 — /static/ 에서 서빙). */
@font-face {
  font-family: "Pretendard";
  src: url("./fonts/pretendard-ks.woff2") format("woff2");
  font-weight: 45 930;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20A9, U+20AC,
    U+2122, U+2212, U+3000-303F, U+FF01-FF60, U+AC00-D7A3;
}
@font-face {
  font-family: "Pretendard";
  src: url("./fonts/pretendard-ext.woff2") format("woff2");
  font-weight: 45 930;
  font-display: swap;
  unicode-range: U+AC00-D7A3;
}
@font-face {
  font-family: "Outfit";
  src: url("./fonts/outfit-latin.woff2") format("woff2");
  font-weight: 500 800;
  font-display: swap;
}
```

두 `@font-face` 의 `unicode-range` 에 `U+AC00-D7A3` 이 같이 있는 것은 의도다(범위를 쪼개 적으면 2350줄이 된다). **`ext` 를 먼저, `ks` 를 나중에 적는다** — 겹치는 범위에서는 나중 선언이 먼저 검사되므로, 흔한 글자를 담은 `ks` 가 마지막에 와야 보통 쪽이 그것만 받는다. 순서가 뒤집히면 매 쪽이 1.78MB 를 받는다(브라우저 실측).

- [ ] **Step 6: 라이선스를 동봉한다**

```bash
cp .src/LICENSE.txt LICENSE-fonts.txt
printf '\n\n--- Outfit ---\nSIL Open Font License 1.1 — https://github.com/Outfitio/Outfit-Fonts\n' >> LICENSE-fonts.txt
head -3 LICENSE-fonts.txt
```

- [ ] **Step 7: 원본을 커밋에서 뺀다**

```bash
printf '.src/\n' >> .gitignore
git add -A && git status --short
```

Expected: `.src/` 가 목록에 없다. `fonts/*.woff2` 3개는 있다.

- [ ] **Step 8: 커밋하고 태그를 단다**

태그는 소비자 셋을 다 고친 뒤 Task 6 끝에 단다. 여기서는 커밋만.

```bash
git commit -m "feat: 서체 — Pretendard 2단 서브셋 · Outfit

한글은 ks(상용 2350자, 449KB) + ext(나머지 8822자, 1317KB)로 나눠 싣는다.
거래처 이름에 상용 밖 음절이 오므로 2350자만으로는 글자가 깨진다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: geo-master 가 소비한다

원본이 소비자가 되지 않으면 SSOT 가 아니라 네 번째 복사본이다.

**레포:** `~/Documents/Dev/app/GEO-maseuteo/` · **브랜치:** `claude/design-tokens`

**Files:**
- Modify: `artifacts/geo-master/src/index.css:1-140` · `artifacts/geo-master/package.json`

**Interfaces:**
- Consumes: `@ryunae/design-tokens/tokens.css` · `/fonts.css` (Task 2·3)
- 유지: `@theme inline` 블록 · `@layer base` · `@layer utilities` · `html.lang-ko/en` 규칙

- [ ] **Step 1: 교체 전 화면을 찍어 둔다**

값이 안 바뀌므로 색·간격·모서리는 그대로여야 한다. 비교 기준이 있어야 확인이 된다.

```bash
cd ~/Documents/Dev/app/GEO-maseuteo
git checkout -b claude/design-tokens
pnpm --filter @workspace/geo-master dev
```

브라우저로 대시보드·설정·로그인 세 화면을 열어 스크린샷을 남긴다.

- [ ] **Step 2: 의존성을 더한다**

```bash
cd ~/Documents/Dev/app/GEO-maseuteo/artifacts/geo-master
pnpm add "@ryunae/design-tokens@file:../../../../lib/design-tokens"
```

태그 의존성(`github:...#v1.0.0`)은 Task 6 끝에서 바꾼다. 지금은 로컬 경로로 붙여 놓고 셋을 다 고친 뒤 한 번에 태그로 옮긴다 — 아직 태그가 없다.

- [ ] **Step 3: index.css 의 머리를 바꾼다**

1행의 Google Fonts `@import url(...)` 을 지우고, `:root { ... }` 블록 전체(76~140행 근처, `--button-outline` 부터 `--spacing: 0.25rem;` 까지)를 지운 뒤 그 자리에 넣는다:

```css
@import "@ryunae/design-tokens/tokens.css";
@import "@ryunae/design-tokens/fonts.css";
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";
```

- [ ] **Step 4: @theme inline 과 utilities 를 `--ds-` 로 옮긴다**

`@theme inline` 은 배선이라 남지만, 가리키는 이름이 바뀐다. `hsl(var(--x))` → `hsl(var(--ds-x))`, `var(--x)` → `var(--ds-x)` 로 전부.

```css
@theme inline {
  --color-background: hsl(var(--ds-background));
  --color-foreground: hsl(var(--ds-foreground));
  --color-border: hsl(var(--ds-border));
  --color-input: hsl(var(--ds-input));
  --color-ring: hsl(var(--ds-ring));

  --color-card: hsl(var(--ds-card));
  --color-card-foreground: hsl(var(--ds-card-foreground));
  --color-card-border: hsl(var(--ds-card-border));

  --color-popover: hsl(var(--ds-popover));
  --color-popover-foreground: hsl(var(--ds-popover-foreground));
  --color-popover-border: hsl(var(--ds-popover-border));

  --color-primary: hsl(var(--ds-primary));
  --color-primary-foreground: hsl(var(--ds-primary-foreground));
  --color-primary-border: var(--ds-primary-border);

  --color-secondary: hsl(var(--ds-secondary));
  --color-secondary-foreground: hsl(var(--ds-secondary-foreground));
  --color-secondary-border: var(--ds-secondary-border);

  --color-muted: hsl(var(--ds-muted));
  --color-muted-foreground: hsl(var(--ds-muted-foreground));
  --color-muted-border: var(--ds-muted-border);

  --color-accent: hsl(var(--ds-accent));
  --color-accent-foreground: hsl(var(--ds-accent-foreground));
  --color-accent-border: var(--ds-accent-border);

  --color-destructive: hsl(var(--ds-destructive));
  --color-destructive-foreground: hsl(var(--ds-destructive-foreground));
  --color-destructive-border: var(--ds-destructive-border);

  --color-chart-1: hsl(var(--ds-chart-1));
  --color-chart-2: hsl(var(--ds-chart-2));
  --color-chart-3: hsl(var(--ds-chart-3));
  --color-chart-4: hsl(var(--ds-chart-4));
  --color-chart-5: hsl(var(--ds-chart-5));

  --color-sidebar: hsl(var(--ds-sidebar));
  --color-sidebar-foreground: hsl(var(--ds-sidebar-foreground));
  --color-sidebar-border: hsl(var(--ds-sidebar-border));
  --color-sidebar-primary: hsl(var(--ds-sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--ds-sidebar-primary-foreground));
  --color-sidebar-primary-border: var(--ds-sidebar-primary-border);
  --color-sidebar-accent: hsl(var(--ds-sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--ds-sidebar-accent-foreground));
  --color-sidebar-accent-border: var(--ds-sidebar-accent-border);
  --color-sidebar-ring: hsl(var(--ds-sidebar-ring));

  --font-sans: var(--ds-font-sans);
  --font-serif: var(--ds-font-serif);
  --font-mono: var(--ds-font-mono);
  --font-display: var(--ds-font-display);

  --radius-sm: var(--ds-radius-sm);
  --radius-md: var(--ds-radius-md);
  --radius-lg: var(--ds-radius-lg);
  --radius-xl: var(--ds-radius-xl);
}
```

`@layer utilities` 의 `--elevate-1`·`--elevate-2` 참조도 바꾼다:

```css
  .hover-elevate:hover:not(.no-default-hover-elevate)::after {
    background-color: var(--ds-elevate-1);
  }

  .active-elevate:active:not(.no-default-active-elevate)::after {
    background-color: var(--ds-elevate-2);
  }
```

`button.tsx`·`badge.tsx` 의 `[border-color:var(--button-outline)]` · `var(--badge-outline)` 도 `--ds-` 로:

```bash
cd ~/Documents/Dev/app/GEO-maseuteo/artifacts/geo-master
grep -rn "var(--button-outline)\|var(--badge-outline)\|var(--elevate-" src/
```

나오는 자리마다 `--ds-` 를 붙인다.

한글 폴백은 2층이므로 파일 끝 `html.lang-ko` 규칙에 `'Pretendard'` 를 앞세운다 — 이제 실제로 받아오는 서체가 생겼다.

```css
html.lang-ko,
html.lang-ko body,
html.lang-ko input,
html.lang-ko textarea,
html.lang-ko button,
html.lang-ko select {
  font-family: 'Pretendard', 'Noto Sans KR', system-ui, sans-serif;
  word-break: keep-all;
}
```

- [ ] **Step 4b: 갈라짐 검사를 빌드에 끼운다**

`artifacts/geo-master/package.json` 의 `scripts` 에 더하고, 루트 `verify` 가 타게 한다.

```json
"check:tokens": "node ../../node_modules/@ryunae/design-tokens/scripts/check-consumer.mjs src/index.css"
```

```bash
pnpm --filter @workspace/geo-master run check:tokens
```

Expected: `1층 계약 이상 없음`

- [ ] **Step 5: 빌드와 타입 검사를 돌린다**

```bash
cd ~/Documents/Dev/app/GEO-maseuteo
pnpm run verify
```

Expected: typecheck · lint · test 전부 통과

- [ ] **Step 6: 육안으로 비교한다**

```bash
pnpm --filter @workspace/geo-master dev
```

Step 1 의 세 화면을 다시 열어 스크린샷과 비교한다.

Expected: **색·간격·모서리 변화 0.** 라틴 글자는 Inter → Pretendard 라 자간이 미세하게 움직일 수 있다(결정 4). 그 외에 달라 보이면 옮기다 흘린 것이다 — `:root` 에 있던 이름이 `tokens.css` 에 다 들어갔는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "refactor(ui): 토큰을 @ryunae/design-tokens 에서 받는다 · Google Fonts CDN 제거

원본도 소비자가 된다 — 안 그러면 SSOT 가 아니라 네 번째 복사본이다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: review-gen 이 소비한다

**레포:** `~/Documents/Dev/app/review-gen/` · **브랜치:** `claude/design-tokens`

**Files:**
- Modify: `src/index.css:1-60` · `package.json`

**Interfaces:**
- Consumes: `@ryunae/design-tokens/tokens.css` · `/fonts.css`
- 유지: `@layer base` · `@layer utilities` (glass-panel 류)

- [ ] **Step 1: 브랜치와 의존성**

```bash
cd ~/Documents/Dev/app/review-gen
git checkout -b claude/design-tokens
npm i "file:../../lib/design-tokens"
```

- [ ] **Step 2: 머리 5줄과 :root 를 바꾼다**

1~2행의 CDN `@import` 두 줄(Google Fonts Outfit · jsdelivr Pretendard)과 9~30행의 `:root { ... }` 블록을 지우고:

```css
@import "@ryunae/design-tokens/tokens.css";
@import "@ryunae/design-tokens/fonts.css";
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 3: @theme inline 을 고친다**

세 가지가 갈라져 있다.

**(가) 이름을 `--ds-` 로 옮기고 `hsl()` 로 감싼다.** `:root` 가 이제 1층이라 감싸는 쪽이 여기로 온다. 18줄 전부:

```css
    --color-ring: hsl(var(--ds-ring));
    --color-input: hsl(var(--ds-input));
    --color-border: hsl(var(--ds-border));
    --color-destructive: hsl(var(--ds-destructive));
    --color-accent-foreground: hsl(var(--ds-accent-foreground));
    --color-accent: hsl(var(--ds-accent));
    --color-muted-foreground: hsl(var(--ds-muted-foreground));
    --color-muted: hsl(var(--ds-muted));
    --color-secondary-foreground: hsl(var(--ds-secondary-foreground));
    --color-secondary: hsl(var(--ds-secondary));
    --color-primary-foreground: hsl(var(--ds-primary-foreground));
    --color-primary: hsl(var(--ds-primary));
    --color-popover-foreground: hsl(var(--ds-popover-foreground));
    --color-popover: hsl(var(--ds-popover));
    --color-card-foreground: hsl(var(--ds-card-foreground));
    --color-card: hsl(var(--ds-card));
    --color-foreground: hsl(var(--ds-foreground));
    --color-background: hsl(var(--ds-background));
```

**(나) 모서리를 곱셈에서 덧셈으로.** 지금은 `calc(var(--radius) * 0.6)`(7.2px)인데 geo-master 는 `calc(var(--radius) - 4px)`(8px)다. 네 줄을 1층 참조로 바꾼다:

```css
    --radius-sm: var(--ds-radius-sm);
    --radius-md: var(--ds-radius-md);
    --radius-lg: var(--ds-radius-lg);
    --radius-xl: var(--ds-radius-xl);
```

`--radius-2xl`·`3xl`·`4xl` 은 1층에 없다. 쓰는 곳이 있는지 본다:

```bash
grep -rn "rounded-2xl\|rounded-3xl\|rounded-4xl" src/ components/ 2>/dev/null | head
```

쓰는 곳이 없으면 세 줄을 지운다. 있으면 `calc(var(--ds-radius) * N)` 으로 남긴다.

**(다) 서체.**

```css
    --font-sans: var(--ds-font-sans);
    --font-display: var(--ds-font-display);
```

Pretendard 가 1층 스택 첫 자리라 지금과 같은 글자가 나온다 — 받아오는 곳만 CDN 에서 우리 파일로 바뀐다.

- [ ] **Step 3b: 갈라짐 검사를 빌드에 끼운다**

`package.json` `scripts` 에:

```json
"check:tokens": "node node_modules/@ryunae/design-tokens/scripts/check-consumer.mjs src/index.css"
```

그리고 `build` 앞에 붙인다: `"build": "npm run check:tokens && vite build"` (기존 build 명령 앞에).

```bash
npm run check:tokens
```

Expected: `1층 계약 이상 없음`

- [ ] **Step 4: 빌드와 검사**

```bash
npm run build && npm run typecheck 2>/dev/null || npm run build
```

Expected: 빌드 성공

- [ ] **Step 5: 육안 확인**

```bash
npm run dev
```

Expected: 모서리가 아주 조금 커진다(7.2px → 8px). 색·서체는 그대로여야 한다 — Pretendard 를 CDN 대신 우리 파일에서 받을 뿐이다.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "refactor(ui): 토큰을 @ryunae/design-tokens 에서 받는다

CDN 두 줄 제거(Google Fonts · jsdelivr) · 색 표기를 맨 삼중항으로 · 모서리를
곱셈(×0.6)에서 geo-master 의 덧셈(-4px)으로.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: client-crawling 토큰층 + 드리프트 테스트

**레포:** client-crawling · **브랜치:** `claude/design-tokens` (Task 1 에서 만든 것)

**Files:**
- Modify: `src/web/app.css:31-80` · `package.json` · `tests/web_style.test.ts`

**Interfaces:**
- Consumes: `@ryunae/design-tokens/tokens.css` · `tokens.json`
- Produces: 2층 별칭 블록. 이후 태스크(8·9·10)가 `--radius-sm`~`--radius-xl` 과 `--elevate-1/2` 를 쓴다.
- 건드리지 않음: `src/ui/tokens.css`(리포트 밝은 팔레트) · `src/report/style.css`

- [ ] **Step 1: 실패하는 드리프트 테스트를 쓴다**

`tests/web_style.test.ts` 에 추가:

```ts
import tokensJson from "../node_modules/@ryunae/design-tokens/tokens.json" with { type: "json" };

describe("공용 토큰과의 계약", () => {
  const LAYER1 = new Set((tokensJson as { names: string[] }).names.map((n) => `--ds-${n}`));

  // 2층이 hex 로 직접 정하는 이름. 1층에 없는 값들이라 여기 사는 게 맞다.
  // 새 hex 가 :root 에 생기면 이 목록에 넣을지 1층으로 올릴지 판단하게 만드는 것이 목적이다.
  const OWNED_HEX = new Set([
    "--client-bg", "--comp1-bg", "--comp2-bg", "--comp3-bg", "--comp4-bg", "--comp5-bg",
    "--ok-bg", "--warn-bg", "--bad-bg", "--tie-bg", "--danger-bg",
    "--comp5", "--tie", "--ok", "--warn", "--bad",
    "--field", "--field-line",
  ]);

  it("쓰는 --ds- 이름이 1층에 전부 있다", () => {
    // 없으면 CSS 는 에러 없이 조용히 무효가 되고 색이 사라진다.
    const used = new Set([...appCss.matchAll(/var\(\s*(--ds-[\w-]+)/g)].map((m) => m[1]!));
    const missing = [...used].filter((n) => !LAYER1.has(n));
    expect(missing, `1층에 없는 이름: ${missing.join(", ")}`).toEqual([]);
  });

  it("1층 이름을 다시 선언하지 않는다", () => {
    const redeclared = [...appCss.matchAll(/^\s*(--ds-[\w-]+)\s*:/gm)].map((m) => m[1]!);
    expect(redeclared, `다시 선언하면 값이 둘이 된다: ${redeclared.join(", ")}`).toEqual([]);
  });

  it(":root 의 hex 는 2층이 소유한다고 선언한 것뿐이다", () => {
    const root = appCss.slice(appCss.indexOf(":root"), appCss.indexOf("}", appCss.indexOf(":root")));
    const raw = [...root.matchAll(/^\s*(--[\w-]+)\s*:\s*#[0-9a-f]{3,8}\s*;/gim)].map((m) => m[1]!);
    const stray = raw.filter((n) => !OWNED_HEX.has(n));
    expect(stray, `1층에서 받아야 할 것을 hex 로 적었다: ${stray.join(", ")}`).toEqual([]);
  });

  it("업체 색은 1층의 hue 를 쓴다 — 색상이 갈라지지 않는다", () => {
    const want: [string, number][] = [
      ["--client", 1], ["--comp1", 4], ["--comp2", 3], ["--comp3", 2], ["--comp4", 5],
    ];
    for (const [name, hue] of want) {
      const re = new RegExp(`${name}:\\s*hsl\\(var\\(--ds-hue-${hue}\\)`);
      expect(appCss, `${name} 이 --ds-hue-${hue} 를 안 쓴다`).toMatch(re);
    }
  });

  it("리포트 팔레트는 건드리지 않는다", () => {
    // src/ui/tokens.css 는 리포트(A4 인쇄)가 쓰는 밝은 값이다. 여기에 --ds- 가 새어 들어가면
    // 거래처에 나가는 문서가 조용히 바뀐다.
    const light = fs.readFileSync(path.join(here, "../src/ui/tokens.css"), "utf8");
    expect(light).not.toContain("--ds-");
    expect(light).toContain("--bg: #f7f5f1;");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
pnpm vitest run tests/web_style.test.ts
```

Expected: FAIL — `Cannot find module '../node_modules/@ryunae/design-tokens/tokens.json'`

- [ ] **Step 3: 의존성을 더한다**

```bash
pnpm add "@ryunae/design-tokens@file:../lib/design-tokens"
```

태그 의존성으로는 Task 6 Step 9 에서 옮긴다 — 아직 태그가 없다.

- [ ] **Step 4: app.css 의 :root 를 2층으로 바꾼다**

18~30행 `@font-face` 두 벌은 Task 7 에서 바꾼다. 여기서는 31~80행 `:root` 블록만 바꾼다.

**이름이 겹치지 않으므로 그냥 덮어쓰면 된다.** 1층은 `--ds-` 를 쓰고 2층은 이 앱의 어휘를 쓴다. `--card`·`--muted` 가 양쪽에 있었다면 자기 참조가 되어 무효화됐을 것이다(`--muted` 는 뜻까지 달랐다 — geo 는 흐린 배경, 여기는 흐린 글자).

맨 위에 import 를 넣고:

```css
@import "@ryunae/design-tokens/tokens.css";
```

`:root` 블록을 통째로 교체한다:

```css
:root {
  /* --- 2층: 1층(@ryunae/design-tokens)의 --ds-* 에 이 앱의 어휘를 붙인다.
   *     리포트는 같은 어휘를 src/ui/tokens.css 의 밝은 값으로 쓴다 — 그래서
   *     var(--client) 를 쓰는 규칙은 한 줄도 안 고치고 팔레트만 갈린다. --- */
  --bg: hsl(var(--ds-background));
  --card: hsl(var(--ds-card));
  --ink: hsl(var(--ds-foreground));
  --muted: hsl(var(--ds-muted-foreground));
  --line: hsl(var(--ds-border));

  /* 업체 색 — hue 는 1층이 주고, 명도·채도는 어두운 배경에 맞춰 여기서 올린다.
     「바른길은 어디서나 호박색」이 규칙이지 특정 hex 가 규칙이 아니다(스펙 §2.3).
     배정도 2층이 한다 — 거래처=hue-1, 경쟁사1=hue-4(호박) 순서 고정. */
  --client: hsl(var(--ds-hue-1) 87% 73%);
  --comp1: hsl(var(--ds-hue-4) 73% 56%);
  --comp2: hsl(var(--ds-hue-3) 60% 53%);
  --comp3: hsl(var(--ds-hue-2) 78% 73%);
  --comp4: hsl(var(--ds-hue-5) 86% 70%);
  --comp5: #9aa0ad;
  --comp: var(--comp1);

  /* 어두운 짝 — 육안 검증(43c77c6)으로 맞춘 대비다. 자동 유도하지 않는다. */
  --client-bg: #1b1a38;
  --comp1-bg: #2a2114;
  --comp2-bg: #122b28;
  --comp3-bg: #251a33;
  --comp4-bg: #2f1620;
  --comp5-bg: #1d2029;
  --comp-bg: var(--comp1-bg);

  /* 상태색 — 1층에 없다(geo 는 destructive 만 갖는다). 2층이 소유한다. */
  --ok: #4ade80;
  --ok-bg: #12291c;
  --warn: #fbbf24;
  --warn-bg: #2a2110;
  --bad: #fb7185;
  --bad-bg: #2f1620;
  --tie: #8b93a7;
  --tie-bg: #1b1e29;
  --danger: var(--bad);
  --danger-bg: #2f1620;

  /* --- 앱 전용 상호작용. 44px 과 3px 은 geo 와 다르게 두는 것이다(스펙). --- */
  --focus: var(--client);
  --focus-ring: 0 0 0 3px hsl(var(--ds-hue-1) 87% 73% / 0.36);
  --hover: var(--ds-elevate-1);
  --pressed: var(--ds-elevate-2);
  --field: #171a26;
  --field-line: #2e3346;
  --touch: 44px;
}
```

`--focus-ring` 이 `rgba(139, 124, 246, 0.36)` 에서 `hsl(... / 0.36)` 이 된 것이 결정 3 의 값이다 — hex 를 rgba 로 손으로 풀던 일이 사라진다.

`--shadow-sm`·`--shadow`·`--glass`·`--glass-line`·`--radius` 는 2층에서 지운다. 1층이 `--ds-` 로 주므로 쓰는 자리를 그 이름으로 바꾼다:

```bash
cd ~/Documents/Dev/client-crawling
sed -i '' \
  -e 's/var(--shadow-sm)/var(--ds-shadow-sm)/g' \
  -e 's/var(--shadow)/var(--ds-shadow)/g' \
  -e 's/var(--glass-line)/var(--ds-glass-line)/g' \
  -e 's/var(--glass)/var(--ds-glass)/g' \
  src/web/app.css
grep -n "var(--ds-shadow\|var(--ds-glass" src/web/app.css | head
```

`var(--radius)` 는 Task 9 에서 4단 스케일로 옮기므로 여기서는 두고, 2층에 `--radius: var(--ds-radius);` 한 줄만 임시로 남긴다(Task 9 에서 지운다).

**예상되는 눈에 보이는 변화:** 업체 5색의 색상이 1층 hue 로 **3~8° 수렴한다**(실측: client 247→252 · comp1 37→40 · comp2 168→160 · comp3 273→280 · comp4 346→350). 의도된 수렴이고, 명도·채도는 그대로라 밝기는 안 변한다. Step 7 에서 육안으로 확인한다.

- [ ] **Step 5: 테스트를 돌린다**

```bash
pnpm vitest run tests/web_style.test.ts
```

Expected: PASS. 실패하면 메시지가 어떤 이름이 문제인지 말해 준다.

- [ ] **Step 6: 패키지 자산을 가져오는 스크립트를 만든다**

`pages.ts` 는 CSS 를 파일에서 읽어 `<style>` 로 인라인한다. 패키지 파일을 런타임에 `node_modules` 에서 읽지 않고, 개발·빌드 모두 레포 안 경로로 **복사해 두고** 읽는다 — 배포본(`dist/`)이 `node_modules` 에 기대지 않게 하려는 것이다.

`package.json` 에 스크립트를 더한다:

```json
"sync:assets": "mkdir -p src/ui src/web/static && cp node_modules/@ryunae/design-tokens/tokens.css src/ui/design-tokens.css"
```

**`predev`·`prebuild` 를 쓰지 않는다.** 이 레포는 pnpm 11 이고 `enable-pre-post-scripts` 의 기본값이 `false` 라 `pre*` 스크립트가 **조용히 안 돈다**(설정 확인: `pnpm config get enable-pre-post-scripts` → `undefined`). 두 스크립트에서 **명시적으로 부른다**:

```json
"dev": "pnpm run sync:assets && tsx src/index.ts",
"build": "pnpm run sync:assets && tsc -p tsconfig.json --noCheck && … && mkdir -p dist/ui && cp src/ui/tokens.css src/ui/design-tokens.css dist/ui/ && …"
```

기존 `build` 의 `cp src/ui/tokens.css dist/ui/` 를 위처럼 두 파일 복사로 넓히고, 맨 앞에 `pnpm run sync:assets &&` 를 붙인다.

그리고 `src/web/pages.ts:29-31` 의 `UI_CSS` 조립에 그 파일을 **맨 앞에** 넣는다:

```ts
const UI_CSS =
  fs.readFileSync(path.join(uiDir, "../ui/design-tokens.css"), "utf8") +
  fs.readFileSync(path.join(uiDir, "../ui/tokens.css"), "utf8") +
  fs.readFileSync(path.join(uiDir, "app.css"), "utf8");
```

순서가 중요하다 — 1층이 먼저 와야 2층의 `var(--ds-*)` 가 값을 찾는다.

`src/ui/design-tokens.css` 는 생성물이므로 `.gitignore` 에 넣는다.

- [ ] **Step 6b: 스크립트가 실제로 도는지 확인한다**

```bash
rm -f src/ui/design-tokens.css
pnpm run sync:assets && ls -la src/ui/design-tokens.css
pnpm build && ls -la dist/ui/
```

Expected: 두 경로 모두에 `design-tokens.css` 가 있다. 없으면 `sync:assets` 가 안 불린 것이다.

- [ ] **Step 7: 전체 테스트와 인쇄 검사**

```bash
pnpm test 2>&1 | tail -10 && pnpm check:print 2>&1 | tail -5
```

Expected: 전부 통과. `check:print` 초록 — 리포트가 안 바뀌었다는 증거다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "refactor(ui): 앱 토큰을 @ryunae/design-tokens 에서 받는다

25개 hex 복사본을 2층 별칭으로. 업체 색은 1층의 hue 를 받아 명도만 올린다 —
「바른길은 어디서나 호박색」이 규칙이지 특정 hex 가 규칙이 아니다.
어두운 짝 12개는 육안으로 맞춘 값이라 그대로 둔다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 9: 태그를 달고 세 소비자를 태그로 옮긴다**

소비자 셋이 다 돌아가는 것을 확인했으므로 이제 태그를 단다.

```bash
cd ~/Documents/Dev/lib/design-tokens
gh repo create ryunae/design-tokens --private --source=. --remote=origin
git push -u origin main
git tag v1.0.0 && git push origin v1.0.0
```

각 소비자의 `package.json` 에서 `file:` 경로를 태그로 바꾼다:

```
"@ryunae/design-tokens": "github:ryunae/design-tokens#v1.0.0"
```

그리고 각 레포에서 재설치 후 테스트를 다시 돌린다.

```bash
cd ~/Documents/Dev/client-crawling && pnpm install && pnpm test 2>&1 | tail -5
cd ~/Documents/Dev/app/GEO-maseuteo && pnpm install && pnpm run verify 2>&1 | tail -5
cd ~/Documents/Dev/app/review-gen && npm i && npm run build 2>&1 | tail -5
```

Expected: 셋 다 통과. `file:` 은 이 맥에서만 되는 경로다 — 태그로 옮겨야 맥북프로에서도 산다.

---

### Task 7: client-crawling 서체 교체

**레포:** client-crawling

**Files:**
- Modify: `src/web/app.css:14-30,88-100` · `package.json` · `tests/web_style.test.ts`
- Delete: `src/web/static/inter-latin.woff2` · `src/web/static/outfit-latin.woff2`

**Interfaces:**
- Consumes: Task 3 의 `fonts/*.woff2`
- 건드리지 않음: `src/report/style.css` 의 폰트 스택. 리포트는 `@font-face` 를 선언하지 않으므로 웹폰트가 안 걸린다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/web_style.test.ts` 에 추가:

```ts
it("Pretendard 를 2단으로 싣고 한글을 덮는다", () => {
  const faces = [...appCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]!);
  const pretendard = faces.filter((f) => /font-family:\s*"Pretendard"/.test(f));
  expect(pretendard.length, "Pretendard @font-face 가 둘이 아니다").toBe(2);
  expect(pretendard.some((f) => f.includes("pretendard-ks.woff2"))).toBe(true);
  expect(pretendard.some((f) => f.includes("pretendard-ext.woff2"))).toBe(true);
  for (const f of pretendard) expect(f).toContain("U+AC00-D7A3");
});

it("Inter 를 더 싣지 않는다 — Pretendard 라틴이 Inter 파생이다", () => {
  expect(appCss).not.toContain("inter-latin.woff2");
  expect(appCss).not.toMatch(/font-family:\s*"Inter"/);
});

it("리포트에는 웹폰트가 새어 들어가지 않는다 — 거래처 PDF 가 조용히 바뀌면 안 된다", () => {
  const reportCss = fs.readFileSync(path.join(here, "../src/report/style.css"), "utf8");
  expect(reportCss).not.toContain("@font-face");
  expect(reportCss).not.toContain("woff2");
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
pnpm vitest run tests/web_style.test.ts
```

Expected: FAIL — Pretendard `@font-face` 가 0개

- [ ] **Step 3: @font-face 를 바꾼다**

`src/web/app.css` 의 14~30행 주석과 `@font-face` 두 벌을 교체한다:

```css
/* 서체 — woff2 를 /static/ 에서 직접 서빙한다. CDN 금지 규칙의 뜻은 "서드파티 가용성에
   기대지 말자"이지 "시스템 폰트만 쓰자"가 아니었다. 파일은 @ryunae/design-tokens 가
   싣고 build 가 dist/web/static/ 으로 복사한다.

   한글은 2단이다 — 보통 쪽은 ks(상용 2350자, 449KB)만 받고, 거래처 이름에 상용 밖
   음절이 있는 쪽만 ext(8822자, 1317KB)를 더 받는다. 2350자만 실으면 그 이름이 깨진다. */
@font-face {
  font-family: "Pretendard";
  src: url("/static/pretendard-ks.woff2") format("woff2");
  font-weight: 45 930;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20A9, U+20AC,
    U+2122, U+2212, U+3000-303F, U+FF01-FF60, U+AC00-D7A3;
}
@font-face {
  font-family: "Pretendard";
  src: url("/static/pretendard-ext.woff2") format("woff2");
  font-weight: 45 930;
  font-display: swap;
  unicode-range: U+AC00-D7A3;
}
@font-face {
  font-family: "Outfit";
  src: url("/static/outfit-latin.woff2") format("woff2");
  font-weight: 500 800;
  font-display: swap;
}
```

- [ ] **Step 4: font-family 스택을 바꾼다**

`body` 규칙(88~100행 근처):

```css
body {
  /* Pretendard 가 한글·라틴·숫자를 모두 맡는다. Apple SD Gothic Neo 는 Pretendard 의
     두 파일도 못 덮는 글자(옛한글·한자)를 위한 폴백으로 뒤에 남는다. */
  font-family: var(--ds-font-sans), "Apple SD Gothic Neo", sans-serif;
  font-variant-numeric: tabular-nums;
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```

`h1, h2, h3` 규칙의 `font-family` 도 `var(--ds-font-display), "Apple SD Gothic Neo", sans-serif` 로.

- [ ] **Step 5: 자산 복사를 바꾼다**

`package.json` 의 `build` 에서 `cp src/web/static/*.woff2 dist/web/static/` 를 바꾼다:

```
&& cp node_modules/@ryunae/design-tokens/fonts/*.woff2 dist/web/static/
```

개발 중에도 `/static/` 이 이 파일들을 서빙해야 하므로 Task 6 의 `sync:assets` 에 더한다(`pre*` 스크립트는 pnpm 기본값에서 안 돈다):

```json
"sync:assets": "mkdir -p src/ui src/web/static && cp node_modules/@ryunae/design-tokens/tokens.css src/ui/design-tokens.css && cp node_modules/@ryunae/design-tokens/fonts/*.woff2 src/web/static/"
```

`src/web/static/*.woff2` 를 `.gitignore` 에 넣는다(생성물이 된다).

- [ ] **Step 6: 옛 파일을 지운다**

패키지에 같은 파일이 있으므로 사라지는 게 아니라 주소가 바뀌는 것이다.

```bash
git rm src/web/static/inter-latin.woff2 src/web/static/outfit-latin.woff2
```

- [ ] **Step 7: 테스트와 육안 확인**

```bash
pnpm test 2>&1 | tail -10
pnpm dev
```

브라우저에서 확인할 것: 한글이 Pretendard 로 나오는가 · 숫자 열이 흔들리지 않는가(`tabular-nums`) · **개발자 도구 Network 에서 `pretendard-ext.woff2` 가 안 받아지는가**(보통 쪽은 ks 만 받아야 한다).

- [ ] **Step 8: 리포트 PDF 가 안 바뀌었는지 확인한다**

```bash
pnpm check:print 2>&1 | tail -5
```

그리고 화면에서 「PDF 받기」를 눌러 받은 PDF 의 한글이 **전과 같은 서체**인지 본다(Apple SD Gothic Neo). 바뀌었으면 웹폰트가 리포트로 샌 것이다.

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "feat(ui): 서체를 Pretendard 로 — 한글을 웹폰트가 덮는다

Inter 를 뺀다(Pretendard 라틴이 Inter 파생). 한글은 unicode-range 2단 —
보통 쪽 449KB, 희귀 음절이 있는 쪽만 1317KB 를 더 받는다.
리포트는 @font-face 를 선언하지 않으므로 거래처 PDF 는 그대로다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 상호작용 오버레이 + 버튼 variant

**레포:** client-crawling

**Files:**
- Modify: `src/web/app.css:199-234`
- Test: `tests/web_style.test.ts`

**Interfaces:**
- Consumes: 1층의 `--elevate-1` · `--elevate-2` · `--button-outline`
- Produces: `.btn` variant 클래스 `primary` · `destructive` · `outline` · `ghost` · `link`. Task 10 의 로그인 버튼이 `primary` 를 쓴다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

지금 `button.primary` 는 hover 반응이 없다 — `button:hover`(특정도 0,1,1)와 `button.primary`(0,1,1)가 동률이고 `.primary` 가 뒤에 있어서 배경을 되받아 덮는다. 오버레이로 바꾸면 이 함정이 구조적으로 사라진다.

```ts
describe("버튼 상호작용", () => {
  it("hover 는 배경을 갈아끼우지 않고 위에 얹는다", () => {
    // 배경 교체 방식이면 variant 가 배경을 다시 덮어 반응이 사라진다(실제로 그랬다).
    expect(appCss).toMatch(/\.hover-elevate:hover[^{]*::after\s*\{[^}]*var\(--elevate-1\)/s);
    expect(appCss).toMatch(/\.active-elevate:active[^{]*::after\s*\{[^}]*var\(--elevate-2\)/s);
  });

  it("버튼 규칙이 background 를 hover 에서 직접 건드리지 않는다", () => {
    const hoverRules = [...appCss.matchAll(/(button|\.btn)[^{]*:hover[^{]*\{([^}]*)\}/g)];
    for (const [, sel, body] of hoverRules) {
      expect(body, `${sel}:hover 가 background 를 바꾼다 — variant 가 이걸 덮는다`).not.toMatch(
        /(^|\s)background(-color)?\s*:/,
      );
    }
  });

  it("variant 전부가 hover 반응을 갖는다", () => {
    for (const v of ["primary", "destructive", "outline", "ghost"]) {
      const rule = new RegExp(`\\.btn\\.${v}\\b|button\\.${v}\\b`);
      expect(appCss, `.${v} variant 가 없다`).toMatch(rule);
    }
    // 오버레이는 .btn 전부에 걸리므로 variant 별 hover 규칙이 따로 필요 없다.
    expect(appCss).toMatch(/button,\s*\.btn\s*\{[^}]*position:\s*relative/s);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
pnpm vitest run tests/web_style.test.ts -t "버튼 상호작용"
```

Expected: FAIL — `.hover-elevate` 규칙이 없다

- [ ] **Step 3: 오버레이와 variant 를 쓴다**

`src/web/app.css` 의 199~234행(버튼 블록)을 교체한다:

```css
/* 버튼 — hover/active 는 배경을 갈아끼우지 않고 ::after 로 위에 얹는다.
   예전에는 `button:hover { background }` 였는데, `button.primary { background }` 와
   특정도가 동률(0,1,1)이라 뒤에 오는 .primary 가 되받아 덮었다. 그래서 primary 버튼은
   눌러도 손에 반응이 없었다. 오버레이는 버튼 자기 배경과 무관하게 얹히므로 그 싸움이 없다. */
button,
.btn {
  position: relative;
  z-index: 0;
  box-shadow: var(--ds-shadow-sm);
  min-height: var(--touch);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid var(--ds-glass-line);
  border-radius: var(--ds-radius-md);
  background: linear-gradient(var(--ds-glass), var(--ds-glass)), var(--card);
  color: var(--ink);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}
.hover-elevate::after,
.active-elevate::after,
button::after,
.btn::after {
  content: "";
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 1;
}
.hover-elevate:hover::after,
button:hover::after,
.btn:hover::after {
  background-color: var(--ds-elevate-1);
}
.active-elevate:active::after,
button:active::after,
.btn:active::after {
  background-color: var(--ds-elevate-2);
}
button:disabled,
.btn:disabled {
  opacity: 0.5;
  pointer-events: none;
}

button.primary,
.btn.primary {
  background: var(--client);
  border-color: var(--client);
  color: hsl(var(--ds-background));
}
button.destructive,
.btn.destructive,
button.danger,
.btn.danger {
  background: var(--danger-bg);
  border-color: var(--danger);
  color: var(--danger);
}
button.outline,
.btn.outline {
  background: transparent;
  border-color: var(--ds-button-outline);
}
button.ghost,
.btn.ghost {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
button.link,
.btn.link {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  min-height: auto;
  padding: 0;
  color: var(--client);
  text-decoration: underline;
  text-underline-offset: 4px;
}
```

`.danger` 를 `.destructive` 와 같이 두는 것은 의도다 — 기존 마크업이 `.danger` 를 쓰고 있어 한 번에 다 바꾸면 이 태스크가 화면 수정까지 끌어안는다.

- [ ] **Step 4: 통과를 확인한다**

```bash
pnpm vitest run tests/web_style.test.ts
```

Expected: PASS

- [ ] **Step 5: 육안으로 확인한다**

```bash
pnpm dev
```

확인할 것: **「로그인」·「바꾸기」 같은 primary 버튼에 hover 반응이 생겼는가**(이게 이 태스크의 핵심이다) · `.danger` 버튼도 반응하는가 · 오버레이가 글자를 가리지 않는가(`pointer-events: none` 과 `z-index`).

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "fix(ui): primary 버튼에 hover 반응이 없던 것 — 배경 교체를 오버레이로

button:hover(0,1,1) 와 button.primary(0,1,1) 가 특정도 동률이라 뒤에 오는
.primary 가 배경을 되받아 덮었다. geo 방식대로 ::after 오버레이로 바꾸면
버튼 자기 배경과 무관하게 얹히므로 이 함정이 구조적으로 사라진다.
variant 를 geo 어휘(primary·destructive·outline·ghost·link)로 넓혔다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: 배지 · 모서리 · 글자 스케일

**레포:** client-crawling

**Files:**
- Modify: `src/web/app.css` (전역 — `border-radius` 9곳, `font-size` 14곳, `.badge` 블록)
- Test: `tests/web_style.test.ts`

**Interfaces:**
- Consumes: 1층의 `--radius-sm`~`--radius-xl`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```ts
describe("형태 스케일", () => {
  it("모서리는 1층의 4단이나 알약만 쓴다 — 임의 px 이 없다", () => {
    const values = [...appCss.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    const allowed = new Set([
      "var(--ds-radius-sm)", "var(--ds-radius-md)", "var(--ds-radius-lg)", "var(--ds-radius-xl)",
      "999px",   // 알약 — 배지·진행 막대
      "inherit", // 버튼 오버레이(::after)가 부모 모서리를 따른다
      "0",
      "3px",     // .legend i — 10×10px 색 점이다. 4단(8px 최소)을 주면 거의 원이 된다.
    ]);
    const stray = [...new Set(values.filter((v) => !allowed.has(v)))];
    expect(stray, `스케일 밖 모서리: ${stray.join(", ")}`).toEqual([]);
  });

  it("글자 크기에 0.5px 단위가 없다", () => {
    const sizes = [...new Set([...appCss.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => m[1]!))];
    const half = sizes.filter((v) => v.includes("."));
    expect(half, `0.5px 단위: ${half.join("px, ")}px`).toEqual([]);
  });

  it("글자 크기는 정해진 단만 쓴다", () => {
    const sizes = [...new Set([...appCss.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => m[1]!))];
    const allowed = new Set([
      "12", "13", "14", "15", "17", // 본문 5단
      "20", "24", "34",             // 제목 3단
      "26",                         // 모바일 h1 재정의
      "10",                         // .matrix td .tri — 숫자 옆 삼각형 장식이다. 글이 아니다.
    ]);
    const stray = sizes.filter((v) => !allowed.has(v));
    expect(stray, `스케일 밖 글자 크기: ${stray.join("px, ")}px`).toEqual([]);
  });
});
```

두 예외는 기계적으로 바꾸면 깨지는 자리라 근거를 적고 남긴다 — 규칙을 지키려고 화면을 망가뜨리지 않는다.

- [ ] **Step 2: 실패를 확인한다**

```bash
pnpm vitest run tests/web_style.test.ts -t "형태 스케일"
```

Expected: FAIL — 스케일 밖 모서리 `8px, 12px, 10px, 16px, calc(var(--radius) + 4px), var(--radius)`, 0.5px 단위 `11.5, 12.5`, 스케일 밖 `11, 16`

- [ ] **Step 3: 모서리를 스케일로 옮긴다**

실제 위치다(행 번호는 Task 6~8 의 수정으로 밀렸을 수 있다 — 선택자로 찾는다).

| 선택자 | 지금 | 바꿀 값 |
|---|---|---|
| `.err` | `8px` | `var(--ds-radius-sm)` |
| `nav.top a` | `8px` | `var(--ds-radius-sm)` |
| `input, select, textarea` | `var(--radius)` | `var(--ds-radius-md)` |
| `table` | `12px` | `var(--ds-radius-lg)` |
| `pre` | `10px` | `var(--ds-radius-md)` |
| `.steps li` | `10px` | `var(--ds-radius-md)` |
| `.card` | `calc(var(--radius) + 4px)` | `var(--ds-radius-xl)` |
| `.sheet` | `16px` | `var(--ds-radius-xl)` |
| `.legend i` | `3px` | **그대로** — 10×10px 색 점 |
| `input[type="checkbox"]` | `0` | **그대로** |
| 배지·막대 4곳 | `999px` | **그대로** — 알약이 맞다 |

`button, .btn` 은 Task 8 에서 이미 `var(--ds-radius-md)` 가 됐다.

다 옮긴 뒤 Task 6 에서 임시로 남긴 `--radius: var(--ds-radius);` 한 줄을 `:root` 에서 지운다.

```bash
grep -n "border-radius:\|--radius:" src/web/app.css
```

Expected: `var(--ds-radius-*)` · `999px` · `3px` · `0` · `inherit` 만 남고 `--radius:` 선언은 없다

- [ ] **Step 4: 배지를 geo 모양으로 바꾼다**

```css
/* 배지 — geo 모양. 알약이 아니라 각진 칩 + 테두리다. */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid var(--ds-badge-outline);
  border-radius: var(--ds-radius-sm);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
```

`.badge.up` · `.down` · `.flat` 의 색 규칙은 그대로 둔다. `white-space: nowrap` 은 geo 의 규칙이다 — 배지는 줄바꿈하지 않는다.

- [ ] **Step 5: 글자 크기를 스케일로 옮긴다**

| 선택자 | 지금 | 바꿀 값 |
|---|---|---|
| `.muted` | `12.5px` | `12px` |
| `th` | `12.5px` | `12px` |
| `pre` | `12.5px` | `12px` |
| `.viz .name` | `12.5px` | `12px` |
| `.legend` | `12.5px` | `12px` |
| `.badge` | `12.5px` | `12px` (Step 4 에서 이미) |
| `.viz .axis` | `11.5px` | `12px` |
| `.dl` | `11.5px` | `12px` |
| `.viz .pause` | `11px` | `12px` |
| `.stream h2` | `16px` | `17px` |
| `.matrix td .tri` | `10px` | **그대로** — 삼각형 장식 |

`12.5px` 는 6곳이다. 선택자로 확인하고 옮긴다:

```bash
grep -n "font-size: 1[0-9.]*px" src/web/app.css
```

Expected: `12 · 13 · 14 · 15 · 17` 과 제목 `20 · 24 · 26 · 34`, 그리고 `.matrix td .tri` 의 `10` 만 남는다

- [ ] **Step 6: 통과를 확인하고 전체를 돌린다**

```bash
pnpm test 2>&1 | tail -10
```

Expected: 전부 통과

- [ ] **Step 7: 육안으로 확인한다**

```bash
pnpm dev
```

확인할 것: 관리 화면의 표가 안 깨지는가(글자가 커졌다) · 배지가 각진 칩으로 보이는가 · 범례의 색 점이 여전히 점으로 보이는가.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "style(ui): 모서리 9종 → 4단 · 글자 14종 → 8단 · 배지를 geo 모양으로

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: 로그인 화면

세 프로그램 중 사람이 가장 먼저 보는 화면이다.

**레포:** client-crawling

**Files:**
- Modify: `src/web/login_pages.ts` · `src/web/app.css` (`.sheet` 블록 313-325행)
- Test: `tests/login_page.test.ts` (없으면 만든다)

**Interfaces:**
- Consumes: Task 1 의 `email` 폼 필드 · Task 8 의 `.primary` · 1층의 `--glass` · `--radius-xl`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/login_page.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { loginPage } from "../src/web/login_pages.js";

describe("로그인 화면", () => {
  it("이메일을 묻는다", () => {
    const html = loginPage();
    expect(html).toContain("이메일");
    expect(html).toContain('name="email"');
    expect(html).toContain('type="email"');
    expect(html).not.toContain("login_id");
  });

  it("계정이 있는지 알려 주지 않는다", () => {
    // 열거 방지: 아이디가 틀렸는지 비밀번호가 틀렸는지 구분해 주지 않는다.
    const html = loginPage("이메일 또는 비밀번호가 일치하지 않습니다.");
    expect(html).toContain("이메일 또는 비밀번호가 일치하지 않습니다.");
    expect(html).not.toMatch(/없는 (계정|이메일|사용자)/);
  });

  it("유리 패널을 쓴다 — geo 와 같은 첫인상", () => {
    expect(loginPage()).toContain('class="sheet glass"');
  });

  it("next 를 그대로 심지 않는다", () => {
    const html = loginPage(undefined, '"><script>alert(1)</script>');
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
pnpm vitest run tests/login_page.test.ts
```

Expected: FAIL — `class="sheet glass"` 가 없다

- [ ] **Step 3: .sheet 를 유리 패널로 바꾼다**

`src/web/app.css` 의 `.sheet` 블록:

```css
/* 가운데 한 장 — 로그인·비밀번호 변경. geo 의 glass-panel 과 같은 첫인상. */
.sheet {
  max-width: 380px;
  margin: 64px auto;
  padding: 32px;
  background: linear-gradient(var(--ds-glass), var(--ds-glass)), var(--card);
  border: 1px solid var(--ds-glass-line);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-lg);
}
.sheet.glass {
  backdrop-filter: blur(16px);
}
.sheet h1 {
  font-size: 24px;
  margin: 0 0 16px;
  background: linear-gradient(90deg, var(--ink), hsl(var(--ds-foreground) / 0.6));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

- [ ] **Step 4: login_pages.ts 를 고친다**

`loginPage` 의 `<div class="sheet">` 를 `<div class="sheet glass">` 로. `passwordPage` 도 같이. `next` 는 이미 `encodeURIComponent` 를 거치므로 그대로 둔다(테스트가 그걸 확인한다).

- [ ] **Step 5: 통과를 확인한다**

```bash
pnpm vitest run tests/login_page.test.ts && pnpm test 2>&1 | tail -5
```

Expected: 전부 통과

- [ ] **Step 6: 육안으로 확인한다**

```bash
pnpm dev
```

`/login` 을 열어 확인할 것: 유리 패널로 보이는가 · 제목 그라데이션이 읽히는가(대비) · 이메일 칸이 모바일에서 이메일 키보드를 부르는가(`type="email"`).

- [ ] **Step 7: lint · build · 전체 검사**

```bash
pnpm lint && pnpm build && pnpm test 2>&1 | tail -5 && pnpm check:print 2>&1 | tail -3
```

Expected: 전부 통과

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat(web): 로그인 화면을 유리 패널로 — geo 와 같은 첫인상

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 마무리

- [ ] 세 레포의 브랜치를 각각 검토하고 머지한다(`superpowers:finishing-a-development-branch`).
- [ ] `~/dotfiles/claude/CLAUDE.md` 의 디렉토리 지형도에 `~/Documents/Dev/lib/` 한 줄을 더한다.
- [ ] 볼트 기록: client-crawling 의 Changelog · Current State · 05. Agent Handoff · 세션 노트. 배포 구조(Cloudflare·launchd)도 같이 — 앞서 미룬 것이다.
