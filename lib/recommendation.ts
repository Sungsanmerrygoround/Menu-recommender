/**
 * 추천 로직 (순수 함수 모음)
 *
 * - calculateWeight: 경과일 → 가중치 계산 (공식 교체 지점)
 * - pickWeighted: 가중치 기반 랜덤 추첨 (샘플링 전용, rng 주입 가능)
 * - pickRecommendation: 위 둘을 조합해 후보군에서 1개 추천
 *
 * 수치는 전부 RecommendationConfig(lib/recommendation-config.ts)로 받는다.
 */
import { daysBetween, todayString } from "./date-utils";
import type { RecommendationConfig } from "./recommendation-config";
import type { DishWithLastEaten } from "./types";

/**
 * 마지막 취식 후 경과일로 가중치를 계산한다.
 * @param daysSinceEaten 마지막 취식 후 경과일. null이면 한 번도 안 먹은 요리.
 */
export function calculateWeight(
  daysSinceEaten: number | null,
  config: RecommendationConfig
): number {
  // 한 번도 먹은 적 없는 요리: 최대 가중치
  if (daysSinceEaten === null) return config.MAX_WEIGHT;
  // 쿨다운: 최근에 먹었으면 가중치 강등
  if (daysSinceEaten < config.COOLDOWN_DAYS) return config.COOLDOWN_WEIGHT;
  // 기본: 오래 안 먹을수록 커지되 상한에서 멈춤
  return Math.min(daysSinceEaten, config.MAX_WEIGHT);
}

/**
 * 가중치 비례 랜덤 추첨. 계산 로직과 분리된 샘플링 전용 함수.
 * 테스트를 위해 rng를 주입할 수 있다.
 */
export function pickWeighted<T>(
  items: T[],
  weights: number[],
  rng: () => number = Math.random
): T | null {
  const total = weights.reduce((sum, w) => sum + Math.max(w, 0), 0);
  if (items.length === 0 || total <= 0) return null;

  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(weights[i], 0);
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

export interface PickOptions {
  /** 제외할 요리 id 목록 (예: "다른 메뉴 볼래요"에서 직전 추천) */
  excludeIds?: string[];
  /** 기준 날짜 (기본: 오늘). 테스트용. */
  today?: string;
  /** 랜덤 소스 (기본: Math.random). 테스트용. */
  rng?: () => number;
}

/** 필터링된 후보군에서 가중치 기반으로 대표 1개를 뽑는다. */
export function pickRecommendation(
  candidates: DishWithLastEaten[],
  config: RecommendationConfig,
  options: PickOptions = {}
): DishWithLastEaten | null {
  const { excludeIds = [], today = todayString(), rng } = options;

  const pool = candidates.filter((dish) => !excludeIds.includes(dish.id));
  const weights = pool.map((dish) =>
    calculateWeight(
      dish.last_eaten_at === null
        ? null
        : daysBetween(dish.last_eaten_at, today),
      config
    )
  );

  return pickWeighted(pool, weights, rng);
}
