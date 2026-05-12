# Plan: Consultancy Platform Enhancements

আপনি যা চেয়েছেন সেগুলো + কিছু extra useful feature যোগ করব।

## ১. Admin Video & Review Management

**Videos Tab (admin panel)** — ইতিমধ্যে `site_videos` টেবিল আছে কিন্তু admin UI নেই। যোগ করব:
- Add/Edit/Delete YouTube video (review type / promo type / consultancy content)
- Title, video ID, type, sort order, active toggle
- Live preview thumbnail

**Reviews Management (নতুন)** — দুই ধরনের review:
- **Image Reviews** — screenshot/photo upload (Facebook review, client photo) → storage bucket `reviews`
- **Video Reviews** — already covered via site_videos (type=review)
- নতুন `reviews` table: type (image/video), media_url বা video_id, client_name, rating, caption, sort_order, active
- Public site এ review section এ সব দেখাবে (carousel)

## ২. Consultation Scheduling System (মূল feature)

**Database changes:**
- নতুন `consultation_schedules` table:
  - payment_submission_id (FK), user_id, scheduled_at (timestamp), duration_minutes (15/30/60), meet_link, status (scheduled/completed/cancelled), admin_notes
  - **UNIQUE constraint on `scheduled_at`** → একই সময়ে দুটো schedule হতে পারবে না
- যদি admin একই time দিতে চায় → আগের schedule cancel করতে হবে (UI তে confirmation modal: "এই সময়ে অলরেডি একটা meeting আছে — cancel করে নতুন বুক করবেন?")

**Admin flow:**
- Payment approve হলে → "Schedule Meeting" button আসবে
- Modal: date + time picker (অলরেডি booked slot গুলো disabled দেখাবে), duration dropdown (15/30/45/60/90 min), meet link input (Google Meet / Zoom)
- Save করলে user এর profile এ realtime update যাবে

**User account flow (`/account`):**
- "Upcoming Consultations" section
- Each card: date, time, duration, "Join Meeting" button
- Meeting time এর ১০ মিনিট আগে থেকে button active হবে (এর আগে disabled + countdown দেখাবে: "শুরু হবে ২ ঘণ্টা ১৫ মিনিটে")
- meeting শেষ হলে "Completed" badge

## ৩. Manual Signup/Signin (Phone + Password)

**ইতিমধ্যে আছে:** consultation form submit করলে auto account তৈরি হয়।

**নতুন যোগ করব:**
- Public `/signup` page: name, phone, email, password → Supabase auth দিয়ে account create
- Public `/login` page: email/phone + password
- Phone কে email-এ convert করব internally: `<phone>@phone.local` (যেহেতু Supabase auth এর email লাগে আর OTP চাচ্ছেন না)
- "Forgot password" — email-based reset (যাদের real email আছে)

## ৪. Extra Features (আমার suggestion)

- **Notifications/Bell icon** in user account → meeting scheduled, payment confirmed, ইত্যাদি
- **Admin Dashboard stats card**: total scheduled meetings আজ/this week, upcoming in next 24h
- **Email/SMS reminder** (future-ready, এখন শুধু schema): meeting এর ২৪ ঘণ্টা আগে notification flag
- **Reschedule request** from user side → admin approve করলে নতুন time
- **Meeting history** in user profile — পুরাতন meeting গুলোর list with admin notes

## Technical Details

**Migration:**
```sql
-- reviews table
CREATE TABLE reviews (id, type CHECK IN ('image','video'), media_url, video_id, client_name, rating int, caption, sort_order, active, ...)
-- consultation_schedules
CREATE TABLE consultation_schedules (
  id, payment_submission_id, user_id, scheduled_at timestamptz UNIQUE,
  duration_minutes int CHECK (>0), meet_link, status, admin_notes, ...
)
-- storage bucket 'reviews' (public read)
-- realtime publication on consultation_schedules
-- RLS: users see own schedules, admins see all
```

**Files to add/edit:**
- `src/components/admin/VideosTab.tsx` (নতুন)
- `src/components/admin/ReviewsTab.tsx` (নতুন)
- `src/components/admin/ScheduleMeetingDialog.tsx` (নতুন) — date/time picker, conflict detection
- `src/components/admin/PaymentsTab.tsx` — "Schedule Meeting" button যোগ
- `src/routes/account.tsx` — upcoming meetings section + join button with countdown
- `src/routes/signup.tsx`, `src/routes/login.tsx` (phone-based) — নতুন
- `src/routes/admin.tsx` — Videos, Reviews tab যোগ
- Public site review section update — image + video mixed display

**Conflict detection:** `scheduled_at UNIQUE` + admin UI তে existing schedules query করে time slots blocked দেখাবে; force booking করলে আগেরটা auto-cancel।

---

**আপনার কাছে দুইটা ছোট প্রশ্ন:**
1. Meeting এর duration গুলো কী কী option দিব? (আমি default 15/30/45/60/90 minutes ভাবছি)
2. Phone login এর জন্য — শুধু Bangladesh numbers (+880) accept করব নাকি international?
