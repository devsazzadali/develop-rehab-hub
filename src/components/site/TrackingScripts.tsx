import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Settings = Record<string, string>;

const FB_PIXEL_RE = /^\d{10,20}$/;
const GTM_RE = /^GTM-[A-Z0-9]{4,12}$/;
const GA4_RE = /^G-[A-Z0-9]{4,12}$/;

const safe = (v: string | undefined, re: RegExp) => {
  const s = (v ?? "").trim();
  return re.test(s) ? s : "";
};

export function TrackingScripts() {
  const [s, setS] = useState<Settings>({});

  useEffect(() => {
    (supabase as any)
      .from("site_settings")
      .select("key,value")
      .then(({ data }: any) => {
        const map: Settings = {};
        (data ?? []).forEach((r: any) => (map[r.key] = r.value || ""));
        setS(map);
      });
  }, []);

  // Facebook Pixel
  useEffect(() => {
    const id = safe(s.facebook_pixel_id, FB_PIXEL_RE);
    if (!id || (window as any).__fbqLoaded) return;
    (window as any).__fbqLoaded = true;
    const script = document.createElement("script");
    script.textContent = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', ${JSON.stringify(id)}); fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }, [s.facebook_pixel_id]);

  // Google Tag Manager
  useEffect(() => {
    const id = safe(s.gtm_id, GTM_RE);
    if (!id || (window as any).__gtmLoaded) return;
    (window as any).__gtmLoaded = true;
    const script = document.createElement("script");
    script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer',${JSON.stringify(id)});`;
    document.head.appendChild(script);
    const noscript = document.createElement("noscript");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.prepend(noscript);
  }, [s.gtm_id]);

  // GA4
  useEffect(() => {
    const id = safe(s.ga_measurement_id, GA4_RE);
    if (!id || (window as any).__gaLoaded) return;
    (window as any).__gaLoaded = true;
    const tag = document.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(tag);
    const init = document.createElement("script");
    init.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date()); gtag('config', ${JSON.stringify(id)});`;
    document.head.appendChild(init);
  }, [s.ga_measurement_id]);

  // Custom head/body code (admin-authored raw HTML — kept by design)
  useEffect(() => {
    if (s.head_custom_code && !(window as any).__headCustom) {
      (window as any).__headCustom = true;
      const div = document.createElement("div");
      div.innerHTML = s.head_custom_code;
      Array.from(div.childNodes).forEach((n) => document.head.appendChild(n));
    }
    if (s.body_custom_code && !(window as any).__bodyCustom) {
      (window as any).__bodyCustom = true;
      const div = document.createElement("div");
      div.innerHTML = s.body_custom_code;
      Array.from(div.childNodes).forEach((n) => document.body.appendChild(n));
    }
  }, [s.head_custom_code, s.body_custom_code]);

  return null;
}
