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
    <main className="px-5 pb-8 pt-14">
      <h1 className="text-[24px] font-bold">내 요리</h1>

      {/* 검색창 */}
      <div className="mt-5">
        <input
          className="w-full rounded-[14px] bg-[#f2f4f6] px-4 py-3.5 text-[15px] placeholder:text-[#b0b8c1] outline-none focus:ring-2 focus:ring-primary/40"
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
              className="press-effect flex cursor-pointer items-center gap-3 rounded-[18px] bg-white p-4"
              onClick={() => setEditing(dish)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">
                  {dish.name}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="blue">{dish.category}</Badge>
                  <Badge>{dish.effort}</Badge>
                  {dish.cook_time != null && <Badge>{dish.cook_time}분</Badge>}
                </div>
                <p className="mt-1.5 text-[13px] text-text-sub">
                  {lastEatenLabel(dish.last_eaten_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEat(dish);
                }}
                className="press-effect shrink-0 rounded-[12px] bg-[#e8f3ff] px-3.5 py-2.5 text-[13px] font-semibold text-primary"
              >
                먹었어요
              </button>
            </div>
          ))
        )}
      </div>

      {/* 플로팅 + 버튼 */}
      <div className="pointer-events-none fixed bottom-[88px] left-1/2 z-30 flex w-full max-w-[480px] -translate-x-1/2 justify-end px-5">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="요리 추가"
          className="press-effect pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[28px] font-light text-white shadow-lg shadow-primary/30"
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
            }}
            onSubmit={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </BottomSheet>
    </main>
  );
}
