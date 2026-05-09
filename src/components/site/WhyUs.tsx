import { motion } from "framer-motion";
import { Award, Cpu, HandHeart, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

const items = [
  { icon: Award, title: "অভিজ্ঞ থেরাপিস্ট", desc: "বছরের পর বছর হাজারো রোগীকে সুস্থ করার অভিজ্ঞতা।" },
  { icon: Cpu, title: "আধুনিক যন্ত্রপাতি", desc: "সর্বশেষ প্রযুক্তির ফিজিওথেরাপি ইকুইপমেন্ট।" },
  { icon: HandHeart, title: "ব্যক্তিগত যত্ন", desc: "প্রতিটি রোগীর জন্য আলাদা চিকিৎসা পরিকল্পনা।" },
  { icon: ShieldCheck, title: "নিরাপদ চিকিৎসা পরিবেশ", desc: "পরিচ্ছন্ন, জীবাণুমুক্ত ও আরামদায়ক পরিবেশ।" },
  { icon: TrendingUp, title: "দ্রুত উন্নতির পরিকল্পনা", desc: "প্রমাণিত পদ্ধতিতে দ্রুততম সুস্থতা।" },
  { icon: Wallet, title: "সাশ্রয়ী চিকিৎসা সেবা", desc: "সকলের নাগালে সাধ্যের মধ্যে সেরা সেবা।" },
];

export function WhyUs() {
  return (
    <section id="why-us" className="py-20 lg:py-28 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-block px-4 py-1.5 rounded-full bg-card text-primary text-sm font-semibold mb-4 shadow-soft">
            কেন আমাদের বেছে নিবেন
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            <span className="text-gradient">বিশ্বস্ত</span> ও আধুনিক চিকিৎসার ঠিকানা
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-elegant transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent text-primary grid place-items-center group-hover:gradient-primary group-hover:text-primary-foreground transition">
                  <it.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{it.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
