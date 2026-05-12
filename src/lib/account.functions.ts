import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createConsultationUserSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(20),
  problem_type: z.string().min(1).max(100),
  address: z.string().trim().max(200).optional().default(""),
  details: z.string().trim().max(1000).optional().default(""),
  appointment_id: z.string().uuid().optional(),
});

export const createConsultationUser = createServerFn({ method: "POST" })
  .inputValidator((input) => createConsultationUserSchema.parse(input))
  .handler(async ({ data }) => {
    // Try to create the user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, phone: data.phone },
    });

    if (createErr) {
      const msg = createErr.message?.toLowerCase() || "";
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return { ok: false as const, code: "email_exists" as const, message: "এই ইমেইল ইতিমধ্যে রেজিস্টার করা আছে। লগইন করুন।" };
      }
      return { ok: false as const, code: "error" as const, message: createErr.message };
    }

    const userId = created.user!.id;

    // Insert profile
    await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address || null,
      problem_type: data.problem_type,
      details: data.details || null,
    });

    // Link appointment to user if provided
    if (data.appointment_id) {
      await supabaseAdmin
        .from("appointments")
        .update({ user_id: userId })
        .eq("id", data.appointment_id);
    }

    return { ok: true as const, userId };
  });

const adminUpdatePasswordSchema = z.object({
  user_id: z.string().uuid(),
  password: z.string().min(6).max(100),
});

export const adminUpdateUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => adminUpdatePasswordSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Verify caller is admin
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const [{ data: profiles }, { data: usersList }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const merged = (usersList?.users ?? []).map((u) => {
      const p: any = profileMap.get(u.id);
      return {
        user_id: u.id,
        name: p?.name || u.user_metadata?.name || u.email?.split("@")[0] || "—",
        email: p?.email || u.email || "",
        phone: p?.phone || u.user_metadata?.phone || "",
        address: p?.address || null,
        problem_type: p?.problem_type || null,
        details: p?.details || null,
        created_at: p?.created_at || u.created_at,
        auth_email: u.email,
        last_sign_in_at: u.last_sign_in_at || null,
        has_profile: !!p,
      };
    });

    // Sort newest first
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged;
  });
