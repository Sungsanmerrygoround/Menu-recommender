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

/** YYYY-MM-DD에 n일을 더한 날짜 문자열 */
export function addDays(dateStr: string, n: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + n);
  return toDateString(date);
}

/** 식단표용 미래 날짜 라벨: 오늘 / 내일 / M월 D일 (요일) */
export function futureDateLabel(
  dateStr: string,
  today: string = todayString()
): string {
  const diff = daysBetween(today, dateStr);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  const date = new Date(`${dateStr}T00:00:00`);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

/** 해당 날짜가 속한 주의 시작일(월요일)을 YYYY-MM-DD로 반환 */
export function startOfWeek(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return toDateString(date);
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
