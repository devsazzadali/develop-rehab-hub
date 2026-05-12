import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CalendarDays, Download, Image as ImageIcon, Loader2, LogOut, MapPin, MessageCircle, Phone, Plus, RefreshCw, Save, Search, Settings2, Sparkles, Trash2, Video, X,
  LayoutDashboard, Users, Bell, Tag, BarChart3, FileText, Menu, ChevronLeft, Filter, Mail, Star, AlertCircle, CheckCircle2, Clock, TrendingUp, PhoneCall, PhoneOff, UserCheck, UserX, Wallet,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { INFO_KEY_MAP, type SiteInfo } from "@/lib/use-site-data";
import { OnlineConsultationTab } from "@/components/admin/OnlineConsultationTab";
import { PaymentsTab } from "@/components/admin/PaymentsTab";
import { UsersTab } from "@/components/admin/UsersTab";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "অ্যাডমিন CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

// ---------- Types ----------
type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  problem_type: string;
  address: string | null;
  details: string | null;
  status: string;
  business_category: string | null;
  problem_category: string | null;
  priority: string;
  meeting_date: string | null;
  meeting_time: string | null;
  lead_source: string | null;
  follow_up_status: string;
  call_status: string;
  interest_status: string | null;
  next_followup_date: string | null;
  labels: string[];
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type Activity = {
  id: string;
  appointment_id: string;
  type: string;
  content: string;
  created_at: string;
};

type SiteVideo = { id: string; video_id: string; title: string; type: "hero" | "review" | "consultancy"; sort_order: number };

const sb: any = supabase;

