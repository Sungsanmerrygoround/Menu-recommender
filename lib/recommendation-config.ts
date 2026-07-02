/**
 * 추천 가중치 설정
 *
 * 추천 성향을 튜닝할 때는 이 파일의 숫자만 바꾸면 된다.
 * 가중치 공식 자체를 바꾸고 싶다면 lib/recommendation.ts의
 * calculateWeight를 교체하면 되고, 화면/DB 코드는 영향받지 않는다.
 */
export interface RecommendationConfig {
  /**
   * 가중치 상한 (일 단위).
   * - 한 번도 먹은 적 없는 요리는 이 값을 그대로 받는다.
   * - 마지막 취식 후 경과일이 이 값을 넘어도 가중치는 여기서 멈춘다.
   */
  MAX_WEIGHT: number;

  /**
   * 쿨다운 기간 (일).
   * 최근 이 일수 이내에 먹은 요리는 가중치를 COOLDOWN_WEIGHT로 강등한다.
   */
  COOLDOWN_DAYS: number;

  /**
   * 쿨다운 상태 요리에 부여할 가중치.
   * 0으로 두면 쿨다운 중인 요리는 아예 추천되지 않는다.
   */
  COOLDOWN_WEIGHT: number;
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  MAX_WEIGHT: 30,
  COOLDOWN_DAYS: 7,
  COOLDOWN_WEIGHT: 1,
};
