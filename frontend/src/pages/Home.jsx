import HeroSection from "../components/HeroSection";
import SeeBeyondSection from "../components/SeeBeyondSection";
import HowItWorks from "../components/HowItWorks";
import FinalCTA from "../components/FinalCTA";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* See Beyond the Balance Sheet */}
      <SeeBeyondSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Final Call To Action */}
      <FinalCTA />

      <Footer />
    </div>
  );
}
