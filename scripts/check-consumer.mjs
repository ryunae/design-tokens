#!/usr/bin/env node
// 소비자 CSS 가 1층과 어긋나지 않는지 본다. 인자는 검사할 .css 파일들.
//   node check-consumer.mjs src/index.css
//
// 두 가지가 조용한 실패다:
//   ① 1층 이름을 다시 선언하면 값이 둘이 되고, 그 순간부터 갈라진다 — 이 패키지가
//      없애려는 바로 그것이다.
//   ② 1층에 없는 --ds-* 를 참조하면 CSS 는 에러 없이 그 속성을 무효로 만든다. 색이
//      사라지는데 아무도 모른다.
//   ③ 이 파일이 정의하지도 않고 1층에도 없는 이름을 참조하는 것 — 옮기다 흘린 옛 이름
//      (--background) 이나 이름이 바뀐 것(--app-font-display → --ds-font-display).
//      ②와 결과는 같은데 --ds- 만 보면 안 걸린다. 실제로 geo-master 를 옮길 때
//      @layer base 의 두 줄이 이렇게 남았다(실측: 매달린 참조 2, 오탐 0).
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
  // 이 파일이 스스로 정의한 이름은 2층이므로 통과시킨다. 정의도 없고 1층에도 없으면
  // 어디에서도 값이 오지 않는다 — Tailwind 가 만드는 이름(--tw-*, --color-* 등)은
  // 이 파일 안에서 @theme 이 선언하므로 defined 에 들어가 여기 안 걸린다.
  const defined = new Set([...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]));
  const dangling = [...css.matchAll(/var\(\s*(--[\w-]+)/g)]
    .map((m) => m[1])
    .filter((n) => !defined.has(n) && !layer1.has(n) && !n.startsWith("--tw-"));
  for (const n of new Set(dangling)) {
    const guess = layer1.has(`--ds-${n.slice(2)}`) ? ` — --ds-${n.slice(2)} 를 뜻한 것 같다` : "";
    console.error(`${file}: ${n} 은 어디에도 정의가 없다 — var() 가 조용히 무효가 된다${guess}`);
    bad++;
  }
}
console.log(bad ? `${bad}건 걸림` : "1층 계약 이상 없음");
process.exit(bad ? 1 : 0);
