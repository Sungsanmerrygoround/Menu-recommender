"use client";

import { useMemo, useState } from "react";
import Badge from "./Badge";
import BottomSheet from "./BottomSheet";
import { CATEGORY_EMOJI } from "@/lib/emoji";
import type { DishWithLastEaten } from "@/lib/types";

interface DishPickerSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  dishes: DishWithLastEaten[] | null;
  onSelect: (dish: DishWithLastEaten) => void;
}

/** 검색 + 요리 목록에서 하나를 고르는 바텀시트 */
export default function DishPickerSheet({
  open,
  onClose,
  title,
  dishes,
  onSelect,
}: DishPickerSheetProps) {
  const [search, setSearch] = useState("");

  const candidates = useMemo(() => {
    if (!dishes) return [];
    if (!search) return dishes;
    return dishes.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [dishes, search]);

  function handleClose() {
    setSearch("");
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title={title}>
      <input
        className="w-full rounded-[14px] bg-[#f1f4f8] px-4 py-3.5 text-[16px] text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-grad-start/40"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="요리 이름 검색"
      />
      <div className="mt-4 flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
        {dishes === null ? (
          <p className="py-8 text-center text-[14px] text-sub">
            불러오는 중...
          </p>
        ) : candidates.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-sub">
            {dishes.length === 0
              ? "내 요리 탭에서 요리를 먼저 추가해주세요"
              : "검색 결과가 없어요"}
          </p>
        ) : (
          candidates.map((dish) => (
            <button
              key={dish.id}
              type="button"
              onClick={() => {
                setSearch("");
                onSelect(dish);
              }}
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
  );
}
