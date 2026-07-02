-- =============================================================
-- 오늘 뭐 해먹지 — 스키마 (001)
-- 로그인 없음: 모든 사용자가 같은 데이터를 공유하며,
-- RLS는 켜되 anon 키로 전체 CRUD를 허용하는 정책을 둔다.
-- =============================================================

-- 요리 목록
create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('한식', '중식', '양식', '일식', '분식/기타')),
  effort text not null check (effort in ('쉬움', '중간', '어려움')),
  cook_time int,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 실제로 먹은 기록 ("먹었어요" 버튼을 누른 것만 기록)
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes (id) on delete cascade,
  eaten_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists meal_logs_dish_id_idx on public.meal_logs (dish_id);
create index if not exists meal_logs_eaten_at_idx on public.meal_logs (eaten_at desc);

-- RLS: 활성화 + 전체 허용 정책 (인증 없이 anon 키로 CRUD)
alter table public.dishes enable row level security;
alter table public.meal_logs enable row level security;

drop policy if exists "dishes_full_access" on public.dishes;
create policy "dishes_full_access"
  on public.dishes for all
  using (true)
  with check (true);

drop policy if exists "meal_logs_full_access" on public.meal_logs;
create policy "meal_logs_full_access"
  on public.meal_logs for all
  using (true)
  with check (true);
