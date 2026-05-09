import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Clock, Heart, ThumbsUp, Users } from "lucide-react";

const toBn = (n: number) =>
  String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

function Counter({ to, suffix = "+" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const dur = 1600;
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / dur);
            setVal(Math.floor(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
            else setVal(to);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);

  return (
    <div ref={ref} className="text-4xl sm:text-5xl font-bold text-gradient">
      {toBn(val)}
      {suffix}
    </div>
  );
}

const stats = [
  { icon: Users, to: 5000, suffix: "+", label: "সন্তুষ্ট রোগী" },
  { icon: Clock, to: 10, suffix: "+", label: "বছরের অভিজ্ঞতা" },
  { icon: ThumbsUp, to: 95, suffix: "%", label: "সফল রিকভারি" },
  { icon: Heart, to: 24, suffix: "/৭", label: "সাপোর্ট" },
];

export function Counters() {
  return (
    <section className="py-16 lg:py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-center"
            >
              <s.icon className="w-8 h-8 mx-auto text-primary-foreground mb-3" />
              <Counter to={s.to} suffix={s.suffix} />
              <div className="mt-2 text-primary-foreground/90 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
