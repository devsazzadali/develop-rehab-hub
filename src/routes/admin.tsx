import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Image as ImageIcon, Loader2, LogOut, Phone, Plus, RefreshCw, Save, Settings2, Sparkles, Trash2, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { INFO_KEY_MAP, type SiteInfo } from "@/lib/use-site-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "অ্যাডমিন প্যানেল" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type Appointment = {
  id: string; name: string; phone: string; problem_type: string;
  address: string | null; details: string | null; status: string; created_at: string;
};

type SiteVideo = {
  id: string; video_id: string; title: string;
  type: "hero" | "review"; sort_order: number;
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
    supabase.from("user_roles").select("role")
      .eq("user_id", session.userId).eq("role", "admin").maybeSingle()
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
    e.preventDefault(); setLoading(true);
    try {
      if (mode === "signup") {
        const redirect = `${window.location.origin}/admin`;
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect } });
        if (error) throw error;
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে।");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) { toast.error(err.message || "ত্রুটি"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-card rounded-3xl p-8 shadow-elegant border border-border space-y-4">
        <h1 className="text-2xl font-bold text-gradient">অ্যাডমিন {mode === "login" ? "লগইন" : "সাইন আপ"}</h1>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ইমেইল"
          className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="পাসওয়ার্ড (৬+ অক্ষর)"
          className="w-full rounded-xl border border-input bg-background px-4 py-3" />
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
        <p className="text-sm text-muted-foreground">Supabase SQL এডিটরে নিচের কোয়েরি রান করুন:</p>
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

type Tab = "appointments" | "videos" | "site" | "tracking";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "appointments", label: "অ্যাপয়েন্টমেন্ট", icon: CalendarDays },
  { key: "videos", label: "ভিডিও", icon: Video },
  { key: "site", label: "সাইট তথ্য", icon: Settings2 },
  { key: "tracking", label: "Pixel / GTM", icon: Sparkles },
];

function Dashboard() {
  const [tab, setTab] = useState<Tab>("appointments");
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-accent/20">
      <header className="border-b border-border/60 bg-card/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl gradient-primary grid place-items-center text-primary-foreground shadow-elegant">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">অ্যাডমিন প্যানেল</h1>
              <p className="text-xs text-muted-foreground">সম্পূর্ণ সাইট ম্যানেজমেন্ট</p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="px-3 py-2 rounded-lg bg-card border border-border hover:border-destructive hover:text-destructive inline-flex items-center gap-2 text-sm transition">
            <LogOut className="w-4 h-4" /> লগআউট
          </button>
        </div>
        <div className="container mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition inline-flex items-center gap-2 ${tab === key ? "gradient-primary text-primary-foreground shadow-soft" : "bg-card border border-border text-foreground hover:border-primary"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {tab === "appointments" && <AppointmentsTab />}
        {tab === "videos" && <VideosTab />}
        {tab === "site" && <SiteInfoTab />}
        {tab === "tracking" && <TrackingTab />}
      </main>
    </div>
  );
}

