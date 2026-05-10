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
  secondPhone: string;
  whatsapp: string;
  whatsappMessage: string;
  email: string;
  facebook: string;
  youtube: string;
  address: string;
  mapEmbed: string;
  hours: string;
  brandInitial: string;
  footerTagline: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
};

const FALLBACK: SiteInfo = {
  name: SITE.name,
  shortName: SITE.shortName,
  phone: SITE.phone,
  phoneDisplay: SITE.phoneDisplay,
  secondPhone: "",
  whatsapp: SITE.whatsapp,
  whatsappMessage: "আমি অ্যাপয়েন্টমেন্ট নিতে চাই।",
  email: SITE.email,
  facebook: SITE.facebook,
  youtube: "",
  address: SITE.address,
  mapEmbed: SITE.mapEmbed,
  hours: "সর্বদা খোলা",
  brandInitial: "ডে",
  footerTagline:
    "রংপুরের আধুনিক ফিজিওথেরাপি ও নিউরো রিহ্যাবিলিটেশন সেন্টার। অভিজ্ঞ চিকিৎসকের তত্ত্বাবধানে সাশ্রয়ী মূল্যে উন্নত সেবা।",
  heroBadge: "রংপুরের #১ ফিজিওথেরাপি সেন্টার",
  heroTitle: "ব্যথামুক্ত জীবনের জন্য আধুনিক ফিজিওথেরাপি",
  heroSubtitle:
    "প্যারালাইসিস, PLID, কোমর-ঘাড়-হাঁটুর ব্যথা সহ সব ধরনের নিউরো রিহ্যাবিলিটেশন সেবা।",
  seoTitle: "ডেভেলপ ফিজিওথেরাপি এন্ড নিউরো রিহ্যাবিলিটেশন সেন্টার | রংপুর",
  seoDescription:
    "রংপুরের সেরা ফিজিওথেরাপি ও নিউরো রিহ্যাবিলিটেশন সেন্টার। প্যারালাইসিস, PLID, ব্যথা চিকিৎসায় বিশেষজ্ঞ।",
  ogImage: "",
};

export const INFO_KEY_MAP: Record<keyof SiteInfo, string> = {
  name: "site_name",
  shortName: "site_short_name",
  phone: "site_phone",
  phoneDisplay: "site_phone_display",
  secondPhone: "site_second_phone",
  whatsapp: "site_whatsapp",
  whatsappMessage: "site_whatsapp_message",
  email: "site_email",
  facebook: "site_facebook",
  youtube: "site_youtube",
  address: "site_address",
  mapEmbed: "site_map_embed",
  hours: "site_hours",
  brandInitial: "site_brand_initial",
  footerTagline: "site_footer_tagline",
  heroBadge: "site_hero_badge",
  heroTitle: "site_hero_title",
  heroSubtitle: "site_hero_subtitle",
  seoTitle: "site_seo_title",
  seoDescription: "site_seo_description",
  ogImage: "site_og_image",
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
