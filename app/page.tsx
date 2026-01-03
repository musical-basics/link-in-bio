import { Header } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { ComparisonSection } from "@/components/landing/comparison-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      <Header />
      <div id="hero">
        <HeroSection />
      </div>
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="comparison">
        <ComparisonSection />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>
      <Footer />
    </main>
  )
}
