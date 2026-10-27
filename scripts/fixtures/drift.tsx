// 갈라짐 경고 시험용 — 세 가지가 모두 경고로 나와야 하고, 종료 코드는 0 이어야 한다.
export const a = <div className="transition-colors duration-200" />;
export const b = <p className="text-xs text-white/40">흐린 글자</p>;
export const c = <button className="bg-destructive text-destructive-foreground">삭제</button>;
// 주석 줄의 duration-300 · text-white/20 은 경고하지 않는다.
export const ok = <button className="bg-destructive/10 text-destructive border-destructive">보관</button>;
