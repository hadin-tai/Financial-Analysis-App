import { useState } from "react";
import axios from "../../api/axios";
import ConfirmPopup from "../common/ConfirmPopup";
import SuccessPopup from "../common/SuccessPopup";

function BalanceSheetForm() {
  const [formData, setFormData] = useState({
    date: "",
    currentAssets: "",
    currentLiabilities: "",
    totalLiabilities: "",
    totalEquity: "",
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const doSubmit = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authentication token found. Please login again.");
        return;
      }

      const response = await axios.post("/balances", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setShowSuccess(true);
        setFormData({
          date: "",
          currentAssets: "",
          currentLiabilities: "",
          totalLiabilities: "",
          totalEquity: "",
          notes: ""
        });
      } else {
        alert("Failed to save balance sheet entry: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving balance sheet entry:", error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || "Server error";
        alert("Failed to save balance sheet entry: " + errorMessage);
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Failed to save balance sheet entry. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  return (
    <div className="w-full max-w-[1080px] mx-auto">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-6">
        {/* Date Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Current Assets Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Current Assets</label>
          <input
            type="number"
            name="currentAssets"
            value={formData.currentAssets}
            onChange={handleChange}
            required
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Current Liabilities Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Current Liabilities</label>
          <input
            type="number"
            name="currentLiabilities"
            value={formData.currentLiabilities}
            onChange={handleChange}
            required
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Total Liabilities Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Total Liabilities</label>
          <input
            type="number"
            name="totalLiabilities"
            value={formData.totalLiabilities}
            onChange={handleChange}
            required
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Total Equity Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Total Equity</label>
          <input
            type="number"
            name="totalEquity"
            value={formData.totalEquity}
            onChange={handleChange}
            required
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Notes Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Notes</label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="col-span-2 w-full bg-[#FFFF00] text-black font-semibold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Entry"}
        </button>
      </form>

      <ConfirmPopup
        open={showConfirm}
        title="Form submission"
        message="Please confirm that you want to save this data."
        confirmText="Save"
        cancelText="Cancel"
        onCancel={() => setShowConfirm(false)}
        onConfirm={async () => {
          setShowConfirm(false);
          await doSubmit();
        }}
      />

      <SuccessPopup
        open={showSuccess}
        messageTitle="Entered Successfully"
        messageBody="Your data has been saved successfully."
        durationMs={1500}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}

export default BalanceSheetForm;
