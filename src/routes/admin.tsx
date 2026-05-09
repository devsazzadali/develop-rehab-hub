import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, Phone, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "অ্যাডমিন প্যানেল" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type Appointment = {
  id: string;
  name: string;
  phone: string;
  problem_type: string;
  address: string | null;
  details: string | null;
  status: string;
  created_at: string;
};

function AdminPage() {
  const [session, setSession] = useState<{ userId: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ? { userId: s.user.id } : null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { userId: data.session.user.id } : null);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (checking) return <FullCenter><Loader2 className="w-6 h-6 animate-spin text-primary" /></FullCenter>;
  if (!session) return <LoginCard />;
  if (isAdmin === null) return <FullCenter><Loader2 className="w-6 h-6 animate-spin text-primary" /></FullCenter>;
  if (!isAdmin) return <NotAdmin userId={session.userId} />;
  return <Dashboard />;
}

function FullCenter({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen grid place-items-center bg-background">{children}</div>;
}

function LoginCard() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const redirect = `${window.location.origin}/admin`;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে। অ্যাডমিন রোল নিচের নির্দেশনা অনুসারে সেট করুন।");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "ত্রুটি");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-card rounded-3xl p-8 shadow-elegant border border-border space-y-4">
        <h1 className="text-2xl font-bold text-gradient">অ্যাডমিন {mode === "login" ? "লগইন" : "সাইন আপ"}</h1>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="ইমেইল"
          className="w-full rounded-xl border border-input bg-background px-4 py-3"
        />
        <input
          type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="পাসওয়ার্ড (৬+ অক্ষর)"
          className="w-full rounded-xl border border-input bg-background px-4 py-3"
        />
        <button disabled={loading} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-70 inline-flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "login" ? "লগইন" : "সাইন আপ"}
        </button>
        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-primary w-full">
          {mode === "login" ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন"}
        </button>
      </form>
    </div>
  );
}

function NotAdmin({ userId }: { userId: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 px-4">
      <div className="max-w-lg bg-card rounded-3xl p-8 shadow-elegant border border-border space-y-4">
        <h1 className="text-xl font-bold text-foreground">আপনার অ্যাডমিন অনুমতি নেই</h1>
        <p className="text-sm text-muted-foreground">
          অ্যাডমিন অ্যাক্সেস পেতে Supabase SQL এডিটরে নিচের কোয়েরি রান করুন:
        </p>
        <pre className="bg-muted rounded-xl p-3 text-xs overflow-x-auto">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${userId}', 'admin');`}
        </pre>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-primary inline-flex items-center gap-2">
          <LogOut className="w-4 h-4" /> লগআউট
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data as Appointment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("আপডেট হয়েছে"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("নিশ্চিত মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("মুছে ফেলা হয়েছে"); load(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gradient">অ্যাডমিন প্যানেল</h1>
            <p className="text-xs text-muted-foreground">অ্যাপয়েন্টমেন্ট সমূহ</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="px-3 py-2 rounded-lg border border-border hover:bg-accent inline-flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> রিফ্রেশ
            </button>
            <button onClick={() => supabase.auth.signOut()} className="px-3 py-2 rounded-lg gradient-primary text-primary-foreground inline-flex items-center gap-2 text-sm">
              <LogOut className="w-4 h-4" /> লগআউট
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।</div>
        ) : (
          <div className="grid gap-4">
            {items.map((a) => (
              <div key={a.id} className="bg-card rounded-2xl p-5 border border-border shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-foreground">{a.name}</div>
                    <a href={`tel:${a.phone}`} className="text-sm text-primary inline-flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {a.phone}
                    </a>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(a.created_at).toLocaleString("bn-BD")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                      className="text-xs rounded-lg border border-input bg-background px-2 py-1.5"
                    >
                      <option value="new">নতুন</option>
                      <option value="contacted">যোগাযোগ করা হয়েছে</option>
                      <option value="booked">বুকড</option>
                      <option value="done">সম্পন্ন</option>
                    </select>
                    <button onClick={() => remove(a.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                  <div><span className="text-muted-foreground">সমস্যা: </span>{a.problem_type}</div>
                  <div><span className="text-muted-foreground">ঠিকানা: </span>{a.address || "—"}</div>
                </div>
                {a.details && (
                  <div className="mt-3 text-sm bg-muted/50 rounded-lg p-3">
                    <span className="text-muted-foreground">বিস্তারিত: </span>{a.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
