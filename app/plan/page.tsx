"use client";

import { useEffect, useMemo, useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import DishPickerSheet from "@/components/DishPickerSheet";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { updateCached, useCachedQuery } from "@/lib/cache";
import { addDays, futureDateLabel, todayString } from "@/lib/date-utils";
import { dishEmoji } from "@/lib/emoji";
import {
  deleteMealPlan,
  fetchDishesWithLastEaten,
  fetchMealPlans,
  upsertMealPlan,
} from "@/lib/queries";
import { DEFAULT_RECOMMENDATION_CONFIG } from "@/lib/recommendation-config";
import { pickRecommendation } from "@/lib/recommendation";
import {
  MEAL_SLOTS,
  type DishWithLastEaten,
  type MealPlanWithDish,
  type MealSlot,
} from "@/lib/types";

const PLAN_DAYS = 7;

function slotKey(date: string, slot: MealSlot): string {
  return `${date}|${slot}`;
}

export default function PlanPage() {
  const today = todayString();
  const rangeEnd = addDays(today, PLAN_DAYS - 1);
  const {
    data: plans,
    error,
    reload,
    mutate: mutatePlans,
  } = useCachedQuery(`plans:${today}:${rangeEnd}`, () =>
    fetchMealPlans(today, rangeEnd)
  );
  const { data: dishes } = useCachedQuery("dishes", fetchDishesWithLastEaten);

  const [working, setWorking] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [picking, setPicking] = useState<{ date: string; slot: MealSlot } | null>(
    null
  );
  const showToast = useToast();

  const dates = useMemo(
    () => Array.from({ length: PLAN_DAYS }, (_, i) => addDays(today, i)),
    [today]
  );

  const planBySlot = useMemo(() => {
    const map = new Map<string, MealPlanWithDish>();
    for (const p of plans ?? []) map.set(slotKey(p.plan_date, p.meal_slot), p);
    return map;
  }, [plans]);

  /** 홈의 오늘 식단 캐시 무효화 (다음 방문 시 재조회) */
  function invalidateHomePlans() {
    updateCached(`plans:${today}:${today}`, () => null);
  }

  /** 같은 날에 이미 배정된 요리 id 목록 (하루 중복 방지) */
  function sameDayDishIds(date: string, exceptSlot?: MealSlot): string[] {
    return (plans ?? [])
      .filter((p) => p.plan_date === date && p.meal_slot !== exceptSlot)
      .map((p) => p.dish_id);
  }

  /** 낙관적으로 칸을 채우고 서버에 저장 */
  async function assignSlot(date: string, slot: MealSlot, dish: DishWithLastEaten) {
    const current = planBySlot.get(slotKey(date, slot));
    const optimistic: MealPlanWithDish = {
      id: current?.id ?? `temp-${Date.now()}`,
      plan_date: date,
      meal_slot: slot,
      dish_id: dish.id,
      created_at: new Date().toISOString(),
      dish,
    };
    mutatePlans((prev) => [
      ...(prev ?? []).filter((p) => !(p.plan_date === date && p.meal_slot === slot)),
      optimistic,
    ]);
    invalidateHomePlans();
    showToast(`${futureDateLabel(date)} ${slot} → ${dish.name}`);
    try {
      await upsertMealPlan(date, slot, dish.id);
      reload(); // 임시 id를 실제 데이터로 교체
    } catch {
      showToast("저장에 실패했어요. 잠시 후 다시 시도해주세요");
      reload();
    }
  }

  /** 저녁 빈 칸만 자동 추첨으로 채우기 (주간 저녁 중복 방지) */
  async function fillEmptyDinners() {
    if (!dishes || dishes.length === 0 || working) return;
    const emptyDates = dates.filter((d) => !planBySlot.has(slotKey(d, "저녁")));
    if (emptyDates.length === 0) {
      showToast("저녁은 이미 모두 채워져 있어요");
      return;
    }
    setWorking(true);
    try {
      const exclude = (plans ?? [])
        .filter((p) => p.meal_slot === "저녁")
        .map((p) => p.dish_id);
      let filled = 0;
      for (const date of emptyDates) {
        const pick = pickRecommendation(dishes, DEFAULT_RECOMMENDATION_CONFIG, {
          excludeIds: [...exclude, ...sameDayDishIds(date)],
        });
        if (!pick) break; // 후보 소진
        await upsertMealPlan(date, "저녁", pick.id);
        exclude.push(pick.id);
        filled++;
      }
      showToast(`저녁 ${filled}일을 채웠어요`);
      invalidateHomePlans();
      await reload();
    } catch {
      showToast("저장에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setWorking(false);
    }
  }

  /** 한 칸 랜덤 뽑기/재추첨 (같은 날 다른 끼니 + 현재 요리 제외) */
  function rollSlot(date: string, slot: MealSlot) {
    if (!dishes) return;
    const current = planBySlot.get(slotKey(date, slot));
    const exclude = sameDayDishIds(date, slot);
    if (current) exclude.push(current.dish_id);
    const pick = pickRecommendation(dishes, DEFAULT_RECOMMENDATION_CONFIG, {
      excludeIds: exclude,
    });
    if (!pick) {
      showToast("바꿀 수 있는 다른 후보가 없어요");
      return;
    }
    assignSlot(date, slot, pick);
  }

  async function removeSlot(date: string, slot: MealSlot) {
    const current = planBySlot.get(slotKey(date, slot));
    if (!current) return;
    mutatePlans(
      (prev) =>
        prev?.filter((p) => !(p.plan_date === date && p.meal_slot === slot)) ??
        prev
    );
    invalidateHomePlans();
    if (current.id.startsWith("temp-")) return;
    try {
      await deleteMealPlan(current.id);
    } catch {
      showToast("삭제에 실패했어요. 잠시 후 다시 시도해주세요");
      reload();
    }
  }

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

  return (
    <main className="px-5 pb-8 pt-10">
      <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-[12px] font-bold text-blue-acc">
        🗓️ 일주일 식사 걱정 끝
      </span>
      <h1 className="mt-3 text-[24px] font-black tracking-[-0.02em] text-ink">
        식단표
      </h1>

      {plans === null && !error ? (
        <div className="mt-6">
          <SkeletonList count={5} />
        </div>
      ) : error && !plans ? (
        <EmptyState
          emoji="😵"
          title="식단표를 불러오지 못했어요"
          description="Supabase에서 003, 005 SQL을 실행했는지 확인해주세요"
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
            onClick={fillEmptyDinners}
            disabled={working}
            className="grad-primary shadow-btn-grad press-effect mt-5 h-[54px] w-full rounded-[20px] text-[16px] font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
          >
            {working ? "처리 중..." : "빈 저녁 채우기 ✨"}
          </button>
          <button
            type="button"
            onClick={() => setShopOpen(true)}
            className="glass-surface press-effect mt-2.5 h-[48px] w-full rounded-[20px] text-[14px] font-bold text-chip-ink"
          >
            🛒 장보기 리스트
          </button>

          <div className="mt-5 flex flex-col gap-3">
            {dates.map((date) => (
              <section key={date}>
                <p className="mb-1.5 text-[12px] font-extrabold text-sub">
                  {futureDateLabel(date)}
                </p>
                <div className="glass-card shadow-list-lv rounded-[20px] px-4">
                  {MEAL_SLOTS.map((slot, idx) => {
                    const plan = planBySlot.get(slotKey(date, slot));
                    const dish = plan?.dish ?? null;
                    return (
                      <div
                        key={slot}
                        className={`flex min-h-[52px] items-center gap-2.5 py-2 ${
                          idx > 0 ? "border-t border-divider" : ""
                        }`}
                      >
                        <span className="w-[30px] shrink-0 text-[11px] font-extrabold text-muted">
                          {slot}
                        </span>
                        {dish ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPicking({ date, slot })}
                              className="press-effect flex min-w-0 flex-1 items-center gap-2 text-left"
                            >
                              <span className="text-[18px]">
                                {dishEmoji(dish)}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                                {dish.name}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => rollSlot(date, slot)}
                              aria-label="다시 뽑기"
                              className="press-effect hit-44 shrink-0 rounded-full border border-blue-btn/[.28] px-2 py-1.5 text-[13px] text-blue-btn"
                            >
                              ↻
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSlot(date, slot)}
                              aria-label="비우기"
                              className="press-effect -m-1.5 p-1.5 text-[12px] font-bold text-dim"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="min-w-0 flex-1 text-[13px] font-semibold text-muted">
                              비어 있음
                            </span>
                            <button
                              type="button"
                              onClick={() => rollSlot(date, slot)}
                              className="press-effect hit-44 shrink-0 rounded-full border border-blue-btn/[.28] px-2.5 py-1.5 text-[11px] font-extrabold text-blue-btn"
                            >
                              🎲 뽑기
                            </button>
                            <button
                              type="button"
                              onClick={() => setPicking({ date, slot })}
                              className="press-effect hit-44 shrink-0 rounded-full border border-line bg-row px-2.5 py-1.5 text-[11px] font-extrabold text-chip-ink"
                            >
                              선택
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {/* 직접 선택 바텀시트 */}
      <DishPickerSheet
        open={picking !== null}
        onClose={() => setPicking(null)}
        title={
          picking
            ? `${futureDateLabel(picking.date)} ${picking.slot} 메뉴 선택`
            : "메뉴 선택"
        }
        dishes={dishes}
        onSelect={(dish) => {
          if (!picking) return;
          const target = picking;
          setPicking(null);
          assignSlot(target.date, target.slot, dish);
        }}
      />

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
                    className="press-effect flex items-center gap-3 rounded-2xl bg-row px-4 py-3 text-left"
                  >
                    <span
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] text-[13px] font-black text-white ${
                        done ? "grad-primary" : "border border-line bg-field"
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
