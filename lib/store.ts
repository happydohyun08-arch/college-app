"use client";
// 학생 자료는 이 브라우저의 localStorage에만 저장한다. 서버로 보내지 않는다.
import { useEffect, useState } from "react";

export type Test = { id: string; type: string; subject: string; score: string; date: string };
export type Activity = { id: string; kind: "활동" | "수상"; name: string; role: string; grades: string; hours: string; desc: string };
export type MySchool = { id: number; round: string; deadline: string; status: string; memo: string };
export type Criterion = { name: string; score: number; quote: string; quoteFound: boolean; reason: string; fix: string };
export type EvalResult = { total: number; summary: string; criteria: Criterion[]; safety: string; injectionFlags: string[] };
export type Essay = {
  id: string; type: "ps" | "supp"; school: string; question: string; text: string; limit: string;
  result?: EvalResult; evaluatedAt?: string;
};
export type Data = {
  gpa: string; tests: Test[]; acts: Activity[]; schools: MySchool[]; essays: Essay[];
  age14: boolean | null; // 만 14세 이상인지 (AI 평가에만 씀)
};

const KEY = "college-app-v1";
export const empty: Data = { gpa: "", tests: [], acts: [], schools: [], essays: [], age14: null };
export const newId = () => crypto.randomUUID();

function isData(x: unknown): x is Data {
  const d = x as Data;
  return !!d && typeof d === "object" && ["tests", "acts", "schools", "essays"].every((k) => Array.isArray(d[k as keyof Data]));
}

export function load(): Data {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return isData(d) ? { ...empty, ...d } : empty;
  } catch {
    return empty;
  }
}

/** 페이지에서 쓰는 저장소. 바뀔 때마다 localStorage에 바로 저장한다. */
export function useData(): [Data, (f: (d: Data) => Data) => void, boolean] {
  const [data, setData] = useState<Data>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => { setData(load()); setReady(true); }, []);
  const update = (f: (d: Data) => Data) =>
    setData((d) => {
      const next = f(d);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { alert("브라우저에 저장하지 못했어요. 내보내기로 백업해 주세요."); }
      return next;
    });
  return [data, update, ready];
}

export function exportFile() {
  const blob = new Blob([JSON.stringify(load(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `college-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importFile(file: File) {
  let d: unknown;
  try { d = JSON.parse(await file.text()); } catch { return alert("JSON 파일이 아니에요."); }
  if (!isData(d)) return alert("이 사이트에서 내보낸 백업 파일이 아니에요.");
  if (!confirm("지금 브라우저의 자료를 이 파일 내용으로 바꿀까요? (지금 자료는 사라져요)")) return;
  localStorage.setItem(KEY, JSON.stringify({ ...empty, ...d }));
  location.reload();
}

/** 학생 최고 SAT/ACT 점수 */
export function bestScores(d: Data) {
  const best = (t: string) => Math.max(0, ...d.tests.filter((x) => x.type === t).map((x) => Number(x.score) || 0)) || null;
  return { sat: best("SAT"), act: best("ACT") };
}
