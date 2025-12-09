import { NavLink, Link } from "react-router-dom";
import logo from "../assets/home/logo.svg?url";

export default function Navbar() {
  return (
          <header className="w-full bg-white" style={{ height: "100px" }}>
        <div
          className="flex items-center justify-between"
          style={{
            maxWidth: "100%",
            width: "100%",
            height: "100px",
            margin: "0 auto",
            paddingLeft: "clamp(20px, 4vw, 34px)",
            paddingRight: "clamp(20px, 4vw, 34px)",
          }}
        >
        {/* Logo */}
        <Link to="/" style={{ width: "247px", height: "74px" }}>
          <img
            src={logo}
            alt="InsightEdge Logo"
            style={{
              width: "247px",
              height: "74px",
              objectFit: "contain",
            }}
          />
        </Link>

        {/* Navigation Links */}
                  <nav
            className="flex items-center"
            style={{ gap: "40px", marginLeft: "50px" }}
          >
          {/* Home */}
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              backgroundColor: isActive ? "#16166B" : "transparent",
              color: isActive ? "#FFFFFF" : "#000000",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: "10px",
            })}
          >
            Home
          </NavLink>

          {/* Contact US */}
          <NavLink
            to="/contact"
            style={({ isActive }) => ({
              backgroundColor: isActive ? "#16166B" : "transparent",
              color: isActive ? "#FFFFFF" : "#000000",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: "10px",
            })}
          >
            Contact US
          </NavLink>

          {/* About US */}
          <NavLink
            to="/about"
            style={({ isActive }) => ({
              backgroundColor: isActive ? "#16166B" : "transparent",
              color: isActive ? "#FFFFFF" : "#000000",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: "10px",
            })}
          >
            About US
          </NavLink>
        </nav>

        {/* Buttons */}
        <div
          className="flex items-center"
          style={{ marginLeft: "auto", gap: "20px" }}
        >
          {/* Register Button */}
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
      </div>
    </header>
  );
}
