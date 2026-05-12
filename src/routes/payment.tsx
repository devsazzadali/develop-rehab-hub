import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Copy, Loader2, ShieldCheck, Wallet, Phone, User, Hash, MessageSquare,
  ArrowRight, ArrowLeft, Lock, Upload, Image as ImageIcon, Mail, Receipt, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingButtons } from "@/components/site/FloatingButtons";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

type PaymentMethod = {
  id: string; name: string; type: string; account_number: string; account_name: string;
  instructions: string; account_type: string; active: boolean; sort_order: number;
};
type Pkg = { id: string; name: string; price: string };

export const Route = createFileRoute("/payment")({
  validateSearch: (s: Record<string, unknown>) => ({
    package: typeof s.package === "string" ? s.package : undefined,
  }),
  head: () => ({
    meta: [
      { title: "নিরাপদ পেমেন্ট | Develop Care" },
      { name: "description", content: "SSL-secured মাল্টি-স্টেপ পেমেন্ট। বিকাশ, নগদ, রকেট, ব্যাংক — সব মাধ্যমে।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentPage,
});

const customerSchema = z.object({
  customer_name: z.string().trim().min(2, "নাম দিন").max(100),
  customer_phone: z.string().trim().min(10, "সঠিক ফোন দিন").max(20),
  customer_email: z.string().trim().email("সঠিক ইমেইল দিন").max(255).optional().or(z.literal("")),
});

const trxSchema = z.object({
  sender_number: z.string().trim().min(10, "Sender নাম্বার দিন").max(20),
  transaction_id: z.string().trim().min(4, "TRX ID দিন").max(50),
});

type FormState = {
  customer_name: string; customer_phone: string; customer_email: string;
  sender_number: string; transaction_id: string; note: string;
};

function PaymentPage() {
  const search = useSearch({ from: "/payment" }) as { package?: string };
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0..3
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [selectedPkgId, setSelectedPkgId] = useState<string>(search.package || "");
  const [submitting, setSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [form, setForm] = useState<FormState>({
    customer_name: "", customer_phone: "", customer_email: "",
    sender_number: "", transaction_id: "", note: "",
  });

  useEffect(() => {
    Promise.all([
      sb.from("payment_methods").select("*").eq("active", true).order("sort_order"),
      sb.from("consultation_packages").select("id,name,price").eq("active", true).order("sort_order"),
    ]).then(([m, p]: any[]) => {
      const ms = (m.data as PaymentMethod[]) ?? [];
      setMethods(ms);
      if (ms[0]) setSelectedMethodId(ms[0].id);
      setPackages((p.data as Pkg[]) ?? []);
      setLoading(false);
    });
  }, []);

  const selectedMethod = useMemo(() => methods.find((m) => m.id === selectedMethodId), [methods, selectedMethodId]);
  const selectedPkg = useMemo(() => packages.find((p) => p.id === selectedPkgId), [packages, selectedPkgId]);

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("কপি হয়েছে"); };

  const next = () => {
    if (step === 0) {
      const parsed = customerSchema.safeParse(form);
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    }
    if (step === 1 && !selectedMethod) { toast.error("পেমেন্ট মাধ্যম বাছাই করুন"); return; }
    if (step === 2) {
      const parsed = trxSchema.safeParse(form);
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
      if (!screenshot) { toast.error("পেমেন্ট স্ক্রিনশট আপলোড করুন"); return; }
    }
    setStep((s) => Math.min(s + 1, 3));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!selectedMethod) return;
    setSubmitting(true);
    try {
      let screenshot_url: string | null = null;
      if (screenshot) {
        setUploadingFile(true);
        const ext = screenshot.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await sb.storage.from("payment_proofs").upload(path, screenshot, {
          contentType: screenshot.type, upsert: false,
        });
        setUploadingFile(false);
        if (upErr) { toast.error("স্ক্রিনশট আপলোড ব্যর্থ: " + upErr.message); setSubmitting(false); return; }
        screenshot_url = path;
      }

      const { data, error } = await sb.from("payment_submissions").insert({
        package_id: selectedPkg?.id ?? null,
        payment_method_id: selectedMethod.id,
        payment_method_name: selectedMethod.name,
        package_name: selectedPkg?.name ?? "",
        amount: selectedPkg?.price ?? "",
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
        sender_number: form.sender_number,
        transaction_id: form.transaction_id,
        note: form.note || null,
        screenshot_url,
      }).select("id").single();

      if (error) { toast.error(error.message); setSubmitting(false); return; }
      navigate({ to: "/thank-you", search: { id: data.id } });
    } catch (e: any) {
      toast.error(e?.message || "Error");
      setSubmitting(false);
    }
  };

  const steps = [
    { n: 1, label: "তথ্য", icon: User },
    { n: 2, label: "মাধ্যম", icon: CreditCard },
    { n: 3, label: "পে করুন", icon: Wallet },
    { n: 4, label: "কনফার্ম", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* SSL trust strip */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mx-auto w-fit mb-6">
            <Lock className="w-3.5 h-3.5" /> 256-bit SSL Encrypted • Secure Payment
          </motion.div>

          {/* Stepper */}
          <Stepper steps={steps} current={step} />

          {loading ? (
            <div className="grid place-items-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
          ) : (
            <div className="mt-8 bg-card border border-border rounded-3xl shadow-elegant overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="p-6 md:p-8">
                  {step === 0 && (
                    <Step1Customer form={form} setForm={setForm} packages={packages}
                      selectedPkgId={selectedPkgId} setSelectedPkgId={setSelectedPkgId} />
                  )}
                  {step === 1 && (
                    <Step2Method methods={methods} selectedId={selectedMethodId} onSelect={setSelectedMethodId} />
                  )}
                  {step === 2 && selectedMethod && (
                    <Step3Pay method={selectedMethod} pkg={selectedPkg} form={form} setForm={setForm}
                      screenshot={screenshot} setScreenshot={setScreenshot} copy={copy} />
                  )}
                  {step === 3 && selectedMethod && (
                    <Step4Confirm method={selectedMethod} pkg={selectedPkg} form={form} screenshot={screenshot} />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3 px-6 md:px-8 py-4 bg-muted/30 border-t border-border">
                <button type="button" onClick={prev} disabled={step === 0 || submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-border bg-card hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed">
                  <ArrowLeft className="w-4 h-4" /> পেছনে
                </button>
                {step < 3 ? (
                  <button type="button" onClick={next}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold gradient-primary text-primary-foreground shadow-elegant">
                    পরবর্তী <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={submit} disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-emerald-500 text-white shadow-elegant disabled:opacity-70">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {uploadingFile ? "আপলোড হচ্ছে..." : "কনফার্ম করুন"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trust badges footer */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 100% Secure</span>
            <span>•</span>
            <span>Manual Verification</span>
            <span>•</span>
            <span>Money-back Guarantee</span>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}

function Stepper({ steps, current }: { steps: { n: number; label: string; icon: any }[]; current: number }) {
  return (
    <div className="flex items-center justify-between gap-1 md:gap-2">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = s.icon;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full grid place-items-center border-2 transition ${
                done ? "bg-emerald-500 border-emerald-500 text-white" :
                active ? "bg-primary border-primary text-primary-foreground shadow-elegant scale-110" :
                "bg-card border-border text-muted-foreground"
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] md:text-xs font-semibold ${active ? "text-primary" : done ? "text-emerald-600" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition ${done ? "bg-emerald-500" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1Customer({ form, setForm, packages, selectedPkgId, setSelectedPkgId }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><User className="w-6 h-6 text-primary" /> আপনার তথ্য</h2>
        <p className="text-sm text-muted-foreground mt-1">পেমেন্ট কনফার্ম করতে এই তথ্য দরকার</p>
      </div>
      {packages.length > 0 && (
        <Field icon={Receipt} label="প্যাকেজ"
          input={
            <select value={selectedPkgId} onChange={(e) => setSelectedPkgId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:border-primary outline-none">
              <option value="">— প্যাকেজ ছাড়া —</option>
              {packages.map((p: Pkg) => <option key={p.id} value={p.id}>{p.name} — {p.price}</option>)}
            </select>
          } />
      )}
      <Input icon={User} label="পুরো নাম *" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} placeholder="আপনার নাম" />
      <Input icon={Phone} label="ফোন নাম্বার *" value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} placeholder="01XXXXXXXXX" />
      <Input icon={Mail} label="ইমেইল (ঐচ্ছিক)" value={form.customer_email} onChange={(v) => setForm({ ...form, customer_email: v })} placeholder="you@email.com" type="email" />
    </div>
  );
}

function Step2Method({ methods, selectedId, onSelect }: { methods: PaymentMethod[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6 text-primary" /> পেমেন্ট মাধ্যম</h2>
        <p className="text-sm text-muted-foreground mt-1">আপনার সুবিধামতো একটি বেছে নিন</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {methods.map((m) => {
          const active = selectedId === m.id;
          return (
            <button key={m.id} type="button" onClick={() => onSelect(m.id)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                active ? "border-primary bg-primary/5 shadow-elegant scale-[1.02]" : "border-border hover:border-primary/40"
              }`}>
              {active && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground grid place-items-center"><CheckCircle2 className="w-3 h-3" /></div>}
              <div className="font-bold text-base">{m.name}</div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">{m.type} • {m.account_type}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step3Pay({ method, pkg, form, setForm, screenshot, setScreenshot, copy }: any) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-6 h-6 text-primary" /> পেমেন্ট করুন</h2>
        <p className="text-sm text-muted-foreground mt-1">নিচের নাম্বারে টাকা পাঠিয়ে TRX ID দিন</p>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{method.name} • {method.account_type}</span>
          {pkg && <span className="text-2xl font-extrabold text-primary">{pkg.price}</span>}
        </div>
        <div className="flex items-center justify-between gap-3 bg-background rounded-xl px-4 py-3 border border-border">
          <span className="font-mono font-bold text-lg break-all">{method.account_number}</span>
          <button type="button" onClick={() => copy(method.account_number)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90">
            <Copy className="w-3.5 h-3.5" /> কপি
          </button>
        </div>
        {method.account_name && <div className="text-sm"><span className="text-muted-foreground">নাম:</span> <b>{method.account_name}</b></div>}
        {method.instructions && (
          <div className="text-sm bg-background/60 rounded-lg p-3 border border-border whitespace-pre-line">
            {method.instructions}
          </div>
        )}
      </div>

      <Input icon={Phone} label="যে নাম্বার থেকে পাঠিয়েছেন *" value={form.sender_number} onChange={(v) => setForm({ ...form, sender_number: v })} placeholder="01XXXXXXXXX" />
      <Input icon={Hash} label="Transaction ID (TRX) *" value={form.transaction_id} onChange={(v) => setForm({ ...form, transaction_id: v })} placeholder="যেমন: 8N7A2K9X" />

      <ScreenshotUpload value={screenshot} onChange={setScreenshot} />

      <label className="block">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> নোট (ঐচ্ছিক)</span>
        <textarea value={form.note} onChange={(e: any) => setForm({ ...form, note: e.target.value })} rows={2}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" placeholder="অতিরিক্ত কোনো তথ্য" />
      </label>
    </div>
  );
}

function Step4Confirm({ method, pkg, form, screenshot }: any) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> তথ্য যাচাই করুন</h2>
        <p className="text-sm text-muted-foreground mt-1">কনফার্ম করার আগে একবার দেখে নিন</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <Summary k="নাম" v={form.customer_name} />
        <Summary k="ফোন" v={form.customer_phone} />
        {form.customer_email && <Summary k="ইমেইল" v={form.customer_email} />}
        <Summary k="প্যাকেজ" v={pkg?.name || "—"} />
        <Summary k="পরিমাণ" v={pkg?.price || "—"} highlight />
        <Summary k="মাধ্যম" v={method.name} />
        <Summary k="Sender" v={form.sender_number} />
        <Summary k="TRX ID" v={form.transaction_id} mono />
      </div>
      {screenshot && (
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> স্ক্রিনশট</div>
          <img src={URL.createObjectURL(screenshot)} alt="proof" className="max-h-64 rounded-lg border border-border" />
        </div>
      )}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-700 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
        <span>কনফার্ম করার পর আপনাকে রিয়েল-টাইম স্ট্যাটাস পেজে নিয়ে যাওয়া হবে। আমরা ৩০ মিনিটের মধ্যে ভেরিফাই করবো।</span>
      </div>
    </div>
  );
}

function ScreenshotUpload({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const url = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
  return (
    <div>
      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> পেমেন্ট স্ক্রিনশট *</span>
      <label className="mt-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary rounded-xl p-4 cursor-pointer transition bg-background">
        {url ? (
          <img src={url} alt="preview" className="max-h-48 rounded-lg" />
        ) : (
          <>
            <Upload className="w-7 h-7 text-muted-foreground" />
            <span className="text-sm font-semibold">ক্লিক করে স্ক্রিনশট আপলোড করুন</span>
            <span className="text-[11px] text-muted-foreground">JPG / PNG • সর্বোচ্চ 5MB</span>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) { toast.error("ফাইল 5MB এর কম হতে হবে"); return; }
          onChange(f);
        }} />
      </label>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="mt-1 text-xs text-destructive hover:underline">সরান</button>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, input }: any) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1 relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        {input}
      </div>
    </label>
  );
}

function Input({ icon: Icon, label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1 relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:border-primary outline-none" />
      </div>
    </label>
  );
}

function Summary({ k, v, mono, highlight }: { k: string; v: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-muted/40 rounded-lg p-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className={`mt-0.5 break-all ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-extrabold text-base" : "font-semibold"}`}>{v}</div>
    </div>
  );
}
