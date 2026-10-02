#!/usr/bin/env node
// unicode-range 선언이 파일 내용과 어긋나면 글자가 조용히 폴백으로 떨어진다.
// 「돌려 보니 되더라」가 아니라 계약이라 검사한다.
import { execFileSync } from "node:child_process";
const out = execFileSync("uvx", ["--quiet", "--from", "fonttools", "--with", "brotli", "python", "-c", `
from fontTools.ttLib import TTFont
import json, sys, pathlib
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
  # 인쇄용 정적 판: Typst 는 가변 글꼴을 못 써서(굵기가 전부 한 굵기로 찍힌다) 정적이어야 한다.
  "print": {p.name: {
      "fvar": "fvar" in (t := TTFont(p)),
      "family": t["name"].getDebugName(1), "typo": t["name"].getDebugName(16),
      "sub": t["name"].getDebugName(17) or t["name"].getDebugName(2),
      "weight": t["OS/2"].usWeightClass,
      "hangul": len(set(t.getBestCmap()) & syl),
      "varnames": [n.nameID for n in t["name"].names if n.nameID in (21, 22, 25)],
    } for p in sorted(pathlib.Path("fonts/print").glob("*.ttf"))},
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
// 인쇄용 정적 TTF — 이름·굵기가 어긋나면 Typst 가 조용히 다른 굵기·시스템 글꼴을 쓴다.
const WEIGHTS = { 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold" };
for (const [fam, file, hangul] of [["PA Sans", "PASans", 11172], ["PA Display", "PADisplay", 0]]) {
  for (const [w, sub] of Object.entries(WEIGHTS)) {
    const name = `${file}-${sub}.ttf`, p = r.print[name];
    if (!p) { checks.push([false, `인쇄용 ${name} 이 없다 — node scripts/build-print-fonts.mjs`]); continue; }
    checks.push(
      [!p.fvar && p.varnames.length === 0, `${name} 이 아직 가변 글꼴이다(fvar 또는 name 21/22/25)`],
      [p.family === fam && (p.typo ?? fam) === fam, `${name} 패밀리 이름이 ${fam} 가 아니다 (${p.family}/${p.typo})`],
      [p.sub === sub, `${name} 스타일 이름이 ${sub} 가 아니다 (${p.sub})`],
      [p.weight === Number(w), `${name} 굵기 클래스가 ${w} 가 아니다 (${p.weight})`],
      [!/pretendard|outfit/i.test(`${p.family} ${p.typo} ${name}`), `${name} 이 원래 이름(예약 이름)을 쓴다 — OFL 3항`],
      [p.hangul === hangul, `${name} 한글이 ${hangul}자가 아니다 (${p.hangul})`],
    );
  }
}
const extra = Object.keys(r.print).length - 10;
checks.push([extra <= 0, `fonts/print 에 모르는 파일이 ${extra}개 있다`]);
let bad = 0;
for (const [ok, msg] of checks) if (!ok) { console.error("FAIL:", msg); bad++; }
console.log(bad ? `${bad}건 걸림` : `통과 — ks ${r.ks_hangul}자 · ext ${r.ext_hangul}자 · 겹침 0 · tnum · wght 45-930 · 인쇄용 정적 10벌`);
process.exit(bad ? 1 : 0);
