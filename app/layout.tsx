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
      <body className="bg-background text-text-main">
        <ToastProvider>
          <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-background pb-24">
            {children}
          </div>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
