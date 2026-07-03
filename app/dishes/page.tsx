"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/Badge";
import BottomSheet from "@/components/BottomSheet";
import Chip from "@/components/Chip";
import DishForm from "@/components/DishForm";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { daysBetween, todayString } from "@/lib/date-utils";
import { CATEGORY_EMOJI } from "@/lib/emoji";
import {
  addDish,
  deleteDish,
  fetchDishesWithLastEaten,
  logMeal,
  updateDish,
  type DishInput,
} from "@/lib/queries";
import {
  CATEGORIES,
  type Category,
  type DishWithLastEaten,
} from "@/lib/types";

function lastEatenLabel(lastEatenAt: string | null): string {
  if (!lastEatenAt) return "아직 안 먹었어요";
  const days = daysBetween(lastEatenAt, todayString());
  if (days === 0) return "오늘 먹었어요";
  if (days === 1) return "어제 먹었어요";
  return `${days}일 전에 먹었어요`;
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<DishWithLastEaten[] | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<DishWithLastEaten | null>(null);
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

  const filtered = useMemo(() => {
    if (!dishes) return [];
    return dishes.filter((d) => {
      if (categoryFilter && d.category !== categoryFilter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [dishes, search, categoryFilter]);

  async function handleAdd(input: DishInput) {
    await addDish(input);
    setAddOpen(false);
    showToast(`${input.name}을(를) 추가했어요`);
    reload();
  }

  async function handleUpdate(input: DishInput) {
    if (!editing) return;
    await updateDish(editing.id, input);
    setEditing(null);
    showToast("수정했어요");
    reload();
  }

  async function handleDelete() {
    if (!editing) return;
    if (!window.confirm(`'${editing.name}'을(를) 삭제할까요?\n먹은 기록도 함께 삭제돼요.`)) return;
    await deleteDish(editing.id);
    setEditing(null);
    showToast("삭제했어요");
    reload();
  }

  async function handleEat(dish: DishWithLastEaten) {
    await logMeal(dish.id);
    showToast(`${dish.name}을(를) 기록했어요`);
    reload();
  }

  return (
    <main className="px-5 pb-8 pt-10">
      <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-[13px] py-[7px] text-[12px] font-bold text-blue-acc">
        🍳 {dishes ? `${dishes.length}개의 요리` : "내 요리 관리"}
      </span>
      <h1 className="mt-3 text-[24px] font-black tracking-[-0.02em] text-ink">
        내 요리
      </h1>

      {/* 검색창 */}
      <div className="glass-surface mt-4 flex items-center gap-2 rounded-2xl px-4">
        <span className="text-[14px]">🔍</span>
        <input
          className="h-[50px] w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="요리 이름 검색"
        />
      </div>

      {/* 종류 필터 칩 */}
      <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip
          label="전체"
          selected={categoryFilter === null}
          onClick={() => setCategoryFilter(null)}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={categoryFilter === c}
            onClick={() => setCategoryFilter(categoryFilter === c ? null : c)}
          />
        ))}
      </div>

      {/* 리스트 */}
      <div className="mt-4 flex flex-col gap-3">
        {dishes === null ? (
          <SkeletonList />
        ) : error ? (
          <EmptyState
            emoji="😵"
            title="데이터를 불러오지 못했어요"
            description="Supabase에서 스키마 SQL을 실행했는지 확인해주세요"
            actionLabel="다시 시도"
            onAction={reload}
          />
        ) : filtered.length === 0 ? (
          dishes.length === 0 ? (
            <EmptyState
              emoji="🍳"
              title="아직 등록된 요리가 없어요"
              description="만들 수 있는 요리를 추가해보세요"
              actionLabel="요리 추가하기"
              onAction={() => setAddOpen(true)}
            />
          ) : (
            <EmptyState emoji="🔍" title="검색 결과가 없어요" />
          )
        ) : (
          filtered.map((dish) => (
            <div
              key={dish.id}
              className="glass-card shadow-list-lv press-effect flex cursor-pointer items-center gap-3 rounded-[20px] px-4 py-3.5"
              onClick={() => setEditing(dish)}
            >
              <div className="tile-ring flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[24px]">
                {CATEGORY_EMOJI[dish.category]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-extrabold text-ink">
                  {dish.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone="blue" size="sm">
                    {dish.category}
                  </Badge>
                  <Badge size="sm">{dish.effort}</Badge>
                  {dish.cook_time != null && (
                    <Badge size="sm">{dish.cook_time}분</Badge>
                  )}
                </div>
                <p className="mt-1 text-[12px] font-semibold text-sub">
                  {lastEatenLabel(dish.last_eaten_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEat(dish);
                }}
                className="press-effect hit-44 shrink-0 rounded-[14px] border border-blue-btn/[.28] px-[13px] py-[9px] text-[12px] font-extrabold text-blue-btn"
              >
                먹었어요
              </button>
            </div>
          ))
        )}
      </div>

      {/* 플로팅 + 버튼 */}
      <div className="pointer-events-none fixed bottom-[92px] left-1/2 z-30 flex w-full max-w-[480px] -translate-x-1/2 justify-end px-[18px]">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="요리 추가"
          className="grad-primary press-effect pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-[26px] font-light text-white shadow-[0_10px_24px_rgba(42,160,200,.42)]"
        >
          +
        </button>
      </div>

      {/* 추가 바텀시트 */}
      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="요리 추가"
      >
        <DishForm onSubmit={handleAdd} submitLabel="추가하기" />
      </BottomSheet>

      {/* 수정/삭제 바텀시트 */}
      <BottomSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="요리 수정"
      >
        {editing && (
          <DishForm
            initial={{
              name: editing.name,
              category: editing.category,
              effort: editing.effort,
              cook_time: editing.cook_time,
              tags: editing.tags,
              ingredients: editing.ingredients ?? [],
            }}
            onSubmit={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </BottomSheet>
    </main>
  );
}
