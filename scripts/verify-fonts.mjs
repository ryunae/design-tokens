#!/usr/bin/env node
// unicode-range 선언이 파일 내용과 어긋나면 글자가 조용히 폴백으로 떨어진다.
// 「돌려 보니 되더라」가 아니라 계약이라 검사한다.
import { execFileSync } from "node:child_process";
const out = execFileSync("uvx", ["--quiet", "--from", "fonttools", "--with", "brotli", "python", "-c", `
from fontTools.ttLib import TTFont
import json, sys
ks  = set(TTFont("fonts/pretendard-ks.woff2").getBestCmap())
ext = set(TTFont("fonts/pretendard-ext.woff2").getBestCmap())
syl = set(range(0xAC00, 0xD7A4))
f = TTFont("fonts/pretendard-ks.woff2")
feats = sorted({fr.FeatureTag for t in ("GSUB","GPOS") if t in f for fr in f[t].table.FeatureList.FeatureRecord})
print(json.dumps({
  "ks_hangul": len(ks & syl), "ext_hangul": len(ext & syl),
  "covers_all": sorted((ks | ext) & syl) == sorted(syl),
  "overlap": len(ks & ext & syl),
  "ks_latin": 0x41 in ks and 0x30 in ks,
  "tnum": "tnum" in feats,
  "axes": [[a.axisTag, a.minValue, a.maxValue] for a in f["fvar"].axes],
}))
`], { encoding: "utf8" });
const r = JSON.parse(out.trim().split("\n").pop());
const checks = [
  [r.ks_hangul === 2350, `ks 한글이 2350자가 아니다 (${r.ks_hangul})`],
  [r.ext_hangul === 8822, `ext 한글이 8822자가 아니다 (${r.ext_hangul})`],
  [r.covers_all, "둘을 합쳐도 현대 한글이 다 안 된다 — 거래처 이름이 깨진다"],
  [r.overlap === 0, `두 파일이 ${r.overlap}자 겹친다 — 안 받아도 될 파일을 받게 된다`],
  [r.ks_latin, "ks 에 라틴·숫자가 없다"],
  [r.tnum, "tabular-nums 가 빠졌다 — 숫자 열이 흔들린다"],
  [JSON.stringify(r.axes) === '[["wght",45,930]]', `가변 축이 다르다 ${JSON.stringify(r.axes)}`],
];
let bad = 0;
for (const [ok, msg] of checks) if (!ok) { console.error("FAIL:", msg); bad++; }
console.log(bad ? `${bad}건 걸림` : `통과 — ks ${r.ks_hangul}자 · ext ${r.ext_hangul}자 · 겹침 0 · tnum · wght 45-930`);
process.exit(bad ? 1 : 0);
