import { motion } from "framer-motion";
import {
  Activity, Bone, Brain, Footprints, Hand, HeartPulse,
  PersonStanding, Smile, Zap, Accessibility, Move, Waves, Dumbbell, Sparkles,
} from "lucide-react";

const services = [
  { icon: Brain, title: "হাত পা অবশ (প্যারালাইসিস)" },
  { icon: Bone, title: "PLID" },
  { icon: Activity, title: "সারভাইক্যাল ব্যথা" },
  { icon: PersonStanding, title: "কোমর ব্যথা" },
  { icon: Move, title: "ঘাড় ব্যথা" },
  { icon: Footprints, title: "হাঁটু ব্যথা" },
  { icon: Dumbbell, title: "কাঁধ ব্যথা" },
  { icon: Hand, title: "হাতের কব্জির ব্যথা" },
  { icon: HeartPulse, title: "আঘাতজনিত ব্যথা" },
  { icon: Footprints, title: "গোড়ালি ব্যথা" },
  { icon: Smile, title: "মুখ বাকা হয়ে যাওয়া" },
  { icon: Sparkles, title: "মাংসপেশী দুর্বলতা" },
  { icon: Accessibility, title: "শারীরিক প্রতিবন্ধী (সি.পি)" },
  { icon: Zap, title: "পা ঝিনঝিন করা" },
];

export function Services() {
  return (
    <section id="services" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-4">
            আমাদের সেবাসমূহ
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            যে সকল সমস্যার <span className="text-gradient">আধুনিক চিকিৎসা</span> দেওয়া হয়
          </h2>
          <p className="mt-4 text-muted-foreground">
            অভিজ্ঞ চিকিৎসকের তত্ত্বাবধানে রোগী-কেন্দ্রিক উন্নত ফিজিওথেরাপি ও নিউরো রিহ্যাবিলিটেশন।
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="group relative bg-card rounded-2xl p-5 sm:p-6 border border-border hover:border-primary/40 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 rounded-2xl gradient-primary opacity-0 group-hover:opacity-5 transition" />
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl gradient-primary grid place-items-center text-primary-foreground shadow-soft mb-4 group-hover:scale-110 transition-transform">
                <s.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug">
                {s.title}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
