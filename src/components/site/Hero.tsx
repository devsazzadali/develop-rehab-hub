import { motion } from "framer-motion";
import { Phone, Play, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/site-config";
import doctorImg from "@/assets/doctor-treatment.jpg";

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 gradient-hero overflow-hidden">
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-destructive/10 blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              রংপুরের আধুনিক ফিজিওথেরাপি সেন্টার
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-foreground">
              ব্যথা ও প্যারালাইসিসের{" "}
              <span className="text-gradient">আধুনিক ফিজিওথেরাপি</span> চিকিৎসা
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              দক্ষ ও অভিজ্ঞ ফিজিওথেরাপিস্টের মাধ্যমে আধুনিক যন্ত্রপাতি দিয়ে উন্নত
              চিকিৎসা সেবা। ঘরে বসেই বুক করুন আপনার অ্যাপয়েন্টমেন্ট।
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#appointment"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full gradient-primary text-primary-foreground font-semibold shadow-elegant hover:scale-[1.03] transition-transform"
              >
                <Phone className="w-5 h-5" /> এখনই যোগাযোগ করুন
              </a>
              <a
                href="#reviews"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-card border border-border text-foreground font-semibold hover:border-primary hover:text-primary transition shadow-soft"
              >
                <Play className="w-5 h-5 fill-current" /> ভিডিও রিভিউ দেখুন
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-foreground/80">
                <ShieldCheck className="w-5 h-5 text-success" />
                ১০+ বছরের অভিজ্ঞতা
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <ShieldCheck className="w-5 h-5 text-success" />
                ৫০০০+ সন্তুষ্ট রোগী
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-elegant aspect-[4/5] lg:aspect-[5/6] bg-card">
              {showVideo ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${SITE.heroVideoId}?autoplay=1`}
                  title="পরিচিতি"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <>
                  <img
                    src={doctorImg}
                    alt="অভিজ্ঞ চিকিৎসকের তত্ত্বাবধানে ফিজিওথেরাপি"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                  <button
                    onClick={() => setShowVideo(true)}
                    className="absolute inset-0 grid place-items-center group"
                    aria-label="ভিডিও চালান"
                  >
                    <span className="relative w-20 h-20 rounded-full bg-white/95 grid place-items-center text-primary shadow-glow group-hover:scale-110 transition-transform animate-pulse-ring">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </span>
                  </button>
                  <div className="absolute bottom-4 left-4 right-4 glass rounded-2xl px-4 py-3">
                    <div className="text-xs text-muted-foreground">আমাদের সম্পর্কে জানুন</div>
                    <div className="font-semibold text-foreground text-sm">
                      ডেভেলপ ফিজিওথেরাপি পরিচিতি ভিডিও
                    </div>
                  </div>
                </>
              )}
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="hidden sm:block absolute -left-6 top-10 glass rounded-2xl px-4 py-3 shadow-soft"
            >
              <div className="text-2xl font-bold text-gradient">৯৫%</div>
              <div className="text-xs text-muted-foreground">সফল রিকভারি</div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="hidden sm:block absolute -right-4 bottom-16 glass rounded-2xl px-4 py-3 shadow-soft"
            >
              <div className="text-2xl font-bold text-gradient">২৪/৭</div>
              <div className="text-xs text-muted-foreground">সাপোর্ট</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
