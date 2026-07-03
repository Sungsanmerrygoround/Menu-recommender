"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "@/components/Badge";
import Chip from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { updateCached, useCachedQuery } from "@/lib/cache";
import { daysBetween, todayString } from "@/lib/date-utils";
import { dishEmoji } from "@/lib/emoji";
import {
  fetchDishesWithLastEaten,
  fetchEatenDishIds,
  fetchMealPlans,
  logMeal,
} from "@/lib/queries";
import { DEFAULT_RECOMMENDATION_CONFIG } from "@/lib/recommendation-config";
import { pickRecommendation } from "@/lib/recommendation";
import {
  CATEGORIES,
  EFFORTS,
  MEAL_SLOTS,
  type Category,
  type DishWithLastEaten,
  type Effort,
  type MealLogWithDish,
} from "@/lib/types";

function LastEatenText({ lastEatenAt }: { lastEatenAt: string | null }) {
  if (!lastEatenAt) {
    return (
      <>
        아직 <b className="font-extrabold text-teal-acc">한 번도</b> 안
        먹었어요
      </>
    );
  }
  const days = daysBetween(lastEatenAt, todayString());
  if (days === 0) {
    return (
      <>
        <b className="font-extrabold text-teal-acc">오늘</b> 먹었어요
      </>
    );
  }
  return (
    <>
      마지막으로 먹은 지{" "}
      <b className="font-extrabold text-teal-acc">{days}일 전</b>
    </>
  );
}

