import { motion } from "framer-motion";
import { GraduationCap, Stethoscope, Award } from "lucide-react";
import doctorImg from "@/assets/doctor-portrait.jpg";

export function Doctor() {
  return (
    <section id="doctor" className="py-20 lg:py-28 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] max-w-md mx-auto shadow-elegant">
              <img
                src={doctorImg}
                alt="Dr. Jannatul Nayeem Sojeeb - প্রধান চিকিৎসক"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-2 sm:right-10 glass rounded-2xl p-4 shadow-elegant max-w-[200px]">
              <div className="flex items-center gap-2 text-primary">
                <Award className="w-5 h-5" />
                <span className="font-bold text-sm">বিশেষজ্ঞ চিকিৎসক</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">FCPS Orthopaedic</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-card text-primary text-sm font-semibold mb-4 shadow-soft">
              আমাদের চিকিৎসক
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Dr. Jannatul Nayeem <span className="text-gradient">Sojeeb</span>
            </h2>
            <p className="mt-3 text-muted-foreground font-medium">
              MBBS, FCPS (Orthopaedic Surgery, Final Part) <br />
              MRCS OSCE (UK), RCS (England)
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent text-primary grid place-items-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">উচ্চ শিক্ষা ও প্রশিক্ষণ</div>
                  <div className="text-sm text-muted-foreground">
                    দেশ ও বিদেশের প্রখ্যাত প্রতিষ্ঠানে অর্জিত উচ্চতর ডিগ্রি ও প্রশিক্ষণ।
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent text-primary grid place-items-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">বিশেষজ্ঞ ক্ষেত্র</div>
                  <div className="text-sm text-muted-foreground">
                    PLID, সারভাইক্যাল, ঘাড়, কাঁধ, পিঠ, কোমর ও হাঁটুর ব্যথা, বাত-ব্যথা,
                    আঘাতজনিত ব্যথা, প্যারালাইসিস, পক্ষাঘাত পুনর্বাসন।
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-2xl gradient-primary text-primary-foreground shadow-elegant">
              <div className="text-sm opacity-90">সিরিয়ালের জন্য কল করুন</div>
              <div className="text-2xl font-bold tracking-wide">০১৯৫২-৯১৩১৮৮</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
