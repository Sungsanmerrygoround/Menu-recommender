"use client";

import { useState } from "react";
import Chip from "./Chip";
import { CATEGORIES, EFFORTS, type Category, type Effort } from "@/lib/types";
import type { DishInput } from "@/lib/queries";

interface DishFormProps {
  initial?: DishInput;
  submitLabel?: string;
  onSubmit: (input: DishInput) => Promise<void> | void;
}

export default function DishForm({
  initial,
  submitLabel = "저장하기",
  onSubmit,
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
  const [ingredientsText, setIngredientsText] = useState(
    initial?.ingredients?.join(", ") ?? ""
  );
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
        ingredients: ingredientsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-[14px] bg-[#f1f4f8] px-4 py-3.5 text-[16px] text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-grad-start/40";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-2 block text-[12px] font-extrabold text-sub">
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
        <label className="mb-2 block text-[12px] font-extrabold text-sub">
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
        <label className="mb-2 block text-[12px] font-extrabold text-sub">
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
        <label className="mb-2 block text-[12px] font-extrabold text-sub">
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
        <label className="mb-2 block text-[12px] font-extrabold text-sub">
          재료
        </label>
        <input
          className={inputClass}
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          placeholder="쉼표로 구분 (예: 김치, 돼지고기, 두부)"
        />
      </div>

      <div>
        <label className="mb-2 block text-[12px] font-extrabold text-sub">
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
        className="press-effect grad-primary shadow-btn-grad mt-1 h-[54px] w-full rounded-2xl text-[16px] font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
      >
        {submitting ? "저장 중..." : submitLabel}
      </button>
    </div>
  );
}
