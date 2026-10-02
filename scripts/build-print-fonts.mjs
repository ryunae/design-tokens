#!/usr/bin/env node
// 인쇄용(PDF·Typst) 정적 TTF 를 만든다. 서체를 판올림할 때만 돈다 — 생성물은 커밋한다.
//
// 왜 따로 만드나: Typst 0.14 는 가변 글꼴을 못 쓴다(굵기 400~800 이 전부 한 굵기로 찍힌다)
// 그리고 woff2 를 못 읽는다. 그래서 굵기별 정적 TTF 가 필요하다.
// 왜 Pretendard 를 ks/ext 로 나누지 않나: 나눈 건 웹에서 덜 받으려는 것이다. PDF 는 쓴 글자만
// 서브셋으로 담으므로 나눌 이유가 없고, 한 패밀리면 Typst 쪽 폴백 목록도 필요 없다.
// 왜 이름을 바꾸나: OFL 의 예약 이름(Pretendard)을 변형본이 그대로 쓰면 안 되고, 이 맥처럼
// 시스템에 Pretendard 가 깔려 있으면 Typst 가 조용히 시스템 것을 쓴다 — 고유 이름이면 없을 때 경고가 난다.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

process.chdir(fileURLToPath(new URL("..", import.meta.url)));
const SRC = ".src/web/variable/woff2/PretendardVariable.woff2";
if (!existsSync(SRC)) {
  console.error("원본이 없다. scripts/subset.sh 맨 위의 받는 명령으로 .src 를 먼저 채워라.");
  process.exit(1);
}
execFileSync("uvx", ["--quiet", "--from", "fonttools", "--with", "brotli", "python", "-c", `
import pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
out = pathlib.Path("fonts/print"); out.mkdir(parents=True, exist_ok=True)
for old in out.glob("*.ttf"): old.unlink()
WEIGHTS = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}
for src, fam, ps in [("${SRC}", "PA Pretendard", "PAPretendard"), ("fonts/outfit-latin.woff2", "PA Outfit", "PAOutfit")]:
  for w, sub in WEIGHTS.items():
    f = instantiateVariableFont(TTFont(src), {"wght": w})
    f.flavor = None                      # woff2 → TTF
    f.recalcTimestamp = False            # 다시 돌려도 같은 바이트(소비자 diff 가 조용하게)
    f["OS/2"].usWeightClass = w
    if "STAT" in f: del f["STAT"]       # 정적 판엔 필요 없고, 아래에서 지우는 256+ 이름을 가리킨다
    name = f["name"]
    # 가변 흔적(21/22/25)과 fvar·STAT 이 남긴 256+ 이름은 지운다 — 원래 이름이 새어 나오지 않게.
    name.names = [n for n in name.names if n.nameID < 256 and n.nameID not in (21, 22, 25)]
    for nid, val in {1: fam, 2: "Regular", 3: f"{ps}-{sub}", 4: f"{fam} {sub}", 6: f"{ps}-{sub}", 16: fam, 17: sub}.items():
      name.setName(val, nid, 3, 1, 0x409)
      name.setName(val, nid, 1, 0, 0)
    name.names = [n for n in name.names if not (n.nameID in (1, 2, 3, 4, 6, 16, 17) and n.langID not in (0x409, 0))]
    f.save(out / f"{ps}-{sub}.ttf")
`], { stdio: "inherit" });
execFileSync("ls", ["-la", "fonts/print"], { stdio: "inherit" });
