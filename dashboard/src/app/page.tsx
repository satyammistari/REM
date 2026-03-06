import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { CodeSection } from "@/components/landing/CodeSection";
import { BenchmarkSection } from "@/components/landing/BenchmarkSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#08080f", color: "var(--text-primary)" }}>
      <Navbar />
      <main>
        <Hero />
        <CodeSection />
        <BenchmarkSection />
        <HowItWorks />
        <FeaturesGrid />
      </main>
      <Footer />
    </div>
  );
}

