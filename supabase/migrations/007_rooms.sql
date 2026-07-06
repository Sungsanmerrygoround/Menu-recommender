-- =============================================================
-- 오늘 뭐 해먹지 — 방(Room) 기능 (007)
-- 커플/그룹 단위 데이터 분리. 로그인 없이 방 코드로 구분.
-- 001~006 실행 후에 실행할 것.
-- 주의: 기존 dishes/meal_logs/meal_plans 데이터를 전부 삭제한다.
-- =============================================================

-- 1) rooms 테이블
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,      -- 예: TOFU-3942
  name text not null,             -- 예: 한준네 부엌
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

drop policy if exists "rooms_full_access" on public.rooms;
create policy "rooms_full_access"
  on public.rooms for all
  using (true)
  with check (true);

-- 2) 기존 데이터 전체 삭제 (마이그레이션하지 않음)
--    room_id NOT NULL 컬럼을 붙이려면 기존 행이 없어야 한다.
delete from public.meal_logs;
delete from public.meal_plans;
delete from public.dishes;

-- 3) 각 테이블에 room_id 추가 (NOT NULL + FK, 방 삭제 시 함께 삭제)
alter table public.dishes
  add column if not exists room_id uuid not null
  references public.rooms (id) on delete cascade;

alter table public.meal_logs
  add column if not exists room_id uuid not null
  references public.rooms (id) on delete cascade;

alter table public.meal_plans
  add column if not exists room_id uuid not null
  references public.rooms (id) on delete cascade;

create index if not exists dishes_room_id_idx on public.dishes (room_id);
create index if not exists meal_logs_room_id_idx on public.meal_logs (room_id);
create index if not exists meal_plans_room_id_idx on public.meal_plans (room_id);

-- 4) meal_plans unique 제약: (plan_date, meal_slot) → (room_id, plan_date, meal_slot)
--    방마다 같은 날짜·끼니 식단을 가질 수 있어야 한다.
alter table public.meal_plans
  drop constraint if exists meal_plans_date_slot_key;

alter table public.meal_plans
  add constraint meal_plans_room_date_slot_key unique (room_id, plan_date, meal_slot);
