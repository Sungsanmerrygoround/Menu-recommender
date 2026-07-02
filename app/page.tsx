"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import Chip from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { daysBetween, todayString } from "@/lib/date-utils";
import { fetchDishesWithLastEaten, logMeal } from "@/lib/queries";
import { DEFAULT_RECOMMENDATION_CONFIG } from "@/lib/recommendation-config";
import { pickRecommendation } from "@/lib/recommendation";
import {
  CATEGORIES,
  EFFORTS,
  type Category,
  type DishWithLastEaten,
  type Effort,
} from "@/lib/types";

function lastEatenText(lastEatenAt: string | null): string {
  if (!lastEatenAt) return "아직 한 번도 안 먹었어요";
  const days = daysBetween(lastEatenAt, todayString());
  if (days === 0) return "오늘 먹었어요";
  return `마지막으로 먹은 지 ${days}일 전`;
}

export default function HomePage() {
  const [dishes, setDishes] = useState<DishWithLastEaten[] | null>(null);
  const [error, setError] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [efforts, setEfforts] = useState<Effort[]>([]);
  const [picked, setPicked] = useState<DishWithLastEaten | null>(null);
  const [pickCount, setPickCount] = useState(0); // 카드 재등장 애니메이션 트리거
  const [eaten, setEaten] = useState(false);
  const [noCandidates, setNoCandidates] = useState(false);
  const showToast = useToast();

  const reload = useCallback(async () => {
    try {
      setError(false);
      setDishes(await fetchDishesWithLastEaten());
    } catch {
      setError(true);
      setDishes([]);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

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

  function recommend(excludeIds: string[] = []) {
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
    setEaten(false);
    setPicked(result);
    setPickCount((c) => c + 1);
  }

  async function handleEat() {
    if (!picked || eaten) return;
    try {
      await logMeal(picked.id);
    } catch {
      showToast("기록에 실패했어요. 잠시 후 다시 시도해주세요");
      return;
    }
    setEaten(true);
    showToast(`${picked.name}을(를) 기록했어요`);
    reload();
  }

  return (
    <main className="px-5 pb-8 pt-14">
      <h1 className="text-[26px] font-bold leading-snug">
        오늘 뭐
        <br />
        해드실래요?
      </h1>

      {/* 필터 칩 */}
      <section className="mt-7">
        <p className="mb-2.5 text-[13px] font-semibold text-text-sub">종류</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={categories.includes(c)}
              onClick={() => setCategories((prev) => toggle(prev, c))}
            />
          ))}
        </div>
        <p className="mb-2.5 mt-5 text-[13px] font-semibold text-text-sub">
          노력
        </p>
        <div className="flex flex-wrap gap-2">
          {EFFORTS.map((e) => (
            <Chip
              key={e}
              label={e}
              selected={efforts.includes(e)}
              onClick={() => setEfforts((prev) => toggle(prev, e))}
            />
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => recommend()}
        disabled={dishes === null}
        className="press-effect mt-8 h-14 w-full rounded-[14px] bg-primary text-[17px] font-bold text-white disabled:bg-[#d1d6db]"
      >
        추천받기
      </button>

      {/* 추천 결과 카드 */}
      {picked && (
        <div
          key={`${picked.id}-${pickCount}`}
          className="animate-card-in mt-6 rounded-[20px] bg-white p-6"
        >
          <p className="text-[13px] font-medium text-text-sub">오늘의 추천</p>
          <h2 className="mt-1.5 text-[26px] font-bold leading-snug">
            {picked.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge tone="blue">{picked.category}</Badge>
            <Badge>{picked.effort}</Badge>
            {picked.cook_time != null && <Badge>{picked.cook_time}분</Badge>}
            {picked.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
          <p className="mt-4 text-[14px] font-medium text-primary">
            {lastEatenText(picked.last_eaten_at)}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleEat}
              disabled={eaten}
              className="press-effect h-[54px] w-full rounded-[14px] bg-primary text-[16px] font-bold text-white disabled:bg-[#d1d6db]"
            >
              {eaten ? "기록했어요 ✓" : "이거 먹었어요 ✓"}
            </button>
            <button
              type="button"
              onClick={() => recommend([picked.id])}
              className="press-effect h-[54px] w-full rounded-[14px] bg-[#f2f4f6] text-[16px] font-semibold text-[#4e5968]"
            >
              다른 메뉴 볼래요
            </button>
          </div>
        </div>
      )}

      {/* 빈 상태들 */}
      {error && (
        <EmptyState
          emoji="😵"
          title="데이터를 불러오지 못했어요"
          description="Supabase에서 스키마 SQL을 실행했는지 확인해주세요"
          actionLabel="다시 시도"
          onAction={reload}
        />
      )}
      {!error && dishes !== null && dishes.length === 0 && (
        <EmptyState
          emoji="🍳"
          title="아직 등록된 요리가 없어요"
          description="내 요리 탭에서 만들 수 있는 요리를 먼저 추가해주세요"
          action={
            <Link
              href="/dishes"
              className="press-effect block rounded-[14px] bg-[#e8f3ff] px-5 py-3 text-[15px] font-semibold text-primary"
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
