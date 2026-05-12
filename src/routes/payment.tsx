import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Loader2, ShieldCheck, Wallet, Phone, User, Hash, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingButtons } from "@/components/site/FloatingButtons";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

type PaymentMethod = {
  id: string;
  name: string;
  type: string;
  account_number: string;
  account_name: string;
  instructions: string;
  account_type: string;
  active: boolean;
  sort_order: number;
};
type Pkg = { id: string; name: string; price: string };

export const Route = createFileRoute("/payment")({
  validateSearch: (s: Record<string, unknown>) => ({
    package: typeof s.package === "string" ? s.package : undefined,
  }),
  head: () => ({
    meta: [
      { title: "পেমেন্ট করুন | Develop Care" },
      { name: "description", content: "বিকাশ, নগদ, রকেট বা ব্যাংকের মাধ্যমে পেমেন্ট করে TRX ID সাবমিট করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentPage,
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "নাম দিন").max(100),
  customer_phone: z.string().trim().min(10, "সঠিক ফোন নাম্বার দিন").max(20),
  customer_email: z.string().trim().email("সঠিক ইমেইল").max(255).optional().or(z.literal("")),
  sender_number: z.string().trim().min(10, "Sender নাম্বার দিন").max(20),
  transaction_id: z.string().trim().min(4, "TRX ID দিন").max(50),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

function PaymentPage() {
  const search = useSearch({ from: "/payment" }) as { package?: string };
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [selectedPkgId, setSelectedPkgId] = useState<string>(search.package || "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "",
    sender_number: "", transaction_id: "", note: "",
  });

  useEffect(() => {
    Promise.all([
      sb.from("payment_methods").select("*").eq("active", true).order("sort_order"),
      sb.from("consultation_packages").select("id,name,price").eq("active", true).order("sort_order"),
      sb.from("site_settings").select("key,value").in("key", ["payment_page_title", "payment_page_subtitle", "payment_success_message"]),
    ]).then(([m, p, s]: any[]) => {
      const ms = (m.data as PaymentMethod[]) ?? [];
      setMethods(ms);
      if (ms[0]) setSelectedMethodId(ms[0].id);
      setPackages((p.data as Pkg[]) ?? []);
      const map: Record<string, string> = {};
      ((s.data as any[]) ?? []).forEach((r) => (map[r.key] = r.value));
      setContent(map);
      setLoading(false);
    });
  }, []);

  const selectedMethod = useMemo(() => methods.find((m) => m.id === selectedMethodId), [methods, selectedMethodId]);
  const selectedPkg = useMemo(() => packages.find((p) => p.id === selectedPkgId), [packages, selectedPkgId]);

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("কপি হয়েছে"); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!selectedMethod) { toast.error("পেমেন্ট মাধ্যম নির্বাচন করুন"); return; }
    setSubmitting(true);
    const { error } = await sb.from("payment_submissions").insert({
      package_id: selectedPkg?.id ?? null,
      payment_method_id: selectedMethod.id,
      payment_method_name: selectedMethod.name,
      package_name: selectedPkg?.name ?? "",
      amount: selectedPkg?.price ?? "",
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone,
      customer_email: parsed.data.customer_email || null,
      sender_number: parsed.data.sender_number,
      transaction_id: parsed.data.transaction_id,
      note: parsed.data.note || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("সাবমিট হয়েছে");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
              <ShieldCheck className="w-4 h-4" /> নিরাপদ পেমেন্ট
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
              {content.payment_page_title || "পেমেন্ট সম্পূর্ণ করুন"}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              {content.payment_page_subtitle || "নিচের যেকোনো মাধ্যমে পেমেন্ট করে TRX ID সাবমিট করুন।"}
            </p>
          </motion.div>

          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
          ) : done ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl p-10 text-center max-w-xl mx-auto shadow-elegant">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 grid place-items-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">ধন্যবাদ!</h2>
              <p className="mt-2 text-muted-foreground">
                {content.payment_success_message || "পেমেন্ট সাবমিট হয়েছে! আমরা কনফার্ম করে আপনাকে জানাবো ইনশাআল্লাহ।"}
              </p>
              <Link to="/" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-primary-foreground font-semibold">
                হোমে ফিরে যান <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: methods + account info */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> পেমেন্ট মাধ্যম</h3>
                  {packages.length > 0 && (
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-muted-foreground">প্যাকেজ নির্বাচন</label>
                      <select value={selectedPkgId} onChange={(e) => setSelectedPkgId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <option value="">— প্যাকেজ ছাড়া —</option>
                        {packages.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {methods.map((m) => (
                      <button key={m.id} type="button" onClick={() => setSelectedMethodId(m.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedMethodId === m.id ? "border-primary bg-primary/5 shadow-elegant" : "border-border hover:border-primary/40"
                        }`}>
                        <div className="font-semibold text-sm">{m.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{m.type}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedMethod && (
                  <motion.div key={selectedMethod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-5 space-y-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{selectedMethod.name} ({selectedMethod.account_type})</div>
                      <div className="mt-2 flex items-center justify-between gap-3 bg-background rounded-xl px-4 py-3 border border-border">
                        <span className="font-mono font-bold text-foreground break-all">{selectedMethod.account_number}</span>
                        <button type="button" onClick={() => copy(selectedMethod.account_number)}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                      </div>
                    </div>
                    {selectedMethod.account_name && (
                      <div className="text-sm"><span className="text-muted-foreground">নাম:</span> <span className="font-semibold">{selectedMethod.account_name}</span></div>
                    )}
                    {selectedMethod.instructions && (
                      <div className="text-sm bg-background/60 rounded-lg p-3 border border-border">
                        <p className="text-foreground/90 whitespace-pre-line">{selectedMethod.instructions}</p>
                      </div>
                    )}
                    {selectedPkg && (
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-sm text-muted-foreground">পরিমাণ</span>
                        <span className="text-xl font-extrabold text-primary">{selectedPkg.price}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Right: form */}
              <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-lg">TRX ID সাবমিট করুন</h3>
                <Field icon={User} label="আপনার নাম *" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} placeholder="পুরো নাম" />
                <Field icon={Phone} label="ফোন নাম্বার *" value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} placeholder="01XXXXXXXXX" />
                <Field icon={MessageSquare} label="ইমেইল (ঐচ্ছিক)" value={form.customer_email} onChange={(v) => setForm({ ...form, customer_email: v })} placeholder="you@email.com" type="email" />
                <Field icon={Phone} label="যে নাম্বার থেকে পাঠিয়েছেন *" value={form.sender_number} onChange={(v) => setForm({ ...form, sender_number: v })} placeholder="01XXXXXXXXX" />
                <Field icon={Hash} label="Transaction ID (TRX) *" value={form.transaction_id} onChange={(v) => setForm({ ...form, transaction_id: v })} placeholder="যেমন: 8N7A2K9X" />
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">নোট (ঐচ্ছিক)</span>
                  <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="অতিরিক্ত কোনো তথ্য" />
                </label>
                <button type="submit" disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full gradient-primary text-primary-foreground font-bold shadow-elegant disabled:opacity-70">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  পেমেন্ট সাবমিট করুন
                </button>
                <p className="text-[11px] text-muted-foreground text-center">সাবমিট করার পর আমরা ৩০ মিনিটের মধ্যে কনফার্ম করবো।</p>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = "text" }: {
  icon: any; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1 relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:border-primary outline-none" />
      </div>
    </label>
  );
}
