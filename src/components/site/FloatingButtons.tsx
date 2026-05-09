import { MessageCircle, Phone } from "lucide-react";
import { useSiteInfo, waLinkFor } from "@/lib/use-site-data";

export function FloatingButtons() {
  const SITE = useSiteInfo();
  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-3">
      <a
        href={waLinkFor(SITE.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="w-14 h-14 rounded-full bg-success text-success-foreground grid place-items-center shadow-elegant hover:scale-110 transition"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
      <a
        href={`tel:${SITE.phone}`}
        aria-label="জরুরি কল"
        className="relative w-14 h-14 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow-elegant hover:scale-110 transition animate-pulse-ring"
      >
        <Phone className="w-6 h-6" />
      </a>
    </div>
  );
}
