import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Image as ImageIcon, Video, Star, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

type Review = {
  id: string;
  type: "image" | "video";
  media_url: string | null;
  video_id: string | null;
  client_name: string;
  rating: number;
  caption: string | null;
  sort_order: number;
  active: boolean;
};

function extractYouTubeId(input: string): string | null {
  const m = input.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : input.length === 11 ? input : null;
}

export function ReviewsTab() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"image" | "video">("image");
  const [clientName, setClientName] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(5);
  const [videoIdInput, setVideoIdInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await sb.from("reviews").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const reset = () => {
    setClientName(""); setCaption(""); setRating(5); setVideoIdInput(""); setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return toast.error("নাম দিন");
    setBusy(true);
    try {
      let media_url: string | null = null;
      let video_id: string | null = null;

      if (type === "image") {
        if (!file) { toast.error("ছবি সিলেক্ট করুন"); setBusy(false); return; }
        const path = `reviews/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
        const { error: upErr } = await sb.storage.from("reviews").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from("reviews").getPublicUrl(path);
        media_url = pub.publicUrl;
      } else {
        const id = extractYouTubeId(videoIdInput.trim());
        if (!id) { toast.error("YouTube ID/URL দিন"); setBusy(false); return; }
        video_id = id;
      }

      const { error } = await sb.from("reviews").insert({
        type, media_url, video_id, client_name: clientName, caption, rating,
        sort_order: items.length, active: true,
      });
      if (error) throw error;
      toast.success("Review যোগ করা হয়েছে");
      reset(); load();
    } catch (err: any) { toast.error(err.message || "Error"); }
    finally { setBusy(false); }
  };

  const update = async (id: string, patch: Partial<Review>) => {
    const { error } = await sb.from("reviews").update(patch).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await sb.from("reviews").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-card rounded-2xl p-5 border border-border shadow-soft space-y-3">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" /> নতুন Review যোগ করুন
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-xl border border-input bg-background px-3 py-2.5">
            <option value="image">📷 Image Review</option>
            <option value="video">🎥 Video Review (YouTube)</option>
          </select>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name" className="rounded-xl border border-input bg-background px-3 py-2.5" />
        </div>

        {type === "image" ? (
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm rounded-xl border border-input bg-background px-3 py-2.5 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold" />
        ) : (
          <input value={videoIdInput} onChange={(e) => setVideoIdInput(e.target.value)} placeholder="YouTube URL or ID" className="w-full rounded-xl border border-input bg-background px-3 py-2.5" />
        )}

        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" rows={2}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Rating:</label>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border border-input bg-background px-2 py-1 text-sm">
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{"⭐".repeat(n)}</option>)}
          </select>
          <button disabled={busy} className="ml-auto px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold inline-flex items-center gap-2 disabled:opacity-70">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} যোগ করুন
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">কোনো review নেই</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((r) => (
            <div key={r.id} className={`bg-card border rounded-2xl overflow-hidden ${r.active ? "border-border" : "border-dashed opacity-60"}`}>
              {r.type === "image" && r.media_url ? (
                <img src={r.media_url} alt={r.client_name} className="w-full h-48 object-cover" />
              ) : r.type === "video" && r.video_id ? (
                <img src={`https://i.ytimg.com/vi/${r.video_id}/hqdefault.jpg`} alt={r.client_name} className="w-full h-48 object-cover" />
              ) : null}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{r.client_name}</div>
                  <span className="text-xs">{"⭐".repeat(r.rating)}</span>
                </div>
                {r.caption && <p className="text-xs text-muted-foreground line-clamp-2">{r.caption}</p>}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <label className="inline-flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={r.active} onChange={(e) => update(r.id, { active: e.target.checked })} />
                    Active
                  </label>
                  <input type="number" defaultValue={r.sort_order} onBlur={(e) => Number(e.target.value) !== r.sort_order && update(r.id, { sort_order: Number(e.target.value) })} className="w-16 rounded border border-input bg-background px-2 py-1 text-xs" />
                  <button onClick={() => remove(r.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
