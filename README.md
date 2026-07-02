# 오늘 뭐 해먹지 🍳

만들 수 있는 집밥 요리를 등록해두고, 필터를 걸어 추천받으면 **최근에 안 먹은 요리**가 우선적으로 추천되는 웹앱.

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (DB only, 로그인 없음)
- 모바일 우선 반응형 (max-width 480px)

## 로컬 실행

```
npm install
npm run dev
```

→ http://localhost:3000

## 남은 수동 작업 (순서대로)

### 1. Supabase에서 SQL 실행 (필수 — 이걸 해야 앱이 동작해요)

1. https://supabase.com/dashboard 접속 → 프로젝트(`sucwpjnsmyqbnmncoxzx`) 클릭
2. 왼쪽 메뉴에서 **SQL Editor** 클릭 → **New query** 클릭
3. 이 레포의 [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) 파일 내용을 전부 복사해 붙여넣고 **Run** 클릭
4. 성공하면 같은 방법으로 [`supabase/migrations/002_seed.sql`](supabase/migrations/002_seed.sql) 내용을 붙여넣고 **Run** 클릭 (예시 요리 20개 입력)
5. 앱을 새로고침하면 요리 목록이 보여요

### 2. GitHub에 push

원격 저장소(`origin`)는 이미 연결돼 있어요. 터미널에서 아래 한 줄만 실행하면 돼요 (처음이라면 브라우저 로그인 창이 뜰 수 있어요):

```
git push -u origin main
```

### 3. Vercel 배포

1. https://vercel.com 접속 → **Add New...** → **Project** 클릭
2. GitHub 목록에서 **Menu-recommender** 옆 **Import** 클릭
3. **Environment Variables** 섹션을 열고 아래 2개 추가 (`.env.local` 파일의 값 그대로):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** 클릭 → 끝

## 추천 로직 튜닝

가중치 수치는 [`lib/recommendation-config.ts`](lib/recommendation-config.ts) 한 파일에 모여 있어요:

| 상수 | 기본값 | 의미 |
|---|---|---|
| `MAX_WEIGHT` | 30 | 가중치 상한. 한 번도 안 먹은 요리가 받는 값 |
| `COOLDOWN_DAYS` | 7 | 최근 이 일수 이내에 먹은 요리는 가중치 강등 |
| `COOLDOWN_WEIGHT` | 1 | 쿨다운 요리의 가중치 (0이면 아예 제외) |

가중치 공식 자체를 바꾸려면 [`lib/recommendation.ts`](lib/recommendation.ts)의 `calculateWeight`만 교체하면 되고, 화면/DB 코드는 영향받지 않아요.
