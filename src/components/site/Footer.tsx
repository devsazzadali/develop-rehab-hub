import { Facebook, Mail, MapPin, Phone } from "lucide-react";
import { useSiteInfo } from "@/lib/use-site-data";
import logo from "@/assets/logo.png";

export function Footer() {
  const SITE = useSiteInfo();
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground grid place-items-center p-1">
                <img src={logo} alt={SITE.shortName} className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="font-bold">{SITE.shortName}</div>
                <div className="text-xs opacity-80">নিউরো রিহ্যাবিলিটেশন সেন্টার</div>
              </div>
            </div>
            <p className="text-sm opacity-90 leading-relaxed max-w-md">{SITE.footerTagline}</p>
            <a
              href={SITE.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition text-sm"
            >
              <Facebook className="w-4 h-4" /> Facebook পেজ
            </a>
          </div>

          <div>
            <h4 className="font-bold mb-4">কুইক লিংক</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><a href="#services" className="hover:opacity-100">সেবাসমূহ</a></li>
              <li><a href="#why-us" className="hover:opacity-100">কেন আমরা</a></li>
              <li><a href="#doctor" className="hover:opacity-100">চিকিৎসক</a></li>
              <li><a href="#reviews" className="hover:opacity-100">রিভিউ</a></li>
              <li><a href="#appointment" className="hover:opacity-100">অ্যাপয়েন্টমেন্ট</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">যোগাযোগ</h4>
            <ul className="space-y-3 text-sm opacity-90">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5" />
                <a href={`tel:${SITE.phone}`}>{SITE.phoneDisplay}</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5" />
                <a href={`mailto:${SITE.email}`} className="break-all">{SITE.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{SITE.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-foreground/15 text-center text-xs opacity-80">
          © {new Date().getFullYear()} {SITE.name}। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
