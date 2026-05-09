export const SITE = {
  name: "ডেভেলপ ফিজিওথেরাপি এন্ড নিউরো রিহ্যাবিলিটেশন সেন্টার",
  shortName: "ডেভেলপ ফিজিওথেরাপি",
  phone: "01952913188",
  phoneDisplay: "০১৯৫২-৯১৩১৮৮",
  whatsapp: "8801952913188",
  email: "developphysiotherapy@gmail.com",
  facebook: "https://www.facebook.com/Developphysiotherapy1562/",
  address: "ধাপ মেডিকেল মোড়, এস.এস. রোড, রংপুর",
  mapEmbed:
    "https://www.google.com/maps?q=Dhap+Medical+More+SS+Road+Rangpur&output=embed",
  // Replace these with real video IDs anytime
  heroVideoId: "dQw4w9WgXcQ",
  reviewVideos: [
    { id: "dQw4w9WgXcQ", title: "প্যারালাইসিস থেকে সুস্থতা" },
    { id: "9bZkp7q19f0", title: "কোমর ব্যথার সফল চিকিৎসা" },
    { id: "kJQP7kiw5Fk", title: "PLID রোগীর অভিজ্ঞতা" },
  ],
} as const;

export const waLink = (msg = "আমি অ্যাপয়েন্টমেন্ট নিতে চাই।") =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
