"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

export function useRealtimeRefresh(opts: {
  channel: string;
  table: string;
  filter?: string;
  event?: Event;
  schema?: string;
}) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const ch = supabase
      .channel(opts.channel)
      .on(
        "postgres_changes",
        {
          event: opts.event ?? "*",
          schema: opts.schema ?? "public",
          table: opts.table,
          ...(opts.filter ? { filter: opts.filter } : {}),
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [opts.channel, opts.table, opts.filter, opts.event, opts.schema, router]);
}
