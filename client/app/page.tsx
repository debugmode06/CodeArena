import type { Metadata } from "next";
import Footer from "@/components/landing/Footer";
import AboutSection from "@/components/landing/about-section";
import FeaturesSection from "@/components/landing/features-section";
import HeroSection from "@/components/landing/hero-section";

export const metadata: Metadata = {
  title: "Pomelo | Online Coding Contest & Assessment Platform",
  description: "Create, host, and participate in coding contests. Features real-time sandboxed code execution, interactive Monaco editor, automated test cases evaluation, and live leaderboards.",
};

export default function HomePage() {
  return (
    <div className="h-screen overflow-y-auto w-full">
      <main className="w-full min-h-screen pt-12">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <Footer />
      </main>
    </div>
  );
}
