"use client";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  /** 선택 시 라벨 앞에 ✓ 표시 (홈 필터용) */
  check?: boolean;
}

export default function Chip({ label, selected, onClick, check = false }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press-effect hit-44 h-[38px] shrink-0 rounded-full px-[15px] text-[14px] transition-colors ${
        selected
          ? "grad-primary shadow-chip-on font-bold text-white"
          : "border border-white/90 bg-white/75 font-semibold text-[#44515f]"
      }`}
    >
      {selected && check ? `✓ ${label}` : label}
    </button>
  );
}
