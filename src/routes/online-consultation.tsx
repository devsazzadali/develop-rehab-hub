import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Video, Globe2, Clock, ShieldCheck, CheckCircle2, Sparkles, Star, MessageCircle,
  Phone, ChevronDown, Heart, Award, Users, Headphones, Wallet, Calendar,
  X as XIcon, Quote, TrendingUp, Stethoscope, Home, Plane, Briefcase, Baby, Activity, Zap,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingButtons } from "@/components/site/FloatingButtons";
import { useOnlineData } from "@/lib/use-online-data";
import { useSiteInfo, useSiteVideos, waLinkFor } from "@/lib/use-site-data";
import { Play } from "lucide-react";

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
  const { videos: consultVideos } = useSiteVideos("consultancy");
  const heroVideo = consultVideos[0];
  const [showVideo, setShowVideo] = useState(false);
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
                {heroVideo && showVideo ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${heroVideo.video_id}?autoplay=1`}
                    title={heroVideo.title || "Consultation video"}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : heroVideo ? (
                  <>
                    <img
                      src={`https://i.ytimg.com/vi/${heroVideo.video_id}/hqdefault.jpg`}
                      alt={heroVideo.title || "Consultation video"}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                    <button
                      onClick={() => setShowVideo(true)}
                      className="absolute inset-0 grid place-items-center group"
                      aria-label="ভিডিও চালান"
                    >
                      <span className="w-20 h-20 rounded-full bg-white/95 grid place-items-center text-primary shadow-2xl group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 fill-current ml-1" />
                      </span>
                    </button>
                    {heroVideo.title && (
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                        <div className="text-xs text-muted-foreground">পরিচিতি ভিডিও</div>
                        <div className="text-sm font-semibold text-slate-900 truncate">{heroVideo.title}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                    <Link to="/payment" search={{ package: p.id }}
                      className={`mt-7 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold transition ${
                        p.is_popular
                          ? "gradient-primary text-primary-foreground shadow-elegant hover:opacity-95"
                          : "bg-foreground text-background hover:opacity-90"
                      }`}>
                      <Wallet className="w-4 h-4" /> {p.cta_label || "বুক করুন"}
                    </Link>
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

        {/* WHO IS THIS FOR */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">কাদের জন্য</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">এই সেবা কারা নিতে পারবেন?</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">আপনি যদি নিচের যেকোনো একটির সাথে নিজেকে মেলাতে পারেন — এই কনসালটেশন আপনার জন্য</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {[
                { icon: Plane, t: "প্রবাসী বাংলাদেশি", d: "মধ্যপ্রাচ্য, ইউরোপ, আমেরিকা — যেখানেই থাকুন, বাংলায় বিশেষজ্ঞ পরামর্শ পান" },
                { icon: Briefcase, t: "ব্যস্ত পেশাজীবী", d: "অফিস, মিটিং, ট্রাভেল — হাসপাতালে যাওয়ার সময় নেই? ঘর থেকেই সেবা নিন" },
                { icon: Home, t: "বয়স্ক রোগী", d: "চলাচলে কষ্ট, যাতায়াত ঝুঁকিপূর্ণ — পরিবারের সাথে বসেই কনসালটেশন" },
                { icon: Baby, t: "মা ও শিশু", d: "প্রসব-পরবর্তী পেইন, পেডিয়াট্রিক ফিজিও — নিরাপদ ঘরোয়া পরিবেশে" },
                { icon: Activity, t: "ক্রীড়াবিদ", d: "চোট, পুনর্বাসন, পারফরম্যান্স রিকভারি — দ্রুত বিশেষজ্ঞ গাইডলাইন" },
                { icon: TrendingUp, t: "দীর্ঘস্থায়ী ব্যথায় ভুক্তভোগী", d: "কোমর, ঘাড়, হাঁটু — বছরের পর বছর কষ্ট? এবার সঠিক সমাধান" },
              ].map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-soft transition group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center mb-3 group-hover:scale-110 transition">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{b.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CONDITIONS WE TREAT */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-10">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">যে সমস্যাগুলোতে সাহায্য করি</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">কোন সমস্যায় কনসালটেশন নেবেন?</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "কোমর ব্যথা (Lower Back Pain)", "ঘাড় ব্যথা / Cervical", "হাঁটুর ব্যথা / Knee Pain",
                "কাঁধ ব্যথা / Frozen Shoulder", "Sciatica / Disc Prolapse", "Stroke পরবর্তী রিহ্যাব",
                "Facial Palsy / Bell's Palsy", "Sports Injury", "Post-Surgery Recovery",
                "Arthritis / Joint Pain", "Postural Problem", "শিশু সেরিব্রাল পালসি",
              ].map((c, i) => (
                <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground inline-flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              আপনার সমস্যা তালিকায় নেই? <a href={waLink} target="_blank" rel="noreferrer" className="text-primary font-semibold underline">WhatsApp করুন</a> — আমরা গাইড করব
            </p>
          </div>
        </section>

        {/* ONLINE vs OFFLINE COMPARISON */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-10">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">তুলনা</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">অনলাইন vs প্রচলিত হাসপাতাল ভিজিট</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-card border-2 border-primary rounded-3xl p-6 shadow-elegant relative">
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold">⭐ সুপারিশকৃত</div>
                <h3 className="text-xl font-extrabold text-primary mb-4 inline-flex items-center gap-2"><Video className="w-5 h-5" /> অনলাইন কনসালটেশন</h3>
                <ul className="space-y-3 text-sm">
                  {["যাতায়াত খরচ ও সময় শূন্য", "ঘরে বসে আরামদায়ক পরিবেশ", "৫ মিনিটে অ্যাপয়েন্টমেন্ট", "WhatsApp ফলোআপ সাপোর্ট", "কাস্টম এক্সারসাইজ ভিডিও", "প্রবাসেও একই সেবা", "সাশ্রয়ী মূল্য"].map((p, i) => (
                    <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" /><span className="text-foreground/90">{p}</span></li>
                  ))}
                </ul>
              </div>
              <div className="bg-card border border-border rounded-3xl p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 inline-flex items-center gap-2"><Home className="w-5 h-5 text-muted-foreground" /> হাসপাতাল ভিজিট</h3>
                <ul className="space-y-3 text-sm">
                  {["যাতায়াতে ২-৪ ঘণ্টা নষ্ট", "জ্যাম, পার্কিং, অপেক্ষা", "অ্যাপয়েন্টমেন্ট পেতে ১-২ সপ্তাহ", "ফলোআপের জন্য আবার ভিজিট", "ভিড় ও সংক্রমণের ঝুঁকি", "প্রবাস থেকে অসম্ভব", "অতিরিক্ত খরচ"].map((p, i) => (
                    <li key={i} className="flex items-start gap-2"><XIcon className="w-5 h-5 text-destructive mt-0.5 shrink-0" /><span className="text-muted-foreground">{p}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">রোগীদের মুখে</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">যা বলছেন আমাদের রোগীরা</h2>
              <div className="mt-3 inline-flex items-center gap-2">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}
                <span className="text-sm font-semibold text-foreground ml-1">৪.৯/৫ — ১২০০+ রিভিউ</span>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { name: "রহিমা বেগম", loc: "দুবাই, UAE", text: "৩ বছর কোমর ব্যথায় ভুগছিলাম। প্রবাসে ছিলাম বলে দেশে যেতে পারতাম না। অনলাইন কনসালটেশনে যে এক্সারসাইজ প্ল্যান পেলাম, ২ মাসেই অর্ধেক ব্যথা কমে গেছে।" },
                { name: "মোঃ সাইফুল ইসলাম", loc: "ঢাকা", text: "অফিসের চাপে হাসপাতালে যাওয়ার সময় ছিল না। ভিডিও কলে ৪৫ মিনিটে যা বুঝিয়েছেন — অসাধারণ। ৭ দিনের WhatsApp সাপোর্ট সত্যিই কাজে দিয়েছে।" },
                { name: "নাজনীন আক্তার", loc: "লন্ডন, UK", text: "মায়ের স্ট্রোকের পর রিহ্যাব নিয়ে চিন্তিত ছিলাম। প্রিমিয়াম প্যাকেজে সাপ্তাহিক ফলোআপ এবং কাস্টম ব্যায়াম গাইডলাইন — মা এখন অনেক ভালো।" },
              ].map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-3xl p-6 shadow-soft hover:shadow-elegant transition relative">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full gradient-primary text-primary-foreground grid place-items-center font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.loc}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* GUARANTEE */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-card border-2 border-primary/30 rounded-3xl p-8 md:p-12 shadow-elegant relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative grid md:grid-cols-[auto_1fr] gap-6 items-center">
                <div className="w-24 h-24 rounded-full gradient-primary grid place-items-center shadow-elegant mx-auto md:mx-0">
                  <ShieldCheck className="w-12 h-12 text-primary-foreground" />
                </div>
                <div className="text-center md:text-left">
                  <span className="text-primary text-xs font-bold uppercase tracking-wider">আমাদের ওয়াদা</span>
                  <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-foreground">১০০% মানি ব্যাক গ্যারান্টি</h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    কনসালটেশনে যদি আপনি সন্তুষ্ট না হন — কোনো প্রশ্ন ছাড়াই ৭ দিনের মধ্যে সম্পূর্ণ টাকা ফেরত। আপনার আস্থাই আমাদের সবচেয়ে বড় পুঁজি।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* URGENCY / SLOTS */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
              <Zap className="w-12 h-12 text-amber-500 shrink-0" />
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-extrabold text-foreground">সীমিত স্লট — দিনে মাত্র ৮ জন</h3>
                <p className="mt-1 text-sm text-muted-foreground">প্রতিটি রোগীকে পর্যাপ্ত সময় দেওয়ার জন্য আমরা প্রতিদিন সীমিত সংখ্যক কনসালটেশন নিই। আজকের স্লট দ্রুত শেষ হয়ে যাচ্ছে।</p>
              </div>
              <a href={waLink} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-full gradient-primary text-primary-foreground font-bold shrink-0 inline-flex items-center gap-2 hover:opacity-95">
                <MessageCircle className="w-4 h-4" /> স্লট বুক করুন
              </a>
            </div>
          </div>
        </section>

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
