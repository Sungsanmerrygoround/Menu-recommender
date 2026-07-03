export const CATEGORIES = ["한식", "중식", "양식", "일식", "분식/기타"] as const;
export type Category = (typeof CATEGORIES)[number];

export const EFFORTS = ["쉬움", "중간", "어려움"] as const;
export type Effort = (typeof EFFORTS)[number];

export interface Dish {
  id: string;
  name: string;
  category: Category;
  effort: Effort;
  cook_time: number | null;
  tags: string[];
  /** 004 마이그레이션 이전 데이터에는 없을 수 있음 */
  ingredients?: string[];
  created_at: string;
}

export interface MealLog {
  id: string;
  dish_id: string;
  eaten_at: string; // YYYY-MM-DD
  created_at: string;
}

/** dishes에 meal_logs 기준 마지막 취식일을 붙인 화면용 타입 */
export interface DishWithLastEaten extends Dish {
  last_eaten_at: string | null; // YYYY-MM-DD, 한 번도 안 먹었으면 null
}

export interface MealLogWithDish extends MealLog {
  dish: Pick<Dish, "id" | "name" | "category"> | null;
}

export interface MealPlan {
  id: string;
  plan_date: string; // YYYY-MM-DD
  dish_id: string;
  created_at: string;
}

export interface MealPlanWithDish extends MealPlan {
  dish: Dish | null;
}
