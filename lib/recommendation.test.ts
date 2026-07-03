import { describe, expect, it } from "vitest";
import { calculateWeight, pickRecommendation, pickWeighted } from "./recommendation";
import type { RecommendationConfig } from "./recommendation-config";
import type { DishWithLastEaten } from "./types";

const config: RecommendationConfig = {
  MAX_WEIGHT: 30,
  COOLDOWN_DAYS: 7,
  COOLDOWN_WEIGHT: 1,
};

function dish(
  id: string,
  lastEatenAt: string | null
): DishWithLastEaten {
  return {
    id,
    name: `요리-${id}`,
    category: "한식",
    effort: "쉬움",
    cook_time: 30,
    tags: [],
    created_at: "2026-01-01T00:00:00Z",
    last_eaten_at: lastEatenAt,
  };
}

describe("calculateWeight", () => {
  it("한 번도 안 먹은 요리는 최대 가중치", () => {
    expect(calculateWeight(null, config)).toBe(30);
  });

  it("쿨다운 기간(7일 미만) 내에 먹었으면 가중치 강등", () => {
    expect(calculateWeight(0, config)).toBe(1);
    expect(calculateWeight(6, config)).toBe(1);
  });

  it("쿨다운 경계(정확히 7일)는 쿨다운이 아님", () => {
    expect(calculateWeight(7, config)).toBe(7);
  });

  it("경과일이 가중치가 되고 상한에서 멈춤", () => {
    expect(calculateWeight(15, config)).toBe(15);
    expect(calculateWeight(30, config)).toBe(30);
    expect(calculateWeight(100, config)).toBe(30);
  });

  it("COOLDOWN_WEIGHT=0이면 쿨다운 요리는 사실상 제외", () => {
    const zero = { ...config, COOLDOWN_WEIGHT: 0 };
    expect(calculateWeight(3, zero)).toBe(0);
  });
});

describe("pickWeighted", () => {
  it("빈 배열이면 null", () => {
    expect(pickWeighted([], [], () => 0.5)).toBeNull();
  });

  it("가중치 합이 0이면 null", () => {
    expect(pickWeighted(["a", "b"], [0, 0], () => 0.5)).toBeNull();
  });

  it("rng 값에 따라 가중치 비례로 뽑힌다", () => {
    const items = ["a", "b", "c"];
    const weights = [1, 2, 7]; // 누적: 1, 3, 10
    expect(pickWeighted(items, weights, () => 0.05)).toBe("a"); // 0.5 < 1
    expect(pickWeighted(items, weights, () => 0.2)).toBe("b"); // 2 < 3
    expect(pickWeighted(items, weights, () => 0.99)).toBe("c"); // 9.9 < 10
  });

  it("음수 가중치는 0으로 취급", () => {
    expect(pickWeighted(["a", "b"], [-5, 1], () => 0.5)).toBe("b");
  });
});

describe("pickRecommendation", () => {
  const today = "2026-07-03";

  it("제외 목록의 요리는 뽑히지 않는다", () => {
    const dishes = [dish("a", null), dish("b", null)];
    for (let r = 0.01; r < 1; r += 0.13) {
      const result = pickRecommendation(dishes, config, {
        excludeIds: ["a"],
        today,
        rng: () => r,
      });
      expect(result?.id).toBe("b");
    }
  });

  it("모두 제외되면 null", () => {
    const dishes = [dish("a", null)];
    expect(
      pickRecommendation(dishes, config, { excludeIds: ["a"], today })
    ).toBeNull();
  });

  it("오래 안 먹은 요리가 최근에 먹은 요리보다 가중치가 크다", () => {
    // a: 30일 전(가중치 30), b: 어제(쿨다운, 가중치 1) → 누적 30/31
    const dishes = [dish("a", "2026-06-03"), dish("b", "2026-07-02")];
    const pickA = pickRecommendation(dishes, config, {
      today,
      rng: () => 0.9, // 27.9 < 30 → a
    });
    expect(pickA?.id).toBe("a");
    const pickB = pickRecommendation(dishes, config, {
      today,
      rng: () => 0.99, // 30.69 > 30 → b
    });
    expect(pickB?.id).toBe("b");
  });

  it("빈 후보군이면 null", () => {
    expect(pickRecommendation([], config, { today })).toBeNull();
  });
});