export default function HomePage() {
  const today = todayString();
  const {
    data: dishes,
    error,
    reload,
    mutate: mutateDishes,
  } = useCachedQuery("dishes", fetchDishesWithLastEaten);
  const { data: todayPlans } = useCachedQuery(`plans:${today}:${today}`, () =>
    fetchMealPlans(today, today)
  );
  const { data: eatenIds, mutate: mutateEaten } = useCachedQuery(
    `eaten:${today}`,
    () => fetchEatenDishIds(today)
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [efforts, setEfforts] = useState<Effort[]>([]);
  const [picked, setPicked] = useState<DishWithLastEaten | null>(null);
  const [pickCount, setPickCount] = useState(0); // 카드 재등장 애니메이션 트리거
  const [eaten, setEaten] = useState(false);
  const [noCandidates, setNoCandidates] = useState(false);
  const [rolling, setRolling] = useState(false); // 룰렛 연출 중
  const [rollingDish, setRollingDish] = useState<DishWithLastEaten | null>(null);
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const showToast = useToast();

  // 페이지 이탈 시 룰렛 타이머 정리
  useEffect(() => {
    return () => {
      if (rollTimer.current) clearInterval(rollTimer.current);
    };
  }, []);

  const candidates = useMemo(() => {
    if (!dishes) return [];
    return dishes.filter((d) => {
      if (categories.length > 0 && !categories.includes(d.category))
        return false;
      if (efforts.length > 0 && !efforts.includes(d.effort)) return false;
      return true;
    });
  }, [dishes, categories, efforts]);

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  /** 낙관적 먹었어요: 화면/캐시 즉시 반영 후 서버 저장, 실패 시 롤백 */
  async function optimisticLog(dish: DishWithLastEaten): Promise<boolean> {
    mutateEaten((ids) => [...(ids ?? []), dish.id]);
    mutateDishes(
      (ds) =>
        ds?.map((d) =>
          d.id === dish.id ? { ...d, last_eaten_at: today } : d
        ) ?? ds
    );
    updateCached<MealLogWithDish[]>("logs", (prev) =>
      prev
        ? [
            {
              id: `temp-${Date.now()}`,
              dish_id: dish.id,
              eaten_at: today,
              created_at: new Date().toISOString(),
              dish,
            },
            ...prev,
          ]
        : prev
    );
    showToast(`${dish.name}을(를) 기록했어요`);
    try {
      await logMeal(dish.id);
      updateCached<MealLogWithDish[]>("logs", () => null); // 임시 id 정리(다음 방문 시 재조회)
      return true;
    } catch {
      showToast("기록에 실패했어요. 잠시 후 다시 시도해주세요");
      mutateEaten((ids) => (ids ?? []).filter((id) => id !== dish.id));
      reload();
      return false;
    }
  }

  function reveal(result: DishWithLastEaten) {
    setRolling(false);
    setEaten(false);
    setPicked(result);
    setPickCount((c) => c + 1);
  }

  function recommend(excludeIds: string[] = []) {
    if (rolling) return;
    const result = pickRecommendation(candidates, DEFAULT_RECOMMENDATION_CONFIG, {
      excludeIds,
    });
    if (!result) {
      if (excludeIds.length > 0) {
        showToast("다른 후보가 없어요");
        return;
      }
      setPicked(null);
      setNoCandidates(true);
      return;
    }
    setNoCandidates(false);

    // 룰렛 연출: 후보 이름이 슬롯처럼 지나가다 당첨 메뉴에서 멈춘다.
    const pool = candidates.filter((d) => !excludeIds.includes(d.id));
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (pool.length < 2 || reduceMotion) {
      reveal(result);
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setEaten(false);
    setRolling(true);
    setRollingDish(shuffled[0]);
    const startedAt = Date.now();
    let i = 1;
    rollTimer.current = setInterval(() => {
      if (Date.now() - startedAt > 1100) {
        if (rollTimer.current) clearInterval(rollTimer.current);
        reveal(result);
        return;
      }
      setRollingDish(shuffled[i % shuffled.length]);
      i++;
    }, 75);
  }

  async function handleEat() {
    if (!picked || eaten) return;
    setEaten(true);
    const ok = await optimisticLog(picked);
    if (!ok) setEaten(false);
  }

  // 오늘의 식단 (채워진 끼니만)
  const todaySlots = useMemo(() => {
    if (!todayPlans) return [];
    return MEAL_SLOTS.map((slot) => ({
      slot,
      plan: todayPlans.find((p) => p.meal_slot === slot) ?? null,
    })).filter((s) => s.plan?.dish);
  }, [todayPlans]);

  return (
    <main className="px-5 pb-8 pt-10">
      <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-[12px] font-bold text-blue-acc">
        🥗 신선한 한 끼 어때요?
      </span>
      <h1 className="mt-3.5 text-[32px] font-black leading-[1.25] tracking-[-0.02em] text-ink">
        오늘 뭐
        <br />
        <span className="grad-text">해드실래요?</span>
      </h1>

      {/* 오늘의 식단 (식단표와 연동) */}
      {todaySlots.length > 0 && (
        <section className="glass-card shadow-panel-lv mt-[22px] rounded-[20px] px-4 py-1">
          <div className="flex items-center justify-between pb-1 pt-3">
            <p className="text-[12px] font-extrabold text-teal-acc">
              🗓️ 오늘의 식단
            </p>
            <Link
              href="/plan"
              className="text-[11px] font-bold text-muted underline-offset-2"
            >
              식단표 보기 →
            </Link>
          </div>
          {todaySlots.map(({ slot, plan }) => {
            const dish = plan!.dish!;
            const done = (eatenIds ?? []).includes(dish.id);
            return (
              <div
                key={slot}
                className="flex min-h-[48px] items-center gap-2.5 border-t border-[#eef2f6] py-1.5"
              >
                <span className="w-[30px] shrink-0 text-[11px] font-extrabold text-muted">
                  {slot}
                </span>
                <span className="text-[18px]">{dishEmoji(dish)}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                  {dish.name}
                </span>
                {done ? (
                  <span className="shrink-0 px-1 text-[12px] font-extrabold text-teal-acc">
                    먹었어요 ✓
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      optimisticLog({ ...dish, last_eaten_at: null })
                    }
                    className="press-effect hit-44 shrink-0 rounded-[12px] border border-blue-btn/[.28] px-2.5 py-1.5 text-[11px] font-extrabold text-blue-btn"
                  >
                    먹었어요
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* 필터 패널 */}
      <section className="glass-surface shadow-panel-lv mt-[22px] rounded-3xl p-5">
        <p className="mb-2.5 text-[12px] font-extrabold text-sub">종류</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              check
              selected={categories.includes(c)}
              onClick={() => setCategories((prev) => toggle(prev, c))}
            />
          ))}
        </div>
        <p className="mb-2.5 mt-4 text-[12px] font-extrabold text-sub">노력</p>
        <div className="flex flex-wrap gap-2">
          {EFFORTS.map((e) => (
            <Chip
              key={e}
              label={e}
              check
              selected={efforts.includes(e)}
              onClick={() => setEfforts((prev) => toggle(prev, e))}
            />
          ))}
        </div>
      </section>

      {/* CTA: 추천 전 primary / 추천 후 ghost로 강등 */}
      {picked || rolling ? (
        <button
          type="button"
          onClick={() => recommend()}
          disabled={rolling}
          className="glass-surface press-effect mt-3.5 h-[54px] w-full rounded-[20px] text-[16px] font-bold text-chip-ink disabled:opacity-60"
        >
          다시 추천받기
        </button>
      ) : (
        <button
          type="button"
          onClick={() => recommend()}
          disabled={dishes === null}
          className="grad-primary shadow-btn-grad press-effect mt-3.5 h-[54px] w-full rounded-[20px] text-[16px] font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
        >
          추천받기 ✨
        </button>
      )}

      {/* 룰렛 연출 카드 */}
      {rolling && rollingDish && (
        <div className="glass-card shadow-hero-lv mt-7 rounded-[28px] p-5">
          <span className="grad-tint inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-extrabold text-teal-acc">
            🎲 뽑는 중...
          </span>
          <div className="mt-4 flex items-center gap-3.5">
            <div className="tile-ring flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] text-[34px]">
              {dishEmoji(rollingDish)}
            </div>
            <h2 className="truncate text-[32px] font-black tracking-[-0.02em] text-ink opacity-60">
              {rollingDish.name}
            </h2>
          </div>
        </div>
      )}

      {/* 추천 결과 카드 */}
      {picked && !rolling && (
        <div
          key={`${picked.id}-${pickCount}`}
          className="glass-card shadow-hero-lv animate-card-in mt-7 rounded-[28px] p-5"
        >
          <div className="flex items-center justify-between">
            <span className="grad-tint inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-extrabold text-teal-acc">
              🌿 오늘의 추천
            </span>
            <span className="text-[18px] opacity-55">🎲</span>
          </div>
          <div className="mt-4 flex items-center gap-3.5">
            <div className="tile-ring flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] text-[34px]">
              {dishEmoji(picked)}
            </div>
            <h2 className="text-[32px] font-black tracking-[-0.02em] text-ink">
              {picked.name}
            </h2>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Badge tone="blue">{picked.category}</Badge>
            <Badge>{picked.effort}</Badge>
            {picked.cook_time != null && <Badge>{picked.cook_time}분</Badge>}
            {picked.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
          <p className="glass-surface mt-4 flex items-center gap-2 rounded-[14px] px-3.5 py-3 text-[14px] font-semibold text-sub">
            🕐{" "}
            <span>
              <LastEatenText lastEatenAt={picked.last_eaten_at} />
            </span>
          </p>

          <button
            type="button"
            onClick={handleEat}
            disabled={eaten}
            className="grad-primary shadow-btn-grad press-effect mt-[18px] h-[54px] w-full rounded-2xl text-[16px] font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
          >
            {eaten ? "기록했어요 ✓" : "이거 먹었어요 ✓"}
          </button>
          <button
            type="button"
            onClick={() => recommend([picked.id])}
            className="glass-surface press-effect mt-2.5 h-[52px] w-full rounded-2xl text-[14px] font-bold text-chip-ink"
          >
            다른 메뉴 볼래요
          </button>
        </div>
      )}

      {/* 빈 상태들 */}
      {error && !dishes && (
        <EmptyState
          emoji="😵"
          title="데이터를 불러오지 못했어요"
          description="Supabase에서 스키마 SQL을 실행했는지 확인해주세요"
          actionLabel="다시 시도"
          onAction={reload}
        />
      )}
      {dishes !== null && dishes.length === 0 && (
        <EmptyState
          emoji="🍳"
          title="아직 등록된 요리가 없어요"
          description="내 요리 탭에서 만들 수 있는 요리를 먼저 추가해주세요"
          action={
            <Link
              href="/dishes"
              className="press-effect grad-tint block rounded-[14px] px-5 py-3 text-[14px] font-extrabold text-blue-acc"
            >
              요리 추가하러 가기
            </Link>
          }
        />
      )}
      {noCandidates && dishes !== null && dishes.length > 0 && (
        <EmptyState
          emoji="🤔"
          title="조건에 맞는 요리가 없어요"
          description="필터를 조금 풀어보시겠어요?"
        />
      )}
    </main>
  );
}
