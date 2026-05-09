import { motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Calendar, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteInfo } from "@/lib/use-site-data";

const schema = z.object({
  name: z.string().trim().min(2, "নাম দিন").max(80),
  phone: z
    .string()
    .trim()
    .min(10, "সঠিক মোবাইল নাম্বার দিন")
    .max(20)
    .regex(/^[0-9+\-\s]+$/, "শুধু নাম্বার দিন"),
  problem_type: z.string().min(1, "সমস্যা নির্বাচন করুন"),
  address: z.string().trim().max(200).optional(),
  details: z.string().trim().max(1000).optional(),
});

const problems = [
  "প্যারালাইসিস (হাত পা অবশ)",
  "PLID",
  "সারভাইক্যাল ব্যথা",
  "কোমর ব্যথা",
  "ঘাড় ব্যথা",
  "হাঁটু ব্যথা",
  "কাঁধ ব্যথা",
  "হাতের কব্জির ব্যথা",
  "আঘাতজনিত ব্যথা",
  "গোড়ালি ব্যথা",
  "মুখ বাকা হয়ে যাওয়া",
  "মাংসপেশী দুর্বলতা",
  "শারীরিক প্রতিবন্ধী (সি.পি)",
  "পা ঝিনঝিন করা",
  "অন্যান্য",
];

export function AppointmentForm() {
  const SITE = useSiteInfo();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    problem_type: "",
    address: "",
    details: "",
  });

  const handle = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ফর্ম সঠিকভাবে পূরণ করুন");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert(parsed.data);
      if (error) throw error;
      toast.success("আপনার অ্যাপয়েন্টমেন্ট গৃহীত হয়েছে! আমরা শীঘ্রই যোগাযোগ করবো।");
      const msg = `নতুন অ্যাপয়েন্টমেন্ট অনুরোধ:%0A👤 নাম: ${parsed.data.name}%0A📞 মোবাইল: ${parsed.data.phone}%0A🩺 সমস্যা: ${parsed.data.problem_type}%0A🏠 ঠিকানা: ${parsed.data.address || "-"}%0A📝 বিস্তারিত: ${parsed.data.details || "-"}`;
      window.open(`https://wa.me/${SITE.whatsapp}?text=${msg}`, "_blank");
      setForm({ name: "", phone: "", problem_type: "", address: "", details: "" });
    } catch (err) {
      console.error(err);
      toast.error("কিছু একটা ভুল হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="appointment" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-5 gap-10 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card text-primary text-sm font-semibold shadow-soft mb-4">
              <Calendar className="w-4 h-4" /> অ্যাপয়েন্টমেন্ট
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              আজই বুক করুন আপনার <span className="text-gradient">অ্যাপয়েন্টমেন্ট</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              ফর্মটি পূরণ করুন, আমরা দ্রুততম সময়ে আপনার সাথে যোগাযোগ করবো। আপনার তথ্য সম্পূর্ণ গোপন রাখা হবে।
            </p>
            <div className="mt-6 p-5 rounded-2xl glass">
              <div className="text-sm text-muted-foreground">দ্রুত যোগাযোগ</div>
              <a href={`tel:${SITE.phone}`} className="text-2xl font-bold text-primary block mt-1">
                {SITE.phoneDisplay}
              </a>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            onSubmit={onSubmit}
            className="lg:col-span-3 bg-card rounded-3xl p-6 sm:p-8 shadow-elegant border border-border space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="আপনার নাম *">
                <input required value={form.name} onChange={handle("name")} className={inputCls} placeholder="পুরো নাম" />
              </Field>
              <Field label="মোবাইল নাম্বার *">
                <input required value={form.phone} onChange={handle("phone")} className={inputCls} placeholder="01XXXXXXXXX" inputMode="tel" />
              </Field>
            </div>
            <Field label="সমস্যা নির্বাচন করুন *">
              <select required value={form.problem_type} onChange={handle("problem_type")} className={inputCls}>
                <option value="">— নির্বাচন করুন —</option>
                {problems.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="ঠিকানা">
              <input value={form.address} onChange={handle("address")} className={inputCls} placeholder="গ্রাম / এলাকা, জেলা" />
            </Field>
            <Field label="বিস্তারিত সমস্যা">
              <textarea value={form.details} onChange={handle("details")} rows={4} className={inputCls} placeholder="আপনার সমস্যা সংক্ষেপে লিখুন..." />
            </Field>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl gradient-primary text-primary-foreground font-bold shadow-elegant hover:scale-[1.01] transition disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              অ্যাপয়েন্টমেন্ট বুক করুন
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
