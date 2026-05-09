import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteVideo = {
  id: string;
  video_id: string;
  title: string;
  type: "hero" | "review";
  sort_order: number;
};

export function useSiteVideos(type: "hero" | "review") {
  const [videos, setVideos] = useState<SiteVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (supabase as any)
      .from("site_videos")
      .select("*")
      .eq("type", type)
      .order("sort_order", { ascending: true })
      .then(({ data }: any) => {
        if (!mounted) return;
        setVideos((data as SiteVideo[]) ?? []);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [type]);

  return { videos, loading };
}

export function useSiteSetting(key: string) {
  const [value, setValue] = useState<string>("");
  useEffect(() => {
    let mounted = true;
    (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!mounted) return;
        setValue((data?.value as string) ?? "");
      });
    return () => {
      mounted = false;
    };
  }, [key]);
  return value;
}
