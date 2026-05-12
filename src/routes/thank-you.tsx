import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, MessageCircle, Phone, Mail, ArrowRight, Loader2, ShieldCheck, Receipt, FileCheck2, Radio } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSiteInfo, waLinkFor } from "@/lib/use-site-data";
import { ScheduleMeeting } from "@/components/site/ScheduleMeeting";

const sb: any = supabase;

type Submission = {
  id: string; status: string; payment_method_name: string; package_name: string;
  amount: string; transaction_id: string; sender_number: string;
  customer_name: string; customer_phone: string; customer_email: string | null;
  created_at: string; admin_notes: string | null; confirmed_at: string | null;
};

export const Route = createFileRoute("/thank-you")({
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : "",
  }),
  head: () => ({
    meta: [
      { title: "ধন্যবাদ! পেমেন্ট রিসিভড | Develop Care" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

const STATUS: Record<string, { label: string; cls: string; icon: any; msg: string }> = {
  pending:   { label: "Pending",   cls: "bg-amber-500/15 text-amber-700 border-amber-500/40",     icon: Clock,         msg: "আপনার পেমেন্ট ভেরিফিকেশনের জন্য অপেক্ষা করছে। সাধারণত ৩০ মিনিটের মধ্যে কনফার্ম হয়।" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40", icon: CheckCircle2, msg: "🎉 আপনার পেমেন্ট কনফার্ম হয়েছে! শীঘ্রই আমরা আপনার সাথে যোগাযোগ করবো।" },
  rejected:  { label: "Rejected",  cls: "bg-red-500/15 text-red-700 border-red-500/40",            icon: XCircle,      msg: "দুঃখিত, আপনার পেমেন্ট ভেরিফাই করা যায়নি। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।" },
};

function ThankYouPage() {
  const { id } = Route.useSearch();
  const SITE = useSiteInfo();
  const [item, setItem] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [rtConnected, setRtConnected] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    sb.from("payment_submissions").select("*").eq("id", id).maybeSingle().then(({ data }: any) => {
      setItem(data as Submission);
      setLoading(false);
    });
    const ch = sb.channel(`pay-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payment_submissions", filter: `id=eq.${id}` },
        (p: any) => {
          setItem(p.new as Submission);
          setPulse(true);
          setTimeout(() => setPulse(false), 1800);
        })
      .subscribe((status: string) => setRtConnected(status === "SUBSCRIBED"));
    return () => { sb.removeChannel(ch); };
  }, [id]);

  const meta = item ? STATUS[item.status] || STATUS.pending : STATUS.pending;
  const Icon = meta.icon;
  const waMsg = `Hi, আমি ${item?.customer_name || ""} — TRX: ${item?.transaction_id || ""}. পেমেন্ট স্ট্যাটাস জানতে চাই।`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading ? (
            <div className="grid place-items-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
          ) : !item ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">পেমেন্ট খুঁজে পাওয়া যায়নি।</p>
              <Link to="/" className="mt-4 inline-block text-primary underline">হোমে ফিরে যান</Link>
            </div>
          ) : (
            <>
              {/* Hero status card */}
              <motion.div
                key={item.status}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`relative bg-gradient-to-br from-primary/5 via-card to-accent/5 border rounded-3xl p-8 md:p-10 text-center shadow-elegant transition-colors ${
                  pulse ? "border-primary ring-4 ring-primary/20" : "border-border"
                }`}>
                {/* Realtime indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <span className={`relative flex h-2 w-2`}>
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${rtConnected ? "animate-ping bg-emerald-400" : "bg-muted-foreground/40"}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${rtConnected ? "bg-emerald-500" : "bg-muted-foreground"}`}></span>
                  </span>
                  <span className={rtConnected ? "text-emerald-600" : "text-muted-foreground"}>
                    {rtConnected ? "Live" : "Connecting..."}
                  </span>
                </div>

                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className={`w-20 h-20 rounded-full grid place-items-center mx-auto border-2 ${meta.cls}`}>
                  <Icon className={`w-10 h-10 ${item.status === "pending" ? "animate-pulse" : ""}`} />
                </motion.div>
                <div className={`mt-4 inline-block text-xs font-bold px-3 py-1 rounded-full border ${meta.cls}`}>
                  {meta.label}
                </div>
                <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
                  ধন্যবাদ, {item.customer_name}!
                </h1>
                <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{meta.msg}</p>

                {/* Progress timeline */}
                <StatusTimeline status={item.status} confirmedAt={item.confirmed_at} createdAt={item.created_at} />
              </motion.div>

              {/* Service details */}
              <div className="mt-6 bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-primary" /> সার্ভিস ডিটেইলস
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <Row k="প্যাকেজ" v={item.package_name || "—"} />
                  <Row k="পরিমাণ" v={item.amount || "—"} highlight />
                  <Row k="পেমেন্ট মাধ্যম" v={item.payment_method_name} />
                  <Row k="TRX ID" v={item.transaction_id} mono />
                  <Row k="Sender" v={item.sender_number} />
                  <Row k="সাবমিট" v={new Date(item.created_at).toLocaleString("bn-BD")} />
                </div>
                {item.admin_notes && item.status !== "pending" && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="text-xs font-bold text-muted-foreground mb-1">আমাদের নোট</div>
                    <p className="whitespace-pre-line">{item.admin_notes}</p>
                  </div>
                )}
              </div>

              {/* Schedule meeting (only after admin confirms payment) */}
              {item.status === "confirmed" && (
                <div className="mt-6">
                  <ScheduleMeeting paymentId={item.id} customerName={item.customer_name} />
                </div>
              )}

              {/* Emergency contact */}
              <div className="mt-6 bg-gradient-to-br from-emerald-500/5 to-primary/5 border border-emerald-500/20 rounded-2xl p-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> জরুরি যোগাযোগ
                </h3>
                <p className="text-sm text-muted-foreground mt-1">কোনো সমস্যা হলে সরাসরি আমাদের সাথে যোগাযোগ করুন</p>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <a href={waLinkFor(SITE.whatsapp, waMsg)} target="_blank" rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition">
                    <MessageCircle className="w-4 h-4" /> WhatsApp এ চ্যাট
                  </a>
                  <a href={`tel:${SITE.phone}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border border-border font-bold hover:border-primary transition">
                    <Phone className="w-4 h-4 text-primary" /> {SITE.phoneDisplay}
                  </a>
                </div>
                {SITE.email && (
                  <a href={`mailto:${SITE.email}`} className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <Mail className="w-3.5 h-3.5" /> {SITE.email}
                  </a>
                )}
              </div>

              <div className="mt-8 text-center">
                <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                  হোমে ফিরে যান <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatusTimeline({ status, createdAt, confirmedAt }: { status: string; createdAt: string; confirmedAt: string | null }) {
  const isRejected = status === "rejected";
  const isConfirmed = status === "confirmed";
  const steps = [
    { key: "submitted", label: "সাবমিট", icon: FileCheck2, done: true, time: createdAt },
    { key: "review",    label: "রিভিউ",   icon: Radio,      done: isConfirmed || isRejected, active: status === "pending", time: null as string | null },
    { key: "final",     label: isRejected ? "রিজেক্টেড" : "কনফার্মড", icon: isRejected ? XCircle : CheckCircle2, done: isConfirmed || isRejected, time: confirmedAt },
  ];
  return (
    <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const SIcon = s.icon;
        const tone = isRejected && s.key === "final"
          ? "bg-red-500 text-white border-red-500"
          : s.done
          ? "bg-emerald-500 text-white border-emerald-500"
          : s.active
          ? "bg-amber-500 text-white border-amber-500 animate-pulse"
          : "bg-muted text-muted-foreground border-border";
        return (
          <div key={s.key} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full grid place-items-center border-2 ${tone}`}>
                <SIcon className="w-4 h-4" />
              </div>
              <div className="mt-1.5 text-[10px] sm:text-xs font-bold text-foreground">{s.label}</div>
              {s.time && <div className="text-[9px] text-muted-foreground">{new Date(s.time).toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" })}</div>}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-12 rounded ${steps[i + 1].done || steps[i + 1].active ? "bg-emerald-500" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Row({ k, v, mono, highlight }: { k: string; v: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{k}</div>
      <div className={`mt-0.5 break-all ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-extrabold text-lg" : "font-semibold text-foreground"}`}>{v}</div>
    </div>
  );
}
