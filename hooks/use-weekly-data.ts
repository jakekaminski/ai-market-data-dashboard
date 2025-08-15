"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal client hook to fetch the Weekly bundle from our API route.
 * No external deps (SWR/React Query) required.
 *
 * It fetches once on mount by default and exposes a `refresh()` method.
 * You can optionally set a polling interval.
 */

type UseWeeklyDataOptions<T = any> = {
  /** Polling interval in ms (0 = no polling). Default: 0 */
  refreshInterval?: number;
  /** Optional transform to map raw API response to a smaller DTO */
  transformAction?: (raw: any) => T;
  /** Abort in-flight request if component unmounts. Default: true */
  abortOnUnmount?: boolean;
};

type UseWeeklyDataReturn<T = any> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  lastUpdatedAt: number | null;
};

export function useWeeklyData<T = any>({
  refreshInterval = 0,
  transformAction,
  abortOnUnmount = true,
}: UseWeeklyDataOptions<T> = {}): UseWeeklyDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const fetchWeekly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const res = await fetch("/api/espn/weekly", {
        method: "GET",
        cache: "no-store",
        signal: abortRef.current.signal,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Weekly API ${res.status}: ${text.slice(0, 160)}`);
      }

      const json = JSON.parse(text);
      const out = transformAction ? transformAction(json) : (json as T);
      setData(out);
      setLastUpdatedAt(Date.now());
    } catch (e: any) {
      if (e?.name === "AbortError") return; // ignore aborts
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [transformAction]);

  const refresh = useCallback(async () => {
    await fetchWeekly();
  }, [fetchWeekly]);

  // initial fetch
  useEffect(() => {
    fetchWeekly();
    return () => {
      clearTimer();
      if (abortOnUnmount && abortRef.current) abortRef.current.abort();
    };
  }, [fetchWeekly, abortOnUnmount]);

  // optional polling
  useEffect(() => {
    clearTimer();
    if (!refreshInterval) return;

    const tick = async () => {
      // don't poll when tab is hidden to save resources
      if (
        typeof document === "undefined" ||
        document.visibilityState !== "hidden"
      ) {
        await fetchWeekly();
      }
      timerRef.current = setTimeout(tick, refreshInterval);
    };

    timerRef.current = setTimeout(tick, refreshInterval);
    return clearTimer;
  }, [refreshInterval, fetchWeekly]);

  return { data, isLoading, error, refresh, lastUpdatedAt };
}

export default useWeeklyData;
