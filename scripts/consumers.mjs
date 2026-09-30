#!/usr/bin/env node
// 소비자 전부가 최신 태그를 핀 했는지 본다. 태그를 달기 전에, 그리고 달고 나서 돌린다.
//   node scripts/consumers.mjs
//
// 「판올림 태그는 소비자 표의 전부를 고친 뒤에만」이 README 에 있었는데도 v1.1.1 이
// review-gen(v1.0.3)·GEO(v1.1.0) 를 두고 달렸다(2026-09-30 실측). 읽어야 지켜지는 규칙은
// 깨지므로 눈에 보이는 검사로 바꾼다.
//
// 소비자 목록은 README 표 하나뿐이다 — 여기에 따로 두면 그 둘이 또 갈라진다.
// 각 레포는 로컬 작업 폴더가 아니라 origin/main 을 본다. 작업 폴더는 다른 세션이 다른
// 브랜치로 쓰고 있거나 뒤처져 있을 수 있다(GEO 로컬이 origin 보다 뒤였다).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();
const latest = git(root, "tag", "--sort=-v:refname").split("\n")[0];

// | 레포 | `~/경로` | `package.json 상대경로` | ... |
const rows = fs
  .readFileSync(path.join(root, "README.md"), "utf8")
  .split("\n")
  .map((l) => [...l.matchAll(/`([^`]+)`/g)].map((m) => m[1]))
  .filter((cells) => cells[0]?.startsWith("~/") && cells[1]?.endsWith("package.json"));

let bad = 0;
for (const [dir, pkg] of rows) {
  const repo = dir.replace("~", os.homedir());
  let pin;
  try {
    git(repo, "fetch", "-q", "origin");
    const deps = JSON.parse(git(repo, "show", `origin/main:${pkg}`)).dependencies ?? {};
    pin = deps["@ryunae/design-tokens"]?.split("#")[1] ?? "(의존성 없음)";
  } catch (e) {
    pin = `(읽기 실패: ${e.message.split("\n")[0]})`;
  }
  const ok = pin === latest;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${dir}  ${pin}${ok ? "" : ` → ${latest}`}`);
}
if (rows.length === 0) {
  console.log("FAIL: README 소비자 표를 못 읽었다");
  bad++;
}
process.exit(bad ? 1 : 0);
