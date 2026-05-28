"use client";

import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

export function RealtimeProjectRefresh({ projectId }: { projectId: string }) {
  useRealtimeRefresh({
    channel: `me-project-comments-${projectId}`,
    table: "project_comments",
    filter: `project_id=eq.${projectId}`,
    event: "INSERT",
  });
  return null;
}
