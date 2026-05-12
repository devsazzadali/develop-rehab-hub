import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, Phone, Mail, Link2, Trash2, ExternalLink, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleMeetingDialog } from "./ScheduleMeetingDialog";

const sb: any = supabase;

type Schedule = {
  id: string;
  payment_submission_id: string | null;
  user_id: string | null;
  appointment_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meet_link: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  completed: { label: "Completed", cls: "bg-slate-500/15 text-slate-600 border-slate-500/30" },
  cancelled: { label: "Cancelled", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
};

export function SchedulesTab() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all" | "completed" | "cancelled">("upcoming");
  const [editing, setEditing] = useState<any>(null);

  const load = () => {
    setLoading(true);
    sb.from("consultation_schedules").select("*").order("scheduled_at", { ascending: true })
      .then(({ data, error }: any) => {
        if (error) toast.error(error.message);
        else setItems(data ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  useEffect(() => {
    const ch = sb.channel("schedules-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultation_schedules" }, () => load())
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await sb.from("consultation_schedules").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await sb.from("consultation_schedules").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const now = Date.now();
  const filtered = items.filter((it) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return it.status === "scheduled" && new Date(it.scheduled_at).getTime() > now - 60 * 60_000;
    return it.status === filter;
  });

  if (loading) return <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["upcoming", "all", "completed", "cancelled"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:border-primary"
            }`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">কোনো meeting নেই</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((it) => {
            const dt = new Date(it.scheduled_at);
            return (
              <div key={it.id} className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-start gap-4">
                <div className="text-center px-3 py-2 rounded-xl bg-primary/10 text-primary">
                  <div className="text-xs font-semibold">{dt.toLocaleDateString("bn-BD", { month: "short" })}</div>
                  <div className="text-2xl font-extrabold">{dt.getDate()}</div>
                  <div className="text-xs">{dt.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{it.customer_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_META[it.status]?.cls}`}>{STATUS_META[it.status]?.label || it.status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{it.duration_minutes} min</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {it.customer_phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {it.customer_phone}</span>}
                    {it.customer_email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {it.customer_email}</span>}
                  </div>
                  {it.meet_link && (
                    <a href={it.meet_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Link2 className="w-3 h-3" /> {it.meet_link.length > 50 ? it.meet_link.slice(0, 50) + "…" : it.meet_link}
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <a href={it.meet_link} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold">
                    <ExternalLink className="w-3 h-3" /> Open Meet
                  </a>
                  {it.status === "scheduled" && (
                    <>
                      <button onClick={() => setEditing(it)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold inline-flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => setStatus(it.id, "completed")} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">Mark Done</button>
                    </>
                  )}
                  <button onClick={() => remove(it.id)} className="px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-xs inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ScheduleMeetingDialog
          paymentSubmission={{
            id: editing.payment_submission_id,
            user_id: editing.user_id,
            customer_name: editing.customer_name,
            customer_phone: editing.customer_phone || "",
            customer_email: editing.customer_email,
            appointment_id: editing.appointment_id,
            package_name: "",
          }}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
