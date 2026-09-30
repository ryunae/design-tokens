#!/usr/bin/env node
// 소비자 CSS 가 1층과 어긋나지 않는지 본다. 인자는 검사할 .css 파일들.
//   node check-consumer.mjs src/index.css
//
// 두 가지가 조용한 실패다:
//   ① 1층 이름을 다시 선언하면 값이 둘이 되고, 그 순간부터 갈라진다 — 이 패키지가
//      없애려는 바로 그것이다.
//   ② 1층에 없는 --ds-* 를 참조하면 CSS 는 에러 없이 그 속성을 무효로 만든다. 색이
//      사라지는데 아무도 모른다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { names } = JSON.parse(fs.readFileSync(path.join(here, "../tokens.json"), "utf8"));
const layer1 = new Set(names.map((n) => `--ds-${n}`));
let bad = 0;

for (const file of process.argv.slice(2)) {
  const css = fs.readFileSync(file, "utf8");
  const redeclared = [...css.matchAll(/^\s*(--ds-[\w-]+)\s*:/gm)].map((m) => m[1]);
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
