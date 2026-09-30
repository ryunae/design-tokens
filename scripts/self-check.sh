#!/usr/bin/env bash
# check-consumer.mjs 가 실제로 두 가지를 잡는지 본다. 잡지 못하면 그 검사기는 장식이다.
set -uo pipefail
cd "$(dirname "$0")"
fail=0
run() { node check-consumer.mjs "fixtures/$1" >/dev/null 2>&1; echo $?; }
[ "$(run good.css)" = "0" ]       || { echo "FAIL: 정상 CSS 를 거절했다"; fail=1; }
[ "$(run redeclared.css)" = "1" ] || { echo "FAIL: 1층 재선언을 못 잡았다"; fail=1; }
[ "$(run unknown.css)" = "1" ]    || { echo "FAIL: 없는 이름 참조를 못 잡았다"; fail=1; }
[ $fail = 0 ] && echo "self-check 통과"
exit $fail
