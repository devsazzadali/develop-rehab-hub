
-- Online consultation packages
CREATE TABLE public.consultation_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  original_price TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  features TEXT[] NOT NULL DEFAULT '{}',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  cta_label TEXT DEFAULT 'বুক করুন',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" ON public.consultation_packages
  FOR SELECT USING (true);
CREATE POLICY "Admins manage packages" ON public.consultation_packages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_consultation_packages_updated_at
  BEFORE UPDATE ON public.consultation_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FAQ
CREATE TABLE public.consultation_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view faqs" ON public.consultation_faqs
  FOR SELECT USING (true);
CREATE POLICY "Admins manage faqs" ON public.consultation_faqs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_consultation_faqs_updated_at
  BEFORE UPDATE ON public.consultation_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.consultation_packages (name, tagline, price, original_price, duration, features, is_popular, sort_order) VALUES
('বেসিক কনসালটেশন', 'প্রাথমিক পরামর্শ', '৫০০ টাকা', '১০০০ টাকা', '২০ মিনিট', ARRAY['ভিডিও কলে পরামর্শ','সমস্যার প্রাথমিক মূল্যায়ন','ঘরোয়া ব্যায়ামের গাইডলাইন','১ দিনের সাপোর্ট'], false, 1),
('স্ট্যান্ডার্ড কেয়ার', 'সবচেয়ে জনপ্রিয় প্যাকেজ', '১৫০০ টাকা', '২৫০০ টাকা', '৪৫ মিনিট', ARRAY['বিস্তারিত ভিডিও কনসালটেশন','কাস্টম এক্সারসাইজ প্ল্যান','ভিডিও গাইড সহ','৭ দিন WhatsApp সাপোর্ট','১টি ফলোআপ সেশন'], true, 2),
('প্রিমিয়াম রিহ্যাব', 'সম্পূর্ণ চিকিৎসা প্ল্যান', '৩৫০০ টাকা', '৫০০০ টাকা', '৬০ মিনিট', ARRAY['দীর্ঘ কনসালটেশন','সম্পূর্ণ রিহ্যাব প্রোগ্রাম','সাপ্তাহিক ফলোআপ (১ মাস)','৩০ দিন প্রায়োরিটি সাপোর্ট','কাস্টম ডায়েট গাইড','PDF রিপোর্ট'], false, 3);

INSERT INTO public.consultation_faqs (question, answer, sort_order) VALUES
('অনলাইন কনসালটেশন কীভাবে কাজ করে?', 'বুকিং করার পর আমরা আপনাকে WhatsApp/Zoom লিংক পাঠাবো। নির্ধারিত সময়ে ভিডিও কলে আমাদের বিশেষজ্ঞ ফিজিওথেরাপিস্ট আপনার সমস্যা শুনবেন এবং চিকিৎসা পরিকল্পনা দেবেন।', 1),
('পেমেন্ট কীভাবে করবো?', 'বিকাশ, নগদ, রকেট অথবা ব্যাংক ট্রান্সফারের মাধ্যমে পেমেন্ট করতে পারবেন। বুকিং কনফার্ম করার পর পেমেন্ট ডিটেইলস পাবেন।', 2),
('সেশন মিস করলে কী হবে?', 'কোন সমস্যা নেই! ২৪ ঘন্টা আগে জানালে বিনামূল্যে রিশিডিউল করতে পারবেন।', 3),
('কারা অনলাইন কনসালটেশন নিতে পারবেন?', 'যেকোনো বয়সের মানুষ — দেশে বা বিদেশে — যাদের ব্যথা, প্যারালাইসিস, PLID, স্পোর্টস ইনজুরি বা ফিজিওথেরাপি সংক্রান্ত যেকোনো সমস্যা আছে।', 4),
('চিকিৎসা কতদিনে কাজ করবে?', 'সমস্যার ধরন অনুযায়ী ভিন্ন। সাধারণত নিয়মিত ব্যায়াম ও পরামর্শ অনুসরণ করলে ২-৪ সপ্তাহে দৃশ্যমান উন্নতি দেখা যায়।', 5);

-- Site settings keys for online page (text content)
INSERT INTO public.site_settings (key, value) VALUES
('online_hero_badge', '🌍 দেশ-বিদেশ থেকে সেবা নিন'),
('online_hero_title', 'ঘরে বসেই বিশেষজ্ঞ ফিজিওথেরাপি পরামর্শ'),
('online_hero_subtitle', 'আর হাসপাতালে যাওয়ার ঝামেলা নেই। ভিডিও কলে পান অভিজ্ঞ ফিজিওথেরাপিস্টের পরামর্শ ও কাস্টম রিহ্যাব প্ল্যান।'),
('online_story_title', 'আপনার ব্যথা, আমাদের দায়িত্ব'),
('online_story_body', 'প্রতিদিন শত শত মানুষ ব্যথা নিয়ে কষ্ট পাচ্ছেন কিন্তু সঠিক পরামর্শ পাচ্ছেন না। দূরত্ব, সময়, ব্যস্ততা — অনেক কারণেই হাসপাতালে যাওয়া কঠিন। আমরা এই সমস্যার সমাধান নিয়ে এসেছি অনলাইন কনসালটেশন সেবা — যেখানে দেশ ও দেশের বাইরে থেকে যেকোনো সময় বিশেষজ্ঞ পরামর্শ নিতে পারবেন।'),
('online_packages_title', 'আপনার জন্য সঠিক প্যাকেজ বেছে নিন'),
('online_packages_subtitle', 'যেকোনো প্যাকেজ — ১০০% মানি ব্যাক গ্যারান্টি'),
('online_cta_title', 'আজই শুরু করুন আপনার ব্যথামুক্ত জীবন'),
('online_cta_subtitle', 'হাজারো মানুষ ইতিমধ্যে উপকৃত হয়েছেন। আপনিও যুক্ত হোন।'),
('online_whatsapp_message', 'আমি অনলাইন কনসালটেশন নিতে চাই।')
ON CONFLICT (key) DO NOTHING;
