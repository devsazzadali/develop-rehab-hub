import { motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Calendar, Loader2, Send, Lock, Mail, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSiteInfo } from "@/lib/use-site-data";
import { createConsultationUser } from "@/lib/account.functions";

const schema = z.object({
  name: z.string().trim().min(2, "নাম দিন").max(80),
  phone: z.string().trim().min(10, "সঠিক মোবাইল নাম্বার দিন").max(20).regex(/^[0-9+\-\s]+$/, "শুধু নাম্বার দিন"),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(255),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর").max(100),
  problem_type: z.string().min(1, "সমস্যা নির্বাচন করুন"),
  address: z.string().trim().max(200).optional(),
  details: z.string().trim().max(1000).optional(),
});

const problems = [
  "প্যারালাইসিস (হাত পা অবশ)", "PLID", "সারভাইক্যাল ব্যথা", "কোমর ব্যথা", "ঘাড় ব্যথা",
  "হাঁটু ব্যথা", "কাঁধ ব্যথা", "হাতের কব্জির ব্যথা", "আঘাতজনিত ব্যথা", "গোড়ালি ব্যথা",
  "মুখ বাকা হয়ে যাওয়া", "মাংসপেশী দুর্বলতা", "শারীরিক প্রতিবন্ধী (সি.পি)", "পা ঝিনঝিন করা", "অন্যান্য",
];

const sb: any = supabase;

export function AppointmentForm() {
  const SITE = useSiteInfo();
  const createUser = useServerFn(createConsultationUser);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "",
    problem_type: "", address: "", details: "",
  });

  const handle = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "ফর্ম পূরণ করুন"); return; }
    setLoading(true);
    try {
      // 1) insert appointment
      const { data: appt, error } = await sb.from("appointments").insert({
        name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email,
        problem_type: parsed.data.problem_type,
        address: parsed.data.address || null, details: parsed.data.details || null,
      }).select("id").single();
      if (error) throw error;

      // 2) create auth account + profile
      const res = await createUser({
        data: {
          email: parsed.data.email, password: parsed.data.password,
          name: parsed.data.name, phone: parsed.data.phone,
          problem_type: parsed.data.problem_type,
          address: parsed.data.address || "", details: parsed.data.details || "",
          appointment_id: appt.id,
        },
      });

      if (!res.ok) {
        if (res.code === "email_exists") {
          toast.info("এই ইমেইল দিয়ে আগে অ্যাকাউন্ট আছে। লগইন করে দেখুন।");
        } else {
          toast.error(res.message || "অ্যাকাউন্ট তৈরি হয়নি");
        }
      } else {
        // sign user in
        await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        toast.success("অ্যাপয়েন্টমেন্ট গৃহীত! অ্যাকাউন্ট তৈরি হয়েছে।");
      }

      const msg = `নতুন অ্যাপয়েন্টমেন্ট:%0A👤 ${parsed.data.name}%0A📞 ${parsed.data.phone}%0A✉️ ${parsed.data.email}%0A🩺 ${parsed.data.problem_type}`;
      window.open(`https://wa.me/${SITE.whatsapp}?text=${msg}`, "_blank");
      setDone(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "কিছু একটা ভুল হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="appointment" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-5 gap-10 items-center max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card text-primary text-sm font-semibold shadow-soft mb-4">
              <Calendar className="w-4 h-4" /> অ্যাপয়েন্টমেন্ট
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              আজই বুক করুন <span className="text-gradient">অ্যাপয়েন্টমেন্ট</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              ফর্ম পূরণ করলে স্বয়ংক্রিয়ভাবে আপনার একটি অ্যাকাউন্ট তৈরি হবে — পরে স্ট্যাটাস ও পেমেন্ট দেখতে পারবেন।
            </p>
            <div className="mt-6 p-5 rounded-2xl glass">
              <div className="text-sm text-muted-foreground">দ্রুত যোগাযোগ</div>
              <a href={`tel:${SITE.phone}`} className="text-2xl font-bold text-primary block mt-1">{SITE.phoneDisplay}</a>
            </div>
          </motion.div>

          {done ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-3 bg-card rounded-3xl p-8 shadow-elegant border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 grid place-items-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </div>
              <h3 className="mt-4 text-2xl font-bold">ধন্যবাদ!</h3>
              <p className="mt-2 text-muted-foreground">আপনার অ্যাপয়েন্টমেন্ট রিসিভ হয়েছে। শীঘ্রই যোগাযোগ করবো ইনশাআল্লাহ।</p>
              <Link to="/account" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-primary-foreground font-bold">
                আপনার অ্যাকাউন্ট দেখুন →
              </Link>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              onSubmit={onSubmit}
              className="lg:col-span-3 bg-card rounded-3xl p-6 sm:p-8 shadow-elegant border border-border space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="আপনার নাম *">
                  <input required value={form.name} onChange={handle("name")} className={inputCls} placeholder="পুরো নাম" />
                </Field>
                <Field label="মোবাইল নাম্বার *">
                  <input required value={form.phone} onChange={handle("phone")} className={inputCls} placeholder="01XXXXXXXXX" inputMode="tel" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="ইমেইল *">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input required type="email" value={form.email} onChange={handle("email")} className={inputCls + " pl-10"} placeholder="you@email.com" />
                  </div>
                </Field>
                <Field label="পাসওয়ার্ড সেট করুন *">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input required type="password" minLength={6} value={form.password} onChange={handle("password")} className={inputCls + " pl-10"} placeholder="৬+ অক্ষর" />
                  </div>
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
                <textarea value={form.details} onChange={handle("details")} rows={3} className={inputCls} placeholder="আপনার সমস্যা সংক্ষেপে লিখুন..." />
              </Field>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> সাবমিট করলে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট তৈরি হবে।
              </p>
              <button type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl gradient-primary text-primary-foreground font-bold shadow-elegant hover:scale-[1.01] transition disabled:opacity-70">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                অ্যাপয়েন্টমেন্ট বুক করুন
              </button>
            </motion.form>
          )}
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
