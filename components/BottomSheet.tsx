"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  // SSR에는 document가 없으므로 마운트 후에만 포털 렌더
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 시트가 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  // 페이지 래퍼(z-10)의 스택 컨텍스트에 갇히면 하단 탭(z-30)이 시트를 덮으므로
  // body에 포털로 렌더해 항상 최상위에 표시
  return createPortal(
    <div className="fixed inset-0 z-40">
      <div
        className="animate-fade-in absolute inset-0 touch-none bg-[#17202b]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px]">
        <div className="sheet-surface animate-sheet-up max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-[28px] px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
          {title && (
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold text-ink">{title}</h2>
              {titleAction}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
