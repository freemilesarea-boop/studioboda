"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ProjectComment } from "@/lib/types/db";

export function useRealtimeComments(
  projectId: string,
  initial: ProjectComment[],
) {
  const [comments, setComments] = useState<ProjectComment[]>(initial);

  useEffect(() => {
    setComments(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`project-comments-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_comments",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = payload.new as ProjectComment;
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [row, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return comments;
}
