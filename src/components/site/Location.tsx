import { MapPin, Phone, MessageCircle, Mail } from "lucide-react";
import { useSiteInfo, waLinkFor } from "@/lib/use-site-data";

export function Location() {
  const SITE = useSiteInfo();
  return (
    <section id="contact" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-4">
            আমাদের অবস্থান
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            আমাদের <span className="text-gradient">চেম্বারে আসুন</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-3xl overflow-hidden shadow-elegant border border-border bg-card">
            <iframe
              src={SITE.mapEmbed}
              className="w-full h-[400px] lg:h-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ঠিকানা"
            />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-foreground">ঠিকানা</div>
                  <div className="text-sm text-muted-foreground mt-1">{SITE.address}</div>
                  <div className="text-xs text-muted-foreground mt-1">সর্বদা খোলা</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div className="min-w-0">
                  <div className="font-bold text-foreground">ইমেইল</div>
                  <a href={`mailto:${SITE.email}`} className="text-sm text-muted-foreground break-all hover:text-primary">
                    {SITE.email}
                  </a>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${SITE.phone}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-elegant hover:scale-[1.02] transition"
              >
                <Phone className="w-5 h-5" /> কল করুন
              </a>
              <a
                href={waLinkFor(SITE.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-success text-success-foreground font-semibold shadow-elegant hover:scale-[1.02] transition"
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
