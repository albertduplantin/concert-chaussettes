"use client";

import { useEffect, useRef } from "react";

interface TrackViewProps {
  type: "PROFILE_VIEW" | "CONCERT_VIEW";
  targetId: string;
}

export function TrackView({ type, targetId }: TrackViewProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, targetId }),
    }).catch(() => {});
  }, [type, targetId]);

  return null;
}
