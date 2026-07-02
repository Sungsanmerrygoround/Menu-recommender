import type { Category } from "./types";

/** 종류별 기본 이모지 (요리별 이모지 필드가 생기기 전까지의 매핑) */
export const CATEGORY_EMOJI: Record<Category, string> = {
  한식: "🍲",
  중식: "🥘",
  양식: "🍝",
  일식: "🍛",
  "분식/기타": "🍜",
};
