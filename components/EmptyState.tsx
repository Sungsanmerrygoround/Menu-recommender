"use client";

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** 버튼 대신 커스텀 액션(예: Link)을 넣을 때 사용 */
  action?: React.ReactNode;
}

export default function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <span className="text-[44px]">{emoji}</span>
      <p className="mt-4 text-[16px] font-semibold text-text-main">{title}</p>
      {description && (
        <p className="mt-1.5 text-[14px] leading-relaxed text-text-sub">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="press-effect mt-6 rounded-[14px] bg-[#e8f3ff] px-5 py-3 text-[15px] font-semibold text-primary"
        >
          {actionLabel}
        </button>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
