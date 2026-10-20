"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TextStates } from "@/components/spectrumui/text-states";

export function AutoRefresh({ fetchedAt, intervalMs = 60_000 }: { fetchedAt: string; intervalMs?: number }) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date(fetchedAt).getTime());

  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    const refresh = setInterval(() => router.refresh(), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [router, intervalMs]);

  const seconds = Math.max(0, Math.round((now - new Date(fetchedAt).getTime()) / 1000));
  const age = seconds < 60 ? `${seconds}s ago` : `${Math.round(seconds / 60)} min ago`;

  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-md border bg-card px-2.5 text-[12.5px] text-muted-foreground">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-quiet opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-quiet" />
      </span>
      Updated <TextStates text={age} className="tabular-nums" />
    </span>
  );
}
