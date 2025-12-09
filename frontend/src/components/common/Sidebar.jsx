// src/components/common/Sidebar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import ConfirmPopup from "./ConfirmPopup";

// icons
import logo from "../../assets/dashboard/logo.png";
import dashboardIcon from "../../assets/dashboard/dashboard.svg?url";
import uploadIcon from "../../assets/upload/upload.svg?url";
import logoutIcon from "../../assets/dashboard/logout.svg?url";

export default function Sidebar() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    setShowConfirm(true);
  };

  return (
    <aside className="w-[300px] h-screen bg-[#16166B] flex flex-col justify-start pt-2 pb-4">
      {/* Logo */}
      <div className="px-4 pt-0">
        <img src={logo} alt="InsightEdge" className="h-28 w-full object-contain" />
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-3 px-4 mt-4">
        <SidebarItem
          to="/dashboard"
          icon={dashboardIcon}
          label="Dashboard"
        />
        <SidebarItem
          to="/upload"
          icon={uploadIcon}
          label="Upload"
        />
        <SidebarItem
          to="/chatbot"
          icon={dashboardIcon}
          label="AI Assistant"
        />
      </div>

      {/* Logout Button */}
      <div className="px-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-4 w-full bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 transition text-center"
        >
          <img src={logoutIcon} alt="Logout" className="h-6 w-6" />
          <span>Log Out</span>
        </button>
      </div>

      <ConfirmPopup
        open={showConfirm}
        title="Log Out ?"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />
    </aside>
  );
}
