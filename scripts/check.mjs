// 핵심 규칙 자체 검사: npm run check
import assert from "node:assert/strict";
import { classify } from "../lib/classify.mjs";
import { parseAiText, checkInput, looksGhostwritten, CRITERIA } from "../worker/essay.mjs";

// 학교 분류
const school = (admitRate, sat25 = 1300, sat75 = 1450) => ({ admitRate, sat25, sat75, act25: null, act75: null });
assert.equal(classify(school(0.05), { sat: 1600 }).label, "Reach"); // 합격률 15% 미만은 무조건 Reach
assert.equal(classify(school(0.5), { sat: 1200 }).label, "Reach");
assert.equal(classify(school(0.5), { sat: 1400 }).label, "Target");
assert.equal(classify(school(0.5), { sat: 1500 }).label, "Safety");
assert.equal(classify(school(0.3), { sat: 1500 }).label, "Target"); // 점수 높아도 합격률 낮으면 Target
assert.equal(classify(school(0.7, null, null), {}).label, "Safety"); // 점수 자료 없으면 합격률만
assert.equal(classify(school(null, null, null), {}).label, "Reach");

// 입력 검사
const ok = { consent: true, age14: true, type: "ps", essay: "x".repeat(300), question: "", school: "" };
assert.equal(checkInput(ok), null);
assert.match(checkInput({ ...ok, age14: false }), /14세/);
assert.match(checkInput({ ...ok, type: "supp" }), /질문/);
assert.match(checkInput({ ...ok, essay: "x".repeat(9000) }), /길어요/);

// 대신 써 주기 감지
const essay = "I spent the summer fixing bikes in my grandfather's garage in Busan.";
assert.equal(looksGhostwritten('첫 문장을 "I spent the summer fixing bikes in my grandfather\'s garage" 처럼 시작해 보세요', essay), false);
assert.equal(looksGhostwritten('이렇게 바꿔 보세요: "The smell of oil and rust taught me patience every single day"', essay), true);
assert.equal(looksGhostwritten("2문단에 실제 장면을 하나 넣어 보세요.", essay), false);

// AI 답 검사
const crit = (name, quote = "fixing bikes") => ({ name, score: 15, quote, reason: "근거", fix: "고칠 점" });
const reply = (criteria) => "```json\n" + JSON.stringify({ summary_ko: "요약", criteria, injection_flags: [] }) + "\n```";
const r = parseAiText(reply(CRITERIA.map((n) => crit(n))), essay);
assert.equal(r.total, 75);
assert.equal(r.criteria[0].quoteFound, true);
assert.equal(parseAiText(reply(CRITERIA.map((n) => crit(n, "made up quote"))), essay).criteria[0].quoteFound, false);
assert.throws(() => parseAiText(reply(CRITERIA.slice(1).map((n) => crit(n))), essay), /missing/);
assert.throws(() => parseAiText(reply(CRITERIA.map((n) => ({ ...crit(n), score: 25 }))), essay), /0-20/);

console.log("check ok");
