import { describe, expect, it } from "vitest";
import {
  addDays,
  dateLabel,
  daysBetween,
  futureDateLabel,
  startOfWeek,
} from "./date-utils";

describe("daysBetween", () => {
  it("같은 날은 0", () => {
    expect(daysBetween("2026-07-03", "2026-07-03")).toBe(0);
  });

  it("과거→현재는 양수", () => {
    expect(daysBetween("2026-06-21", "2026-07-03")).toBe(12);
  });

  it("월 경계를 넘어도 정확하다", () => {
    expect(daysBetween("2026-06-30", "2026-07-01")).toBe(1);
  });
});

describe("addDays", () => {
  it("월 경계를 넘는 덧셈", () => {
    expect(addDays("2026-06-29", 3)).toBe("2026-07-02");
  });

  it("음수도 지원", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
  });
});

describe("startOfWeek", () => {
  it("금요일 → 같은 주 월요일", () => {
    // 2026-07-03은 금요일
    expect(startOfWeek("2026-07-03")).toBe("2026-06-29");
  });

  it("월요일은 그대로", () => {
    expect(startOfWeek("2026-06-29")).toBe("2026-06-29");
  });

  it("일요일은 직전 월요일", () => {
    expect(startOfWeek("2026-07-05")).toBe("2026-06-29");
  });
});

describe("dateLabel / futureDateLabel", () => {
  const today = "2026-07-03";

  it("오늘/어제/그 이전 날짜 표기", () => {
    expect(dateLabel("2026-07-03", today)).toBe("오늘");
    expect(dateLabel("2026-07-02", today)).toBe("어제");
    expect(dateLabel("2026-06-30", today)).toBe("6월 30일 (화)");
  });

  it("오늘/내일/이후 날짜 표기", () => {
    expect(futureDateLabel("2026-07-03", today)).toBe("오늘");
    expect(futureDateLabel("2026-07-04", today)).toBe("내일");
    expect(futureDateLabel("2026-07-06", today)).toBe("7월 6일 (월)");
  });
});
