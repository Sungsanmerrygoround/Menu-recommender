/** 카드 리스트 로딩용 스켈레톤 */
export default function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-[18px] bg-white p-4">
          <div className="h-4 w-2/5 rounded-md bg-[#f2f4f6]" />
          <div className="mt-2.5 h-3.5 w-3/5 rounded-md bg-[#f2f4f6]" />
        </div>
      ))}
    </div>
  );
}
