"use client";

import { useState } from "react";
import Chip from "./Chip";
import { CATEGORIES, EFFORTS, type Category, type Effort } from "@/lib/types";
import type { DishInput } from "@/lib/queries";

interface DishFormProps {
  initial?: DishInput;
  submitLabel?: string;
  onSubmit: (input: DishInput) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

export default function DishForm({
  initial,
  submitLabel = "저장하기",
  onSubmit,
  onDelete,
}: DishFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<Category | null>(
    initial?.category ?? null
  );
  const [effort, setEffort] = useState<Effort | null>(initial?.effort ?? null);
  const [cookTime, setCookTime] = useState(
    initial?.cook_time != null ? String(initial.cook_time) : ""
  );
  const [tagsText, setTagsText] = useState(initial?.tags.join(", ") ?? "");
  const [submitting, setSubmitting] = useState(false);

  const valid = name.trim().length > 0 && category !== null && effort !== null;

  async function handleSubmit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const parsedTime = parseInt(cookTime, 10);
      await onSubmit({
        name: name.trim(),
        category: category!,
        effort: effort!,
        cook_time: Number.isNaN(parsedTime) ? null : parsedTime,
        tags: tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-[14px] bg-[#f2f4f6] px-4 py-3.5 text-[15px] text-text-main placeholder:text-[#b0b8c1] outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-text-sub">
          이름
        </label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 김치찌개"
        />
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-text-sub">
          종류
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-text-sub">
          노력
        </label>
        <div className="flex flex-wrap gap-2">
          {EFFORTS.map((e) => (
            <Chip
              key={e}
              label={e}
              selected={effort === e}
              onClick={() => setEffort(e)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-text-sub">
          소요 시간 (분)
        </label>
        <input
          className={inputClass}
          type="number"
          inputMode="numeric"
          min={0}
          value={cookTime}
          onChange={(e) => setCookTime(e.target.value)}
          placeholder="예: 30"
        />
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-text-sub">
          태그
        </label>
        <input
          className={inputClass}
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="쉼표로 구분 (예: 국물, 밥)"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!valid || submitting}
        className="press-effect mt-1 h-[54px] w-full rounded-[14px] bg-primary text-[16px] font-bold text-white disabled:bg-[#d1d6db]"
      >
        {submitting ? "저장 중..." : submitLabel}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="press-effect -mt-1 h-[48px] w-full rounded-[14px] text-[15px] font-semibold text-[#f04452]"
        >
          삭제하기
        </button>
      )}
    </div>
  );
}