function AppointmentsTab() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("appointments").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setItems((data as Appointment[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("আপডেট হয়েছে"); load(); }
  };
  const remove = async (id: string) => {
    if (!confirm("নিশ্চিত মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("মুছে ফেলা হয়েছে"); load(); }
  };

  const stats = {
    total: items.length,
    new: items.filter((i) => i.status === "new").length,
    booked: items.filter((i) => i.status === "booked").length,
    done: items.filter((i) => i.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="মোট" value={stats.total} tone="primary" />
        <StatCard label="নতুন" value={stats.new} tone="info" />
        <StatCard label="বুকড" value={stats.booked} tone="success" />
        <StatCard label="সম্পন্ন" value={stats.done} tone="muted" />
      </div>
      <div className="flex justify-end">
        <button onClick={load} className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent inline-flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> রিফ্রেশ
        </button>
      </div>
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
                  <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString("bn-BD")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}
                    className="text-xs rounded-lg border border-input bg-background px-2 py-1.5">
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
              {a.details && <div className="mt-3 text-sm bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground">বিস্তারিত: </span>{a.details}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : trimmed;
}

function VideosTab() {
  const [items, setItems] = useState<SiteVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"hero" | "review">("review");
  const [videoId, setVideoId] = useState("");
  const [title, setTitle] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("site_videos").select("*")
      .order("type").order("sort_order", { ascending: true });
    if (error) toast.error(error.message); else setItems((data as SiteVideo[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeId(videoId);
    if (!id) return toast.error("ভিডিও ID দিন");
    const sort_order = items.filter((i) => i.type === type).length;
    const { error } = await (supabase as any).from("site_videos")
      .insert({ video_id: id, title: title || (type === "hero" ? "পরিচিতি ভিডিও" : "রোগীর অভিজ্ঞতা"), type, sort_order });
    if (error) return toast.error(error.message);
    toast.success("যোগ করা হয়েছে");
    setVideoId(""); setTitle(""); load();
  };

  const update = async (id: string, patch: Partial<SiteVideo>) => {
    const { error } = await (supabase as any).from("site_videos").update(patch).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    if (!confirm("মুছে ফেলবেন?")) return;
    const { error } = await (supabase as any).from("site_videos").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("মুছে ফেলা হয়েছে"); load(); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-card rounded-2xl p-5 border border-border shadow-soft space-y-3">
        <h2 className="font-bold text-foreground">নতুন ভিডিও যোগ করুন</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-xl border border-input bg-background px-3 py-2.5">
            <option value="review">রিভিউ ভিডিও</option>
            <option value="hero">হিরো ভিডিও (পরিচিতি)</option>
          </select>
          <input value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="YouTube URL বা ID"
            className="rounded-xl border border-input bg-background px-3 py-2.5" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="শিরোনাম"
            className="rounded-xl border border-input bg-background px-3 py-2.5" />
        </div>
        <button className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> যোগ করুন
        </button>
        <p className="text-xs text-muted-foreground">টিপ: YouTube link সম্পূর্ণ পেস্ট করলেও চলবে। হিরো সেকশনে শুধু প্রথম হিরো ভিডিওটি দেখানো হবে।</p>
      </form>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {items.map((v) => (
            <div key={v.id} className="bg-card rounded-2xl p-4 border border-border shadow-soft flex flex-wrap items-center gap-4">
              <img src={`https://i.ytimg.com/vi/${v.video_id}/default.jpg`} alt="" className="w-24 h-16 object-cover rounded-lg" />
              <div className="flex-1 min-w-[200px] space-y-2">
                <input defaultValue={v.title} onBlur={(e) => e.target.value !== v.title && update(v.id, { title: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-semibold" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full ${v.type === "hero" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>{v.type}</span>
                  <span>ID: {v.video_id}</span>
                </div>
              </div>
              <input type="number" defaultValue={v.sort_order} onBlur={(e) => Number(e.target.value) !== v.sort_order && update(v.id, { sort_order: Number(e.target.value) })}
                className="w-20 rounded-lg border border-input bg-background px-2 py-1.5 text-sm" title="ক্রম" />
              <button onClick={() => remove(v.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="text-center py-12 text-muted-foreground">কোনো ভিডিও যোগ করা হয়নি।</div>}
        </div>
      )}
    </div>
  );
}

const TRACKING_FIELDS: { key: string; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "facebook_pixel_id", label: "Facebook Pixel ID", placeholder: "যেমন: 1234567890123456" },
  { key: "gtm_id", label: "Google Tag Manager ID", placeholder: "যেমন: GTM-XXXXXXX" },
  { key: "ga_measurement_id", label: "Google Analytics 4 ID", placeholder: "যেমন: G-XXXXXXXXXX" },
  { key: "head_custom_code", label: "Custom <head> Code", placeholder: "<script>...</script>", multiline: true },
  { key: "body_custom_code", label: "Custom <body> Code", placeholder: "<noscript>...</noscript>", multiline: true },
];

function TrackingTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("site_settings").select("key,value");
    if (error) toast.error(error.message);
    else {
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => (map[r.key] = r.value || ""));
      setValues(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      for (const f of TRACKING_FIELDS) {
        const value = values[f.key] ?? "";
        const { error } = await (supabase as any).from("site_settings")
          .upsert({ key: f.key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("সংরক্ষণ হয়েছে");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-5 max-w-3xl">
      <div>
        <h2 className="font-bold text-foreground text-lg">Pixel ও ট্র্যাকিং কোড</h2>
        <p className="text-sm text-muted-foreground mt-1">এখানে যা সেট করবেন সেটি সাইটের সব পেইজে স্বয়ংক্রিয়ভাবে ইনজেক্ট হবে।</p>
      </div>
      {TRACKING_FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">{f.label}</label>
          {f.multiline ? (
            <textarea
              value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.placeholder} rows={4}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          ) : (
            <input
              value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5"
            />
          )}
        </div>
      ))}
      <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold inline-flex items-center gap-2 disabled:opacity-70">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} সংরক্ষণ করুন
      </button>
    </div>
  );
}
