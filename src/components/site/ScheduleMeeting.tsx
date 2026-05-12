import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

const ERR_MAP: Record<string, string> = {
  auth_required: "অনুগ্রহ করে লগইন করুন",
  payment_not_found: "পেমেন্ট খুঁজে পাওয়া যায়নি",
  not_owner: "এই পেমেন্ট আপনার নয়",
  payment_not_confirmed: "পেমেন্ট কনফার্ম হওয়ার আগে শিডিউল করা যাবে না",
  slot_too_soon: "কমপক্ষে ২ ঘন্টা পরের সময় বাছাই করুন",
  friday_closed: "শুক্রবার বন্ধ",
  outside_hours: "সময় ১০টা–৭:৩০ এর মধ্যে রাখুন",
  invalid_slot: "৩০ মিনিটের স্লট বাছাই করুন",
  already_booked: "এই পেমেন্টের জন্য আগেই শিডিউল করা হয়েছে",
  slot_taken: "এই স্লট অলরেডি বুক হয়ে গেছে",
};

// Format YYYY-MM-DD for the upcoming N days, skipping Friday
function buildDays(count: number) {
  const out: { iso: string; label: string; dow: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; out.length < count && i < count + 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    if (dow === 5) continue; // Friday closed
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "short" });
    out.push({ iso, label, dow });
  }
  return out;
}

// Generate 30-min slots 10:00 .. 19:30 (Asia/Dhaka local labels)
const SLOTS = Array.from({ length: 20 }, (_, i) => {
  const total = 10 * 60 + i * 30; // minutes from 00:00
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return { h, m, value: `${hh}:${mm}`, label: `${h12}:${mm} ${ampm}` };
});

// Build a UTC ISO timestamp from a Bangladesh-local (UTC+6) date+time
function toUtcIso(dateIso: string, h: number, m: number) {
  // Bangladesh has no DST and is UTC+6 year-round
  const [y, mo, d] = dateIso.split("-").map(Number);
  // local Asia/Dhaka epoch ms = Date.UTC(y,mo-1,d,h,m) - 6h
  const ms = Date.UTC(y, mo - 1, d, h, m) - 6 * 3600 * 1000;
  return new Date(ms).toISOString();
}

type Existing = { scheduled_at: string; meet_link: string | null; status: string };

export function ScheduleMeeting({
  paymentId,
  customerName,
}: {
  paymentId: string;
  customerName: string;
}) {
  const days = useMemo(() => buildDays(7), []);
  const [date, setDate] = useState<string>(days[0]?.iso || "");
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [picked, setPicked] = useState<{ h: number; m: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<Existing | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Check if this payment already has a booking
  useEffect(() => {
    let active = true;
    sb.from("consultation_schedules")
      .select("scheduled_at, meet_link, status")
      .eq("payment_submission_id", paymentId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!active) return;
        setExisting(data as Existing | null);
        setLoadingExisting(false);
      });
    return () => {
      active = false;
    };
  }, [paymentId]);

  // Load taken slots for selected date
  useEffect(() => {
    if (!date || existing) return;
    setLoadingSlots(true);
    setPicked(null);
    sb.rpc("get_booked_slots", { _date: date }).then(({ data }: any) => {
      const set = new Set<string>();
      (data as { scheduled_at: string }[] | null)?.forEach((r) => {
        const d = new Date(r.scheduled_at);
        // convert to Asia/Dhaka HH:mm
        const dhaka = new Date(d.getTime() + 6 * 3600 * 1000);
        set.add(`${String(dhaka.getUTCHours()).padStart(2, "0")}:${String(dhaka.getUTCMinutes()).padStart(2, "0")}`);
      });
      setTaken(set);
      setLoadingSlots(false);
    });
  }, [date, existing]);

  const submit = async () => {
    if (!picked) {
      toast.error("একটি স্লট বাছাই করুন");
      return;
    }
    setSubmitting(true);
    const iso = toUtcIso(date, picked.h, picked.m);
    const { data, error } = await sb.rpc("book_consultation_slot", {
      _payment_submission_id: paymentId,
      _scheduled_at: iso,
    });
    if (error) {
      const msg = ERR_MAP[error.message] || error.message;
      toast.error(msg);
      setSubmitting(false);
      return;
    }
    toast.success("শিডিউল কনফার্ম হয়েছে!");
    // Re-fetch booking
    const { data: row } = await sb
      .from("consultation_schedules")
      .select("scheduled_at, meet_link, status")
      .eq("id", data)
      .maybeSingle();
    setExisting(row as Existing);
    setSubmitting(false);
  };

  if (loadingExisting) {
    return (
      <div className="grid place-items-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (existing) {
    const d = new Date(existing.scheduled_at);
    return (
      <div className="bg-gradient-to-br from-emerald-500/10 to-primary/5 border-2 border-emerald-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white grid place-items-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">আপনার মিটিং শিডিউলড</h3>
            <p className="text-sm text-muted-foreground mt-1">{customerName}, নিচের সময়ে আমরা আপনার সাথে যোগাযোগ করবো</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">তারিখ</div>
                <div className="font-bold text-foreground mt-0.5">
                  {d.toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">সময়</div>
                <div className="font-bold text-foreground mt-0.5">
                  {d.toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit", hour12: true })}
                </div>
              </div>
            </div>
            {existing.meet_link && (
              <a
                href={existing.meet_link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-sm"
              >
                মিটিং লিংকে যোগ দিন →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center text-primary-foreground shrink-0">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground">আপনার মিটিং শিডিউল করুন</h3>
          <p className="text-sm text-muted-foreground mt-0.5">৩০ মিনিটের ভিডিও কনসালটেশন বাছাই করুন</p>
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 text-xs text-amber-900 dark:text-amber-200 flex gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <ul className="space-y-1 leading-relaxed">
          <li>• শুক্রবার বন্ধ; শনি–বৃহস্পতি ১০:০০ AM – ৭:৩০ PM</li>
          <li>• কমপক্ষে ২ ঘন্টা পরের স্লট বাছাই করতে পারবেন</li>
          <li>• প্রতিটি পেমেন্টে শুধু একবার শিডিউল করা যায়</li>
        </ul>
      </div>

      {/* Date picker */}
      <div className="mb-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">তারিখ</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const active = d.iso === date;
            return (
              <button
                key={d.iso}
                onClick={() => setDate(d.iso)}
                className={`shrink-0 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-soft"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot grid */}
      <div className="mb-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> সময় (Asia/Dhaka)
        </div>
        {loadingSlots ? (
          <div className="grid place-items-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {SLOTS.map((s) => {
              const isTaken = taken.has(s.value);
              const isPicked = picked?.h === s.h && picked?.m === s.m;
              const slotIso = toUtcIso(date, s.h, s.m);
              const isPast = new Date(slotIso).getTime() < Date.now() + 2 * 3600 * 1000;
              const disabled = isTaken || isPast;
              return (
                <button
                  key={s.value}
                  disabled={disabled}
                  onClick={() => setPicked({ h: s.h, m: s.m })}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold border-2 transition ${
                    disabled
                      ? "border-border bg-muted/40 text-muted-foreground/60 line-through cursor-not-allowed"
                      : isPicked
                      ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        disabled={!picked || submitting}
        onClick={submit}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold shadow-elegant disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        শিডিউল কনফার্ম করুন
      </button>
    </div>
  );
}
