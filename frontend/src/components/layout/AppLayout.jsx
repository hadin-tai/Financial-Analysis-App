// src/components/layout/AppLayout.jsx
import Sidebar from "../common/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar - Fixed/Sticky */}
      <div className="sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
