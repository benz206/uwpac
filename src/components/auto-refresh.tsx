"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AutoRefresh({ fetchedAt, intervalMs = 60_000 }: { fetchedAt: string; intervalMs?: number }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    const refresh = setInterval(() => router.refresh(), intervalMs);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [router, intervalMs]);

  const seconds = Math.max(0, Math.round((now - new Date(fetchedAt).getTime()) / 1000));
  const age = seconds < 60 ? `${seconds}s ago` : `${Math.round(seconds / 60)} min ago`;

  return (
    <span className="flex items-center gap-2 text-xs text-muted">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-quiet opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-quiet" />
      </span>
      Updated {age}
    </span>
  );
}
