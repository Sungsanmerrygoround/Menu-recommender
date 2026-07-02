import { supabase } from "./supabase";
import { todayString } from "./date-utils";
import type {
  Category,
  Dish,
  DishWithLastEaten,
  Effort,
  MealLogWithDish,
} from "./types";

export interface DishInput {
  name: string;
  category: Category;
  effort: Effort;
  cook_time: number | null;
  tags: string[];
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

export async function addDish(input: DishInput): Promise<void> {
  const { error } = await supabase.from("dishes").insert(input);
  if (error) throw error;
}

export async function updateDish(id: string, input: DishInput): Promise<void> {
  const { error } = await supabase.from("dishes").update(input).eq("id", id);
  if (error) throw error;
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
