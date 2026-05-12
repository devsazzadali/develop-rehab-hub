import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, Star, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ONLINE_KEYS, type ConsultationPackage, type ConsultationFaq } from "@/lib/use-online-data";

const sb: any = supabase;

const ONLINE_LABELS: Record<string, string> = {
  online_hero_badge: "Hero Badge",
  online_hero_title: "Hero Title",
  online_hero_subtitle: "Hero Subtitle",
  online_story_title: "Story Title",
  online_story_body: "Story Body",
  online_packages_title: "Packages Title",
  online_packages_subtitle: "Packages Subtitle",
  online_cta_title: "CTA Title",
  online_cta_subtitle: "CTA Subtitle",
  online_whatsapp_message: "WhatsApp Message",
};

export function OnlineConsultationTab() {
  const [tab, setTab] = useState<"packages" | "faqs" | "content">("packages");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {[
          { k: "packages", l: "প্যাকেজ" },
          { k: "faqs", l: "FAQ" },
          { k: "content", l: "টেক্সট কন্টেন্ট" },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t.k ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:border-primary"
            }`}>
            {t.l}
          </button>
        ))}
      </div>
      {tab === "packages" && <PackagesEditor />}
      {tab === "faqs" && <FaqsEditor />}
      {tab === "content" && <ContentEditor />}
    </div>
  );
}

function PackagesEditor() {
  const [items, setItems] = useState<ConsultationPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    sb.from("consultation_packages").select("*").order("sort_order").then(({ data }: any) => {
      setItems((data as ConsultationPackage[]) ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const add = async () => {
    const { error } = await sb.from("consultation_packages").insert({
      name: "নতুন প্যাকেজ", price: "০ টাকা", features: [], sort_order: items.length + 1,
    });
    if (error) toast.error(error.message); else { toast.success("Added"); load(); }
  };

  if (loading) return <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={add} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold">
        <Plus className="w-4 h-4" /> নতুন প্যাকেজ
      </button>
      <div className="grid lg:grid-cols-2 gap-4">
        {items.map((p) => <PackageCard key={p.id} pkg={p} reload={load} />)}
      </div>
    </div>
  );
}

function PackageCard({ pkg, reload }: { pkg: ConsultationPackage; reload: () => void }) {
  const [p, setP] = useState(pkg);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await sb.from("consultation_packages").update({
      name: p.name, tagline: p.tagline, price: p.price, original_price: p.original_price,
      duration: p.duration, features: p.features, is_popular: p.is_popular,
      cta_label: p.cta_label, sort_order: p.sort_order, active: p.active,
    }).eq("id", p.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };
  const del = async () => {
    if (!confirm("ডিলিট করবেন?")) return;
    const { error } = await sb.from("consultation_packages").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
  };

  return (
    <div className={`bg-card border rounded-2xl p-5 space-y-3 ${p.is_popular ? "border-primary" : "border-border"}`}>
      <div className="flex items-center justify-between gap-2">
        <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })}
          className="flex-1 font-bold text-lg bg-transparent border-b border-border focus:border-primary outline-none px-1 py-1" />
        <button onClick={del} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tagline" value={p.tagline} onChange={(v) => setP({ ...p, tagline: v })} />
        <Field label="Duration" value={p.duration} onChange={(v) => setP({ ...p, duration: v })} />
        <Field label="Price" value={p.price} onChange={(v) => setP({ ...p, price: v })} />
        <Field label="Original Price" value={p.original_price} onChange={(v) => setP({ ...p, original_price: v })} />
        <Field label="CTA Label" value={p.cta_label} onChange={(v) => setP({ ...p, cta_label: v })} />
        <Field label="Sort Order" type="number" value={String(p.sort_order)} onChange={(v) => setP({ ...p, sort_order: Number(v) || 0 })} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Features (one per line)</label>
        <textarea value={p.features.join("\n")} onChange={(e) => setP({ ...p, features: e.target.value.split("\n").filter(Boolean) })}
          rows={6} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={p.is_popular} onChange={(e) => setP({ ...p, is_popular: e.target.checked })} />
          <Star className="w-4 h-4 text-amber-500" /> Popular
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} />
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

function FaqsEditor() {
  const [items, setItems] = useState<ConsultationFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    sb.from("consultation_faqs").select("*").order("sort_order").then(({ data }: any) => {
      setItems((data as ConsultationFaq[]) ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const add = async () => {
    const { error } = await sb.from("consultation_faqs").insert({
      question: "নতুন প্রশ্ন", answer: "উত্তর লিখুন", sort_order: items.length + 1,
    });
    if (error) toast.error(error.message); else { toast.success("Added"); load(); }
  };

  if (loading) return <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <button onClick={add} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold">
        <Plus className="w-4 h-4" /> নতুন FAQ
      </button>
      {items.map((f) => <FaqRow key={f.id} faq={f} reload={load} />)}
    </div>
  );
}

function FaqRow({ faq, reload }: { faq: ConsultationFaq; reload: () => void }) {
  const [f, setF] = useState(faq);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const { error } = await sb.from("consultation_faqs").update({
      question: f.question, answer: f.answer, sort_order: f.sort_order, active: f.active,
    }).eq("id", f.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };
  const del = async () => {
    if (!confirm("ডিলিট?")) return;
    const { error } = await sb.from("consultation_faqs").delete().eq("id", f.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        <input value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })}
          className="flex-1 font-semibold bg-transparent border-b border-border focus:border-primary outline-none px-1 py-1" />
        <input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) || 0 })}
          className="w-16 text-sm rounded border border-border bg-background px-2 py-1" />
        <button onClick={del} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
      </div>
      <textarea value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      <div className="flex items-center gap-3 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
        </label>
        <button onClick={save} disabled={saving} className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} সেভ
        </button>
      </div>
    </div>
  );
}

function ContentEditor() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sb.from("site_settings").select("key,value").in("key", ONLINE_KEYS as unknown as string[])
      .then(({ data }: any) => {
        const map: Record<string, string> = {};
        ONLINE_KEYS.forEach((k) => (map[k] = ""));
        ((data as { key: string; value: string }[]) ?? []).forEach((r) => (map[r.key] = r.value));
        setVals(map);
        setLoading(false);
      });
  }, []);

  const saveAll = async () => {
    setSaving(true);
    const rows = ONLINE_KEYS.map((k) => ({ key: k, value: vals[k] ?? "" }));
    const { error } = await sb.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("সব সেভ হয়েছে");
  };

  if (loading) return <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 max-w-3xl">
      {ONLINE_KEYS.map((k) => {
        const isLong = k.includes("body") || k.includes("subtitle") || k.includes("message");
        return (
          <div key={k}>
            <label className="text-sm font-semibold text-foreground">{ONLINE_LABELS[k]}</label>
            {isLong ? (
              <textarea value={vals[k] || ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            ) : (
              <input value={vals[k] || ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            )}
          </div>
        );
      })}
      <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground font-bold disabled:opacity-70">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} সব সেভ
      </button>
    </div>
  );
}
