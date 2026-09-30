#!/usr/bin/env bash
# Pretendard 를 unicode-range 2단으로 나눈다. 서체를 판올림할 때만 돈다.
#   ks  — KS X 1001 상용 2350자 + 라틴 + 구두점 (~449 KB, 사실상 모든 쪽이 받는다)
#   ext — 나머지 현대 한글 8,822자 (~1,317 KB, 그 쪽에 희귀 음절이 있을 때만)
#
# 왜 2단인가: 전체판은 2.0MB 라 매 쪽에 지우기 아깝고, 상용 2350자만 실으면
# **거래처 이름의 희귀 음절이 깨진다** — 업체 이름을 띄우는 앱에서 못 쓸 방식이다.
# 공식 릴리스의 PretendardStd 는 서브셋 판본이 아니다(실측: 한글 0자, 라틴·키릴 전용).
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=.src/web/variable/woff2/PretendardVariable.woff2
[ -f "$SRC" ] || { echo "원본이 없다. 먼저 받아라:"; echo "  mkdir -p .src && cd .src && curl -sL -o pretendard.zip https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip && unzip -o pretendard.zip 'web/variable/woff2/PretendardVariable.woff2' LICENSE.txt"; exit 1; }
COMMON="U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20A9,U+20AC,U+2122,U+2212,U+3000-303F,U+FF01-FF60"

python3 - <<'PY'
# KS X 1001 상용 한글 = EUC-KR 선행 0xB0-0xC8 × 후행 0xA1-0xFE. 정확히 2350자다.
ks = []
for lead in range(0xB0, 0xC9):
    for trail in range(0xA1, 0xFF):
        try:
            ks.append(ord(bytes([lead, trail]).decode("euc-kr")))
        except Exception:
            pass
ks = sorted(c for c in ks if 0xAC00 <= c <= 0xD7A3)
assert len(ks) == 2350, len(ks)
rest = [c for c in range(0xAC00, 0xD7A4) if c not in set(ks)]
open(".src/ks.txt", "w").write(",".join("U+%04X" % c for c in ks))
open(".src/ext.txt", "w").write(",".join("U+%04X" % c for c in rest))
print("ks", len(ks), "· ext", len(rest))
PY

uvx --quiet --from fonttools --with brotli pyftsubset "$SRC" \
  --unicodes="$COMMON,$(cat .src/ks.txt)" --layout-features='*' \
  --flavor=woff2 --output-file=fonts/pretendard-ks.woff2
uvx --quiet --from fonttools --with brotli pyftsubset "$SRC" \
  --unicodes="$(cat .src/ext.txt)" --layout-features='*' \
  --flavor=woff2 --output-file=fonts/pretendard-ext.woff2
ls -la fonts/
