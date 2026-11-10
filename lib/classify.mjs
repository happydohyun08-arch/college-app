// 학교 분류 규칙 (참고용). 점수 비교 + 합격률만 쓴다. 실제 입시는 에세이·활동·추천서 등 성적 외 요소가 크다.

/**
 * @param {{admitRate:number|null, sat25:number|null, sat75:number|null, act25:number|null, act75:number|null}} s 학교
 * @param {{sat?:number|null, act?:number|null}} me 학생 최고 점수
 * @returns {{label:"Reach"|"Target"|"Safety", why:string}}
 */
export function classify(s, me) {
  const rate = s.admitRate;
  if (rate != null && rate < 0.15)
    return { label: "Reach", why: "합격률 15% 미만 학교는 점수와 관계없이 Reach로 봐요." };

  let pos = null; // "below" | "mid" | "above"
  let test = "";
  if (me.sat && s.sat25 && s.sat75) {
    pos = me.sat < s.sat25 ? "below" : me.sat > s.sat75 ? "above" : "mid";
    test = `SAT ${me.sat} (학교 중간 50%: ${s.sat25}–${s.sat75})`;
  } else if (me.act && s.act25 && s.act75) {
    pos = me.act < s.act25 ? "below" : me.act > s.act75 ? "above" : "mid";
    test = `ACT ${me.act} (학교 중간 50%: ${s.act25}–${s.act75})`;
  }
  const pct = rate == null ? "알 수 없음" : `${Math.round(rate * 100)}%`;

  if (!pos) {
    const why = `점수 비교 자료가 없어 합격률(${pct})만 봤어요.`;
    if (rate == null) return { label: "Reach", why: "점수·합격률 자료가 없어 Reach로 뒀어요." };
    if (rate >= 0.6) return { label: "Safety", why };
    if (rate >= 0.3) return { label: "Target", why };
    return { label: "Reach", why };
  }
  if (pos === "below") return { label: "Reach", why: `${test}: 하위 25% 아래예요.` };
  if (pos === "above" && rate != null && rate >= 0.4)
    return { label: "Safety", why: `${test}: 상위 25% 위이고 합격률 ${pct}예요.` };
  return { label: "Target", why: `${test}: ${pos === "mid" ? "중간 50% 안" : "상위 25% 위"}, 합격률 ${pct}.` };
}
