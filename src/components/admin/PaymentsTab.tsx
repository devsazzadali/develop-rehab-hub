import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, CheckCircle2, X, Phone, Hash, Mail, Clock, Eye, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleMeetingDialog } from "./ScheduleMeetingDialog";

const sb: any = supabase;

type PaymentMethod = {
  id: string; name: string; type: string; account_number: string; account_name: string;
  instructions: string; account_type: string; sort_order: number; active: boolean;
};

type Submission = {
  id: string; appointment_id: string | null; package_id: string | null; payment_method_id: string | null;
  payment_method_name: string; package_name: string; amount: string;
  customer_name: string; customer_phone: string; customer_email: string | null;
  sender_number: string; transaction_id: string; note: string | null;
  status: string; admin_notes: string | null; confirmed_at: string | null;
  screenshot_url: string | null;
  user_id: string | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  rejected:  { label: "Rejected",  cls: "bg-red-500/15 text-red-700 border-red-500/30" },
};

export function PaymentsTab() {
  const [tab, setTab] = useState<"submissions" | "methods">("submissions");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {[
          { k: "submissions", l: "Payment Submissions" },
          { k: "methods", l: "Payment Methods" },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t.k ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:border-primary"
            }`}>
            {t.l}
          </button>
        ))}
      </div>
      {tab === "submissions" ? <SubmissionsView /> : <MethodsView />}
    </div>
  );
}

// ---------- Submissions ----------
function SubmissionsView() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Submission | null>(null);

  const load = () => {
    setLoading(true);
    sb.from("payment_submissions").select("*").order("created_at", { ascending: false }).then(({ data }: any) => {
      setItems((data as Submission[]) ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  useEffect(() => {
    const ch = sb.channel("payments-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_submissions" }, (p: any) => {
        if (p.eventType === "INSERT") {
          setItems((prev) => [p.new as Submission, ...prev]);
          toast.success(`💰 নতুন পেমেন্ট: ${(p.new as Submission).customer_name}`);
        } else if (p.eventType === "UPDATE") {
          setItems((prev) => prev.map((i) => (i.id === p.new.id ? (p.new as Submission) : i)));
        } else if (p.eventType === "DELETE") {
          setItems((prev) => prev.filter((i) => i.id !== p.old.id));
        }
      }).subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);

  const filtered = statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter);
  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    confirmed: items.filter((i) => i.status === "confirmed").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };

  if (loading) return <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "rejected"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:border-primary"
            }`}>
            {s === "all" ? "সব" : STATUS_META[s]?.label} <span className="opacity-70">({counts[s]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">কোনো পেমেন্ট নেই</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((it) => (
            <div key={it.id} className="bg-card border border-border rounded-2xl p-4 hover:shadow-elegant transition">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{it.customer_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_META[it.status]?.cls}`}>
                      {STATUS_META[it.status]?.label || it.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{it.payment_method_name}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {it.customer_phone}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> Sender: {it.sender_number}</span>
                    <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3" /> TRX: <b className="text-foreground font-mono">{it.transaction_id}</b></span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(it.created_at).toLocaleString("bn-BD")}</span>
                  </div>
                  {(it.package_name || it.amount) && (
                    <div className="mt-1 text-sm">
                      <span className="text-muted-foreground">প্যাকেজ:</span> <b>{it.package_name || "—"}</b>
                      {it.amount && <span className="ml-3 text-primary font-bold">{it.amount}</span>}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(it)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <SubmissionDrawer item={selected} onClose={() => setSelected(null)} reload={load} />}
    </div>
  );
}

function SubmissionDrawer({ item, onClose, reload }: { item: Submission; onClose: () => void; reload: () => void }) {
  const [adminNotes, setAdminNotes] = useState(item.admin_notes || "");
  const [busy, setBusy] = useState(false);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    if (!item.screenshot_url) return;
    sb.storage.from("payment_proofs").createSignedUrl(item.screenshot_url, 3600).then(({ data }: any) => {
      if (data?.signedUrl) setShotUrl(data.signedUrl);
    });
  }, [item.screenshot_url]);

  const setStatus = async (status: string) => {
    setBusy(true);
    const { error } = await sb.from("payment_submissions").update({
      status, admin_notes: adminNotes,
      confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    }).eq("id", item.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`স্ট্যাটাস: ${status}`); reload(); onClose(); }
  };

  const del = async () => {
    if (!confirm("ডিলিট করবেন?")) return;
    const { error } = await sb.from("payment_submissions").delete().eq("id", item.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6 shadow-elegant">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold">{item.customer_name}</h3>
            <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_META[item.status]?.cls}`}>
              {STATUS_META[item.status]?.label || item.status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Info label="ফোন" value={item.customer_phone} />
          <Info label="ইমেইল" value={item.customer_email || "—"} />
          <Info label="Sender Number" value={item.sender_number} />
          <Info label="TRX ID" value={item.transaction_id} mono />
          <Info label="পেমেন্ট মাধ্যম" value={item.payment_method_name} />
          <Info label="পরিমাণ" value={item.amount || "—"} />
          <Info label="প্যাকেজ" value={item.package_name || "—"} />
          <Info label="সময়" value={new Date(item.created_at).toLocaleString("bn-BD")} />
        </div>

        {item.note && (
          <div className="mt-4 bg-muted/40 rounded-xl p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-1">কাস্টমার নোট</div>
            <p className="text-sm whitespace-pre-line">{item.note}</p>
          </div>
        )}

        {shotUrl && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-muted-foreground mb-1">পেমেন্ট স্ক্রিনশট</div>
            <a href={shotUrl} target="_blank" rel="noreferrer">
              <img src={shotUrl} alt="proof" className="max-h-80 rounded-lg border border-border" />
            </a>
          </div>
        )}

        <div className="mt-5">
          <label className="text-xs font-semibold text-muted-foreground">এডমিন নোট</label>
          <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="ইন্টারনাল নোট" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => setStatus("confirmed")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold disabled:opacity-70">
            <CheckCircle2 className="w-4 h-4" /> Confirm
          </button>
          <button disabled={busy} onClick={() => setStatus("rejected")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold disabled:opacity-70">
            <X className="w-4 h-4" /> Reject
          </button>
          <button disabled={busy} onClick={() => setStatus("pending")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border font-semibold disabled:opacity-70">
            <Clock className="w-4 h-4" /> Mark Pending
          </button>
          {item.status === "confirmed" && (
            <button onClick={() => setShowSchedule(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold">
              <Calendar className="w-4 h-4" /> Schedule Meeting
            </button>
          )}
          <button onClick={del} className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-destructive/10 text-destructive font-semibold">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
      {showSchedule && (
        <ScheduleMeetingDialog paymentSubmission={item} onClose={() => setShowSchedule(false)} onSaved={reload} />
      )}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-muted/40 rounded-lg p-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-foreground ${mono ? "font-mono font-bold" : "font-medium"} break-all`}>{value}</div>
    </div>
  );
}

// ---------- Methods ----------
function MethodsView() {
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    sb.from("payment_methods").select("*").order("sort_order").then(({ data }: any) => {
      setItems((data as PaymentMethod[]) ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const add = async () => {
    const { error } = await sb.from("payment_methods").insert({
      name: "নতুন মেথড", type: "mobile", account_number: "", account_name: "",
      instructions: "", account_type: "personal", sort_order: items.length + 1,
    });
    if (error) toast.error(error.message); else { toast.success("Added"); load(); }
  };

  if (loading) return <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={add} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold">
        <Plus className="w-4 h-4" /> নতুন মেথড
      </button>
      <div className="grid lg:grid-cols-2 gap-4">
        {items.map((m) => <MethodCard key={m.id} method={m} reload={load} />)}
      </div>
    </div>
  );
}

function MethodCard({ method, reload }: { method: PaymentMethod; reload: () => void }) {
  const [m, setM] = useState(method);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await sb.from("payment_methods").update({
      name: m.name, type: m.type, account_number: m.account_number, account_name: m.account_name,
      instructions: m.instructions, account_type: m.account_type, sort_order: m.sort_order, active: m.active,
    }).eq("id", m.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };
  const del = async () => {
    if (!confirm("ডিলিট করবেন?")) return;
    const { error } = await sb.from("payment_methods").delete().eq("id", m.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
  };

  return (
    <div className={`bg-card border rounded-2xl p-5 space-y-3 ${m.active ? "border-border" : "border-dashed border-border opacity-70"}`}>
      <div className="flex items-center justify-between gap-2">
        <input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })}
          className="flex-1 font-bold text-lg bg-transparent border-b border-border focus:border-primary outline-none px-1 py-1" />
        <button onClick={del} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Account Number" value={m.account_number} onChange={(v) => setM({ ...m, account_number: v })} />
        <Field label="Account Name" value={m.account_name} onChange={(v) => setM({ ...m, account_name: v })} />
        <Sel label="Type" value={m.type} options={["mobile", "bank", "card", "other"]} onChange={(v) => setM({ ...m, type: v })} />
        <Sel label="Account Type" value={m.account_type} options={["personal", "agent", "merchant", "business"]} onChange={(v) => setM({ ...m, account_type: v })} />
        <Field label="Sort Order" type="number" value={String(m.sort_order)} onChange={(v) => setM({ ...m, sort_order: Number(v) || 0 })} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Instructions</label>
        <textarea value={m.instructions} onChange={(e) => setM({ ...m, instructions: e.target.value })} rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="যেমন: Send Money করে TRX দিন" />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={m.active} onChange={(e) => setM({ ...m, active: e.target.checked })} />
          Active
        </label>
        <button onClick={save} disabled={saving} className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} সেভ
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
    </label>
  );
}
function Sel({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
