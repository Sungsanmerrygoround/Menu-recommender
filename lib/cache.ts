"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 탭(라우트) 간 공유되는 간단한 메모리 캐시.
 * - 페이지 진입 시 캐시가 있으면 즉시 보여주고, 백그라운드에서 재검증한다.
 * - mutate로 낙관적 업데이트를 하면 캐시와 화면이 동시에 갱신된다.
 */
const store = new Map<string, unknown>();

export function getCached<T>(key: string): T | null {
  return (store.get(key) as T) ?? null;
}

/** 화면 밖(다른 탭)의 캐시를 갱신할 때 사용 — 다음 방문 시 즉시 반영됨 */
export function updateCached<T>(key: string, fn: (prev: T | null) => T | null) {
  const next = fn(getCached<T>(key));
  if (next === null) store.delete(key);
  else store.set(key, next);
}

export function useCachedQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(() => getCached<T>(key));
  const [error, setError] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(async () => {
    try {
      const fresh = await fetcherRef.current();
      store.set(key, fresh);
      setData(fresh);
      setError(false);
    } catch {
      setError(true);
    }
  }, [key]);

  useEffect(() => {
    setData(getCached<T>(key));
    setError(false);
    reload();
  }, [key, reload]);

  /** 낙관적 업데이트: 캐시 + 현재 화면 동시 갱신 */
  const mutate = useCallback(
    (fn: (prev: T | null) => T | null) => {
      updateCached<T>(key, fn);
      setData(getCached<T>(key));
    },
    [key]
  );

  return { data, error, reload, mutate };
}