// ---------- Constants ----------
const PROBLEM_CATEGORIES = [
  "Marketing", "Sales", "Branding", "Website", "Product Sourcing",
  "Finance", "Stock Management", "Business Growth", "Advertisement", "Other",
];
const LEAD_SOURCES = ["Facebook", "Google", "Referral", "Walk-in", "Phone", "WhatsApp", "Other"];
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const FOLLOWUP_STATUSES = ["pending", "in_progress", "scheduled", "completed", "lost"] as const;
const CALL_STATUSES = ["not_called", "called", "no_response", "call_later"] as const;
const INTEREST_STATUSES = ["interested", "not_interested", "no_response", "converted"] as const;

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-slate-500/15 text-slate-600 border-slate-500/30" },
  medium: { label: "Medium", cls: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  high:   { label: "High",   cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  urgent: { label: "Urgent", cls: "bg-red-500/15 text-red-600 border-red-500/30" },
};
const STATUS_META: Record<string, { label: string; cls: string }> = {
  new:       { label: "New",       cls: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  contacted: { label: "Contacted", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  booked:    { label: "Booked",    cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  done:      { label: "Done",      cls: "bg-muted text-muted-foreground border-border" },
};
const INTEREST_META: Record<string, { label: string; cls: string }> = {
  interested:     { label: "Interested",     cls: "bg-emerald-500/15 text-emerald-700" },
  not_interested: { label: "Not Interested", cls: "bg-red-500/15 text-red-700" },
  no_response:    { label: "No Response",    cls: "bg-slate-500/15 text-slate-700" },
  converted:      { label: "Converted",      cls: "bg-violet-500/15 text-violet-700" },
};

// ---------- Auth Shell ----------
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
  return <CRMShell />;
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
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) { toast.error(err.message || "Error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-card rounded-3xl p-8 shadow-elegant border border-border space-y-4">
        <h1 className="text-2xl font-bold text-gradient">Admin {mode === "login" ? "Login" : "Sign Up"}</h1>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ chars)" className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        <button disabled={loading} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-70 inline-flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}{mode === "login" ? "Login" : "Sign Up"}
        </button>
        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-primary w-full">
          {mode === "login" ? "Create new account" : "Already have account? Login"}
        </button>
      </form>
    </div>
  );
}

function NotAdmin({ userId }: { userId: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 px-4">
      <div className="max-w-lg bg-card rounded-3xl p-8 shadow-elegant border border-border space-y-4">
        <h1 className="text-xl font-bold text-foreground">No admin permission</h1>
        <p className="text-sm text-muted-foreground">Run this in Supabase SQL editor:</p>
        <pre className="bg-muted rounded-xl p-3 text-xs overflow-x-auto">{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${userId}', 'admin');`}</pre>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-primary inline-flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}

// ---------- CRM Shell with sidebar ----------
type NavKey = "overview" | "leads" | "followups" | "categories" | "analytics" | "activity" | "payments" | "users" | "online" | "videos" | "site" | "tracking";

const NAV: { key: NavKey; label: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { key: "overview",   label: "Dashboard",      icon: LayoutDashboard, group: "CRM" },
  { key: "leads",      label: "All Leads",      icon: Users,           group: "CRM" },
  { key: "followups",  label: "Follow-Ups",     icon: Bell,            group: "CRM" },
  { key: "categories", label: "Categories",     icon: Tag,             group: "CRM" },
  { key: "analytics",  label: "Analytics",      icon: BarChart3,       group: "CRM" },
  { key: "activity",   label: "Activity Log",   icon: FileText,        group: "CRM" },
  { key: "payments",   label: "Payments",       icon: Wallet,          group: "CRM" },
  { key: "users",      label: "Users",          icon: UserCheck,       group: "CRM" },
  { key: "online",     label: "Online Consult", icon: Video,           group: "Site" },
  { key: "videos",     label: "Videos",         icon: Video,           group: "Site" },
  { key: "site",       label: "Site Info",      icon: Settings2,       group: "Site" },
  { key: "tracking",   label: "Pixel / GTM",    icon: Sparkles,        group: "Site" },
];

function CRMShell() {
  const [view, setView] = useState<NavKey>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true);
    const { data, error } = await sb.from("appointments").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setLeads((data as Lead[]) ?? []);
    setLoadingLeads(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  // realtime
  useEffect(() => {
    const ch = sb.channel("crm-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload: any) => {
        if (payload.eventType === "INSERT") {
          setLeads((prev) => [payload.new as Lead, ...prev]);
          toast.success(`New lead: ${(payload.new as Lead).name}`);
        } else if (payload.eventType === "UPDATE") {
          setLeads((prev) => prev.map((i) => (i.id === payload.new.id ? (payload.new as Lead) : i)));
        } else if (payload.eventType === "DELETE") {
          setLeads((prev) => prev.filter((i) => i.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);

  const updateLead = async (id: string, patch: Partial<Lead>) => {
    const { error } = await sb.from("appointments").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return false; }
    return true;
  };
  const removeLead = async (id: string) => {
    if (!confirm("Delete this lead permanently?")) return false;
    const { error } = await sb.from("appointments").delete().eq("id", id);
    if (error) { toast.error(error.message); return false; }
    toast.success("Deleted");
    return true;
  };

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col bg-[#1e1e2e] text-slate-200 transition-all duration-200 ${collapsed ? "w-16" : "w-60"} sticky top-0 h-screen`}>
        <SidebarBrand collapsed={collapsed} />
        <SidebarNav view={view} setView={setView} collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="relative w-64 bg-[#1e1e2e] text-slate-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <SidebarBrand collapsed={false} />
            <SidebarNav view={view} setView={(v) => { setView(v); setMobileOpen(false); }} collapsed={false} />
            <SidebarFooter collapsed={false} onToggle={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-card/90 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <button className="md:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5" /></button>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold text-foreground truncate">{NAV.find((n) => n.key === view)?.label}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Premium CRM Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" target="_blank" rel="noreferrer" className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary items-center gap-2 text-xs transition">View Site ↗</a>
              <button onClick={() => supabase.auth.signOut()} className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-destructive hover:text-destructive inline-flex items-center gap-2 text-xs transition">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {view === "overview" && <OverviewView leads={leads} loading={loadingLeads} onJump={setView} />}
          {view === "leads" && <LeadsView leads={leads} loading={loadingLeads} onUpdate={updateLead} onDelete={removeLead} reload={loadLeads} />}
          {view === "followups" && <FollowUpsView leads={leads} loading={loadingLeads} onUpdate={updateLead} onDelete={removeLead} reload={loadLeads} />}
          {view === "categories" && <CategoriesView leads={leads} />}
          {view === "analytics" && <AnalyticsView leads={leads} />}
          {view === "activity" && <ActivityView />}
          {view === "payments" && <PaymentsTab />}
          {view === "users" && <UsersTab />}
          {view === "online" && <OnlineConsultationTab />}
          {view === "videos" && <VideosTab />}
          {view === "site" && <SiteInfoTab />}
          {view === "tracking" && <TrackingTab />}
        </main>
      </div>
    </div>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="h-14 flex items-center gap-3 px-4 border-b border-white/10">
      <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground shadow-elegant shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>
      {!collapsed && <div className="font-bold text-white truncate">Admin CRM</div>}
    </div>
  );
}

function SidebarNav({ view, setView, collapsed }: { view: NavKey; setView: (v: NavKey) => void; collapsed: boolean }) {
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <nav className="flex-1 overflow-y-auto py-3">
      {groups.map((g) => (
        <div key={g} className="mb-3">
          {!collapsed && <div className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{g}</div>}
          {NAV.filter((n) => n.group === g).map(({ key, label, icon: Icon }) => {
            const active = view === key;
            return (
              <button key={key} onClick={() => setView(key)} title={collapsed ? label : ""}
                className={`group w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all border-l-2 ${active ? "bg-white/10 text-white border-primary font-semibold" : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="border-t border-white/10 p-2">
      <button onClick={onToggle} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 text-xs">
        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        {!collapsed && "Collapse"}
      </button>
    </div>
  );
}

// ---------- Overview ----------
function OverviewView({ leads, loading, onJump }: { leads: Lead[]; loading: boolean; onJump: (v: NavKey) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const isToday = (d: string) => new Date(d) >= today;
    return {
      total: leads.length,
      today: leads.filter((l) => isToday(l.created_at)).length,
      pendingFollowup: leads.filter((l) => l.follow_up_status === "pending" || l.follow_up_status === "in_progress").length,
      called: leads.filter((l) => l.call_status === "called").length,
      interested: leads.filter((l) => l.interest_status === "interested").length,
      converted: leads.filter((l) => l.interest_status === "converted").length,
      todayMeetings: leads.filter((l) => l.meeting_date === todayStr).length,
      dueFollowups: leads.filter((l) => l.next_followup_date && l.next_followup_date <= todayStr && l.follow_up_status !== "completed" && l.follow_up_status !== "lost").length,
    };
  }, [leads, today, todayStr]);

  const recent = leads.slice(0, 5);
  const dueToday = leads.filter((l) => (l.next_followup_date && l.next_followup_date <= todayStr) || l.meeting_date === todayStr).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Total Leads" value={stats.total} tone="primary" />
        <KpiCard icon={Sparkles} label="New Today" value={stats.today} tone="info" />
        <KpiCard icon={Bell} label="Due Follow-ups" value={stats.dueFollowups} tone="warning" onClick={() => onJump("followups")} />
        <KpiCard icon={CalendarDays} label="Meetings Today" value={stats.todayMeetings} tone="success" />
        <KpiCard icon={PhoneCall} label="Calls Done" value={stats.called} tone="info" />
        <KpiCard icon={UserCheck} label="Interested" value={stats.interested} tone="success" />
        <KpiCard icon={TrendingUp} label="Converted" value={stats.converted} tone="primary" />
        <KpiCard icon={Clock} label="Pending" value={stats.pendingFollowup} tone="muted" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-soft">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground">Recent Leads</h3>
            <button onClick={() => onJump("leads")} className="text-xs text-primary font-semibold">View all →</button>
          </div>
          {loading ? <CenterLoader /> : recent.length === 0 ? <Empty msg="No leads yet" /> : (
            <div className="divide-y divide-border">
              {recent.map((l) => (
                <div key={l.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold">{l.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{l.problem_type}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(l.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-soft">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground inline-flex items-center gap-2"><Bell className="w-4 h-4 text-amber-500" /> Today's Reminders</h3>
            <button onClick={() => onJump("followups")} className="text-xs text-primary font-semibold">All →</button>
          </div>
          {dueToday.length === 0 ? <Empty msg="Nothing scheduled today 🎉" /> : (
            <div className="p-3 space-y-2">
              {dueToday.map((l) => (
                <div key={l.id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="font-semibold text-foreground text-sm">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.problem_category || l.problem_type}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <a href={`tel:${l.phone}`} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground inline-flex items-center gap-1"><Phone className="w-3 h-3" />Call</a>
                    {l.meeting_time && <span className="text-xs text-amber-700 font-medium">{l.meeting_time}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Leads ----------
function LeadsView(props: { leads: Lead[]; loading: boolean; onUpdate: (id: string, p: Partial<Lead>) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; reload: () => void }) {
  return <LeadsTable {...props} title="All Leads" />;
}

function FollowUpsView(props: { leads: Lead[]; loading: boolean; onUpdate: (id: string, p: Partial<Lead>) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; reload: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const filtered = props.leads.filter((l) =>
    (l.next_followup_date && l.next_followup_date <= today && l.follow_up_status !== "completed" && l.follow_up_status !== "lost") ||
    l.meeting_date === today
  );
  return <LeadsTable {...props} leads={filtered} title="Follow-Ups & Today's Meetings" />;
}

function LeadsTable({ leads, loading, onUpdate, onDelete, reload, title }: { leads: Lead[]; loading: boolean; onUpdate: (id: string, p: Partial<Lead>) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; reload: () => void; title: string }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [waNumber, setWaNumber] = useState("");

  const [filters, setFilters] = useState({
    status: "all",
    followup: "all",
    call: "all",
    interest: "all",
    priority: "all",
    category: "all",
    source: "all",
    dateFrom: "",
    dateTo: "",
    upcomingOnly: false,
  });

  useEffect(() => {
    sb.from("site_settings").select("value").eq("key", "site_whatsapp").maybeSingle()
      .then(({ data }: any) => setWaNumber(data?.value ?? ""));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    return leads.filter((l) => {
      if (filters.status !== "all" && l.status !== filters.status) return false;
      if (filters.followup !== "all" && l.follow_up_status !== filters.followup) return false;
      if (filters.call !== "all" && l.call_status !== filters.call) return false;
      if (filters.interest !== "all" && l.interest_status !== filters.interest) return false;
      if (filters.priority !== "all" && l.priority !== filters.priority) return false;
      if (filters.category !== "all" && l.problem_category !== filters.category) return false;
      if (filters.source !== "all" && l.lead_source !== filters.source) return false;
      if (filters.dateFrom && l.created_at < filters.dateFrom) return false;
      if (filters.dateTo && l.created_at > filters.dateTo + "T23:59:59") return false;
      if (filters.upcomingOnly && !(l.meeting_date && l.meeting_date >= today)) return false;
      if (!q) return true;
      return [l.name, l.phone, l.email, l.problem_type, l.address, l.business_category, l.problem_category, ...(l.labels || [])]
        .filter(Boolean).some((s) => String(s).toLowerCase().includes(q));
    });
  }, [leads, query, filters]);

  const exportCSV = () => {
    const cols = ["Name","Phone","Email","Problem","Category","Priority","Source","Call","Interest","Follow-up","Meeting Date","Meeting Time","Next Follow-up","Labels","Created"];
    const rows = [cols, ...filtered.map((l) => [l.name, l.phone, l.email||"", l.problem_type, l.problem_category||"", l.priority, l.lead_source||"", l.call_status, l.interest_status||"", l.follow_up_status, l.meeting_date||"", l.meeting_time||"", l.next_followup_date||"", (l.labels||[]).join("|"), new Date(l.created_at).toISOString()])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const waLink = (phone: string, name: string) => {
    const num = (waNumber || phone).replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(`Hello ${name}, this is from Develop Care. Reaching out about your inquiry.`);
    return `https://wa.me/${num}?text=${msg}`;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email, problem, label..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm focus:border-primary outline-none" />
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className={`px-3 py-2 rounded-xl border text-sm inline-flex items-center gap-2 ${showFilters ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:border-primary"}`}>
          <Filter className="w-4 h-4" /> Filters
        </button>
        <button onClick={exportCSV} className="px-3 py-2 rounded-xl border border-border bg-background hover:border-primary inline-flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> CSV</button>
        <button onClick={reload} className="px-3 py-2 rounded-xl border border-border bg-background hover:border-primary inline-flex items-center gap-2 text-sm"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {showFilters && (
        <div className="bg-card rounded-2xl border border-border shadow-soft p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={["all","new","contacted","booked","done"]} />
          <FilterSelect label="Follow-up" value={filters.followup} onChange={(v) => setFilters({ ...filters, followup: v })} options={["all", ...FOLLOWUP_STATUSES]} />
          <FilterSelect label="Call" value={filters.call} onChange={(v) => setFilters({ ...filters, call: v })} options={["all", ...CALL_STATUSES]} />
          <FilterSelect label="Interest" value={filters.interest} onChange={(v) => setFilters({ ...filters, interest: v })} options={["all", ...INTEREST_STATUSES]} />
          <FilterSelect label="Priority" value={filters.priority} onChange={(v) => setFilters({ ...filters, priority: v })} options={["all", ...PRIORITIES]} />
          <FilterSelect label="Problem Category" value={filters.category} onChange={(v) => setFilters({ ...filters, category: v })} options={["all", ...PROBLEM_CATEGORIES]} />
          <FilterSelect label="Lead Source" value={filters.source} onChange={(v) => setFilters({ ...filters, source: v })} options={["all", ...LEAD_SOURCES]} />
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Date Range</label>
            <div className="flex gap-1 mt-1">
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs" />
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm self-end pb-1.5">
            <input type="checkbox" checked={filters.upcomingOnly} onChange={(e) => setFilters({ ...filters, upcomingOnly: e.target.checked })} /> Upcoming meetings only
          </label>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">{title} <span className="text-muted-foreground font-normal">({filtered.length})</span></div>
        </div>
        {loading ? <CenterLoader /> : filtered.length === 0 ? <Empty msg="No leads match your filters" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Lead</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold">Call</th>
                  <th className="text-left px-4 py-3 font-semibold">Follow-up</th>
                  <th className="text-left px-4 py-3 font-semibold">Meeting</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const pri = PRIORITY_META[l.priority] ?? PRIORITY_META.medium;
                  return (
                    <tr key={l.id} className="border-t border-border hover:bg-secondary/30 transition cursor-pointer" onClick={() => setActive(l)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{l.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{l.problem_type}</div>
                        {l.labels?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">{l.labels.slice(0, 3).map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <a href={`tel:${l.phone}`} className="text-primary text-xs inline-flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</a>
                        {l.email && <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{l.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">{l.problem_category || "—"}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${pri.cls}`}>{pri.label}</span></td>
                      <td className="px-4 py-3"><CallBadge status={l.call_status} /></td>
                      <td className="px-4 py-3"><FollowupBadge status={l.follow_up_status} /></td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {l.meeting_date ? <div className="text-foreground">{l.meeting_date}{l.meeting_time && <span className="text-muted-foreground"> · {l.meeting_time}</span>}</div> : <span className="text-muted-foreground">—</span>}
                        {l.next_followup_date && <div className="text-amber-600 mt-0.5">↻ {l.next_followup_date}</div>}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex gap-1">
                          <a href={`tel:${l.phone}`} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Phone className="w-4 h-4" /></a>
                          <a href={waLink(l.phone, l.name)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600"><MessageCircle className="w-4 h-4" /></a>
                          <button onClick={() => onDelete(l.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
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

      {active && <LeadDrawer lead={active} onClose={() => setActive(null)} onUpdate={onUpdate} onDelete={async () => { if (await onDelete(active.id)) setActive(null); }} waLink={waLink} />}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm">
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );
}

function CallBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    not_called:  { label: "Not Called",  cls: "text-muted-foreground bg-muted",      icon: PhoneOff },
    called:      { label: "Called",      cls: "text-emerald-700 bg-emerald-500/10",  icon: PhoneCall },
    no_response: { label: "No Response", cls: "text-amber-700 bg-amber-500/10",      icon: AlertCircle },
    call_later:  { label: "Call Later",  cls: "text-blue-700 bg-blue-500/10",        icon: Clock },
  };
  const m = map[status] || map.not_called;
  const I = m.icon;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-semibold ${m.cls}`}><I className="w-3 h-3" />{m.label}</span>;
}

function FollowupBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:     "bg-amber-500/10 text-amber-700",
    in_progress: "bg-blue-500/10 text-blue-700",
    scheduled:   "bg-violet-500/10 text-violet-700",
    completed:   "bg-emerald-500/10 text-emerald-700",
    lost:        "bg-red-500/10 text-red-700",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${map[status] || "bg-muted"}`}>{status.replace("_", " ")}</span>;
}

// ---------- Lead Drawer (full profile editor + activity log) ----------
function LeadDrawer({ lead, onClose, onUpdate, onDelete, waLink }: {
  lead: Lead; onClose: () => void; onUpdate: (id: string, p: Partial<Lead>) => Promise<boolean>; onDelete: () => void; waLink: (phone: string, name: string) => string;
}) {
  const [tab, setTab] = useState<"profile" | "activity">("profile");
  const [form, setForm] = useState<Lead>(lead);
  const [saving, setSaving] = useState(false);
  const [labelInput, setLabelInput] = useState("");

  useEffect(() => { setForm(lead); }, [lead.id]);

  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const patch: Partial<Lead> = {
      name: form.name, phone: form.phone, email: form.email,
      problem_type: form.problem_type, problem_category: form.problem_category,
      business_category: form.business_category, address: form.address, details: form.details,
      priority: form.priority, status: form.status,
      meeting_date: form.meeting_date || null, meeting_time: form.meeting_time || null,
      lead_source: form.lead_source, follow_up_status: form.follow_up_status,
      call_status: form.call_status, interest_status: form.interest_status,
      next_followup_date: form.next_followup_date || null,
      labels: form.labels, admin_notes: form.admin_notes,
    };
    const ok = await onUpdate(lead.id, patch);
    if (ok) toast.success("Saved");
    setSaving(false);
  };

  const addLabel = () => {
    const t = labelInput.trim();
    if (!t || form.labels.includes(t)) return;
    set("labels", [...form.labels, t]);
    setLabelInput("");
  };
  const removeLabel = (t: string) => set("labels", form.labels.filter((l) => l !== t));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl h-full bg-card border-l border-border shadow-elegant overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold text-lg shrink-0">{form.name.charAt(0)}</div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Lead Profile</div>
                <div className="font-bold text-lg text-foreground truncate">{form.name}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <a href={`tel:${form.phone}`} className="p-2 rounded-lg bg-primary text-primary-foreground"><Phone className="w-4 h-4" /></a>
              <a href={waLink(form.phone, form.name)} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-emerald-500 text-white"><MessageCircle className="w-4 h-4" /></a>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="px-4 flex gap-1 border-t border-border">
            {(["profile", "activity"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t === "profile" ? "Profile" : "Notes & Activity"}
              </button>
            ))}
          </div>
        </div>

        {tab === "profile" ? (
          <div className="p-5 space-y-5">
            <Section title="Customer">
              <Field label="Name"><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
              <Field label="Phone"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} /></Field>
              <Field label="Email"><input value={form.email || ""} onChange={(e) => set("email", e.target.value)} className={inputCls} /></Field>
              <Field label="Address"><input value={form.address || ""} onChange={(e) => set("address", e.target.value)} className={inputCls} /></Field>
              <Field label="Business Category"><input value={form.business_category || ""} onChange={(e) => set("business_category", e.target.value)} placeholder="e.g. Restaurant, eCom" className={inputCls} /></Field>
              <Field label="Lead Source">
                <select value={form.lead_source || ""} onChange={(e) => set("lead_source", e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </Section>

            <Section title="Problem">
              <Field label="Problem (short)" full><input value={form.problem_type} onChange={(e) => set("problem_type", e.target.value)} className={inputCls} /></Field>
              <Field label="Problem Category">
                <select value={form.problem_category || ""} onChange={(e) => set("problem_category", e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {PROBLEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                </select>
              </Field>
              <Field label="Problem Details" full><textarea value={form.details || ""} onChange={(e) => set("details", e.target.value)} rows={3} className={inputCls} /></Field>
            </Section>

            <Section title="Call & Follow-up">
              <Field label="Call Status">
                <select value={form.call_status} onChange={(e) => set("call_status", e.target.value)} className={inputCls}>
                  {CALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </Field>
              <Field label="Interest">
                <select value={form.interest_status || ""} onChange={(e) => set("interest_status", e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {INTEREST_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </Field>
              <Field label="Follow-up Status">
                <select value={form.follow_up_status} onChange={(e) => set("follow_up_status", e.target.value)} className={inputCls}>
                  {FOLLOWUP_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </Field>
              <Field label="Overall Status">
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="booked">Booked</option><option value="done">Done</option>
                </select>
              </Field>
              <Field label="Meeting Date"><input type="date" value={form.meeting_date || ""} onChange={(e) => set("meeting_date", e.target.value)} className={inputCls} /></Field>
              <Field label="Meeting Time"><input type="time" value={form.meeting_time || ""} onChange={(e) => set("meeting_time", e.target.value)} className={inputCls} /></Field>
              <Field label="Next Follow-up Date" full><input type="date" value={form.next_followup_date || ""} onChange={(e) => set("next_followup_date", e.target.value)} className={inputCls} /></Field>
            </Section>

            <Section title="Labels & Notes">
              <Field label="Labels / Tags" full>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {form.labels.map((t) => (
                    <span key={t} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" />{t}
                      <button onClick={() => removeLabel(t)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }} placeholder="Add label & press Enter" className={inputCls} />
                  <button type="button" onClick={addLabel} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm">Add</button>
                </div>
              </Field>
              <Field label="Admin Notes (private)" full><textarea value={form.admin_notes || ""} onChange={(e) => set("admin_notes", e.target.value)} rows={4} className={inputCls} placeholder="Internal remarks, conversation summary..." /></Field>
            </Section>

            <div className="sticky bottom-0 -mx-5 px-5 py-3 bg-card/95 backdrop-blur-xl border-t border-border flex items-center justify-between">
              <button onClick={onDelete} className="px-3 py-2 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 text-sm inline-flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
              <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold inline-flex items-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
              </button>
            </div>
          </div>
        ) : (
          <ActivityPanel leadId={lead.id} />
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-primary outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

function ActivityPanel({ leadId }: { leadId: string }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.from("lead_activities").select("*").eq("appointment_id", leadId).order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setItems((data as Activity[]) ?? []);
    setLoading(false);
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!content.trim()) return;
    setPosting(true);
    const { data: ures } = await supabase.auth.getUser();
    const { error } = await sb.from("lead_activities").insert({ appointment_id: leadId, type, content: content.trim(), created_by: ures.user?.id });
    if (error) toast.error(error.message);
    else { setContent(""); toast.success("Added"); load(); }
    setPosting(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await sb.from("lead_activities").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="p-5 space-y-4">
      <div className="bg-secondary/40 rounded-2xl p-3 space-y-2">
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
            <option value="note">Note</option><option value="call">Call</option><option value="meeting">Meeting</option><option value="message">Message</option>
          </select>
          <input value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="Add a note, call summary, follow-up message..." className={inputCls} />
          <button onClick={add} disabled={posting || !content.trim()} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50 inline-flex items-center gap-1">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>
      </div>

      {loading ? <CenterLoader /> : items.length === 0 ? <Empty msg="No activity yet" /> : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-3 group">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary">{a.type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  <button onClick={() => remove(a.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap">{a.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Categories ----------
function CategoriesView({ leads }: { leads: Lead[] }) {
  const data = useMemo(() => {
    return PROBLEM_CATEGORIES.map((c) => {
      const subset = leads.filter((l) => l.problem_category === c);
      return {
        name: c,
        count: subset.length,
        urgent: subset.filter((l) => l.priority === "urgent").length,
        high: subset.filter((l) => l.priority === "high").length,
        pending: subset.filter((l) => l.follow_up_status === "pending" || l.follow_up_status === "in_progress").length,
        converted: subset.filter((l) => l.interest_status === "converted").length,
      };
    }).sort((a, b) => b.count - a.count);
  }, [leads]);

  const uncategorized = leads.filter((l) => !l.problem_category).length;

  return (
    <div className="space-y-4">
      {uncategorized > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-800">
          <strong>{uncategorized}</strong> leads have no problem category assigned. Open a lead and set its category.
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((c) => (
          <div key={c.name} className="bg-card rounded-2xl border border-border shadow-soft p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">{c.name}</h3>
              <span className="text-2xl font-extrabold text-primary">{c.count}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Stat tone="red" label="Urgent" value={c.urgent} />
              <Stat tone="amber" label="High" value={c.high} />
              <Stat tone="blue" label="Pending" value={c.pending} />
              <Stat tone="emerald" label="Converted" value={c.converted} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ tone, label, value }: { tone: "red" | "amber" | "blue" | "emerald"; label: string; value: number }) {
  const cls = { red: "text-red-700 bg-red-500/10", amber: "text-amber-700 bg-amber-500/10", blue: "text-blue-700 bg-blue-500/10", emerald: "text-emerald-700 bg-emerald-500/10" }[tone];
  return <div className={`rounded-lg px-2 py-1.5 ${cls}`}><div className="text-[10px] font-semibold opacity-80">{label}</div><div className="font-bold text-base">{value}</div></div>;
}

// ---------- Analytics ----------
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#6366f1"];

function AnalyticsView({ leads }: { leads: Lead[] }) {
  // 14-day trend
  const trend = useMemo(() => {
    const days: { date: string; leads: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      days.push({
        date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        leads: leads.filter((l) => { const t = new Date(l.created_at); return t >= d && t < next; }).length,
      });
    }
    return days;
  }, [leads]);

  const catData = useMemo(() => PROBLEM_CATEGORIES
    .map((c) => ({ name: c, value: leads.filter((l) => l.problem_category === c).length }))
    .filter((c) => c.value > 0), [leads]);

  const sourceData = useMemo(() => LEAD_SOURCES
    .map((s) => ({ name: s, value: leads.filter((l) => l.lead_source === s).length }))
    .filter((s) => s.value > 0), [leads]);

  const interestData = useMemo(() => INTEREST_STATUSES
    .map((s) => ({ name: s.replace("_", " "), value: leads.filter((l) => l.interest_status === s).length })), [leads]);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border shadow-soft p-4">
        <h3 className="font-bold text-foreground mb-3">Leads — Last 14 Days</h3>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <ReTooltip />
              <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border shadow-soft p-4">
          <h3 className="font-bold text-foreground mb-3">Problems by Category</h3>
          <div style={{ width: "100%", height: 280 }}>
            {catData.length === 0 ? <Empty msg="No category data" /> : (
              <ResponsiveContainer>
                <BarChart data={catData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ReTooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-soft p-4">
          <h3 className="font-bold text-foreground mb-3">Lead Sources</h3>
          <div style={{ width: "100%", height: 280 }}>
            {sourceData.length === 0 ? <Empty msg="No source data" /> : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={90} label={(e) => `${e.name}: ${e.value}`}>
                    {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft p-4">
        <h3 className="font-bold text-foreground mb-3">Interest Distribution</h3>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={interestData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <ReTooltip />
              <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------- Activity (global) ----------
function ActivityView() {
  const [items, setItems] = useState<(Activity & { lead?: Lead })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: acts } = await sb.from("lead_activities").select("*").order("created_at", { ascending: false }).limit(100);
      const ids = Array.from(new Set((acts || []).map((a: Activity) => a.appointment_id)));
      if (ids.length === 0) { setItems([]); setLoading(false); return; }
      const { data: leads } = await sb.from("appointments").select("id,name,phone").in("id", ids);
      const map = new Map((leads || []).map((l: any) => [l.id, l]));
      setItems((acts || []).map((a: Activity) => ({ ...a, lead: map.get(a.appointment_id) as any })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <CenterLoader />;
  if (items.length === 0) return <Empty msg="No activity yet. Open a lead to add notes & call logs." />;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft divide-y divide-border">
      {items.map((a) => (
        <div key={a.id} className="p-4 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-foreground">{a.lead?.name || "Unknown"}</span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary">{a.type}</span>
              <span className="text-muted-foreground">· {timeAgo(a.created_at)}</span>
            </div>
            <div className="text-sm text-foreground mt-1 whitespace-pre-wrap">{a.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Helpers ----------
function KpiCard({ icon: Icon, label, value, tone, onClick }: { icon: any; label: string; value: number; tone: "primary" | "info" | "success" | "muted" | "warning"; onClick?: () => void }) {
  const toneCls = {
    primary: "from-primary/15 to-primary/5 text-primary",
    info: "from-blue-500/15 to-blue-500/5 text-blue-600",
    success: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    warning: "from-amber-500/15 to-amber-500/5 text-amber-600",
    muted: "from-muted to-muted/40 text-foreground",
  }[tone];
  return (
    <button onClick={onClick} disabled={!onClick} className={`text-left rounded-2xl p-4 border border-border bg-gradient-to-br ${toneCls} shadow-soft transition hover:shadow-elegant hover:-translate-y-0.5 disabled:cursor-default`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold opacity-80">{label}</div>
        <Icon className="w-4 h-4 opacity-70" />
      </div>
      <div className="text-3xl font-extrabold mt-1">{value.toLocaleString()}</div>
    </button>
  );
}

function CenterLoader() { return <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>; }
function Empty({ msg }: { msg: string }) { return <div className="text-center py-12 text-muted-foreground text-sm">{msg}</div>; }

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ---------- Site / Videos / Tracking (kept) ----------
function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : trimmed;
}

function VideosTab() {
  const [items, setItems] = useState<SiteVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"hero" | "review" | "consultancy">("review");
  const [videoId, setVideoId] = useState("");
  const [title, setTitle] = useState("");
  const load = async () => {
    setLoading(true);
    const { data, error } = await sb.from("site_videos").select("*").order("type").order("sort_order", { ascending: true });
    if (error) toast.error(error.message); else setItems((data as SiteVideo[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeId(videoId);
    if (!id) return toast.error("Provide a video ID");
    const sort_order = items.filter((i) => i.type === type).length;
    const { error } = await sb.from("site_videos").insert({ video_id: id, title: title || (type === "hero" ? "Intro" : "Review"), type, sort_order });
    if (error) return toast.error(error.message);
    toast.success("Added"); setVideoId(""); setTitle(""); load();
  };
  const update = async (id: string, patch: Partial<SiteVideo>) => {
    const { error } = await sb.from("site_videos").update(patch).eq("id", id);
    if (error) toast.error(error.message); else load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await sb.from("site_videos").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-card rounded-2xl p-5 border border-border shadow-soft space-y-3">
        <h2 className="font-bold text-foreground">Add new video</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-xl border border-input bg-background px-3 py-2.5">
            <option value="review">Review video</option>
            <option value="hero">Hero (intro)</option>
          </select>
          <input value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="YouTube URL or ID" className="rounded-xl border border-input bg-background px-3 py-2.5" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border border-input bg-background px-3 py-2.5" />
        </div>
        <button className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
      </form>
      {loading ? <CenterLoader /> : (
        <div className="grid gap-3">
          {items.map((v) => (
            <div key={v.id} className="bg-card rounded-2xl p-4 border border-border shadow-soft flex flex-wrap items-center gap-4">
              <img src={`https://i.ytimg.com/vi/${v.video_id}/default.jpg`} alt="" className="w-24 h-16 object-cover rounded-lg" />
              <div className="flex-1 min-w-[200px] space-y-2">
                <input defaultValue={v.title} onBlur={(e) => e.target.value !== v.title && update(v.id, { title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-semibold" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full ${v.type === "hero" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>{v.type}</span>
                  <span>ID: {v.video_id}</span>
                </div>
              </div>
              <input type="number" defaultValue={v.sort_order} onBlur={(e) => Number(e.target.value) !== v.sort_order && update(v.id, { sort_order: Number(e.target.value) })} className="w-20 rounded-lg border border-input bg-background px-2 py-1.5 text-sm" />
              <button onClick={() => remove(v.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {items.length === 0 && <Empty msg="No videos added" />}
        </div>
      )}
    </div>
  );
}

const TRACKING_FIELDS: { key: string; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "facebook_pixel_id", label: "Facebook Pixel ID", placeholder: "1234567890123456" },
  { key: "gtm_id", label: "Google Tag Manager ID", placeholder: "GTM-XXXXXXX" },
  { key: "ga_measurement_id", label: "Google Analytics 4 ID", placeholder: "G-XXXXXXXXXX" },
  { key: "head_custom_code", label: "Custom <head> Code", placeholder: "<script>...</script>", multiline: true },
  { key: "body_custom_code", label: "Custom <body> Code", placeholder: "<noscript>...</noscript>", multiline: true },
];

function TrackingTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true);
    const { data, error } = await sb.from("site_settings").select("key,value");
    if (error) toast.error(error.message);
    else { const map: Record<string, string> = {}; (data ?? []).forEach((r: any) => (map[r.key] = r.value || "")); setValues(map); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    setSaving(true);
    try {
      for (const f of TRACKING_FIELDS) {
        const { error } = await sb.from("site_settings").upsert({ key: f.key, value: values[f.key] ?? "" }, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success("Saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  if (loading) return <CenterLoader />;
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-5 max-w-3xl">
      <h2 className="font-bold text-foreground text-lg">Pixel & Tracking</h2>
      {TRACKING_FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">{f.label}</label>
          {f.multiline
            ? <textarea value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} rows={4} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono" />
            : <input value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} className="w-full rounded-xl border border-input bg-background px-3 py-2.5" />}
        </div>
      ))}
      <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold inline-flex items-center gap-2 disabled:opacity-70">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
      </button>
    </div>
  );
}

const SITE_FIELDS: { key: keyof SiteInfo; label: string; placeholder: string; multiline?: boolean; group: string }[] = [
  { key: "name", label: "Site full name", placeholder: "...", group: "Brand" },
  { key: "shortName", label: "Short name", placeholder: "...", group: "Brand" },
  { key: "brandInitial", label: "Logo letter", placeholder: "A", group: "Brand" },
  { key: "footerTagline", label: "Footer tagline", placeholder: "...", multiline: true, group: "Brand" },
  { key: "heroBadge", label: "Hero badge text", placeholder: "...", group: "Hero" },
  { key: "heroTitle", label: "Hero title", placeholder: "...", multiline: true, group: "Hero" },
  { key: "heroSubtitle", label: "Hero subtitle", placeholder: "...", multiline: true, group: "Hero" },
  { key: "phone", label: "Primary phone (dial)", placeholder: "01952913188", group: "Contact" },
  { key: "phoneDisplay", label: "Phone (display)", placeholder: "...", group: "Contact" },
  { key: "secondPhone", label: "Secondary phone", placeholder: "", group: "Contact" },
  { key: "whatsapp", label: "WhatsApp number", placeholder: "8801xxxxxxxxx", group: "Contact" },
  { key: "whatsappMessage", label: "WhatsApp default message", placeholder: "", multiline: true, group: "Contact" },
  { key: "email", label: "Email", placeholder: "you@example.com", group: "Contact" },
  { key: "facebook", label: "Facebook page", placeholder: "https://...", group: "Contact" },
  { key: "youtube", label: "YouTube channel", placeholder: "https://...", group: "Contact" },
  { key: "address", label: "Address", placeholder: "", group: "Location" },
  { key: "hours", label: "Open hours", placeholder: "", group: "Location" },
  { key: "mapEmbed", label: "Map embed URL", placeholder: "", multiline: true, group: "Location" },
  { key: "seoTitle", label: "SEO title", placeholder: "<60 chars", group: "SEO" },
  { key: "seoDescription", label: "SEO description", placeholder: "<160 chars", multiline: true, group: "SEO" },
  { key: "ogImage", label: "OG share image URL", placeholder: "https://...jpg", group: "SEO" },
];

function SiteInfoTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true);
    const keys = Object.values(INFO_KEY_MAP);
    const { data, error } = await sb.from("site_settings").select("key,value").in("key", keys);
    if (error) toast.error(error.message);
    else { const map: Record<string, string> = {}; (data ?? []).forEach((r: any) => (map[r.key] = r.value || "")); setValues(map); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    setSaving(true);
    try {
      const rows = SITE_FIELDS.map((f) => ({ key: INFO_KEY_MAP[f.key], value: values[INFO_KEY_MAP[f.key]] ?? "" }));
      const { error } = await sb.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      toast.success("Saved");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  if (loading) return <CenterLoader />;
  const groups = Array.from(new Set(SITE_FIELDS.map((f) => f.group)));
  return (
    <div className="space-y-6 max-w-4xl">
      {groups.map((g) => (
        <div key={g} className="bg-card rounded-2xl p-6 border border-border shadow-soft space-y-4">
          <h3 className="font-bold text-foreground text-lg">{g}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {SITE_FIELDS.filter((f) => f.group === g).map((f) => {
              const k = INFO_KEY_MAP[f.key];
              return (
                <div key={k} className={`space-y-1.5 ${f.multiline ? "md:col-span-2" : ""}`}>
                  <label className="text-sm font-semibold text-foreground">{f.label}</label>
                  {f.multiline
                    ? <textarea value={values[k] ?? ""} onChange={(e) => setValues({ ...values, [k]: e.target.value })} placeholder={f.placeholder} rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                    : <input value={values[k] ?? ""} onChange={(e) => setValues({ ...values, [k]: e.target.value })} placeholder={f.placeholder} className="w-full rounded-xl border border-input bg-background px-3 py-2.5" />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {values[INFO_KEY_MAP.mapEmbed] && (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-soft">
          <div className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Map Preview</div>
          <iframe src={values[INFO_KEY_MAP.mapEmbed]} className="w-full h-64 rounded-xl border border-border" loading="lazy" />
        </div>
      )}
      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={saving} className="px-6 py-3 rounded-2xl gradient-primary text-primary-foreground font-bold inline-flex items-center gap-2 disabled:opacity-70 shadow-elegant">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All
        </button>
      </div>
    </div>
  );
}
