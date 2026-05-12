import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, Link2, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

type Props = {
  paymentSubmission: {
    id: string;
    user_id: string | null;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    appointment_id: string | null;
    package_name: string;
  };
  onClose: () => void;
  onSaved?: () => void;
};

const DURATIONS = [15, 30, 45, 60, 90, 120];

export function ScheduleMeetingDialog({ paymentSubmission, onClose, onSaved }: Props) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [meetLink, setMeetLink] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<any>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [existing, setExisting] = useState<any>(null);

  useEffect(() => {
    sb.from("consultation_schedules").select("scheduled_at,id,customer_name")
      .eq("status", "scheduled")
      .then(({ data }: any) => {
        setBookedSlots((data ?? []).map((d: any) => d.scheduled_at));
      });
    sb.from("consultation_schedules").select("*")
      .eq("payment_submission_id", paymentSubmission.id)
      .eq("status", "scheduled").maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setExisting(data);
          const dt = new Date(data.scheduled_at);
          setDate(dt.toISOString().slice(0, 10));
          setTime(dt.toTimeString().slice(0, 5));
          setDuration(data.duration_minutes);
          setMeetLink(data.meet_link);
          setNotes(data.admin_notes || "");
        }
      });
  }, [paymentSubmission.id]);

  const checkConflict = async (iso: string) => {
    const { data } = await sb.from("consultation_schedules")
      .select("id,customer_name,scheduled_at")
      .eq("scheduled_at", iso).eq("status", "scheduled").maybeSingle();
    if (data && data.id !== existing?.id) return data;
    return null;
  };

  const save = async (force = false) => {
    if (!date || !time) return toast.error("Date এবং Time দিন");
    if (!meetLink.trim()) return toast.error("Meeting link দিন");
    const iso = new Date(`${date}T${time}:00`).toISOString();

    setBusy(true);
    const c = await checkConflict(iso);
    if (c && !force) { setConflict(c); setBusy(false); return; }

    if (c && force) {
      await sb.from("consultation_schedules").update({ status: "cancelled" }).eq("id", c.id);
    }

    const payload = {
      payment_submission_id: paymentSubmission.id,
      user_id: paymentSubmission.user_id,
      appointment_id: paymentSubmission.appointment_id,
      customer_name: paymentSubmission.customer_name,
      customer_phone: paymentSubmission.customer_phone,
      customer_email: paymentSubmission.customer_email,
      scheduled_at: iso,
      duration_minutes: duration,
      meet_link: meetLink.trim(),
      admin_notes: notes,
      status: "scheduled",
    };

    let err: any;
    if (existing) {
      ({ error: err } = await sb.from("consultation_schedules").update(payload).eq("id", existing.id));
    } else {
      ({ error: err } = await sb.from("consultation_schedules").insert(payload));
    }
    setBusy(false);
    if (err) {
      toast.error(err.message);
      return;
    }
    toast.success("Meeting scheduled");
    onSaved?.();
    onClose();
  };

  const cancelExisting = async () => {
    if (!existing) return;
    if (!confirm("এই meeting cancel করবেন?")) return;
    const { error } = await sb.from("consultation_schedules").update({ status: "cancelled" }).eq("id", existing.id);
    if (error) toast.error(error.message);
    else { toast.success("Cancelled"); onSaved?.(); onClose(); }
  };

  const slotIsBooked = (d: string, t: string) => {
    if (!d || !t) return false;
    const iso = new Date(`${d}T${t}:00`).toISOString();
    return bookedSlots.includes(iso) && (!existing || existing.scheduled_at !== iso);
  };
  const isBooked = slotIsBooked(date, time);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-auto p-6 shadow-elegant space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Schedule Meeting</h3>
            <p className="text-xs text-muted-foreground mt-1">{paymentSubmission.customer_name} • {paymentSubmission.package_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        {existing && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs">
            ✅ Already scheduled — editing will update the booking
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold">Date</span>
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold">Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
        </div>

        {isBooked && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>এই slot ইতিমধ্যে booked আছে। Save করলে আগের meeting cancel করে এটা book হবে।</span>
          </div>
        )}

        <label className="block">
          <span className="text-xs font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</span>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold flex items-center gap-1"><Link2 className="w-3 h-3" /> Meeting Link (Google Meet / Zoom)</span>
          <input value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </label>

        <label className="block">
          <span className="text-xs font-semibold">Internal notes (optional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </label>

        {conflict && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm space-y-2">
            <div className="font-semibold text-red-600">⚠️ Time slot conflict</div>
            <div className="text-xs">{conflict.customer_name} এর meeting এই সময়ে আছে।</div>
            <div className="flex gap-2">
              <button onClick={() => save(true)} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold">আগের cancel করে এটা book করুন</button>
              <button onClick={() => setConflict(null)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs">বাতিল</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button disabled={busy} onClick={() => save(false)}
            className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold inline-flex items-center justify-center gap-2 disabled:opacity-70">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {existing ? "Update" : "Schedule"}
          </button>
          {existing && (
            <button onClick={cancelExisting} className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 border border-red-500/30 font-semibold text-sm">
              Cancel meeting
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
