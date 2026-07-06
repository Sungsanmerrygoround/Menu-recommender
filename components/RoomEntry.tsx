"use client";

import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { useToast } from "./Toast";
import { useRoom } from "./RoomProvider";
import { createRoom, joinRoom } from "@/lib/room";

const inputClass =
  "w-full rounded-[14px] bg-field px-4 py-3.5 text-[16px] text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-grad-start/40";

type Mode = "create" | "join" | null;

export default function RoomEntry() {
  const { setRoom } = useRoom();
  const showToast = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function open(next: Mode) {
    setMode(next);
    setValue("");
    setError(null);
  }

  function close() {
    if (busy) return;
    setMode(null);
  }

  async function handleCreate() {
    const name = value.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      const room = await createRoom(name);
      showToast(`${room.name} 방을 만들었어요 · ${room.code}`);
      setRoom(room);
    } catch {
      setError("방을 만들지 못했어요. 잠시 후 다시 시도해주세요");
      setBusy(false);
    }
  }

  async function handleJoin() {
    const code = value.trim();
    if (!code || busy) return;
    setBusy(true);
    setError(null);
    try {
      const room = await joinRoom(code);
      if (!room) {
        setError("정확한 코드를 입력해주세요!");
        setBusy(false);
        return;
      }
      showToast(`${room.name} 방에 입장했어요`);
      setRoom(room);
    } catch {
      setError("입장에 실패했어요. 잠시 후 다시 시도해주세요");
      setBusy(false);
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-6 pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col items-center text-center">
        <div className="tile-ring flex h-20 w-20 items-center justify-center rounded-[28px] text-[44px]">
          🍚
        </div>
        <h1 className="mt-6 text-[34px] font-black leading-[1.2] tracking-[-0.02em] text-ink">
          오늘 뭐<br />
          <span className="grad-text">해먹지</span>
        </h1>
        <p className="mt-3 text-[14px] font-semibold text-sub">
          방을 만들고 배우자와 코드를 공유하면
          <br />
          같은 요리 목록을 함께 써요
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => open("create")}
          className="grad-primary shadow-btn-grad press-effect h-[54px] w-full rounded-[20px] text-[16px] font-extrabold text-white"
        >
          새 방 만들기
        </button>
        <button
          type="button"
          onClick={() => open("join")}
          className="glass-surface press-effect h-[54px] w-full rounded-[20px] text-[16px] font-bold text-chip-ink"
        >
          코드로 입장
        </button>
      </div>

      <BottomSheet
        open={mode === "create"}
        onClose={close}
        title="새 방 만들기 🍳"
      >
        <p className="-mt-2 mb-4 text-[13px] leading-relaxed text-sub">
          방 이름을 정해주세요. 방 코드는 자동으로 만들어져요.
        </p>
        <input
          className={inputClass}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="예: 한준네 부엌"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        {error && (
          <p className="mt-2.5 text-[13px] font-bold text-rose-500">{error}</p>
        )}
        <button
          type="button"
          onClick={handleCreate}
          disabled={!value.trim() || busy}
          className="grad-primary shadow-btn-grad press-effect mt-4 h-[54px] w-full rounded-2xl text-[16px] font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "만드는 중..." : "방 만들기"}
        </button>
      </BottomSheet>

      <BottomSheet open={mode === "join"} onClose={close} title="코드로 입장 🔑">
        <p className="-mt-2 mb-4 text-[13px] leading-relaxed text-sub">
          배우자에게 받은 방 코드를 입력해주세요.
        </p>
        <input
          className={`${inputClass} uppercase tracking-wider`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="예: TOFU-3942"
          autoFocus
          autoCapitalize="characters"
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        />
        {error && (
          <p className="mt-2.5 text-[13px] font-bold text-rose-500">{error}</p>
        )}
        <button
          type="button"
          onClick={handleJoin}
          disabled={!value.trim() || busy}
          className="grad-primary shadow-btn-grad press-effect mt-4 h-[54px] w-full rounded-2xl text-[16px] font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "입장 중..." : "입장하기"}
        </button>
      </BottomSheet>
    </main>
  );
}
