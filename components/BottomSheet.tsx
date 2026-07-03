"use client";

import { useEffect } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 제목 오른쪽에 표시할 액션 (예: 삭제 버튼) */
  titleAction?: React.ReactNode;
  children: React.ReactNode;
}

export default function BottomSheet({
  open,
  onClose,
  title,
  titleAction,
  children,
}: BottomSheetProps) {
  // 시트가 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="animate-fade-in absolute inset-0 bg-[#17202b]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px]">
        <div className="animate-sheet-up max-h-[85dvh] overflow-y-auto rounded-t-[28px] bg-white/95 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#dde4ec]" />
          {title && (
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold text-ink">{title}</h2>
              {titleAction}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
