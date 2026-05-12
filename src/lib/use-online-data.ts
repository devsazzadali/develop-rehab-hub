import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

export type ConsultationPackage = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  original_price: string;
  duration: string;
  features: string[];
  is_popular: boolean;
  cta_label: string;
  sort_order: number;
  active: boolean;
};

export type ConsultationFaq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
};

export const ONLINE_KEYS = [
  "online_hero_badge",
  "online_hero_title",
  "online_hero_subtitle",
  "online_story_title",
  "online_story_body",
  "online_packages_title",
  "online_packages_subtitle",
  "online_cta_title",
  "online_cta_subtitle",
  "online_whatsapp_message",
] as const;

export type OnlineKey = (typeof ONLINE_KEYS)[number];

export function useOnlineData() {
  const [packages, setPackages] = useState<ConsultationPackage[]>([]);
  const [faqs, setFaqs] = useState<ConsultationFaq[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      sb.from("consultation_packages").select("*").eq("active", true).order("sort_order"),
      sb.from("consultation_faqs").select("*").eq("active", true).order("sort_order"),
      sb.from("site_settings").select("key,value").in("key", ONLINE_KEYS as unknown as string[]),
    ]).then(([pkg, faq, st]: any[]) => {
      if (!mounted) return;
      setPackages((pkg.data as ConsultationPackage[]) ?? []);
      setFaqs((faq.data as ConsultationFaq[]) ?? []);
      const map: Record<string, string> = {};
      ((st.data as { key: string; value: string }[]) ?? []).forEach((r) => (map[r.key] = r.value));
      setContent(map);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return { packages, faqs, content, loading };
}
