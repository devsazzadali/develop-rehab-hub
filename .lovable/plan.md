# Premium Payment Flow + Auto User Accounts

## 1. Premium Multi-Step Payment Page (`/payment`)

SSL-style stepper with 4 steps:

```text
[1 Customer Info] → [2 Choose Method] → [3 Pay & Submit TRX] → [4 Confirm]
```

- **Step 1**: Name, phone, email, package select. Validate before next.
- **Step 2**: Choose payment method (bKash/Nagad/Rocket/Bank cards with logos). On Next →
- **Step 3**: Reveal account number + copy button + amount. Inputs: sender number, TRX ID, **screenshot upload** (Supabase Storage bucket `payment_proofs`), optional note.
- **Step 4**: Review & Confirm → insert into `payment_submissions` → redirect to `/thank-you?id=...`.

Premium polish: progress bar, framer-motion transitions between steps, gradient cards, trust badges (SSL/secure/refund), method logos.

## 2. Thank You Page (`/thank-you?id=<submission_id>`)

- Live status badge (pending / confirmed / rejected) via Supabase **realtime** subscription on `payment_submissions` row.
- Service details (package, amount, method, TRX, submitted at).
- Emergency contact card: WhatsApp button, phone, email.
- "What's next" timeline.
- When status flips to `confirmed`, show success animation + next-steps CTA.

## 3. Auto User Account on Consultation Submit

Currently `online-consultation` submits to `appointments`. New flow:

- After form submit, prompt user to **set a password** (inline modal step).
- Call edge function `create-consultation-user` (service role) that:
  - Creates `auth.users` with email + password (admin API, email_confirm = true).
  - Creates `profiles` row with name, phone, address, problem details copied from form.
  - Links the appointment to `user_id`.
- If email already exists → tell user to log in / reset password.
- After success, sign in client-side with the new password and route to `/account`.

New `/account` page: shows their profile data + appointments + payment submissions.

## 4. Admin User Management Tab

New `UsersTab` in admin panel:

- List all profiles (name, email, phone, created_at, last appointment).
- Edit profile fields.
- **Reset password**: admin-only edge function `admin-update-user-password` calls `auth.admin.updateUserById`.
- View user's appointments + payments.

## 5. Admin Payment Confirmation → Realtime

`PaymentsTab` already has confirm/reject buttons. Add:
- Enable Supabase Realtime on `payment_submissions`.
- Thank-you page subscribes by submission id; status updates instantly.

## Technical Details

**DB migration:**
- `profiles` table (user_id FK, name, email, phone, address, problem_type, details).
- `appointments`: add nullable `user_id uuid`.
- `payment_submissions`: ensure `screenshot_url text` column.
- Storage bucket `payment_proofs` (private; admin read, public insert via signed upload).
- Enable realtime publication for `payment_submissions`.
- RLS: users select/update own profile; admins all.

**Edge functions** (service role):
- `create-consultation-user` — creates auth user + profile, links appointment.
- `admin-update-user-password` — verifies caller is admin via JWT, then resets password.

**Files:**
- Rewrite `src/routes/payment.tsx` as multi-step wizard (extract step components).
- New `src/routes/thank-you.tsx`.
- New `src/routes/account.tsx`.
- New `src/components/admin/UsersTab.tsx` + add tab in `admin.tsx`.
- Update `online-consultation.tsx` form submit to include password step + call edge function.
- Update `PaymentsTab.tsx` to show screenshot.

## Open Questions

1. Screenshot upload — required or optional in step 3?
2. For consultation auto-account: should email be **required** in the form (currently optional)? Needed for auth.
3. Existing email handling: redirect to login, or just attach the new appointment to the existing user if they enter the right password?
