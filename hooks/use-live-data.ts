"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight polling hook for ESPN live scoring via our API route.
 * Defaults to 15s polling, pauses when the tab is hidden, and exposes
 * start/stop + manual refresh.
 */

type UseLiveDataOptions<T = any> = {
  /** Polling interval in ms. Default: 15000 */
  refreshInterval?: number;
  /** Optional transform to reduce raw payload to a small DTO */
  transformAction?: (raw: any) => T;
  /** Start polling immediately. Default: true */
  immediate?: boolean;
  /** Abort in-flight request on unmount. Default: true */
  abortOnUnmount?: boolean;
};

type UseLiveDataReturn<T = any> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  start: () => void;
  stop: () => void;
  isPolling: boolean;
  lastUpdatedAt: number | null;
};

export function useLiveData<T = any>({
  refreshInterval = 15000,
  transformAction,
  immediate = true,
  abortOnUnmount = true,
}: UseLiveDataOptions<T> = {}): UseLiveDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(immediate);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const fetchLive = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const res = await fetch("/api/espn/live", {
        method: "GET",
        cache: "no-store",
        signal: abortRef.current.signal,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Live API ${res.status}: ${text.slice(0, 160)}`);
      }

      const json = JSON.parse(text);
      const out = transformAction ? transformAction(json) : (json as T);
      setData(out);
      setLastUpdatedAt(Date.now());
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [transformAction]);

  const refresh = useCallback(async () => {
    await fetchLive();
  }, [fetchLive]);

  const start = useCallback(() => {
    setIsPolling(true);
  }, []);
  const stop = useCallback(() => {
    setIsPolling(false);
  }, []);

  // manage polling timer
  useEffect(() => {
    clearTimer();
    if (!isPolling) return;

    const tick = async () => {
      // Only poll when visible
      if (
        typeof document === "undefined" ||
        document.visibilityState !== "hidden"
      ) {
        await fetchLive();
      }
      timerRef.current = setTimeout(tick, refreshInterval);
    };

    // kick it off immediately
    tick();

    return clearTimer;
  }, [isPolling, refreshInterval, fetchLive]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (abortOnUnmount && abortRef.current) abortRef.current.abort();
    };
  }, [abortOnUnmount]);

  // auto-start if immediate=true
  useEffect(() => {
    setIsPolling(immediate);
  }, [immediate]);

  return {
    data,
    isLoading,
    error,
    refresh,
    start,
    stop,
    isPolling,
    lastUpdatedAt,
  };
}

export default useLiveData;
