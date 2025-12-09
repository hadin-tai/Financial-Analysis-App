import Button from "./Button";
import { Link } from "react-router-dom";

export default function SeeBeyondSection() {
  return (
    <section className="text-center py-8">
      <h2 className="text-4xl font-bold mb-6 text-gray-900 leading-tight">
        See Beyond the Balance Sheet 🔍
      </h2>
      <p className="mb-10 text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
        Predict trends, uncover risks, and spot opportunities before they happen.
      </p>
      <div className="flex justify-center space-x-6">
      <Link
            to="/register"
            style={{
              width: "182px",
              height: "50px",
              backgroundColor: "#FFFF00",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#121212",
            }}
          >
            Register
          </Link>

          {/* Login Button */}
          <Link
            to="/login"
            style={{
              width: "182px",
              height: "50px",
              backgroundColor: "#16166B",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#FFFFFF",
            }}
          >
            Login
          </Link>
      </div>
    </section>
  );
}
