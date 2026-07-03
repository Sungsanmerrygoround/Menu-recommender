interface BadgeProps {
  children: React.ReactNode;
  tone?: "blue" | "gray";
  size?: "md" | "sm";
}

export default function Badge({
  children,
  tone = "gray",
  size = "md",
}: BadgeProps) {
  const toneClass = tone === "blue" ? "grad-tint text-blue-acc" : "badge-gray";
  const sizeClass =
    size === "sm" ? "px-2 py-[3px] text-[11px]" : "px-2.5 py-[5px] text-[12px]";
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${toneClass} ${sizeClass}`}
    >
      {children}
    </span>
  );
}
