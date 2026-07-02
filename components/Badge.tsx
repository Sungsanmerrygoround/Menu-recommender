interface BadgeProps {
  children: React.ReactNode;
  tone?: "blue" | "gray";
}

export default function Badge({ children, tone = "gray" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[12px] font-medium ${
        tone === "blue"
          ? "bg-[#e8f3ff] text-primary"
          : "bg-[#f2f4f6] text-[#4e5968]"
      }`}
    >
      {children}
    </span>
  );
}
