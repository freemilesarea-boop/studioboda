"use client";

import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

// Subscribe to every workspace surface so the page reflects operator actions
// (chat, files, revisions, deliverables) live without a manual refresh.
export function RealtimeProjectRefresh({ projectId }: { projectId: string }) {
  useRealtimeRefresh({
    channel: `me-project-comments-${projectId}`,
    table: "project_comments",
    filter: `project_id=eq.${projectId}`,
    event: "*",
  });
  useRealtimeRefresh({
    channel: `me-project-files-${projectId}`,
    table: "project_files",
    filter: `project_id=eq.${projectId}`,
    event: "*",
  });
  useRealtimeRefresh({
    channel: `me-project-revisions-${projectId}`,
    table: "revision_requests",
    filter: `project_id=eq.${projectId}`,
    event: "*",
  });
  useRealtimeRefresh({
    channel: `me-project-deliverables-${projectId}`,
    table: "project_deliverables",
    filter: `project_id=eq.${projectId}`,
    event: "*",
  });
  return null;
}
