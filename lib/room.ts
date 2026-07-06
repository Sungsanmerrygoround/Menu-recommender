import { supabase } from "./supabase";
import { resetCache } from "./cache";
import { SEED_DISHES } from "./seed-dishes";
import type { Room } from "./types";

const STORAGE_KEY = "room";

/** 방 코드에 쓰는 음식류 영단어 (읽기 쉬운 4~5글자 위주) */
const CODE_WORDS = [
  "TOFU", "RICE", "MISO", "UDON", "SOBA", "KIMCHI", "CURRY", "RAMEN",
  "MOCHI", "SUSHI", "MANGO", "PEACH", "BERRY", "LEMON", "MELON", "OLIVE",
  "BASIL", "HONEY", "MOCHA", "LATTE", "COCOA", "CREAM", "TOAST", "BAGEL",
  "NOODLE", "GARLIC", "PEPPER", "TOMATO", "POTATO", "ONION", "GINGER",
  "SESAME", "WASABI", "MANDU", "BUNGE", "JEONYU", "GIMBAP", "BULGOGI",
];

/** 모듈 레벨의 현재 방 id. 쿼리에서 getRoomId()로 참조한다. */
let currentRoomId: string | null = null;

export function getRoomId(): string {
  if (!currentRoomId) {
    throw new Error("방이 선택되지 않았습니다");
  }
  return currentRoomId;
}

/** 현재 방을 설정하고 localStorage와 동기화한다. null이면 초기화. */
export function setCurrentRoom(room: Room | null): void {
  currentRoomId = room?.id ?? null;
  if (typeof window === "undefined") return;
  try {
    if (room) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) — 메모리 상태만 유지
  }
}

/** 재방문 시 localStorage에서 방 정보를 복원한다. */
export function loadStoredRoom(): Room | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Room>;
    if (!parsed?.id || !parsed?.code || !parsed?.name) return null;
    return parsed as Room;
  } catch {
    return null;
  }
}

/** 코드 정규화: 공백 제거 + 대문자 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/** 음식류 영단어 + 4자리 숫자 (예: TOFU-3942) */
export function generateRoomCode(): string {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const num = Math.floor(1000 + Math.random() * 9000); // 1000~9999
  return `${word}-${num}`;
}

/** 시드 요리를 방에 등록 (004/006 미적용 DB에서도 동작하도록 컬럼 오류 시 재시도) */
async function seedRoomDishes(roomId: string): Promise<void> {
  const rows = SEED_DISHES.map((d) => ({ ...d, room_id: roomId }));
  let { error } = await supabase.from("dishes").insert(rows);
  if (error && /(ingredients|emoji)/.test(error.message)) {
    const stripped = rows.map(({ ingredients: _i, emoji: _e, ...rest }) => rest);
    ({ error } = await supabase.from("dishes").insert(stripped));
  }
  if (error) throw error;
}

/**
 * 새 방 생성: 코드 발급(중복 시 재시도) → rooms insert → 시드 요리 10개 등록.
 * 성공하면 현재 방으로 설정하고 캐시를 비운다.
 */
export async function createRoom(name: string): Promise<Room> {
  let room: Room | null = null;
  for (let attempt = 0; attempt < 10 && !room; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code, name: name.trim() })
      .select()
      .single();
    if (!error) {
      room = data as Room;
      break;
    }
    // 23505 = unique_violation (코드 중복) → 다른 코드로 재시도
    const isDup =
      (error as { code?: string }).code === "23505" ||
      /duplicate|unique/i.test(error.message);
    if (!isDup) throw error;
  }
  if (!room) throw new Error("방 코드 생성에 실패했어요. 다시 시도해주세요");

  await seedRoomDishes(room.id);
  resetCache();
  setCurrentRoom(room);
  return room;
}

/**
 * 코드로 입장: 방이 있으면 현재 방으로 설정하고 반환, 없으면 null.
 */
export async function joinRoom(code: string): Promise<Room | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const room = data as Room;
  resetCache();
  setCurrentRoom(room);
  return room;
}
