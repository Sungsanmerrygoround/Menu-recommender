import { supabase } from "./supabase";
import { getRoomId } from "./room";
import { todayString } from "./date-utils";
import type {
  Category,
  Dish,
  DishWithLastEaten,
  Effort,
  MealLogWithDish,
  MealPlanWithDish,
  MealSlot,
} from "./types";

export interface DishInput {
  name: string;
  category: Category;
  effort: Effort;
  cook_time: number | null;
  tags: string[];
  ingredients?: string[];
  emoji?: string | null;
}

/** 전체 요리 + 각 요리의 마지막 취식일(meal_logs의 max(eaten_at))을 조회 */
export async function fetchDishesWithLastEaten(): Promise<DishWithLastEaten[]> {
  const roomId = getRoomId();
  const [dishesRes, logsRes] = await Promise.all([
    supabase.from("dishes").select("*").eq("room_id", roomId).order("name"),
    supabase.from("meal_logs").select("dish_id, eaten_at").eq("room_id", roomId),
  ]);
  if (dishesRes.error) throw dishesRes.error;
  if (logsRes.error) throw logsRes.error;

  const lastEatenMap = new Map<string, string>();
  for (const log of logsRes.data as Pick<MealLogWithDish, "dish_id" | "eaten_at">[]) {
    const prev = lastEatenMap.get(log.dish_id);
    if (!prev || log.eaten_at > prev) lastEatenMap.set(log.dish_id, log.eaten_at);
  }

  return (dishesRes.data as Dish[]).map((dish) => ({
    ...dish,
    last_eaten_at: lastEatenMap.get(dish.id) ?? null,
  }));
}

/** 004/006(선택 컬럼) 미적용 DB에서도 동작하도록 컬럼 오류 시 재시도 */
async function writeDish(
  input: DishInput,
  write: (
    payload: Partial<DishInput>
  ) => PromiseLike<{ error: { message: string } | null }>
): Promise<void> {
  let { error } = await write(input);
  if (error && /(ingredients|emoji)/.test(error.message)) {
    const { ingredients: _i, emoji: _e, ...rest } = input;
    ({ error } = await write(rest));
  }
  if (error) throw error;
}

export async function addDish(input: DishInput): Promise<void> {
  const roomId = getRoomId();
  await writeDish(input, (payload) =>
    supabase.from("dishes").insert({ ...payload, room_id: roomId })
  );
}

export async function updateDish(id: string, input: DishInput): Promise<void> {
  const roomId = getRoomId();
  await writeDish(input, (payload) =>
    supabase.from("dishes").update(payload).eq("id", id).eq("room_id", roomId)
  );
}

export async function deleteDish(id: string): Promise<void> {
  const { error } = await supabase
    .from("dishes")
    .delete()
    .eq("id", id)
    .eq("room_id", getRoomId());
  if (error) throw error;
}

/** "먹었어요" 기록 — 오늘 날짜(로컬 기준)로 meal_logs에 추가 */
export async function logMeal(
  dishId: string,
  eatenAt: string = todayString()
): Promise<void> {
  const { error } = await supabase
    .from("meal_logs")
    .insert({ dish_id: dishId, eaten_at: eatenAt, room_id: getRoomId() });
  if (error) throw error;
}

/** 먹은 기록 전체를 최근순으로 조회 (요리 정보 조인) */
export async function fetchMealLogs(): Promise<MealLogWithDish[]> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("id, dish_id, eaten_at, created_at, dish:dishes(*)")
    .eq("room_id", getRoomId())
    .order("eaten_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MealLogWithDish[];
}

/** 특정 날짜에 먹은 요리 id 목록 (오늘의 식단 체크 표시용) */
export async function fetchEatenDishIds(date: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("dish_id")
    .eq("room_id", getRoomId())
    .eq("eaten_at", date);
  if (error) throw error;
  return (data ?? []).map((r) => r.dish_id as string);
}

