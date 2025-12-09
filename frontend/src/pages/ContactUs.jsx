import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactBanner from "../components/CotactBanner";
import ContactForm from "../components/ContactForm";

export default function ContactUs() {
  return (
    <div className="bg-white">
      <Navbar />

      <ContactBanner />
      <ContactForm />


      <Footer />
    </div>
  );
}
