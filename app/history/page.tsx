"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import BottomSheet from "@/components/BottomSheet";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { dateLabel, startOfWeek, todayString } from "@/lib/date-utils";
import { CATEGORY_EMOJI } from "@/lib/emoji";
import {
  deleteMealLog,
  fetchDishesWithLastEaten,
  fetchMealLogs,
  logMeal,
} from "@/lib/queries";
import type { Category, DishWithLastEaten, MealLogWithDish } from "@/lib/types";

export default function HistoryPage() {
  const [logs, setLogs] = useState<MealLogWithDish[] | null>(null);
  const [error, setError] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [dishes, setDishes] = useState<DishWithLastEaten[] | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const showToast = useToast();

  const reload = useCallback(async () => {
    try {
      setError(false);
      setLogs(await fetchMealLogs());
    } catch {
      setError(true);
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // 날짜별 그룹핑 (이미 최근순 정렬됨)
  const groups = useMemo(() => {
    if (!logs) return [];
    const result: { date: string; items: MealLogWithDish[] }[] = [];
    for (const log of logs) {
      const last = result[result.length - 1];
      if (last && last.date === log.eaten_at) {
        last.items.push(log);
      } else {
        result.push({ date: log.eaten_at, items: [log] });
      }
    }
    return result;
  }, [logs]);

  // 요약: 이번 주(월요일 시작) 먹은 수 + 가장 자주 먹은 종류
  const summary = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    const weekStart = startOfWeek(todayString());
    const thisWeekCount = logs.filter((l) => l.eaten_at >= weekStart).length;

    const categoryCounts = new Map<string, number>();
    for (const log of logs) {
      if (!log.dish) continue;
      categoryCounts.set(
        log.dish.category,
        (categoryCounts.get(log.dish.category) ?? 0) + 1
      );
    }
    let topCategory: string | null = null;
    let topCount = 0;
    for (const [category, count] of categoryCounts) {
      if (count > topCount) {
        topCategory = category;
        topCount = count;
      }
    }
    return { thisWeekCount, topCategory };
  }, [logs]);

  async function handleDelete(log: MealLogWithDish) {
    const name = log.dish?.name ?? "이 기록";
    if (!window.confirm(`'${name}' 기록을 삭제할까요?`)) return;
    try {
      await deleteMealLog(log.id);
    } catch {
      showToast("삭제에 실패했어요. 잠시 후 다시 시도해주세요");
      return;
    }
    showToast("기록을 삭제했어요");
    reload();
  }

  // FAB: 추천 없이 직접 기록
  async function openLogSheet() {
    setLogSearch("");
    setLogOpen(true);
    if (dishes === null) {
      try {
        setDishes(await fetchDishesWithLastEaten());
      } catch {
        setDishes([]);
      }
    }
  }

  const logCandidates = useMemo(() => {
    if (!dishes) return [];
    if (!logSearch) return dishes;
    return dishes.filter((d) =>
      d.name.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [dishes, logSearch]);

  async function handleDirectLog(dishId: string, name: string) {
    try {
      await logMeal(dishId);
    } catch {
      showToast("기록에 실패했어요. 잠시 후 다시 시도해주세요");
      return;
    }
    setLogOpen(false);
    showToast(`${name}을(를) 기록했어요`);
    reload();
  }

  return (
    <main className="px-5 pb-8 pt-10">
      <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-[12px] font-bold text-blue-acc">
        📅 오늘도 잘 챙겨 드세요
      </span>
      <h1 className="mt-3 text-[24px] font-black tracking-[-0.02em] text-ink">
        기록
      </h1>

      {/* 요약 카드 */}
      {summary && (
        <div className="mt-6 flex gap-3">
          <div className="glass-card shadow-panel-lv flex-1 rounded-[20px] p-4">
            <p className="text-[12px] font-bold text-sub">이번 주 먹은 요리</p>
            <p className="mt-1 text-[24px] font-black tracking-[-0.02em] text-ink">
              {summary.thisWeekCount}
              <span className="text-[14px] font-extrabold">끼</span>
            </p>
          </div>
          <div className="glass-card shadow-panel-lv flex-1 rounded-[20px] p-4">
            <p className="text-[12px] font-bold text-sub">자주 먹는 종류</p>
            <p className="mt-1 text-[24px] font-black tracking-[-0.02em] text-ink">
              {summary.topCategory ?? "-"}
            </p>
          </div>
        </div>
      )}

      {/* 타임라인 */}
      {logs === null ? (
        <div className="mt-6">
          <SkeletonList />
        </div>
      ) : error ? (
        <EmptyState
          emoji="😵"
          title="데이터를 불러오지 못했어요"
          description="Supabase에서 스키마 SQL을 실행했는지 확인해주세요"
          actionLabel="다시 시도"
          onAction={reload}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title="아직 먹은 기록이 없어요"
          description="추천받은 메뉴를 먹고 '먹었어요'를 눌러보세요"
        />
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="mb-2 text-[12px] font-extrabold text-sub">
                {dateLabel(group.date)}
              </h2>
              <div className="flex flex-col gap-2">
                {group.items.map((log) => (
                  <div
                    key={log.id}
                    className="glass-card shadow-list-lv flex items-center gap-2.5 rounded-[20px] px-4 py-3"
                  >
                    <span className="text-[20px]">
                      {log.dish ? CATEGORY_EMOJI[log.dish.category as Category] : "🍽️"}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                      {log.dish?.name ?? "(삭제된 요리)"}
                    </p>
                    {log.dish && (
                      <Badge tone="blue" size="sm">
                        {log.dish.category}
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(log)}
                      aria-label="기록 삭제"
                      className="press-effect -m-3 p-3 text-[14px] font-bold text-[#b3bcc7]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 플로팅 + 버튼: 추천 없이 직접 기록 */}
      <div className="pointer-events-none fixed bottom-[92px] left-1/2 z-30 flex w-full max-w-[480px] -translate-x-1/2 justify-end px-[18px]">
        <button
          type="button"
          onClick={openLogSheet}
          aria-label="직접 기록"
          className="grad-primary press-effect pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-[26px] font-light text-white shadow-[0_10px_24px_rgba(42,160,200,.42)]"
        >
          +
        </button>
      </div>

      {/* 직접 기록 바텀시트 */}
      <BottomSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="먹은 요리 기록"
      >
        <input
          className="w-full rounded-[14px] bg-[#f1f4f8] px-4 py-3.5 text-[16px] text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-grad-start/40"
          value={logSearch}
          onChange={(e) => setLogSearch(e.target.value)}
          placeholder="요리 이름 검색"
        />
        <div className="mt-4 flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
          {dishes === null ? (
            <p className="py-8 text-center text-[14px] text-sub">
              불러오는 중...
            </p>
          ) : logCandidates.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-sub">
              {dishes.length === 0
                ? "내 요리 탭에서 요리를 먼저 추가해주세요"
                : "검색 결과가 없어요"}
            </p>
          ) : (
            logCandidates.map((dish) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => handleDirectLog(dish.id, dish.name)}
                className="press-effect flex items-center gap-3 rounded-2xl bg-[#f6f8fb] px-4 py-3 text-left"
              >
                <span className="text-[20px]">
                  {CATEGORY_EMOJI[dish.category]}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                  {dish.name}
                </span>
                <Badge tone="blue" size="sm">
                  {dish.category}
                </Badge>
              </button>
            ))
          )}
        </div>
      </BottomSheet>
    </main>
  );
}
