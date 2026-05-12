import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Video, Globe2, Clock, ShieldCheck, CheckCircle2, Sparkles, Star, MessageCircle,
  Phone, ChevronDown, Heart, Award, Users, Headphones, Wallet, Calendar,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingButtons } from "@/components/site/FloatingButtons";
import { useOnlineData } from "@/lib/use-online-data";
import { useSiteInfo, waLinkFor } from "@/lib/use-site-data";

export const Route = createFileRoute("/online-consultation")({
  head: () => ({
    meta: [
      { title: "অনলাইন ফিজিওথেরাপি কনসালটেশন | ঘরে বসেই বিশেষজ্ঞ পরামর্শ" },
      {
        name: "description",
        content:
          "দেশ-বিদেশ যেখানেই থাকুন — ভিডিও কলে নিন অভিজ্ঞ ফিজিওথেরাপিস্টের পরামর্শ। ৩টি প্যাকেজ থেকে বেছে নিন আপনার সুবিধামতো।",
      },
      { property: "og:title", content: "অনলাইন ফিজিওথেরাপি কনসালটেশন" },
      { property: "og:description", content: "ভিডিও কলে বিশেষজ্ঞ পরামর্শ ও কাস্টম রিহ্যাব প্ল্যান।" },
    ],
  }),
  component: OnlineConsultationPage,
});

