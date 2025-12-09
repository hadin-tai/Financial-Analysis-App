import React from "react";
import ContactBannerImage from "../assets/home/ConatctBanner.svg?url"; // Make sure the filename matches exactly

const ContactBanner = () => {
  return (
    <section className="w-full flex justify-center items-center py-8 relative">
      <div className="relative inline-block">
        <img
          src={ContactBannerImage}
          alt="Contact Banner"
          className="max-w-[2100px] w-full h-auto rounded-[30px]"
        />
        {/* If you want to add buttons or content over the image, do it here */}
      </div>
    </section>
  );
};

export default ContactBanner;