import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘 뭐 해먹지",
  description: "오늘 먹을 집밥 메뉴를 추천해드려요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#e9f3ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <ToastProvider>
          {/* 고정 배경: 그라디언트 + 블롭 (스크롤과 무관하게 유지) */}
          <div className="pointer-events-none fixed inset-0 z-0 flex justify-center">
            <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-gradient-to-b from-[#e9f3ff] to-[#f5fbf7]">
              <div className="blob blob-1" />
              <div className="blob blob-2" />
              <div className="blob blob-3" />
            </div>
          </div>
          <div className="relative z-10 mx-auto min-h-dvh w-full max-w-[480px] pb-32">
            {children}
          </div>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
