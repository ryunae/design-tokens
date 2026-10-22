# design-tokens

볼트 SSOT(상태·결정·인계): `~/Documents/RyunAe/600. Developments/lib/design-tokens/` — 시작 전 `05. Agent Handoff` LIVE 확인·갱신, 끝나면 세션 노트·Changelog·LIVE(볼트 `600. Developments/CLAUDE.md` 계약. Claude Code 는 Stop 훅이 강제, Codex 는 직접 수행).
브랜치 `claude/*`·`codex/*`, main 머지는 사람(squash 금지 — 훅이 막는다). 작성자 라벨 `**작성:** [클로드코드]`/`[지피티]`. 작업본(plan·spec·런북)은 이 repo `docs/`, 확정 요약만 볼트.

## 명령
- `bash scripts/self-check.sh` — 검사기(`check-consumer.mjs`)가 실제로 잡는지
- `node scripts/consumers.mjs` — 소비자 전부가 최신 태그를 핀 했는지(각 레포 origin/main)
- `scripts/subset.sh` · `node scripts/verify-fonts.mjs` — 서체 재생성·확인

## 이 레포에서만 통하는 규칙
- **태그는 달기 전에 사용자에게 한 번 확인받는다(2026-10-22).** 확인받은 뒤엔: **태그를 달았으면 같은 작업 안에서 소비자 전부를 올리고 `consumers.mjs` 전부 ok 를 본 뒤 끝낸다.** 태그만 달고 멈추면 앱마다 버전이 갈라진다 — v1.1.1·v1.2.2 때 실제로 그랬다. (태그 push 를 훅으로 막지 않는다 — 소비자는 태그가 있어야 올릴 수 있어 교착이다.)
- **소비자 목록은 README 표 하나.** `consumers.mjs` 가 그 표를 읽는다. 다른 곳에 목록을 두지 않는다.
- `tokens.json` 은 생성물 — `tokens.css` 를 고치고 README 의 한 줄로 다시 만든다.
- 소비자 레포를 고칠 때는 그 레포의 볼트 LIVE 를 먼저 본다. 다른 세션이 쓰는 중이면 `git worktree` 로(2026-09-30 review-gen ERR-006).

## 멈춤 규칙 — 이 저장소 (2026-10-22)
- 공통 멈춤 규칙(고치기 2번·멈추고 묻기·완료 보고)은 전역 `~/.claude/CLAUDE.md`(Codex 는 `~/.codex/AGENTS.md`) 「멈춤 규칙」을 따른다. 완료 보고에 붙일 이 저장소 검사: 테스트 없음 — `bash scripts/self-check.sh` · `node scripts/consumers.mjs` 출력을 붙인다.
