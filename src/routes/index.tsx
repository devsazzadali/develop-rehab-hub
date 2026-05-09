import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { WhyUs } from "@/components/site/WhyUs";
import { Counters } from "@/components/site/Counters";
import { VideoReviews } from "@/components/site/VideoReviews";
import { Doctor } from "@/components/site/Doctor";
import { AppointmentForm } from "@/components/site/AppointmentForm";
import { Location } from "@/components/site/Location";
import { Footer } from "@/components/site/Footer";
import { FloatingButtons } from "@/components/site/FloatingButtons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ডেভেলপ ফিজিওথেরাপি এন্ড নিউরো রিহ্যাবিলিটেশন সেন্টার | রংপুর" },
      {
        name: "description",
        content:
          "রংপুরের আধুনিক ফিজিওথেরাপি ও নিউরো রিহ্যাবিলিটেশন সেন্টার। ব্যথা, প্যারালাইসিস, PLID, কোমর ব্যথা ও অন্যান্য রোগের আধুনিক চিকিৎসা।",
      },
      { property: "og:title", content: "ডেভেলপ ফিজিওথেরাপি এন্ড নিউরো রিহ্যাবিলিটেশন সেন্টার" },
      {
        property: "og:description",
        content: "অভিজ্ঞ চিকিৎসকের তত্ত্বাবধানে আধুনিক ফিজিওথেরাপি ও পুনর্বাসন সেবা — রংপুর।",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <WhyUs />
        <Counters />
        <Doctor />
        <VideoReviews />
        <AppointmentForm />
        <Location />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
