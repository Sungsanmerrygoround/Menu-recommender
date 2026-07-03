"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import BottomSheet from "@/components/BottomSheet";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import {
  addDays,
  dateLabel,
  daysBetween,
  startOfWeek,
  todayString,
} from "@/lib/date-utils";
import { CATEGORY_COLOR, CATEGORY_EMOJI } from "@/lib/emoji";
import {
  deleteMealLog,
  fetchDishesWithLastEaten,
  fetchMealLogs,
  logMeal,
} from "@/lib/queries";
import {
  CATEGORIES,
  type Category,
  type DishWithLastEaten,
  type MealLogWithDish,
} from "@/lib/types";

export default function HistoryPage() {
  const [logs, setLogs] = useState<MealLogWithDish[] | null>(null);
  const [dishes, setDishes] = useState<DishWithLastEaten[] | null>(null);
  const [error, setError] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const showToast = useToast();

  const today = todayString();

  const reload = useCallback(async () => {
    try {
      setError(false);
      const [logData, dishData] = await Promise.all([
        fetchMealLogs(),
        fetchDishesWithLastEaten(),
      ]);
      setLogs(logData);
      setDishes(dishData);
    } catch {
      setError(true);
      setLogs([]);
      setDishes([]);
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

  // 요약: 이번 주 끼니 수 + 연속 기록(스트릭)
  const summary = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    const weekStart = startOfWeek(today);
    const thisWeekCount = logs.filter((l) => l.eaten_at >= weekStart).length;

    const logDates = new Set(logs.map((l) => l.eaten_at));
    let streak = 0;
    let cursor = logDates.has(today) ? today : addDays(today, -1);
    while (logDates.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return { thisWeekCount, streak };
  }, [logs, today]);

  // 이번 달 리포트: 끼니 수 + 종류별 분포
  const monthReport = useMemo(() => {
    if (!logs) return null;
    const monthStart = `${today.slice(0, 8)}01`;
    const monthLogs = logs.filter((l) => l.eaten_at >= monthStart);
    if (monthLogs.length === 0) return null;

    const counts = new Map<Category, number>();
    for (const log of monthLogs) {
      if (!log.dish) continue;
      const cat = log.dish.category as Category;
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    // 엔티티 고정 순서(CATEGORIES)로 세그먼트 구성 — 색은 항상 종류를 따라감
    const segments = CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0).map(
      (c) => ({ category: c, count: counts.get(c)! })
    );
    const total = segments.reduce((sum, s) => sum + s.count, 0);
    return { monthCount: monthLogs.length, segments, total };
  }, [logs, today]);

  // 오래 안 먹은 요리 TOP 3 (한 번도 안 먹은 요리 우선)
  const forgotten = useMemo(() => {
    if (!dishes || dishes.length === 0) return [];
    return [...dishes]
      .sort((a, b) => {
        if (a.last_eaten_at === null && b.last_eaten_at === null) return 0;
        if (a.last_eaten_at === null) return -1;
        if (b.last_eaten_at === null) return 1;
        return a.last_eaten_at.localeCompare(b.last_eaten_at);
      })
      .slice(0, 3);
  }, [dishes]);

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

  async function quickLog(dishId: string, name: string) {
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

  const logCandidates = useMemo(() => {
    if (!dishes) return [];
    if (!logSearch) return dishes;
    return dishes.filter((d) =>
      d.name.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [dishes, logSearch]);

  return (
    <main className="px-5 pb-8 pt-10">
      <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-[12px] font-bold text-blue-acc">
        📅 오늘도 잘 챙겨 드세요
      </span>
      <h1 className="mt-3 text-[24px] font-black tracking-[-0.02em] text-ink">
        기록
      </h1>

      {/* 요약 스탯 타일 */}
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
            <p className="text-[12px] font-bold text-sub">연속 기록</p>
            <p className="mt-1 text-[24px] font-black tracking-[-0.02em] text-ink">
              🔥 {summary.streak}
              <span className="text-[14px] font-extrabold">일</span>
            </p>
          </div>
        </div>
      )}

      {/* 이번 달 종류 분포 */}
      {monthReport && (
        <div className="glass-card shadow-panel-lv mt-3 rounded-[20px] p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] font-bold text-sub">이번 달 집밥</p>
            <p className="text-[14px] font-extrabold text-ink">
              {monthReport.monthCount}끼
            </p>
          </div>
          <div className="mt-3 flex h-[14px] w-full gap-[2px] overflow-hidden rounded-full">
            {monthReport.segments.map((s) => (
              <div
                key={s.category}
                className="h-full"
                style={{
                  width: `${(s.count / monthReport.total) * 100}%`,
                  backgroundColor: CATEGORY_COLOR[s.category],
                }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {monthReport.segments.map((s) => (
              <span
                key={s.category}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-sub"
              >
                <i
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[s.category] }}
                />
                {s.category}{" "}
                <b className="font-extrabold text-ink">{s.count}끼</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 오래 안 먹은 요리 TOP 3 */}
      {forgotten.length > 0 && (
        <div className="glass-card shadow-panel-lv mt-3 rounded-[20px] p-4">
          <p className="text-[12px] font-bold text-sub">
            요즘 잊고 지낸 요리 ⏰
          </p>
          <div className="mt-2.5 flex flex-col gap-2">
            {forgotten.map((dish) => (
              <div key={dish.id} className="flex items-center gap-2.5">
                <span className="text-[18px]">
                  {CATEGORY_EMOJI[dish.category]}
                </span>
                <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
                  {dish.name}
                </p>
                <span className="text-[12px] font-semibold text-sub">
                  {dish.last_eaten_at === null
                    ? "아직 한 번도"
                    : `${daysBetween(dish.last_eaten_at, today)}일 전`}
                </span>
                <button
                  type="button"
                  onClick={() => quickLog(dish.id, dish.name)}
                  className="press-effect hit-44 shrink-0 rounded-[12px] border border-blue-btn/[.28] px-2.5 py-1.5 text-[11px] font-extrabold text-blue-btn"
                >
                  먹었어요
                </button>
              </div>
            ))}
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
          onClick={() => {
            setLogSearch("");
            setLogOpen(true);
          }}
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
                onClick={() => quickLog(dish.id, dish.name)}
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
