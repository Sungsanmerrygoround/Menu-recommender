"use client";

import BottomSheet from "./BottomSheet";

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

/** window.confirm을 대체하는 디자인된 확인 시트 (파괴적 액션용) */
export default function ConfirmSheet({
  open,
  onClose,
  title,
  description,
  confirmLabel = "삭제하기",
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {description && (
        <p className="-mt-2 mb-5 whitespace-pre-line text-[14px] leading-relaxed text-sub">
          {description}
        </p>
      )}
      <button
        type="button"
        onClick={onConfirm}
        className="press-effect h-[54px] w-full rounded-2xl bg-[#e5484d] text-[16px] font-extrabold text-white shadow-[0_8px_20px_rgba(229,72,77,.3)]"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="press-effect mt-2.5 h-[52px] w-full rounded-2xl bg-field text-[14px] font-bold text-chip-ink"
      >
        취소
      </button>
    </BottomSheet>
  );
}
