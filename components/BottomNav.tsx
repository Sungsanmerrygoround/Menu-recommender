"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function ForkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v7a2 2 0 0 0 2 2h0V3" />
      <path d="M11 3v18" />
      <path d="M17 3c-1.5 1.5-2 4-2 6v3h3v9" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "홈", Icon: HomeIcon },
  { href: "/plan", label: "식단표", Icon: CalendarIcon },
  { href: "/dishes", label: "내 요리", Icon: ForkIcon },
  { href: "/history", label: "기록", Icon: ClockIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-3.5 z-30 flex justify-center px-3.5">
      <div className="glass-card flex w-full max-w-[452px] rounded-full p-[7px] shadow-[0_10px_28px_rgba(70,120,180,.18)]">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`press-effect flex flex-1 flex-col items-center gap-0.5 rounded-full py-[7px] text-[11.5px] font-bold ${
                active ? "nav-on text-blue-btn" : "text-sub"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