export async function deleteMealLog(id: string): Promise<void> {
  const { error } = await supabase
    .from("meal_logs")
    .delete()
    .eq("id", id)
    .eq("room_id", getRoomId());
  if (error) throw error;
}

/** 기간 내 식단표 조회 (요리 정보 조인, 날짜순) */
export async function fetchMealPlans(
  from: string,
  to: string
): Promise<MealPlanWithDish[]> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("id, plan_date, meal_slot, dish_id, created_at, dish:dishes(*)")
    .eq("room_id", getRoomId())
    .gte("plan_date", from)
    .lte("plan_date", to)
    .order("plan_date");
  if (error) throw error;
  return (data ?? []) as unknown as MealPlanWithDish[];
}

/** 특정 날짜·끼니의 식단 저장 (이미 있으면 교체) */
export async function upsertMealPlan(
  planDate: string,
  mealSlot: MealSlot,
  dishId: string
): Promise<void> {
  const { error } = await supabase
    .from("meal_plans")
    .upsert(
      {
        room_id: getRoomId(),
        plan_date: planDate,
        meal_slot: mealSlot,
        dish_id: dishId,
      },
      { onConflict: "room_id,plan_date,meal_slot" }
    );
  if (error) throw error;
}

export async function deleteMealPlan(id: string): Promise<void> {
  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", id)
    .eq("room_id", getRoomId());
  if (error) throw error;
}

// ---- 데이터 백업/복원 ----

export interface BackupData {
  version: 1;
  exported_at: string;
  dishes: Record<string, unknown>[];
  meal_logs: Record<string, unknown>[];
  meal_plans: Record<string, unknown>[];
}

export async function exportAllData(): Promise<BackupData> {
  const roomId = getRoomId();
  const [d, l, p] = await Promise.all([
    supabase.from("dishes").select("*").eq("room_id", roomId),
    supabase.from("meal_logs").select("*").eq("room_id", roomId),
    supabase.from("meal_plans").select("*").eq("room_id", roomId),
  ]);
  if (d.error) throw d.error;
  if (l.error) throw l.error;
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    dishes: d.data ?? [],
    meal_logs: l.data ?? [],
    // meal_plans 테이블이 없는 환경(003 미적용)도 허용
    meal_plans: p.error ? [] : (p.data ?? []),
  };
}

/**
 * 백업 병합 복원: id 기준 upsert (기존 데이터는 유지, 백업 내용이 우선).
 * 다른 방에서 만든 백업이라도 현재 방으로 안전하게 복원되도록 room_id를 덮어쓴다.
 */
export async function importAllData(backup: BackupData): Promise<void> {
  const roomId = getRoomId();
  const withRoom = (
    rows: Record<string, unknown>[]
  ): Record<string, unknown>[] => rows.map((r) => ({ ...r, room_id: roomId }));

  if (backup.dishes.length > 0) {
    const rows = withRoom(backup.dishes);
    let { error } = await supabase
      .from("dishes")
      .upsert(rows, { onConflict: "id" });
    if (error && /(ingredients|emoji)/.test(error.message)) {
      // 미적용 마이그레이션 컬럼 제거 후 재시도
      const stripped = rows.map(
        ({ ingredients: _i, emoji: _e, ...rest }) => rest
      );
      ({ error } = await supabase
        .from("dishes")
        .upsert(stripped, { onConflict: "id" }));
    }
    if (error) throw error;
  }
  if (backup.meal_logs.length > 0) {
    const { error } = await supabase
      .from("meal_logs")
      .upsert(withRoom(backup.meal_logs), { onConflict: "id" });
    if (error) throw error;
  }
  if (backup.meal_plans.length > 0) {
    const { error } = await supabase
      .from("meal_plans")
      .upsert(withRoom(backup.meal_plans), { onConflict: "id" });
    if (error) throw error;
  }
}
