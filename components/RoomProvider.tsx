"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { loadStoredRoom, setCurrentRoom } from "@/lib/room";
import type { Room } from "@/lib/types";
import RoomEntry from "./RoomEntry";

interface RoomContextValue {
  room: Room | null;
  ready: boolean;
  setRoom: (room: Room | null) => void;
}

const RoomContext = createContext<RoomContextValue>({
  room: null,
  ready: false,
  setRoom: () => {},
});

/** 현재 방 정보를 읽는다. 게이트 안(앱 화면)에서는 room이 항상 존재한다. */
export function useRoom() {
  return useContext(RoomContext);
}

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoomState] = useState<Room | null>(null);
  const [ready, setReady] = useState(false);

  // 최초 마운트 시 localStorage에서 방 복원 (재방문 자동 입장)
  useEffect(() => {
    const stored = loadStoredRoom();
    if (stored) setCurrentRoom(stored);
    setRoomState(stored);
    setReady(true);
  }, []);

  const setRoom = useCallback((next: Room | null) => {
    setCurrentRoom(next); // 모듈 상태 + localStorage 동기화
    setRoomState(next);
  }, []);

  return (
    <RoomContext.Provider value={{ room, ready, setRoom }}>
      {children}
    </RoomContext.Provider>
  );
}

/**
 * 방이 선택되기 전에는 첫 화면(RoomEntry)을 보여주고,
 * 방이 있으면 실제 앱(children)을 렌더한다.
 */
export function RoomGate({ children }: { children: React.ReactNode }) {
  const { room, ready } = useRoom();

  // 하이드레이션 가드: localStorage를 읽기 전엔 중립 화면(배경만)
  if (!ready) return null;
  if (!room) return <RoomEntry />;
  return <>{children}</>;
}
