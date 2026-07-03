"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import BottomSheet from "@/components/BottomSheet";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { addDays, futureDateLabel, todayString } from "@/lib/date-utils";
import { CATEGORY_EMOJI } from "@/lib/emoji";
import {
  deleteMealPlan,
  fetchDishesWithLastEaten,
  fetchMealPlans,
  upsertMealPlan,
} from "@/lib/queries";
import { DEFAULT_RECOMMENDATION_CONFIG } from "@/lib/recommendation-config";
import { pickRecommendation } from "@/lib/recommendation";
import type { DishWithLastEaten, MealPlanWithDish } from "@/lib/types";

const PLAN_DAYS = 7;

export default function PlanPage() {
  const [plans, setPlans] = useState<MealPlanWithDish[] | null>(null);
  const [dishes, setDishes] = useState<DishWithLastEaten[] | null>(null);
  const [error, setError] = useState(false);
  const [working, setWorking] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const showToast = useToast();

  const today = todayString();
  const dates = useMemo(
    () => Array.from({ length: PLAN_DAYS }, (_, i) => addDays(today, i)),
    [today]
  );

  const reload = useCallback(async () => {
    try {
      setError(false);
      const [planData, dishData] = await Promise.all([
        fetchMealPlans(today, addDays(today, PLAN_DAYS - 1)),
        fetchDishesWithLastEaten(),
      ]);
      setPlans(planData);
      setDishes(dishData);
    } catch {
      setError(true);
      setPlans([]);
      setDishes([]);
    }
  }, [today]);

  useEffect(() => {
    reload();
  }, [reload]);

  const planByDate = useMemo(() => {
    const map = new Map<string, MealPlanWithDish>();
    for (const p of plans ?? []) map.set(p.plan_date, p);
    return map;
  }, [plans]);

  // 장보기 리스트: 이번 주 식단의 재료를 합산 (재료명 → 사용 요리 목록)
  const shoppingList = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of plans ?? []) {
      if (!p.dish) continue;
      for (const ing of p.dish.ingredients ?? []) {
        const users = map.get(ing) ?? [];
        users.push(p.dish.name);
        map.set(ing, users);
      }
    }
    return [...map.entries()]
      .map(([name, usedBy]) => ({ name, usedBy }))
      .sort(
        (a, b) => b.usedBy.length - a.usedBy.length || a.name.localeCompare(b.name)
      );
  }, [plans]);

  // 체크 상태는 주(시작일) 단위로 로컬에 저장
  const checkedKey = `shopping-checked:${today}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(checkedKey);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
  }, [checkedKey]);

  function toggleChecked(name: string) {
    setChecked((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      try {
        localStorage.setItem(checkedKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  async function copyShoppingList() {
    const lines = shoppingList
      .filter((item) => !checked[item.name])
      .map((item) => `- ${item.name}`);
    if (lines.length === 0) {
      showToast("복사할 항목이 없어요");
      return;
    }
    try {
      await navigator.clipboard.writeText(`🛒 장보기 리스트\n${lines.join("\n")}`);
      showToast("장보기 리스트를 복사했어요");
    } catch {
      showToast("복사에 실패했어요");
    }
  }

  /** 이번 주에 이미 배정된 요리 id 목록 (중복 방지용) */
  function plannedDishIds(except?: string): string[] {
    return (plans ?? [])
      .filter((p) => p.plan_date !== except)
      .map((p) => p.dish_id);
  }

  /** 빈 날들을 가중치 추첨으로 채우기 */
  async function fillEmptyDays() {
    if (!dishes || dishes.length === 0 || working) return;
    const emptyDates = dates.filter((d) => !planByDate.has(d));
    if (emptyDates.length === 0) {
      showToast("이미 모든 날이 채워져 있어요");
      return;
    }
    setWorking(true);
    try {
      const exclude = plannedDishIds();
      let filled = 0;
      for (const date of emptyDates) {
        const pick = pickRecommendation(dishes, DEFAULT_RECOMMENDATION_CONFIG, {
          excludeIds: exclude,
        });
        if (!pick) break; // 후보 소진 (요리 수 < 7일)
        await upsertMealPlan(date, pick.id);
        exclude.push(pick.id);
        filled++;
      }
      showToast(`${filled}일 식단을 채웠어요`);
      await reload();
    } catch {
      showToast("저장에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setWorking(false);
    }
  }

  /** 하루 재추첨 (이번 주 다른 요리 + 현재 요리 제외) */
  async function rerollDay(date: string) {
    if (!dishes || working) return;
    const current = planByDate.get(date);
    const exclude = plannedDishIds(date);
    if (current) exclude.push(current.dish_id);
    const pick = pickRecommendation(dishes, DEFAULT_RECOMMENDATION_CONFIG, {
      excludeIds: exclude,
    });
    if (!pick) {
      showToast("바꿀 수 있는 다른 후보가 없어요");
      return;
    }
    setWorking(true);
    try {
      await upsertMealPlan(date, pick.id);
      showToast(`${futureDateLabel(date)} → ${pick.name}`);
      await reload();
    } catch {
      showToast("저장에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setWorking(false);
    }
  }

  async function removeDay(date: string) {
    const current = planByDate.get(date);
    if (!current || working) return;
    setWorking(true);
    try {
      await deleteMealPlan(current.id);
      await reload();
    } catch {
      showToast("삭제에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="px-5 pb-8 pt-10">
      <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-[12px] font-bold text-blue-acc">
        🗓️ 일주일 저녁 걱정 끝
      </span>
      <h1 className="mt-3 text-[24px] font-black tracking-[-0.02em] text-ink">
        식단표
      </h1>

      {plans === null ? (
        <div className="mt-6">
          <SkeletonList count={5} />
        </div>
      ) : error ? (
        <EmptyState
          emoji="😵"
          title="식단표를 불러오지 못했어요"
          description="Supabase에서 003_meal_plans.sql을 실행했는지 확인해주세요"
          actionLabel="다시 시도"
          onAction={reload}
        />
      ) : dishes !== null && dishes.length === 0 ? (
        <EmptyState
          emoji="🍳"
          title="아직 등록된 요리가 없어요"
          description="요리를 먼저 추가해야 식단을 짤 수 있어요"
          action={
            <Link
              href="/dishes"
              className="press-effect grad-tint block rounded-[14px] px-5 py-3 text-[14px] font-extrabold text-blue-acc"
            >
              요리 추가하러 가기
            </Link>
          }
        />
      ) : (
        <>
          <button
            type="button"
            onClick={fillEmptyDays}
            disabled={working}
            className="grad-primary shadow-btn-grad press-effect mt-5 h-[54px] w-full rounded-[20px] text-[16px] font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
          >
            {working ? "채우는 중..." : "빈 날 채우기 ✨"}
          </button>
          <button
            type="button"
            onClick={() => setShopOpen(true)}
            className="glass-surface press-effect mt-2.5 h-[48px] w-full rounded-[20px] text-[14px] font-bold text-[#44515f]"
          >
            🛒 장보기 리스트
          </button>

          <div className="mt-5 flex flex-col gap-2.5">
            {dates.map((date) => {
              const plan = planByDate.get(date);
              const dish = plan?.dish ?? null;
              return (
                <div key={date}>
                  <p className="mb-1.5 text-[12px] font-extrabold text-sub">
                    {futureDateLabel(date)}
                  </p>
                  {dish ? (
                    <div className="glass-card shadow-list-lv flex items-center gap-3 rounded-[20px] px-4 py-3">
                      <div className="tile-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[22px]">
                        {CATEGORY_EMOJI[dish.category]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-extrabold text-ink">
                          {dish.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Badge tone="blue" size="sm">
                            {dish.category}
                          </Badge>
                          <Badge size="sm">{dish.effort}</Badge>
                          {dish.cook_time != null && (
                            <Badge size="sm">{dish.cook_time}분</Badge>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => rerollDay(date)}
                        disabled={working}
                        aria-label="다시 뽑기"
                        className="press-effect hit-44 shrink-0 rounded-full border border-blue-btn/[.28] px-2.5 py-2 text-[14px] text-blue-btn"
                      >
                        ↻
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDay(date)}
                        disabled={working}
                        aria-label="비우기"
                        className="press-effect -m-1 p-1 text-[13px] font-bold text-[#b3bcc7]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => rerollDay(date)}
                      disabled={working}
                      className="glass-surface press-effect flex w-full items-center justify-center gap-1.5 rounded-[20px] border-dashed py-4 text-[14px] font-bold text-sub"
                    >
                      + 메뉴 뽑기
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 장보기 리스트 바텀시트 */}
      <BottomSheet
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        title="장보기 리스트 🛒"
      >
        {shoppingList.length === 0 ? (
          <p className="py-8 text-center text-[14px] leading-relaxed text-sub">
            {(plans ?? []).length === 0
              ? "먼저 식단을 채워주세요"
              : "이번 주 요리에 등록된 재료가 없어요.\n내 요리에서 재료를 채워보세요"}
          </p>
        ) : (
          <>
            <div className="flex max-h-[50dvh] flex-col gap-1.5 overflow-y-auto">
              {shoppingList.map((item) => {
                const done = !!checked[item.name];
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleChecked(item.name)}
                    className="press-effect flex items-center gap-3 rounded-2xl bg-[#f6f8fb] px-4 py-3 text-left"
                  >
                    <span
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] text-[13px] font-black text-white ${
                        done ? "grad-primary" : "border border-[#d5dce4] bg-white"
                      }`}
                    >
                      {done ? "✓" : ""}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-[14px] font-bold ${
                        done ? "text-muted line-through" : "text-ink"
                      }`}
                    >
                      {item.name}
                      {item.usedBy.length > 1 && (
                        <b className="ml-1 font-extrabold text-blue-acc">
                          ×{item.usedBy.length}
                        </b>
                      )}
                    </span>
                    <span className="max-w-[40%] truncate text-[11px] font-semibold text-muted">
                      {item.usedBy.join(", ")}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={copyShoppingList}
              className="grad-primary shadow-btn-grad press-effect mt-4 h-[50px] w-full rounded-2xl text-[14px] font-extrabold text-white"
            >
              남은 항목 복사하기
            </button>
          </>
        )}
      </BottomSheet>
    </main>
  );
}
