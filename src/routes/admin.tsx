import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Download, Image as ImageIcon, Loader2, LogOut, MapPin, MessageCircle, Phone, Plus, RefreshCw, Save, Search, Settings2, Sparkles, Trash2, Video, X } from "lucide-react";
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
  const [overview, setOverview] = useState({ total: 0, today: 0, videos: 0, pixelOn: false });

  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [{ count: total }, { count: todayCount }, { count: videos }, { data: pix }] = await Promise.all([
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        (supabase as any).from("site_videos").select("*", { count: "exact", head: true }),
        (supabase as any).from("site_settings").select("value").eq("key", "facebook_pixel_id").maybeSingle(),
      ]);
      setOverview({
        total: total ?? 0,
        today: todayCount ?? 0,
        videos: videos ?? 0,
        pixelOn: !!(pix?.value),
      });
    })();
  }, [tab]);

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
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-card border border-border hover:border-primary inline-flex items-center gap-2 text-sm transition">
              সাইট দেখুন ↗
            </a>
            <button onClick={() => supabase.auth.signOut()} className="px-3 py-2 rounded-lg bg-card border border-border hover:border-destructive hover:text-destructive inline-flex items-center gap-2 text-sm transition">
              <LogOut className="w-4 h-4" /> লগআউট
            </button>
          </div>
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

      <div className="container mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="আজকের লিড" value={overview.today} tone="primary" />
          <StatCard label="মোট অ্যাপয়েন্টমেন্ট" value={overview.total} tone="info" />
          <StatCard label="মোট ভিডিও" value={overview.videos} tone="success" />
          <div className={`rounded-2xl p-4 border border-border bg-gradient-to-br shadow-soft ${overview.pixelOn ? "from-emerald-500/15 to-emerald-500/5 text-emerald-700" : "from-muted to-muted/40 text-muted-foreground"}`}>
            <div className="text-xs font-semibold opacity-80">FB Pixel</div>
            <div className="text-2xl font-extrabold mt-1">{overview.pixelOn ? "সক্রিয়" : "নিষ্ক্রিয়"}</div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {tab === "appointments" && <AppointmentsTab />}
        {tab === "videos" && <VideosTab />}
        {tab === "site" && <SiteInfoTab />}
        {tab === "tracking" && <TrackingTab />}
      </main>
    </div>
  );
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: "নতুন", cls: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  contacted: { label: "যোগাযোগ", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  booked: { label: "বুকড", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  done: { label: "সম্পন্ন", cls: "bg-muted text-muted-foreground border-border" },
};

function AppointmentsTab() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<Appointment | null>(null);
  const [waNumber, setWaNumber] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("appointments").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setItems((data as Appointment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Realtime: new appointments appear instantly
  useEffect(() => {
    const ch = supabase
      .channel("appointments-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setItems((prev) => [payload.new as Appointment, ...prev]);
          toast.success(`নতুন অ্যাপয়েন্টমেন্ট: ${(payload.new as Appointment).name}`);
        } else if (payload.eventType === "UPDATE") {
          setItems((prev) => prev.map((i) => (i.id === (payload.new as Appointment).id ? (payload.new as Appointment) : i)));
        } else if (payload.eventType === "DELETE") {
          setItems((prev) => prev.filter((i) => i.id !== (payload.old as Appointment).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Load WhatsApp number for quick action
  useEffect(() => {
    (supabase as any).from("site_settings").select("value").eq("key", "site_whatsapp").maybeSingle()
      .then(({ data }: any) => setWaNumber(data?.value ?? ""));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("আপডেট হয়েছে");
  };
  const remove = async (id: string) => {
    if (!confirm("নিশ্চিত মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("মুছে ফেলা হয়েছে"); setActive(null); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (filter !== "all" && i.status !== filter) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.phone.toLowerCase().includes(q) ||
        i.problem_type.toLowerCase().includes(q) ||
        (i.address ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  const stats = {
    total: items.length,
    new: items.filter((i) => i.status === "new").length,
    booked: items.filter((i) => i.status === "booked").length,
    done: items.filter((i) => i.status === "done").length,
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Phone", "Problem", "Address", "Details", "Status", "Created"],
      ...filtered.map((i) => [i.name, i.phone, i.problem_type, i.address ?? "", i.details ?? "", i.status, new Date(i.created_at).toISOString()]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `appointments-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const waLink = (phone: string, name: string) => {
    const num = (waNumber || phone).replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(`আসসালামু আলাইকুম ${name}, ডেভেলপ ফিজিওথেরাপি সেন্টার থেকে বলছি। আপনার অ্যাপয়েন্টমেন্টের ব্যাপারে যোগাযোগ করছি।`);
    return `https://wa.me/${num}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="মোট" value={stats.total} tone="primary" />
        <StatCard label="নতুন" value={stats.new} tone="info" />
        <StatCard label="বুকড" value={stats.booked} tone="success" />
        <StatCard label="সম্পন্ন" value={stats.done} tone="muted" />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 bg-gradient-to-r from-card to-secondary/30">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="নাম, ফোন, সমস্যা দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "new", "contacted", "booked", "done"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${filter === s ? "gradient-primary text-primary-foreground border-transparent shadow-soft" : "bg-background border-border text-foreground hover:border-primary"}`}
              >
                {s === "all" ? "সব" : STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-border bg-background hover:border-primary inline-flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={load} className="px-3 py-2 rounded-lg border border-border bg-background hover:border-primary inline-flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">রোগী</th>
                  <th className="text-left px-4 py-3 font-semibold">যোগাযোগ</th>
                  <th className="text-left px-4 py-3 font-semibold">সমস্যা</th>
                  <th className="text-left px-4 py-3 font-semibold">তারিখ</th>
                  <th className="text-left px-4 py-3 font-semibold">স্ট্যাটাস</th>
                  <th className="text-right px-4 py-3 font-semibold">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const meta = STATUS_META[a.status] ?? STATUS_META.new;
                  return (
                    <tr key={a.id} className="border-t border-border hover:bg-secondary/30 transition cursor-pointer" onClick={() => setActive(a)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{a.name}</div>
                        {a.address && <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{a.address}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`tel:${a.phone}`} onClick={(e) => e.stopPropagation()} className="text-primary font-medium inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {a.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-foreground">{a.problem_type}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}
                          className={`text-xs rounded-lg border px-2 py-1 font-semibold ${meta.cls}`}>
                          <option value="new">নতুন</option>
                          <option value="contacted">যোগাযোগ</option>
                          <option value="booked">বুকড</option>
                          <option value="done">সম্পন্ন</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex gap-1">
                          <a href={`tel:${a.phone}`} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" title="কল"><Phone className="w-4 h-4" /></a>
                          <a href={waLink(a.phone, a.name)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600" title="WhatsApp"><MessageCircle className="w-4 h-4" /></a>
                          <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10" title="মুছুন"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {active && <AppointmentDrawer item={active} onClose={() => setActive(null)} onStatus={(s) => updateStatus(active.id, s)} onDelete={() => remove(active.id)} waLink={waLink} />}
    </div>
  );
}

function AppointmentDrawer({ item, onClose, onStatus, onDelete, waLink }: {
  item: Appointment; onClose: () => void; onStatus: (s: string) => void; onDelete: () => void;
  waLink: (phone: string, name: string) => string;
}) {
  const meta = STATUS_META[item.status] ?? STATUS_META.new;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md h-full bg-card border-l border-border shadow-elegant overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card/90 backdrop-blur-xl border-b border-border p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">অ্যাপয়েন্টমেন্ট বিবরণ</div>
            <div className="font-bold text-lg text-foreground">{item.name}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${meta.cls}`}>{meta.label}</div>

          <div className="grid gap-3">
            <DetailRow label="ফোন" value={<a href={`tel:${item.phone}`} className="text-primary font-semibold">{item.phone}</a>} />
            <DetailRow label="সমস্যা" value={item.problem_type} />
            <DetailRow label="ঠিকানা" value={item.address || "—"} />
            <DetailRow label="বিস্তারিত" value={item.details || "—"} />
            <DetailRow label="জমা দেয়ার সময়" value={new Date(item.created_at).toLocaleString("bn-BD", { dateStyle: "full", timeStyle: "short" })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a href={`tel:${item.phone}`} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2"><Phone className="w-4 h-4" /> কল</a>
            <a href={waLink(item.phone, item.name)} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold inline-flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground mb-2">স্ট্যাটাস পরিবর্তন</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_META).map(([k, v]) => (
                <button key={k} onClick={() => onStatus(k)} className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${item.status === k ? v.cls : "bg-background border-border hover:border-primary"}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={onDelete} className="w-full px-4 py-2.5 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold inline-flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> মুছে ফেলুন
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-border/60">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="col-span-2 text-sm text-foreground break-words">{value}</div>
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

function StatCard({ label, value, tone }: { label: string; value: number; tone: "primary" | "info" | "success" | "muted" }) {
  const toneCls = {
    primary: "from-primary/15 to-primary/5 text-primary",
    info: "from-blue-500/15 to-blue-500/5 text-blue-600",
    success: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    muted: "from-muted to-muted/40 text-foreground",
  }[tone];
  return (
    <div className={`rounded-2xl p-4 border border-border bg-gradient-to-br ${toneCls} shadow-soft`}>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value.toLocaleString("bn-BD")}</div>
    </div>
  );
}

const SITE_FIELDS: { key: keyof SiteInfo; label: string; placeholder: string; multiline?: boolean; group: string }[] = [
  { key: "name", label: "সাইটের পূর্ণ নাম", placeholder: "ডেভেলপ ফিজিওথেরাপি...", group: "ব্র্যান্ড" },
  { key: "shortName", label: "সংক্ষিপ্ত নাম", placeholder: "ডেভেলপ ফিজিওথেরাপি", group: "ব্র্যান্ড" },
  { key: "brandInitial", label: "লোগো অক্ষর", placeholder: "ডে", group: "ব্র্যান্ড" },
  { key: "footerTagline", label: "ফুটার ট্যাগলাইন", placeholder: "সংক্ষিপ্ত পরিচিতি...", multiline: true, group: "ব্র্যান্ড" },

  { key: "heroBadge", label: "হিরো ব্যাজ টেক্সট", placeholder: "রংপুরের #১ সেন্টার", group: "হিরো সেকশন" },
  { key: "heroTitle", label: "হিরো প্রধান শিরোনাম", placeholder: "ব্যথামুক্ত জীবনের জন্য...", multiline: true, group: "হিরো সেকশন" },
  { key: "heroSubtitle", label: "হিরো সাবটাইটেল", placeholder: "প্যারালাইসিস, PLID...", multiline: true, group: "হিরো সেকশন" },

  { key: "phone", label: "প্রধান ফোন (ডায়াল)", placeholder: "01952913188", group: "যোগাযোগ" },
  { key: "phoneDisplay", label: "প্রধান ফোন (প্রদর্শন)", placeholder: "০১৯৫২-৯১৩১৮৮", group: "যোগাযোগ" },
  { key: "secondPhone", label: "দ্বিতীয় ফোন (ঐচ্ছিক)", placeholder: "01XXXXXXXXX", group: "যোগাযোগ" },
  { key: "whatsapp", label: "WhatsApp নাম্বার", placeholder: "8801952913188 (কান্ট্রি কোডসহ)", group: "যোগাযোগ" },
  { key: "whatsappMessage", label: "WhatsApp ডিফল্ট মেসেজ", placeholder: "আমি অ্যাপয়েন্টমেন্ট নিতে চাই।", multiline: true, group: "যোগাযোগ" },
  { key: "email", label: "ইমেইল", placeholder: "you@example.com", group: "যোগাযোগ" },
  { key: "facebook", label: "Facebook পেজ লিংক", placeholder: "https://facebook.com/...", group: "যোগাযোগ" },
  { key: "youtube", label: "YouTube চ্যানেল লিংক", placeholder: "https://youtube.com/@...", group: "যোগাযোগ" },

  { key: "address", label: "ঠিকানা", placeholder: "ধাপ মেডিকেল মোড়, রংপুর", group: "অবস্থান" },
  { key: "hours", label: "খোলা থাকার সময়", placeholder: "সর্বদা খোলা / সকাল ৯টা - রাত ১০টা", group: "অবস্থান" },
  { key: "mapEmbed", label: "Google Map Embed URL", placeholder: "https://www.google.com/maps?q=...&output=embed", multiline: true, group: "অবস্থান" },

  { key: "seoTitle", label: "SEO টাইটেল", placeholder: "৬০ অক্ষরের মধ্যে", group: "SEO" },
  { key: "seoDescription", label: "SEO বিবরণ", placeholder: "১৬০ অক্ষরের মধ্যে", multiline: true, group: "SEO" },
  { key: "ogImage", label: "Open Graph শেয়ার ইমেজ URL", placeholder: "https://...jpg (1200x630)", group: "SEO" },
];

function SiteInfoTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const keys = Object.values(INFO_KEY_MAP);
    const { data, error } = await (supabase as any).from("site_settings").select("key,value").in("key", keys);
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
      const rows = SITE_FIELDS.map((f) => ({
        key: INFO_KEY_MAP[f.key],
        value: values[INFO_KEY_MAP[f.key]] ?? "",
      }));
      const { error } = await (supabase as any).from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      toast.success("সাইট তথ্য সংরক্ষণ হয়েছে");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const groups = Array.from(new Set(SITE_FIELDS.map((f) => f.group)));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 rounded-2xl p-6 border border-border shadow-soft">
        <h2 className="text-xl font-bold text-foreground inline-flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" /> সাইট তথ্য কাস্টমাইজ করুন
        </h2>
        <p className="text-sm text-muted-foreground mt-1">নাম, ফোন, ইমেইল, ঠিকানা, ম্যাপ — সব কিছু এখান থেকে পরিবর্তন করুন। সাইটে সাথে সাথে আপডেট হবে।</p>
      </div>

      {groups.map((g) => (
        <div key={g} className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-4">
          <h3 className="font-bold text-foreground text-lg">{g}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {SITE_FIELDS.filter((f) => f.group === g).map((f) => {
              const k = INFO_KEY_MAP[f.key];
              return (
                <div key={k} className={`space-y-1.5 ${f.multiline ? "md:col-span-2" : ""}`}>
                  <label className="text-sm font-semibold text-foreground">{f.label}</label>
                  {f.multiline ? (
                    <textarea value={values[k] ?? ""} onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                      placeholder={f.placeholder} rows={3}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                  ) : (
                    <input value={values[k] ?? ""} onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {values[INFO_KEY_MAP.mapEmbed] && (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-soft">
          <div className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> ম্যাপ প্রিভিউ
          </div>
          <iframe src={values[INFO_KEY_MAP.mapEmbed]} className="w-full h-64 rounded-xl border border-border" loading="lazy" />
        </div>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={saving} className="px-6 py-3 rounded-2xl gradient-primary text-primary-foreground font-bold inline-flex items-center gap-2 disabled:opacity-70 shadow-elegant">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} সব সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
}
