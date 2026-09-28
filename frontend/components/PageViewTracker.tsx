"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

export function PageViewTracker({
  event,
  data,
}: {
  event: AnalyticsEvent;
  data?: Record<string, unknown>;
}) {
  useEffect(() => {
    track(event, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}
