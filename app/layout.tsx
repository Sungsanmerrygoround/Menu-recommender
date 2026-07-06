import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import SwRegister from "@/components/SwRegister";
import { ToastProvider } from "@/components/Toast";
import { RoomProvider, RoomGate } from "@/components/RoomProvider";
import RoomHeader from "@/components/RoomHeader";
import "./globals.css";

const SPLASH = [
  { w: 390, h: 844, r: 3, img: "1170x2532" },
  { w: 393, h: 852, r: 3, img: "1179x2556" },
  { w: 430, h: 932, r: 3, img: "1290x2796" },
  { w: 414, h: 896, r: 2, img: "828x1792" },
  { w: 375, h: 812, r: 3, img: "1125x2436" },
];

export const metadata: Metadata = {
  title: "오늘 뭐 해먹지",
  description: "오늘 먹을 집밥 메뉴를 추천해드려요",
  appleWebApp: {
    capable: true,
    title: "뭐해먹지",
    statusBarStyle: "default",
    startupImage: SPLASH.map((s) => ({
      url: `/splash/${s.img}.png`,
      media: `(device-width: ${s.w}px) and (device-height: ${s.h}px) and (-webkit-device-pixel-ratio: ${s.r})`,
    })),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // env(safe-area-inset-*)가 실제 값을 갖도록 (홈 인디케이터 회피)
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9f3ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1219" },
  ],
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
        <SwRegister />
        <ToastProvider>
          <RoomProvider>
            {/* 고정 배경: 그라디언트 + 블롭 (게이트 밖 → 첫 화면에서도 표시) */}
            <div className="pointer-events-none fixed inset-0 z-0 flex justify-center">
              <div className="app-bg relative h-full w-full max-w-[480px] overflow-hidden">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
              </div>
            </div>
            {/* 방이 있을 때만 실제 앱을 렌더, 없으면 RoomGate가 첫 화면 표시 */}
            <RoomGate>
              <div className="relative z-10 mx-auto min-h-dvh w-full max-w-[480px] pb-[calc(8rem+env(safe-area-inset-bottom))]">
                {children}
              </div>
              <RoomHeader />
              <BottomNav />
            </RoomGate>
          </RoomProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
