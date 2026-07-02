"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { dateLabel, startOfWeek, todayString } from "@/lib/date-utils";
import { deleteMealLog, fetchMealLogs } from "@/lib/queries";
import type { MealLogWithDish } from "@/lib/types";

export default function HistoryPage() {
  const [logs, setLogs] = useState<MealLogWithDish[] | null>(null);
  const [error, setError] = useState(false);
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

  return (
    <main className="px-5 pb-8 pt-14">
      <h1 className="text-[24px] font-bold">기록</h1>

      {/* 요약 카드 */}
      {summary && (
        <div className="mt-5 flex gap-3">
          <div className="flex-1 rounded-[18px] bg-white p-4">
            <p className="text-[13px] text-text-sub">이번 주 먹은 요리</p>
            <p className="mt-1 text-[22px] font-bold">
              {summary.thisWeekCount}
              <span className="text-[15px] font-semibold">끼</span>
            </p>
          </div>
          <div className="flex-1 rounded-[18px] bg-white p-4">
            <p className="text-[13px] text-text-sub">자주 먹는 종류</p>
            <p className="mt-1 text-[22px] font-bold">
              {summary.topCategory ?? "-"}
            </p>
          </div>
        </div>
      )}

      {/* 타임라인 */}
      {logs === null ? (
        <p className="py-16 text-center text-[14px] text-text-sub">
          불러오는 중...
        </p>
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
              <h2 className="mb-2.5 text-[14px] font-semibold text-text-sub">
                {dateLabel(group.date)}
              </h2>
              <div className="flex flex-col gap-2">
                {group.items.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-[16px] bg-white px-4 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">
                        {log.dish?.name ?? "(삭제된 요리)"}
                      </p>
                    </div>
                    {log.dish && <Badge tone="blue">{log.dish.category}</Badge>}
                    <button
                      type="button"
                      onClick={() => handleDelete(log)}
                      aria-label="기록 삭제"
                      className="press-effect flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] text-[#b0b8c1]"
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
    </main>
  );
}
