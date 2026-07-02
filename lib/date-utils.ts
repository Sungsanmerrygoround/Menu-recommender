/** 로컬 타임존 기준 오늘 날짜를 YYYY-MM-DD 문자열로 반환 */
export function todayString(): string {
  return toDateString(new Date());
}

/** Date → 로컬 기준 YYYY-MM-DD */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD 두 날짜 사이의 경과일 (from이 과거면 양수) */
export function daysBetween(from: string, to: string): number {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

/** 기록 화면용 날짜 라벨: 오늘 / 어제 / M월 D일 (요일) */
export function dateLabel(dateStr: string, today: string = todayString()): string {
  const diff = daysBetween(dateStr, today);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  const date = new Date(`${dateStr}T00:00:00`);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}
