# design-tokens

볼트 SSOT(상태·결정·인계): `~/Documents/RyunAe/600. Developments/lib/design-tokens/` — 시작 전 `05. Agent Handoff` LIVE 확인·갱신, 끝나면 세션 노트·Changelog·LIVE(볼트 `600. Developments/CLAUDE.md` 계약. Claude Code 는 Stop 훅이 강제, Codex 는 직접 수행).
브랜치 `claude/*`·`codex/*`, main 머지는 사람(squash 금지 — 훅이 막는다). 작성자 라벨 `**작성:** [클로드코드]`/`[지피티]`. 작업본(plan·spec·런북)은 이 repo `docs/`, 확정 요약만 볼트.

## 명령
- `bash scripts/self-check.sh` — 검사기(`check-consumer.mjs`)가 실제로 잡는지
- `node scripts/consumers.mjs` — 소비자 전부가 최신 태그를 핀 했는지(각 레포 origin/main)
- `scripts/subset.sh` · `node scripts/verify-fonts.mjs` — 서체 재생성·확인

## 이 레포에서만 통하는 규칙
- **태그는 `consumers.mjs` 가 통과할 수 있을 때만 단다.** 소비자를 두고 태그만 올리면 앱마다 버전이 갈라진다 — v1.1.1 때 실제로 그랬다.
- **소비자 목록은 README 표 하나.** `consumers.mjs` 가 그 표를 읽는다. 다른 곳에 목록을 두지 않는다.
- `tokens.json` 은 생성물 — `tokens.css` 를 고치고 README 의 한 줄로 다시 만든다.
- 소비자 레포를 고칠 때는 그 레포의 볼트 LIVE 를 먼저 본다. 다른 세션이 쓰는 중이면 `git worktree` 로(2026-09-30 review-gen ERR-006).
