"use client";
import { useState } from "react";
import { useData, bestScores, type MySchool } from "@/lib/store";
import { classify } from "@/lib/classify.mjs";
import data from "@/data/schools.json";

type School = (typeof data.schools)[number];
const byId = new Map<number, School>(data.schools.map((s) => [s.id, s]));
const pct = (r: number | null) => (r == null ? "–" : `${(r * 100).toFixed(1)}%`);
const range = (a: number | null, b: number | null) => (a && b ? `${a}–${b}` : "–");
const dday = (date: string) => {
  if (!date) return "";
  const n = Math.ceil((new Date(date + "T23:59:59").getTime() - Date.now()) / 86400000);
  return n < 0 ? "마감 지남" : n === 0 ? "D-day" : `D-${n}`;
};

export default function Schools() {
  const [d, update] = useData();
  const [q, setQ] = useState("");
  const me = bestScores(d);
  const mine = new Set(d.schools.map((s) => s.id));
  const set = (id: number, k: keyof MySchool, v: string) =>
    update((d) => ({ ...d, schools: d.schools.map((s) => (s.id === id ? { ...s, [k]: v } : s)) }));

  const Tag = ({ s }: { s: School }) => {
    const c = classify(s, me);
    return <span className={`tag ${c.label}`} title={c.why}>{c.label}</span>;
  };

  return (
    <>
      <h1>학교</h1>
      <div className="note">
        <b>참고용이에요.</b> 이 분류는 시험 점수와 합격률만 비교한 것이에요. 실제 입시는 에세이·활동·추천서·전공·지원 시기처럼
        성적 외 요소가 커서 결과가 다를 수 있어요. 태그에 마우스를 올리면 이유가 보여요.
      </div>
      <p className="muted">
        내 점수: SAT {me.sat ?? "없음"} · ACT {me.act ?? "없음"} (내 정보에서 입력) · 자료 출처: 각 학교 행의 링크
        (미국 교육부 College Scorecard, 받은 날 {data.fetchedAt}). SAT 구간은 영역별 25/75%를 더한 근사값이에요.
      </p>

      <h2>내 지원 목록</h2>
      {d.schools.length === 0 && <p className="muted">아래 표에서 학교를 추가하세요.</p>}
      <div className="wide">
        <table>
          <tbody>
            {[...d.schools].sort((a, b) => (a.deadline || "9").localeCompare(b.deadline || "9")).map((m) => {
              const s = byId.get(m.id);
              if (!s) return null;
              return (
                <tr key={m.id}>
                  <td><b>{s.name}</b> <Tag s={s} /></td>
                  <td>
                    <select value={m.round} onChange={(e) => set(m.id, "round", e.target.value)} aria-label="전형">
                      {["RD", "EA", "ED", "ED2", "REA", "Rolling"].map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </td>
                  <td><input type="date" value={m.deadline} onChange={(e) => set(m.id, "deadline", e.target.value)} aria-label="마감일" /> <b>{dday(m.deadline)}</b></td>
                  <td>
                    <select value={m.status} onChange={(e) => set(m.id, "status", e.target.value)} aria-label="상태">
                      {["준비 중", "에세이 완료", "제출함", "합격", "불합격", "대기"].map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </td>
                  <td><input placeholder="메모 (추천서, 서류 등)" value={m.memo} onChange={(e) => set(m.id, "memo", e.target.value)} aria-label="메모" /></td>
                  <td><button onClick={() => update((d) => ({ ...d, schools: d.schools.filter((x) => x.id !== m.id) }))}>삭제</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">마감일은 학교 공식 사이트에서 꼭 다시 확인하세요.</p>

      <h2>학교 찾기 ({data.schools.length}개)</h2>
      <input placeholder="학교 이름 검색" value={q} onChange={(e) => setQ(e.target.value)} aria-label="학교 검색" />
      <div className="wide">
        <table>
          <thead>
            <tr><th>학교</th><th>분류</th><th>합격률</th><th>SAT 중간 50%</th><th>ACT 중간 50%</th><th>출처·연도</th><th /></tr>
          </thead>
          <tbody>
            {data.schools.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).map((s) => (
              <tr key={s.id}>
                <td>{s.name} <span className="muted">{s.state}</span></td>
                <td><Tag s={s} /></td>
                <td>{pct(s.admitRate)}</td>
                <td>{range(s.sat25, s.sat75)}</td>
                <td>{range(s.act25, s.act75)}</td>
                <td><a href={s.sourceUrl} target="_blank" rel="noreferrer">Scorecard</a> <span className="muted">{s.year}</span></td>
                <td>
                  <button disabled={mine.has(s.id)} onClick={() => update((d) => ({ ...d, schools: [...d.schools, { id: s.id, round: "RD", deadline: "", status: "준비 중", memo: "" }] }))}>
                    {mine.has(s.id) ? "추가됨" : "+ 추가"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">합격자 GPA는 이 자료에 없어요. 각 학교 Common Data Set(검색: &quot;학교이름 Common Data Set&quot;) C12 항목에서 확인할 수 있어요.</p>
    </>
  );
}
