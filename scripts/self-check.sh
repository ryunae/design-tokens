#!/usr/bin/env bash
# check-consumer.mjs 가 실제로 두 가지를 잡는지 본다. 잡지 못하면 그 검사기는 장식이다.
set -uo pipefail
cd "$(dirname "$0")"
fail=0
run() { node check-consumer.mjs "fixtures/$1" >/dev/null 2>&1; echo $?; }
[ "$(run good.css)" = "0" ]       || { echo "FAIL: 정상 CSS 를 거절했다"; fail=1; }
[ "$(run redeclared.css)" = "1" ] || { echo "FAIL: 1층 재선언을 못 잡았다"; fail=1; }
[ "$(run unknown.css)" = "1" ]    || { echo "FAIL: 없는 이름 참조를 못 잡았다"; fail=1; }
[ "$(run unprefixed.css)" = "1" ] || { echo "FAIL: 접두어 없는 옛 이름을 못 잡았다"; fail=1; }
[ "$(run dangling.tsx)" = "1" ]   || { echo "FAIL: .tsx 안의 옛 이름을 못 잡았다"; fail=1; }
# 한 소비자의 CSS 가 정의하고 .tsx 가 쓰는 것은 정상이다 — 파일별로 따로 보면 오탐이 난다.
node check-consumer.mjs fixtures/defines.css fixtures/uses.tsx >/dev/null 2>&1 \
  || { echo "FAIL: 다른 파일의 정의를 못 본다(오탐)"; fail=1; }
# 주석의 var(--ds-*) 같은 와일드카드 표기는 참조가 아니라 설명이다.
[ "$(run prose.ts)" = "0" ]       || { echo "FAIL: 주석의 와일드카드를 참조로 읽는다(오탐)"; fail=1; }
# 갈라짐 경고(D-008): 세 가지를 경고하되 실패로 만들지 않는다. 주석 줄과 테두리형 빨강은 경고하지 않는다.
out=$(node check-consumer.mjs fixtures/drift.tsx 2>&1); code=$?
[ "$code" = "0" ] || { echo "FAIL: 경고가 종료 코드를 바꿨다"; fail=1; }
[ "$(printf '%s\n' "$out" | grep -c '^경고 fixtures')" = "3" ] || { echo "FAIL: 갈라짐 경고가 3건이 아니다"; printf '%s\n' "$out"; fail=1; }
[ -z "$(node check-consumer.mjs fixtures/good.css 2>&1 | grep '^경고')" ] || { echo "FAIL: 정상 CSS 에 경고"; fail=1; }
[ $fail = 0 ] && echo "self-check 통과"
exit $fail
