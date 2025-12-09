import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/home/hero-image.svg?url";

const HeroSection = () => {
  return (
    <section className="w-full flex justify-center items-center py-8 relative">
      {/* Image Container */}
      <div className="relative inline-block">
        <img
          src={heroImage}
          alt="Hero"
          className="max-w-[2100px] w-full h-auto rounded-[30px]"
        />

        {/* Buttons Positioned Absolutely on Image */}
        <div
          className="absolute flex gap-5"
          style={{
            bottom: "75px", // Y-axis shift (increase to move up, decrease to move down)
            left: "90px",   // X-axis shift (increase to move right, decrease to move left)
          }}
        >
          {/* Register Button */}
          <Link
            to="/register"
            className="flex items-center justify-center font-bold"
            style={{
              width: "182px",
              height: "50px",
              backgroundColor: "#FFFF00",
              borderRadius: "20px",
              color: "#121212",
            }}
          >
            Register
          </Link>

          {/* Login Button */}
          <Link
            to="/login"
            className="flex items-center justify-center font-bold"
            style={{
              width: "182px",
              height: "50px",
              backgroundColor: "transparent",
              border: "2px solid #FFFF00",
              borderRadius: "20px",
              color: "#FFFF00",
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
