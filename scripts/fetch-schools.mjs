// 미국 교육부 College Scorecard API에서 학교 입시 자료를 받아 data/schools.json에 저장한다.
// 실행: npm run schools   (키: SCORECARD_API_KEY 환경변수, 없으면 DEMO_KEY = 시간당 30회 제한)
// 무료 키 발급: https://api.data.gov/signup/
import fs from "node:fs";

const NAMES = [
  "Princeton University", "Harvard University", "Massachusetts Institute of Technology",
  "Stanford University", "Yale University", "Columbia University in the City of New York",
  "University of Pennsylvania", "Brown University", "Duke University", "Cornell University",
  "Northwestern University", "Johns Hopkins University", "University of Chicago",
  "Carnegie Mellon University", "University of California-Los Angeles",
  "University of California-Berkeley", "University of Michigan-Ann Arbor", "New York University",
  "Georgia Institute of Technology-Main Campus", "University of Southern California",
  "Boston University", "Northeastern University", "University of Washington-Seattle Campus",
  "University of Illinois Urbana-Champaign", "University of Wisconsin-Madison",
  "Purdue University-Main Campus", "Ohio State University-Main Campus",
  "Pennsylvania State University-Main Campus", "University of California-Davis",
  "Texas A & M University-College Station",
];
const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];
const A = "admissions";
const LATEST = [
  `${A}.admission_rate.overall`,
  `${A}.sat_scores.25th_percentile.critical_reading`, `${A}.sat_scores.25th_percentile.math`,
  `${A}.sat_scores.75th_percentile.critical_reading`, `${A}.sat_scores.75th_percentile.math`,
  `${A}.act_scores.25th_percentile.cumulative`, `${A}.act_scores.75th_percentile.cumulative`,
];
const fields = ["id", "school.name", "school.state", "school.school_url",
  ...LATEST.map((f) => `latest.${f}`), ...YEARS.map((y) => `${y}.${A}.admission_rate.overall`)].join(",");
const key = process.env.SCORECARD_API_KEY || "DEMO_KEY";
const sum = (a, b) => (a == null || b == null ? null : a + b);

// 이미 받은 학교는 건너뛰고 이어 받는다 (DEMO_KEY 제한에 걸려도 다시 실행하면 됨).
const old = fs.existsSync("data/schools.json") ? JSON.parse(fs.readFileSync("data/schools.json", "utf8")).schools : [];
const out = old.filter((s) => NAMES.includes(s.name));
for (const name of NAMES) {
  if (out.some((s) => s.name === name)) continue;
  await new Promise((r) => setTimeout(r, 4000));
  const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${key}` +
    `&school.name=${encodeURIComponent(name)}&fields=${fields}&per_page=50`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`실패 ${res.status}: ${name}`); continue; }
  const rows = (await res.json()).results ?? [];
  const r = rows.find((x) => x["school.name"] === name);
  if (!r) { console.error(`이름 불일치: ${name} → 후보: ${rows.map((x) => x["school.name"]).slice(0, 5).join(" | ")}`); continue; }
  const L = (f) => r[`latest.${A}.${f}`] ?? null;
  const rate = L("admission_rate.overall");
  // "latest"와 같은 값을 가진 연도를 자료 연도로 본다 (Scorecard는 latest에 연도를 따로 주지 않음).
  const year = YEARS.find((y) => r[`${y}.${A}.admission_rate.overall`] === rate) ?? null;
  out.push({
    id: r.id,
    name,
    state: r["school.state"],
    admitRate: rate,
    // ponytail: SAT 합계 25/75%는 영역별 25/75%를 더한 근사값. 정확한 값은 각 학교 CDS C9.
    sat25: sum(L("sat_scores.25th_percentile.critical_reading"), L("sat_scores.25th_percentile.math")),
    sat75: sum(L("sat_scores.75th_percentile.critical_reading"), L("sat_scores.75th_percentile.math")),
    act25: L("act_scores.25th_percentile.cumulative"),
    act75: L("act_scores.75th_percentile.cumulative"),
    gpaAvg: null, // CDS C12에서 손으로 채운다 (Scorecard에는 GPA가 없음)
    source: "U.S. Dept. of Education, College Scorecard",
    sourceUrl: `https://collegescorecard.ed.gov/school/?${r.id}`,
    year: year ? `${year}-${String(year + 1).slice(2)}` : "latest (연도 확인 필요)",
  });
}
out.sort((a, b) => NAMES.indexOf(a.name) - NAMES.indexOf(b.name));
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/schools.json", JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), schools: out }, null, 2) + "\n");
console.log(`${out.length}/${NAMES.length}개 저장 → data/schools.json`);
