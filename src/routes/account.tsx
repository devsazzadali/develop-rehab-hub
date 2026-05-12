import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut, User as UserIcon, Phone, Mail, MapPin, Stethoscope, Calendar, Wallet, ShieldCheck, Video, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "আমার অ্যাকাউন্ট | Develop Care" }, { name: "robots", content: "noindex" }] }),
  component: AccountPage,
});

function AccountPage() {
  const nav = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [savingPwd, setSavingPwd] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => { sub.subscription.unsubscribe(); clearInterval(t); };
  }, []);

  const reloadAll = (uid: string) => {
    Promise.all([
      sb.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("appointments").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      sb.from("payment_submissions").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      sb.from("consultation_schedules").select("*").eq("user_id", uid).order("scheduled_at", { ascending: true }),
    ]).then(([p, a, pay, sch]: any[]) => {
      setProfile(p.data); setAppointments(a.data ?? []); setPayments(pay.data ?? []); setSchedules(sch.data ?? []);
    });
  };

  useEffect(() => {
    if (!session) return;
    reloadAll(session.user.id);
    const ch = sb.channel("account-schedules-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultation_schedules", filter: `user_id=eq.${session.user.id}` },
        () => reloadAll(session.user.id))
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [session]);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  if (!session) return <LoginPrompt />;

  const updatePassword = async () => {
    if (newPwd.length < 6) { toast.error("৬+ অক্ষর দিন"); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSavingPwd(false);
    if (error) toast.error(error.message); else { toast.success("পাসওয়ার্ড আপডেট হয়েছে"); setNewPwd(""); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">আমার অ্যাকাউন্ট</h1>
              <p className="text-muted-foreground text-sm">আপনার সব অ্যাপয়েন্টমেন্ট ও পেমেন্ট দেখুন</p>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:border-destructive hover:text-destructive text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-4"><UserIcon className="w-5 h-5 text-primary" /> প্রোফাইল</h2>
            {profile ? (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Row icon={UserIcon} k="নাম" v={profile.name} />
                <Row icon={Mail} k="ইমেইল" v={profile.email} />
                <Row icon={Phone} k="ফোন" v={profile.phone} />
                <Row icon={MapPin} k="ঠিকানা" v={profile.address || "—"} />
                <Row icon={Stethoscope} k="সমস্যা" v={profile.problem_type || "—"} />
              </div>
            ) : <p className="text-muted-foreground text-sm">প্রোফাইল লোড হচ্ছে...</p>}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-primary" /> পাসওয়ার্ড পরিবর্তন</h2>
            <div className="flex flex-wrap gap-2">
              <input type="password" minLength={6} value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড (৬+)" className="flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={updatePassword} disabled={savingPwd}
                className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-70">
                {savingPwd ? "সেভ হচ্ছে..." : "আপডেট"}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-4"><Calendar className="w-5 h-5 text-primary" /> অ্যাপয়েন্টমেন্ট ({appointments.length})</h2>
            {appointments.length === 0 ? <p className="text-sm text-muted-foreground">কোনো অ্যাপয়েন্টমেন্ট নেই।</p> : (
              <div className="space-y-2">
                {appointments.map((a) => (
                  <div key={a.id} className="border border-border rounded-lg p-3 text-sm">
                    <div className="font-semibold">{a.problem_type}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("bn-BD")} • Status: <b>{a.status}</b></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-primary" /> পেমেন্ট ({payments.length})</h2>
            {payments.length === 0 ? <p className="text-sm text-muted-foreground">কোনো পেমেন্ট নেই।</p> : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <Link key={p.id} to="/thank-you" search={{ id: p.id }}
                    className="block border border-border rounded-lg p-3 text-sm hover:border-primary transition">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{p.package_name || p.payment_method_name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "confirmed" ? "bg-emerald-500/15 text-emerald-700" :
                        p.status === "rejected" ? "bg-red-500/15 text-red-700" :
                        "bg-amber-500/15 text-amber-700"
                      }`}>{p.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">TRX: {p.transaction_id} • {p.amount}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Row({ icon: Icon, k, v }: { icon: any; k: string; v: string }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" /> {k}</div>
      <div className="mt-0.5 font-semibold break-all">{v}</div>
    </div>
  );
}

function LoginPrompt() {
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account` });
        if (error) throw error;
        toast.success("রিসেট লিংক পাঠানো হয়েছে");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <form onSubmit={submit} className="max-w-md mx-auto bg-card border border-border rounded-3xl p-8 shadow-elegant space-y-4">
          <h1 className="text-2xl font-bold">আপনার অ্যাকাউন্টে লগইন</h1>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ইমেইল"
            className="w-full rounded-xl border border-input bg-background px-4 py-3" />
          {mode === "login" && (
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="পাসওয়ার্ড"
              className="w-full rounded-xl border border-input bg-background px-4 py-3" />
          )}
          <button disabled={busy} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-70">
            {mode === "login" ? "লগইন" : "রিসেট লিংক পাঠান"}
          </button>
          <button type="button" onClick={() => setMode(mode === "login" ? "reset" : "login")} className="text-sm text-primary w-full">
            {mode === "login" ? "পাসওয়ার্ড ভুলে গেছেন?" : "← লগইনে ফিরে যান"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
