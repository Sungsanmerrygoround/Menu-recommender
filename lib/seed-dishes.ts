import type { DishInput } from "./queries";

/**
 * 새 방을 만들 때 자동으로 등록되는 시드 요리 10개.
 * 기존 전역 시드(002/004/006)에서 종류별로 균형 있게 선정했다.
 * createRoom()에서 room_id를 붙여 방마다 개별 복사본으로 등록한다.
 */
export const SEED_DISHES: DishInput[] = [
  {
    name: "김치찌개",
    category: "한식",
    effort: "쉬움",
    cook_time: 30,
    tags: ["국물", "밥"],
    ingredients: ["김치", "돼지고기", "두부", "대파", "양파"],
    emoji: "🍲",
  },
  {
    name: "된장찌개",
    category: "한식",
    effort: "쉬움",
    cook_time: 25,
    tags: ["국물", "밥"],
    ingredients: ["된장", "두부", "애호박", "감자", "양파", "대파"],
    emoji: "🥣",
  },
  {
    name: "제육볶음",
    category: "한식",
    effort: "중간",
    cook_time: 30,
    tags: ["고기", "밥", "매콤"],
    ingredients: ["돼지고기", "고추장", "양파", "대파", "마늘"],
    emoji: "🥩",
  },
  {
    name: "계란말이",
    category: "한식",
    effort: "쉬움",
    cook_time: 15,
    tags: ["반찬", "밥"],
    ingredients: ["계란", "대파", "당근"],
    emoji: "🍳",
  },
  {
    name: "마파두부",
    category: "중식",
    effort: "중간",
    cook_time: 30,
    tags: ["밥", "매콤"],
    ingredients: ["두부", "다진 돼지고기", "두반장", "대파", "마늘"],
    emoji: "🌶️",
  },
  {
    name: "토마토 파스타",
    category: "양식",
    effort: "중간",
    cook_time: 30,
    tags: ["면"],
    ingredients: ["스파게티면", "토마토소스", "양파", "마늘"],
    emoji: "🍅",
  },
  {
    name: "오므라이스",
    category: "양식",
    effort: "중간",
    cook_time: 25,
    tags: ["밥"],
    ingredients: ["밥", "계란", "양파", "당근", "케첩"],
    emoji: "🥚",
  },
  {
    name: "카레라이스",
    category: "일식",
    effort: "쉬움",
    cook_time: 40,
    tags: ["밥"],
    ingredients: ["카레가루", "감자", "당근", "양파", "돼지고기", "밥"],
    emoji: "🍛",
  },
  {
    name: "떡볶이",
    category: "분식/기타",
    effort: "쉬움",
    cook_time: 25,
    tags: ["매콤", "야식"],
    ingredients: ["떡", "어묵", "고추장", "대파", "설탕"],
    emoji: "🍢",
  },
  {
    name: "라면",
    category: "분식/기타",
    effort: "쉬움",
    cook_time: 10,
    tags: ["면", "국물", "야식"],
    ingredients: ["라면", "계란", "대파"],
    emoji: "🍜",
  },
];
