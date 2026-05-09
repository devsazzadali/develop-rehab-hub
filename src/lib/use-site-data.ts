import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site-config";

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

// ---------- Global site info ----------

export type SiteInfo = {
  name: string;
  shortName: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  facebook: string;
  address: string;
  mapEmbed: string;
  brandInitial: string;
  footerTagline: string;
};

const FALLBACK: SiteInfo = {
  name: SITE.name,
  shortName: SITE.shortName,
  phone: SITE.phone,
  phoneDisplay: SITE.phoneDisplay,
  whatsapp: SITE.whatsapp,
  email: SITE.email,
  facebook: SITE.facebook,
  address: SITE.address,
  mapEmbed: SITE.mapEmbed,
  brandInitial: "ডে",
  footerTagline:
    "রংপুরের আধুনিক ফিজিওথেরাপি ও নিউরো রিহ্যাবিলিটেশন সেন্টার। অভিজ্ঞ চিকিৎসকের তত্ত্বাবধানে সাশ্রয়ী মূল্যে উন্নত সেবা।",
};

export const INFO_KEY_MAP: Record<keyof SiteInfo, string> = {
  name: "site_name",
  shortName: "site_short_name",
  phone: "site_phone",
  phoneDisplay: "site_phone_display",
  whatsapp: "site_whatsapp",
  email: "site_email",
  facebook: "site_facebook",
  address: "site_address",
  mapEmbed: "site_map_embed",
  brandInitial: "site_brand_initial",
  footerTagline: "site_footer_tagline",
};

export function useSiteInfo(): SiteInfo {
  const [info, setInfo] = useState<SiteInfo>(FALLBACK);
  useEffect(() => {
    let mounted = true;
    const keys = Object.values(INFO_KEY_MAP);
    (supabase as any)
      .from("site_settings")
      .select("key,value")
      .in("key", keys)
      .then(({ data }: any) => {
        if (!mounted || !data) return;
        const map: Record<string, string> = {};
        (data as { key: string; value: string }[]).forEach((r) => {
          if (r.value) map[r.key] = r.value;
        });
        const next = { ...FALLBACK };
        (Object.keys(INFO_KEY_MAP) as (keyof SiteInfo)[]).forEach((k) => {
          const v = map[INFO_KEY_MAP[k]];
          if (v) (next[k] as string) = v;
        });
        setInfo(next);
      });
    return () => {
      mounted = false;
    };
  }, []);
  return info;
}

export const waLinkFor = (whatsapp: string, msg = "আমি অ্যাপয়েন্টমেন্ট নিতে চাই।") =>
  `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
