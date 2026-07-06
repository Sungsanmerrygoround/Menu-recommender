"use client";

import { useRoom } from "./RoomProvider";

/**
 * 화면 우측 상단에 방 이름 + 방 코드를 항상 표시한다.
 * 코드는 분실 대비 + 배우자 공유용으로 작게 항상 노출.
 */
export default function RoomHeader() {
  const { room } = useRoom();
  if (!room) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(10px+env(safe-area-inset-top))] z-30 flex justify-center px-5">
      <div className="flex w-full max-w-[480px] justify-end">
        <div className="glass-surface pointer-events-auto max-w-[60%] rounded-[16px] px-3 py-1.5 text-right">
          <p className="truncate text-[13px] font-extrabold leading-tight text-ink">
            {room.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold leading-tight tracking-wide text-muted">
            {room.code}
          </p>
        </div>
      </div>
    </div>
  );
}
