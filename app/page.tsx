"use client";
import { useData, newId, type Test, type Activity } from "@/lib/store";

const TEST_TYPES = ["SAT", "ACT", "AP", "TOEFL", "IELTS", "Duolingo", "기타"];

export default function Profile() {
  const [d, update] = useData();
  const setTest = (id: string, k: keyof Test, v: string) =>
    update((d) => ({ ...d, tests: d.tests.map((t) => (t.id === id ? { ...t, [k]: v } : t)) }));
  const setAct = (id: string, k: keyof Activity, v: string) =>
    update((d) => ({ ...d, acts: d.acts.map((a) => (a.id === id ? { ...a, [k]: v } : a)) }));

  return (
    <>
      <h1>내 정보</h1>
      <p className="muted">이름·학교·연락처는 받지 않아요. 입력한 내용은 이 브라우저에만 저장돼요.</p>

      <h2>GPA</h2>
      <div className="row">
        <input placeholder="예: 3.85 / 4.0 (unweighted)" value={d.gpa} onChange={(e) => update((d) => ({ ...d, gpa: e.target.value }))} />
      </div>

      <h2>시험 점수</h2>
      {d.tests.map((t) => (
        <div className="row" key={t.id}>
          <select value={t.type} onChange={(e) => setTest(t.id, "type", e.target.value)} aria-label="시험 종류">
            {TEST_TYPES.map((x) => <option key={x}>{x}</option>)}
          </select>
          <input placeholder="과목 (AP 등)" value={t.subject} onChange={(e) => setTest(t.id, "subject", e.target.value)} aria-label="과목" />
          <input placeholder="점수" inputMode="numeric" size={6} value={t.score} onChange={(e) => setTest(t.id, "score", e.target.value)} aria-label="점수" />
          <input type="month" value={t.date} onChange={(e) => setTest(t.id, "date", e.target.value)} aria-label="응시 월" />
          <button onClick={() => update((d) => ({ ...d, tests: d.tests.filter((x) => x.id !== t.id) }))}>삭제</button>
        </div>
      ))}
      <button onClick={() => update((d) => ({ ...d, tests: [...d.tests, { id: newId(), type: "SAT", subject: "", score: "", date: "" }] }))}>+ 시험 추가</button>
      <p className="muted">SAT는 총점(400–1600), ACT는 종합 점수(1–36)를 넣으면 학교 분류에 쓰여요.</p>

      <h2>활동·수상</h2>
      {d.acts.map((a) => (
        <div className="card" key={a.id}>
          <div className="row">
            <select value={a.kind} onChange={(e) => setAct(a.id, "kind", e.target.value)} aria-label="종류">
              <option>활동</option><option>수상</option>
            </select>
            <input placeholder={a.kind === "수상" ? "상 이름" : "활동 이름"} value={a.name} onChange={(e) => setAct(a.id, "name", e.target.value)} aria-label="이름" />
            <input placeholder={a.kind === "수상" ? "수준 (교내/지역/전국/국제)" : "역할"} value={a.role} onChange={(e) => setAct(a.id, "role", e.target.value)} aria-label="역할 또는 수준" />
            <input placeholder="학년 (예: 10–12)" size={10} value={a.grades} onChange={(e) => setAct(a.id, "grades", e.target.value)} aria-label="학년" />
            {a.kind === "활동" && <input placeholder="주당 시간" size={8} value={a.hours} onChange={(e) => setAct(a.id, "hours", e.target.value)} aria-label="주당 시간" />}
            <button onClick={() => update((d) => ({ ...d, acts: d.acts.filter((x) => x.id !== a.id) }))}>삭제</button>
          </div>
          <textarea rows={2} maxLength={150} placeholder="설명 (Common App처럼 150자 이내)" value={a.desc} onChange={(e) => setAct(a.id, "desc", e.target.value)} aria-label="설명" />
          <div className="muted">{a.desc.length}/150</div>
        </div>
      ))}
      <button onClick={() => update((d) => ({ ...d, acts: [...d.acts, { id: newId(), kind: "활동", name: "", role: "", grades: "", hours: "", desc: "" }] }))}>+ 활동·수상 추가</button>
    </>
  );
}
