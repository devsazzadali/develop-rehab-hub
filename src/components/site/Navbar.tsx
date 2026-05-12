import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Phone, LogIn, UserCircle2 } from "lucide-react";
import { useSiteInfo } from "@/lib/use-site-data";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const links: { href: string; label: string }[] = [];

export function Navbar() {
  const SITE = useSiteInfo();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    return () => {
      window.removeEventListener("scroll", onScroll);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-soft py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src={logo} alt={SITE.shortName} className="w-10 h-10 object-contain shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base text-foreground truncate">
              {SITE.shortName}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
              নিউরো রিহ্যাবিলিটেশন সেন্টার
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={`/${l.href}`}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/online-consultation"
            className="text-sm font-bold text-primary hover:opacity-80 transition-colors"
          >
            অনলাইন কনসালটেশন
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {authed ? (
            <Link
              to="/account"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border hover:border-primary text-sm font-semibold transition"
            >
              <UserCircle2 className="w-4 h-4" /> অ্যাকাউন্ট
            </Link>
          ) : (
            <Link
              to="/account"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border hover:border-primary text-sm font-semibold transition"
            >
              <LogIn className="w-4 h-4" /> সাইন ইন
            </Link>
          )}
          <a
            href={`tel:${SITE.phone}`}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-primary text-primary-foreground text-sm font-semibold shadow-elegant hover:opacity-95 transition"
          >
            <Phone className="w-4 h-4" /> {SITE.phoneDisplay}
          </a>
          <button
            className="lg:hidden p-2 rounded-md text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden glass border-t border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={`/${l.href}`}
                onClick={() => setOpen(false)}
                className="py-2 text-foreground/90 font-medium"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/online-consultation"
              onClick={() => setOpen(false)}
              className="py-2 font-bold text-primary"
            >
              অনলাইন কনসালটেশন
            </Link>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="py-2 font-semibold text-foreground inline-flex items-center gap-2"
            >
              {authed ? <UserCircle2 className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {authed ? "আমার অ্যাকাউন্ট" : "সাইন ইন / সাইন আপ"}
            </Link>
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full gradient-primary text-primary-foreground font-semibold"
            >
              <Phone className="w-4 h-4" /> {SITE.phoneDisplay}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
