"use client";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press-effect h-9 shrink-0 rounded-full px-3.5 text-[14px] font-medium transition-colors ${
        selected
          ? "bg-primary text-white"
          : "border border-[#e5e8eb] bg-white text-[#4e5968]"
      }`}
    >
      {label}
    </button>
  );
}
