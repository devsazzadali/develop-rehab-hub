import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Settings = Record<string, string>;

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
    const id = s.facebook_pixel_id?.trim();
    if (!id || (window as any).__fbqLoaded) return;
    (window as any).__fbqLoaded = true;
    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${id}'); fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }, [s.facebook_pixel_id]);

  // Google Tag Manager
  useEffect(() => {
    const id = s.gtm_id?.trim();
    if (!id || (window as any).__gtmLoaded) return;
    (window as any).__gtmLoaded = true;
    const script = document.createElement("script");
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${id}');`;
    document.head.appendChild(script);
    const noscript = document.createElement("noscript");
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.prepend(noscript);
  }, [s.gtm_id]);

  // GA4
  useEffect(() => {
    const id = s.ga_measurement_id?.trim();
    if (!id || (window as any).__gaLoaded) return;
    (window as any).__gaLoaded = true;
    const tag = document.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(tag);
    const init = document.createElement("script");
    init.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date()); gtag('config', '${id}');`;
    document.head.appendChild(init);
  }, [s.ga_measurement_id]);

  // Custom head/body code
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
