/** 엑셀에서 한글이 깨지지 않도록 BOM을 붙인 CSV 문자열 */
export function toCsv(header: string[], rows: (string | number | undefined | null)[][]): string {
  const cell = (v: string | number | undefined | null) => {
    const text = v == null ? "" : String(v);
    // 수식으로 해석되는 값(=, +, -, @ 시작)은 앞에 '를 붙여 그대로 보이게 한다.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
