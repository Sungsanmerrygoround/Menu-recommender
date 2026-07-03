import { supabase } from "./supabase";
import { todayString } from "./date-utils";
import type {
  Category,
  Dish,
  DishWithLastEaten,
  Effort,
  MealLogWithDish,
  MealPlanWithDish,
} from "./types";

export interface DishInput {
  name: string;
  category: Category;
  effort: Effort;
  cook_time: number | null;
  tags: string[];
  ingredients?: string[];
}

/** 전체 요리 + 각 요리의 마지막 취식일(meal_logs의 max(eaten_at))을 조회 */
export async function fetchDishesWithLastEaten(): Promise<DishWithLastEaten[]> {
  const [dishesRes, logsRes] = await Promise.all([
    supabase.from("dishes").select("*").order("name"),
    supabase.from("meal_logs").select("dish_id, eaten_at"),
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

/** 004(ingredients 컬럼) 미적용 DB에서도 동작하도록 컬럼 오류 시 재시도 */
async function writeDish(
  input: DishInput,
  write: (
    payload: Partial<DishInput>
  ) => PromiseLike<{ error: { message: string } | null }>
): Promise<void> {
  let { error } = await write(input);
  if (error && /ingredients/.test(error.message)) {
    const { ingredients: _omit, ...rest } = input;
    ({ error } = await write(rest));
  }
  if (error) throw error;
}

export async function addDish(input: DishInput): Promise<void> {
  await writeDish(input, (payload) => supabase.from("dishes").insert(payload));
}

export async function updateDish(id: string, input: DishInput): Promise<void> {
  await writeDish(input, (payload) =>
    supabase.from("dishes").update(payload).eq("id", id)
  );
}

export async function deleteDish(id: string): Promise<void> {
  const { error } = await supabase.from("dishes").delete().eq("id", id);
  if (error) throw error;
}

/** "먹었어요" 기록 — 오늘 날짜(로컬 기준)로 meal_logs에 추가 */
export async function logMeal(
  dishId: string,
  eatenAt: string = todayString()
): Promise<void> {
  const { error } = await supabase
    .from("meal_logs")
    .insert({ dish_id: dishId, eaten_at: eatenAt });
  if (error) throw error;
}

/** 먹은 기록 전체를 최근순으로 조회 (요리 정보 조인) */
export async function fetchMealLogs(): Promise<MealLogWithDish[]> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("id, dish_id, eaten_at, created_at, dish:dishes(id, name, category)")
    .order("eaten_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MealLogWithDish[];
}

export async function deleteMealLog(id: string): Promise<void> {
  const { error } = await supabase.from("meal_logs").delete().eq("id", id);
  if (error) throw error;
}

/** 기간 내 식단표 조회 (요리 정보 조인, 날짜순) */
export async function fetchMealPlans(
  from: string,
  to: string
): Promise<MealPlanWithDish[]> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("id, plan_date, dish_id, created_at, dish:dishes(*)")
    .gte("plan_date", from)
    .lte("plan_date", to)
    .order("plan_date");
  if (error) throw error;
  return (data ?? []) as unknown as MealPlanWithDish[];
}

/** 특정 날짜의 식단 저장 (이미 있으면 교체) */
export async function upsertMealPlan(
  planDate: string,
  dishId: string
): Promise<void> {
  const { error } = await supabase
    .from("meal_plans")
    .upsert({ plan_date: planDate, dish_id: dishId }, { onConflict: "plan_date" });
  if (error) throw error;
}

export async function deleteMealPlan(id: string): Promise<void> {
  const { error } = await supabase.from("meal_plans").delete().eq("id", id);
  if (error) throw error;
}