function OnlineConsultationPage() {
  const { packages, faqs, content, loading } = useOnlineData();
  const SITE = useSiteInfo();
  const waMsg = content.online_whatsapp_message || "আমি অনলাইন কনসালটেশন নিতে চাই।";
  const waLink = waLinkFor(SITE.whatsapp, waMsg);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10" />
          <div className="container mx-auto px-4 py-12 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                <Globe2 className="w-4 h-4" />
                {content.online_hero_badge || "🌍 দেশ-বিদেশ থেকে সেবা নিন"}
              </span>
              <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
                {content.online_hero_title || "ঘরে বসেই বিশেষজ্ঞ ফিজিওথেরাপি পরামর্শ"}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                {content.online_hero_subtitle ||
                  "আর হাসপাতালে যাওয়ার ঝামেলা নেই। ভিডিও কলে পান অভিজ্ঞ ফিজিওথেরাপিস্টের পরামর্শ।"}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#packages" className="px-6 py-3 rounded-full gradient-primary text-primary-foreground font-bold shadow-elegant inline-flex items-center gap-2 hover:opacity-95 transition">
                  <Sparkles className="w-4 h-4" /> প্যাকেজ দেখুন
                </a>
                <a href={waLink} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-full bg-card border border-border font-semibold inline-flex items-center gap-2 hover:border-primary transition">
                  <MessageCircle className="w-4 h-4 text-emerald-500" /> WhatsApp এ কথা বলুন
                </a>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { icon: Users, label: "৫০০০+", sub: "সন্তুষ্ট রোগী" },
                  { icon: Award, label: "১০+ বছর", sub: "অভিজ্ঞতা" },
                  { icon: Star, label: "৪.৯/৫", sub: "রেটিং" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <s.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="font-bold text-foreground">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground">{s.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-elegant border border-border bg-card aspect-[4/5]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="w-32 h-32 rounded-full bg-white/95 grid place-items-center shadow-2xl">
                    <Video className="w-14 h-14 text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-sm font-semibold text-slate-900">লাইভ কনসালটেশন চলছে</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="border-y border-border bg-card/50">
          <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, label: "১০০% মানি ব্যাক" },
              { icon: Clock, label: "২৪/৭ সাপোর্ট" },
              { icon: Globe2, label: "দেশ-বিদেশ থেকে" },
              { icon: Heart, label: "প্রাইভেসি গ্যারান্টি" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <t.icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-semibold text-foreground">{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* STORY */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="text-primary text-sm font-bold uppercase tracking-wider">আমাদের গল্প</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">
                {content.online_story_title || "আপনার ব্যথা, আমাদের দায়িত্ব"}
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                {content.online_story_body ||
                  "প্রতিদিন শত শত মানুষ ব্যথা নিয়ে কষ্ট পাচ্ছেন কিন্তু সঠিক পরামর্শ পাচ্ছেন না।"}
              </p>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">প্রক্রিয়া</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">কীভাবে কাজ করে?</h2>
              <p className="mt-3 text-muted-foreground">মাত্র ৪টি সহজ ধাপে</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Wallet, t: "প্যাকেজ বাছাই", d: "আপনার প্রয়োজন অনুযায়ী একটি প্যাকেজ বেছে নিন" },
                { icon: Calendar, t: "সময় নির্ধারণ", d: "WhatsApp এ আমাদের সাথে সময় ঠিক করুন" },
                { icon: Video, t: "ভিডিও সেশন", d: "নির্ধারিত সময়ে ভিডিও কলে কনসালটেশন নিন" },
                { icon: Headphones, t: "ফলোআপ সাপোর্ট", d: "প্ল্যান অনুযায়ী চলমান সহায়তা পান" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="relative bg-card border border-border rounded-2xl p-6 hover:shadow-elegant hover:border-primary/30 transition">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full gradient-primary text-primary-foreground grid place-items-center font-bold text-sm shadow-elegant">{i + 1}</div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center mb-4">
                    <s.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{s.t}</h3>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PACKAGES */}
        <section id="packages" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">প্যাকেজ</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">
                {content.online_packages_title || "আপনার জন্য সঠিক প্যাকেজ বেছে নিন"}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {content.online_packages_subtitle || "যেকোনো প্যাকেজ — ১০০% মানি ব্যাক গ্যারান্টি"}
              </p>
            </div>
            {loading ? (
              <div className="text-center text-muted-foreground py-12">লোড হচ্ছে...</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {packages.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className={`relative rounded-3xl p-7 border transition-all hover:shadow-elegant ${
                      p.is_popular
                        ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary shadow-elegant scale-[1.02]"
                        : "bg-card border-border hover:border-primary/40"
                    }`}>
                    {p.is_popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold shadow-elegant">
                        ⭐ সবচেয়ে জনপ্রিয়
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                    {p.tagline && <p className="text-sm text-muted-foreground mt-1">{p.tagline}</p>}
                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-foreground">{p.price}</span>
                      {p.original_price && (
                        <span className="text-sm text-muted-foreground line-through">{p.original_price}</span>
                      )}
                    </div>
                    {p.duration && (
                      <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.duration}
                      </p>
                    )}
                    <ul className="mt-6 space-y-3">
                      {p.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-foreground/90">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a href={`${waLink}%20-%20${encodeURIComponent(p.name)}`} target="_blank" rel="noreferrer"
                      className={`mt-7 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold transition ${
                        p.is_popular
                          ? "gradient-primary text-primary-foreground shadow-elegant hover:opacity-95"
                          : "bg-foreground text-background hover:opacity-90"
                      }`}>
                      <MessageCircle className="w-4 h-4" /> {p.cta_label || "বুক করুন"}
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* WHY ONLINE */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">কেন অনলাইন কনসালটেশন?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Globe2, t: "যেকোনো জায়গা থেকে", d: "দেশের বাইরে থাকলেও সমস্যা নেই — ইন্টারনেট থাকলেই হবে" },
                { icon: Wallet, t: "সাশ্রয়ী খরচ", d: "যাতায়াত ও সময় বাঁচান, পান একই মানের চিকিৎসা" },
                { icon: Heart, t: "ব্যক্তিগত যত্ন", d: "প্রতিটি রোগীর জন্য কাস্টম প্ল্যান তৈরি করি" },
              ].map((b, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-soft transition">
                  <div className="w-14 h-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4">
                    <b.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{b.t}</h3>
                  <p className="text-sm text-muted-foreground">{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">FAQ</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">প্রায়শই জিজ্ঞাসিত প্রশ্ন</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => <FaqItem key={f.id} q={f.question} a={f.answer} />)}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl gradient-primary text-primary-foreground p-10 md:p-16 text-center shadow-elegant">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                  {content.online_cta_title || "আজই শুরু করুন আপনার ব্যথামুক্ত জীবন"}
                </h2>
                <p className="mt-4 text-lg opacity-95 max-w-2xl mx-auto">
                  {content.online_cta_subtitle || "হাজারো মানুষ ইতিমধ্যে উপকৃত হয়েছেন। আপনিও যুক্ত হোন।"}
                </p>
                <div className="mt-8 flex flex-wrap gap-3 justify-center">
                  <a href={waLink} target="_blank" rel="noreferrer" className="px-7 py-3.5 rounded-full bg-white text-primary font-bold inline-flex items-center gap-2 hover:opacity-95 transition shadow-lg">
                    <MessageCircle className="w-5 h-5" /> এখনই বুক করুন
                  </a>
                  <a href={`tel:${SITE.phone}`} className="px-7 py-3.5 rounded-full bg-white/15 border border-white/40 backdrop-blur font-bold inline-flex items-center gap-2 hover:bg-white/25 transition">
                    <Phone className="w-5 h-5" /> {SITE.phoneDisplay}
                  </a>
                </div>
                <Link to="/" className="inline-block mt-6 text-sm underline opacity-90">← হোমপেজে ফিরুন</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/50 transition">
        <span className="font-semibold text-foreground">{q}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-muted-foreground leading-relaxed border-t border-border pt-4 whitespace-pre-line">
          {a}
        </div>
      )}
    </div>
  );
}
