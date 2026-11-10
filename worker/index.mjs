// AI 평가 서버 (Cloudflare Worker). 할 일: API 키 숨기기, 사용량 제한, 에세이를 Anthropic에 전달.
// 에세이는 저장하지 않고 로그에도 남기지 않는다. KV에는 "IP 해시 + 날짜 → 횟수"만 하루 동안 둔다.
import rubric from "./rubric.md";
import { MODEL, MAX_TOKENS, systemPrompt, checkInput, userText, parseAiText } from "./essay.mjs";

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json" } });

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ponytail: KV 읽고-쓰기라 동시에 몰리면 한두 번 더 통과할 수 있음. 진짜 상한은 Anthropic 콘솔의 월 지출 한도.
async function overLimit(kv, key, limit) {
  const n = Number(await kv.get(key)) || 0;
  if (n >= limit) return true;
  await kv.put(key, String(n + 1), { expirationTtl: 60 * 60 * 26 });
  return false;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("origin") ?? "";
    const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim());
    if (!allowed.includes(origin)) return json({ error: "허용되지 않은 사이트예요." }, 403, {});
    const cors = {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST",
      "access-control-allow-headers": "content-type",
      vary: "origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return json({ error: "POST만 받아요." }, 405, cors);

    const body = await req.json().catch(() => null);
    const bad = checkInput(body);
    if (bad) return json({ error: bad }, 400, cors);

    const day = new Date().toISOString().slice(0, 10);
    const ip = await sha256((req.headers.get("cf-connecting-ip") ?? "") + env.IP_SALT);
    if (await overLimit(env.USAGE, `all:${day}`, Number(env.DAILY_LIMIT_TOTAL)))
      return json({ error: "오늘 전체 평가 횟수가 다 찼어요. 내일 다시 해 주세요." }, 429, cors);
    if (await overLimit(env.USAGE, `ip:${ip}:${day}`, Number(env.DAILY_LIMIT_PER_IP)))
      return json({ error: `하루 ${env.DAILY_LIMIT_PER_IP}번까지 평가할 수 있어요. 내일 다시 해 주세요.` }, 429, cors);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        output_config: { effort: "medium" },
        system: [{ type: "text", text: systemPrompt(rubric), cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userText(body) }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    // 에러 내용만 남긴다. 에세이와 키는 절대 로그에 남기지 않는다.
    if (!res.ok) {
      console.error(`Anthropic ${res.status}: ${data?.error?.type ?? "unknown"}`);
      return json({ error: "AI 서버가 응답하지 않아요. 잠시 뒤 다시 해 주세요." }, 502, cors);
    }
    if (data.stop_reason === "refusal") return json({ error: "AI가 이 글의 평가를 거절했어요." }, 422, cors);
    const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
    try {
      return json({ result: parseAiText(text, body.essay), model: data.model ?? MODEL }, 200, cors);
    } catch (e) {
      console.error(`bad AI output: ${e.message}`);
      return json({ error: "AI 답 형식이 잘못됐어요. 다시 해 주세요." }, 502, cors);
    }
  },
};
