"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import Chip from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { daysBetween, todayString } from "@/lib/date-utils";
import { CATEGORY_EMOJI } from "@/lib/emoji";
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
    <main className="px-5 pb-8 pt-10">
      <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-[12px] font-bold text-blue-acc">
        🥗 신선한 한 끼 어때요?
      </span>
      <h1 className="mt-3.5 text-[32px] font-black leading-[1.25] tracking-[-0.02em] text-ink">
        오늘 뭐
        <br />
        <span className="grad-text">해드실래요?</span>
      </h1>

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
      {picked ? (
        <button
          type="button"
          onClick={() => recommend()}
          className="glass-surface press-effect mt-3.5 h-[54px] w-full rounded-[20px] text-[16px] font-bold text-[#44515f]"
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

      {/* 추천 결과 카드 */}
      {picked && (
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
              {CATEGORY_EMOJI[picked.category]}
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
            className="glass-surface press-effect mt-2.5 h-[52px] w-full rounded-2xl text-[14px] font-bold text-[#44515f]"
          >
            다른 메뉴 볼래요
          </button>
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
