"use client";
import { useState } from "react";
import Link from "next/link";
import { useData, newId, type Essay, type EvalResult } from "@/lib/store";

const EVAL_URL = process.env.NEXT_PUBLIC_EVAL_URL || "";
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export default function Essays() {
  const [d, update] = useData();
  const set = (id: string, patch: Partial<Essay>) =>
    update((d) => ({ ...d, essays: d.essays.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const add = (type: Essay["type"]) =>
    update((d) => ({ ...d, essays: [...d.essays, { id: newId(), type, school: "", question: "", text: "", limit: type === "ps" ? "650" : "" }] }));

  return (
    <>
      <h1>에세이</h1>
      <p className="muted">
        에세이는 이 브라우저에 저장돼요. <b>AI(Claude) 평가</b>를 누를 때만 그 에세이 한 편이 밖으로 나가요. AI는 점수와 고칠 점만 알려 주고,
        문장을 대신 써 주지는 않아요. 글은 꼭 본인이 쓰세요.
      </p>

      <AgeGate age14={d.age14} onChange={(v) => update((d) => ({ ...d, age14: v }))} />

      {d.essays.map((e) => (
        <EssayCard key={e.id} e={e} age14={d.age14 === true} set={(p) => set(e.id, p)}
          remove={() => update((d) => ({ ...d, essays: d.essays.filter((x) => x.id !== e.id) }))} />
      ))}
      <div className="row">
        <button onClick={() => add("ps")}>+ Personal Statement</button>
        <button onClick={() => add("supp")}>+ 대학별 Supplement</button>
      </div>
    </>
  );
}

function AgeGate({ age14, onChange }: { age14: boolean | null; onChange: (v: boolean) => void }) {
  if (age14 === true) return null;
  return (
    <div className="note">
      {age14 === false ? (
        <>만 14세 미만은 AI 평가를 쓸 수 없어요 (보호자 동의가 필요한 나이예요). 다른 기능은 그대로 쓸 수 있어요.</>
      ) : (
        <>
          AI 평가를 쓰려면 먼저 확인해 주세요. 나는 <b>만 14세 이상</b>인가요? (생년월일은 받지 않아요)
          <div className="row">
            <button onClick={() => onChange(true)}>네, 만 14세 이상이에요</button>
            <button onClick={() => onChange(false)}>아니요</button>
          </div>
        </>
      )}
    </div>
  );
}

function EssayCard({ e, age14, set, remove }: { e: Essay; age14: boolean; set: (p: Partial<Essay>) => void; remove: () => void }) {
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const words = wordCount(e.text);
  const limit = Number(e.limit) || 0;

  async function evaluate() {
    setBusy(true); setErr("");
    try {
      const res = await fetch(EVAL_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: e.type, school: e.school, question: e.question, essay: e.text, consent: true, age14: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `오류 ${res.status}`);
      set({ result: j.result as EvalResult, evaluatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
      setAgree(false);
    } catch (x) {
      setErr(x instanceof Error && x.message !== "Failed to fetch" ? x.message : "평가 서버에 연결하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="row">
        <b>{e.type === "ps" ? "Personal Statement" : "Supplement"}</b>
        {e.type === "supp" && <input placeholder="학교 이름" value={e.school} onChange={(x) => set({ school: x.target.value })} aria-label="학교 이름" />}
        <input placeholder="단어 제한" size={8} inputMode="numeric" value={e.limit} onChange={(x) => set({ limit: x.target.value })} aria-label="단어 제한" />
        <span className="grow" />
        <button onClick={remove}>삭제</button>
      </div>
      <textarea rows={2} placeholder={e.type === "ps" ? "Common App 질문 (선택, 붙여 넣기)" : "대학별 질문(prompt)을 그대로 붙여 넣기"}
        value={e.question} onChange={(x) => set({ question: x.target.value })} aria-label="질문" />
      <textarea rows={12} placeholder="에세이 본문 붙여 넣기" value={e.text} onChange={(x) => set({ text: x.target.value })} aria-label="에세이 본문" />
      <div className="muted" style={limit && words > limit ? { color: "var(--warn)", fontWeight: 600 } : undefined}>
        {words} 단어{limit ? ` / 제한 ${limit}` : ""}{limit && words > limit ? " — 제한을 넘었어요" : ""}
      </div>

      {age14 && (
        <div className="card">
          <b>AI 평가 보내기 전에 확인</b>
          <ul className="muted">
            <li>이 에세이와 질문이 평가 서버를 거쳐 <b>Anthropic(미국, Claude 제작사)</b>으로 보내져요. 우리 서버는 저장하지 않아요.</li>
            <li>Anthropic은 받은 내용을 보통 30일 안에 지워요 (정책 위반으로 표시되면 더 오래 보관할 수 있어요). <Link href="/privacy/">자세히</Link></li>
            <li>에세이 속 <b>이름·학교 이름·전화번호 같은 개인정보는 지우고</b> 보내세요.</li>
            <li>평가는 하루 몇 번으로 제한돼요.</li>
          </ul>
          <label className="row">
            <input type="checkbox" checked={agree} onChange={(x) => setAgree(x.target.checked)} />
            위 내용을 이해했고, 이 에세이 한 편을 보내는 데 동의해요.
          </label>
          <button className="primary" disabled={!agree || busy || !EVAL_URL} onClick={evaluate}>
            {busy ? "평가 중… (최대 1분)" : "AI(Claude) 평가 받기"}
          </button>
          {!EVAL_URL && <p className="muted">평가 서버 주소가 아직 설정되지 않았어요 (운영자: NEXT_PUBLIC_EVAL_URL).</p>}
          {err && <p style={{ color: "var(--warn)" }}>{err}</p>}
        </div>
      )}

      {e.result && <Result r={e.result} at={e.evaluatedAt} />}
    </div>
  );
}

function Result({ r, at }: { r: EvalResult; at?: string }) {
  return (
    <div>
      <h2>AI 평가 {r.total}점 / 100 <span className="muted">({at}, AI가 만든 참고 의견이에요)</span></h2>
      {r.safety && <div className="note">{r.safety}</div>}
      {r.injectionFlags.length > 0 && <div className="note">글 안에 AI에게 내리는 지시 같은 문장이 있어 무시했어요.</div>}
      <p>{r.summary}</p>
      {r.criteria.map((c) => (
        <div key={c.name} className="card">
          <b>{c.name}: {c.score}/20</b>
          {c.quote && (
            <blockquote>
              &ldquo;{c.quote}&rdquo; {!c.quoteFound && <span className="muted">(본문에서 이 문장을 찾지 못했어요)</span>}
            </blockquote>
          )}
          <div>{c.reason}</div>
          <div><b>고칠 점:</b> {c.fix}</div>
        </div>
      ))}
    </div>
  );
}
