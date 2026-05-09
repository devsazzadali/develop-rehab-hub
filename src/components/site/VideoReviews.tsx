import { motion } from "framer-motion";
import { useState } from "react";
import { Play } from "lucide-react";
import { SITE } from "@/lib/site-config";
import { useSiteVideos } from "@/lib/use-site-data";

export function VideoReviews() {
  const { videos } = useSiteVideos("review");
  const list = videos.length
    ? videos.map((v) => ({ id: v.video_id, title: v.title }))
    : SITE.reviewVideos;
  return (
    <section id="reviews" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-4">
            রোগীদের অভিজ্ঞতা
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            রোগীদের <span className="text-gradient">বাস্তব অভিজ্ঞতা</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            আমাদের চিকিৎসা নিয়ে রোগীদের মতামত দেখুন।
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((v, i) => (
            <ReviewCard key={v.id + i} videoId={v.id} title={v.title} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ videoId, title, index }: { videoId: string; title: string; index: number }) {
  const [play, setPlay] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-elegant transition"
    >
      <div className="relative aspect-video bg-muted">
        {play ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlay(true)}
            className="absolute inset-0 group/play"
            aria-label={title}
          >
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="w-16 h-16 rounded-full bg-white/95 grid place-items-center text-primary shadow-glow group-hover/play:scale-110 transition-transform animate-pulse-ring">
                <Play className="w-7 h-7 fill-current ml-1" />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">রোগীর সফল চিকিৎসার বাস্তব গল্প</p>
      </div>
    </motion.div>
  );
}
