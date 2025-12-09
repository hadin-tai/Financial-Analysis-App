// src/components/common/SidebarItem.jsx
import { NavLink } from "react-router-dom";

export default function SidebarItem({ icon, label, to, activeColor }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-start gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${isActive ? "bg-[#ffff1c] text-gray-900 font-bold" : "text-white"}`
      }
    >
      <img src={icon} alt={label} className="h-6 w-6 flex-shrink-0" />
      <span className="flex items-center ml-2 text-center flex-1">{label}</span>
    </NavLink>
  );
}
