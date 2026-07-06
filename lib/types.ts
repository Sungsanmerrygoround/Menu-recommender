export interface Room {
  id: string;
  code: string; // 예: TOFU-3942
  name: string; // 예: 한준네 부엌
  created_at: string;
}

export const CATEGORIES = ["한식", "중식", "양식", "일식", "분식/기타"] as const;
export type Category = (typeof CATEGORIES)[number];

export const EFFORTS = ["쉬움", "중간", "어려움"] as const;
export type Effort = (typeof EFFORTS)[number];

export interface Dish {
  id: string;
  room_id: string;
  name: string;
  category: Category;
  effort: Effort;
  cook_time: number | null;
  tags: string[];
  /** 004 마이그레이션 이전 데이터에는 없을 수 있음 */
  ingredients?: string[];
  /** 요리별 이모지 (006). 비어 있으면 종류별 기본 이모지 사용 */
  emoji?: string | null;
  created_at: string;
}

export interface MealLog {
  id: string;
  room_id: string;
  dish_id: string;
  eaten_at: string; // YYYY-MM-DD
  created_at: string;
}

/** dishes에 meal_logs 기준 마지막 취식일을 붙인 화면용 타입 */
export interface DishWithLastEaten extends Dish {
  last_eaten_at: string | null; // YYYY-MM-DD, 한 번도 안 먹었으면 null
}

export interface MealLogWithDish extends MealLog {
  dish: Dish | null;
}

export const MEAL_SLOTS = ["아침", "점심", "저녁"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export interface MealPlan {
  id: string;
  room_id: string;
  plan_date: string; // YYYY-MM-DD
  meal_slot: MealSlot;
  dish_id: string;
  created_at: string;
}

export interface MealPlanWithDish extends MealPlan {
  dish: Dish | null;
}
