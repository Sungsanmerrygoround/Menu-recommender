-- =============================================================
-- 오늘 뭐 해먹지 — 식단표 아침/점심/저녁 구분 (005)
-- 003 실행 후에 실행할 것. 기존 식단 데이터는 '저녁'으로 유지된다.
-- =============================================================

alter table public.meal_plans
  add column if not exists meal_slot text not null default '저녁'
  check (meal_slot in ('아침', '점심', '저녁'));

-- 날짜 단독 unique 해제 → (날짜, 끼니) 조합 unique
alter table public.meal_plans
  drop constraint if exists meal_plans_plan_date_key;

alter table public.meal_plans
  drop constraint if exists meal_plans_date_slot_key;

alter table public.meal_plans
  add constraint meal_plans_date_slot_key unique (plan_date, meal_slot);
