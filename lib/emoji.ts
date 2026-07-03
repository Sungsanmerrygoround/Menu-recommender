import type { Category } from "./types";

/** 요리에 표시할 이모지: 직접 지정한 이모지 > 종류별 기본 이모지 */
export function dishEmoji(dish: {
  category: Category;
  emoji?: string | null;
}): string {
  return dish.emoji || CATEGORY_EMOJI[dish.category];
}

/** 요리 폼에서 고를 수 있는 이모지 후보 */
export const EMOJI_CHOICES = [
  "🍲", "🥘", "🥣", "🍚", "🍛", "🍜", "🍝", "🍕",
  "🍳", "🥚", "🥩", "🍖", "🥓", "🍗", "🐟", "🦐",
  "🦑", "🥟", "🍤", "🌶️", "🍅", "🥗", "🍢", "🍞",
] as const;

/** 종류별 기본 이모지 (요리별 이모지가 없을 때의 매핑) */
export const CATEGORY_EMOJI: Record<Category, string> = {
  한식: "🍲",
  중식: "🥘",
  양식: "🍝",
  일식: "🍛",
  "분식/기타": "🍜",
};

/**
 * 종류별 차트 색 (엔티티 고정 매핑 — 순서/개수가 바뀌어도 색은 유지).
 * dataviz 검증기 통과 팔레트: 라이트 서피스에서 CVD ΔE 48+, 명도 밴드 내.
 * 중식(#E28A2B)은 서피스 대비 3:1 미만 WARN → 범례에 수치 라벨 필수.
 */
export const CATEGORY_COLOR: Record<Category, string> = {
  한식: "#2f7ff2",
  중식: "#e28a2b",
  양식: "#e25c7e",
  일식: "#8b5cf6",
  "분식/기타": "#1fa39d",
};
