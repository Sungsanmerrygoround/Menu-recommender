-- =============================================================
-- 오늘 뭐 해먹지 — 주간 식단표 (003)
-- 날짜당 저녁 메뉴 1개를 저장한다. 001 실행 후에 실행할 것.
-- =============================================================

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  plan_date date not null unique,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.meal_plans enable row level security;

drop policy if exists "meal_plans_full_access" on public.meal_plans;
create policy "meal_plans_full_access"
  on public.meal_plans for all
  using (true)
  with check (true);
