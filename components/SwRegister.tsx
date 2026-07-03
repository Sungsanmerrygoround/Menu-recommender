"use client";

import { useEffect } from "react";

/** 프로덕션에서만 서비스 워커 등록 (오프라인 지원) */
export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
