import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, KeyRound, Search, Mail, Phone, Calendar, User as UserIcon } from "lucide-react";
import { adminListUsers, adminUpdateUserPassword } from "@/lib/account.functions";

export function UsersTab() {
  const list = useServerFn(adminListUsers);
  const updatePwd = useServerFn(adminUpdateUserPassword);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    list().then((d: any) => {
      const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      setUsers(arr);
      setLoading(false);
    }).catch((e) => { toast.error(String(e?.message || e)); setUsers([]); setLoading(false); });
  };
  useEffect(load, []);

  const filtered = users.filter((u) => {
    const s = (u.name + " " + u.email + " " + u.auth_email + " " + u.phone).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const savePwd = async () => {
    if (pwd.length < 6) { toast.error("৬+ অক্ষর"); return; }
    setBusy(true);
    try {
      await updatePwd({ data: { user_id: editing.user_id, password: pwd } });
      toast.success("পাসওয়ার্ড আপডেট হয়েছে");
      setEditing(null); setPwd("");
    } catch (e: any) { toast.error(e?.message || "Error"); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম / ইমেইল / ফোন দিয়ে খুঁজুন"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">কোনো ইউজার নেই</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((u) => (
            <div key={u.user_id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-primary" /> {u.name || "—"}
                  </div>
                  <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {u.auth_email || u.email}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(u.created_at).toLocaleDateString("bn-BD")}</span>
                  </div>
                  {u.problem_type && <div className="text-xs mt-1"><span className="text-muted-foreground">সমস্যা:</span> {u.problem_type}</div>}
                </div>
                <button onClick={() => { setEditing(u); setPwd(""); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">
                  <KeyRound className="w-3.5 h-3.5" /> Reset Password
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-elegant">
            <h3 className="text-xl font-bold">পাসওয়ার্ড রিসেট</h3>
            <p className="text-sm text-muted-foreground mt-1">{editing.name} ({editing.auth_email || editing.email})</p>
            <input type="password" minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড (৬+)" className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-border text-sm">বাতিল</button>
              <button onClick={savePwd} disabled={busy}
                className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-bold disabled:opacity-70">
                {busy ? "..." : "সেট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
