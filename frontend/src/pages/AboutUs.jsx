import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MeetTheTeam from "../components/MeetTheTeam";

// Decorative Confetti Pattern (reuse your ConfettiPattern or inline here)
const ConfettiPattern = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Add as many as you want, adjust positions/colors */}
    <div className="absolute top-4 left-6 w-4 h-1 bg-yellow-300 rounded"></div>
    <div className="absolute top-8 left-32 w-4 h-1 bg-red-500 rounded"></div>
    <div className="absolute bottom-8 right-12 w-4 h-1 bg-green-500 rounded"></div>
    <div className="absolute top-10 right-24 w-4 h-1 bg-blue-500 rounded"></div>
    {/* ...more rectangles for confetti ... */}
  </div>
);

const SectionBox = ({ title, children }) => (
  <div className="relative bg-[#16166B] rounded-3xl text-white px-8 py-8 mb-10 max-w-4xl mx-auto shadow-lg">
    <ConfettiPattern />
    <h2 className="text-3xl font-bold mb-4 text-center">{title}</h2>
    <div className="text-lg text-center">{children}</div>
  </div>
);

export default function AboutUs() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-10">
        <SectionBox title="About Us">
          At InsightEdge, we believe that financial data shouldn’t be complicated or intimidating. Our platform empowers businesses to easily upload, analyze, and visualize their financial information — without requiring deep accounting knowledge. Whether you’re a small business owner, a startup founder, or a corporate manager, InsightEdge helps you turn complex numbers into meaningful insights.
          <br /><br />
          We combine intuitive design with powerful analytics, ensuring that every decision-maker can quickly understand their company’s financial health and make data-driven choices with confidence.
        </SectionBox>

        <SectionBox title="Our Mission">
          Our mission is to simplify financial analytics for everyone by providing a user-friendly platform that transforms raw business data into actionable insights. We aim to eliminate the gap between financial complexity and business decision-making, enabling organizations to focus on growth and strategy rather than data struggle.
        </SectionBox>

        <SectionBox title="Our Vision">
          We envision a future where financial understanding is accessible to all, regardless of background or technical skills. Through innovative tools, automation, and clear visual storytelling, we strive to make data analysis a natural part of everyday business operations worldwide.
        </SectionBox>

        {/* Meet The Team Section */}
        <MeetTheTeam />
      </main>

      <Footer />
    </div>
  );
}