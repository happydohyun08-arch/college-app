# 대학 지원 노트

고등학생용 미국 대학 지원 관리 사이트. 학생 자료는 **학생 브라우저에만** 저장된다.

- `app/` 화면 (내 정보, 학교, 에세이, 개인정보 안내)
- `lib/store.ts` 브라우저 저장·내보내기·가져오기
- `lib/classify.mjs` Reach/Target/Safety 규칙
- `worker/` AI 평가 서버 (Cloudflare Worker). `rubric.md` = 채점 기준표
- `data/schools.json` 학교 자료 (`npm run schools`로 다시 받기)

## 내 컴퓨터에서 보기
```
npm run dev        # http://localhost:3000
npm run check      # 핵심 규칙 검사
```
AI 평가까지 시험하려면 `.dev.vars` 파일(커밋 금지)에 `ANTHROPIC_API_KEY=...`와 `IP_SALT=아무긴문자열`을 적고
`npm run worker:dev`를 켠 뒤, `NEXT_PUBLIC_EVAL_URL=http://localhost:8787 npm run dev`.

## 배포 (처음 한 번)
1. **Anthropic 콘솔**에서 API 키 만들기 + **월 지출 한도(Spend limit)** 설정 (예: $20). 이것이 진짜 비용 상한.
2. **Cloudflare** 무료 계정 → `npx wrangler login`
3. `npx wrangler kv namespace create USAGE` → 나온 id를 `wrangler.toml`의 `PUT_KV_ID_HERE`에 넣기
4. `wrangler.toml`의 `YOUR_GITHUB_ID`를 내 GitHub 아이디로 바꾸기
5. `npx wrangler secret put ANTHROPIC_API_KEY`, `npx wrangler secret put IP_SALT` (키는 화면에만 입력, 파일에 적지 않기)
6. `npm run worker:deploy` → 나온 주소(`https://college-app-eval.<이름>.workers.dev`) 복사
7. GitHub에 저장소 만들고 push → Settings → Pages → Source: **GitHub Actions**
8. Settings → Secrets and variables → Actions → **Variables**에 `EVAL_URL` = 6번 주소
9. Actions에서 deploy 다시 실행 → `https://<아이디>.github.io/<저장소>/`

비용: 에세이 1편 약 $0.02 (Sonnet 5.5, 2026-10 단가 기준). 하루 한도는 `wrangler.toml`의 `DAILY_LIMIT_*`.

## 배포 전에 할 일
- `app/privacy/page.tsx`의 운영자 연락처 채우기
- 개인정보 안내 문구를 전문가에게 한 번 확인받기 (법률 자문 아님)
- 학교 마감일은 학생이 직접 입력. 합격자 GPA는 각 학교 Common Data Set에서 `data/schools.json`의 `gpaAvg`에 손으로 넣을 수 있음
