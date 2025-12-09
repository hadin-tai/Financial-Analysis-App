import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import ConfirmPopup from "../common/ConfirmPopup";
import SuccessPopup from "../common/SuccessPopup";
import dropdownArrow from "../../assets/upload/dropdown arrow.svg?url";

function TransactionForm() {
  const [form, setForm] = useState({
    date: "",
    type: "income",
    amount: "",
    category: "",
    paymentMethod: "",
    status: "Completed",
    dueDate: "",
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const doSubmit = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authentication token found. Please login again.");
        return;
      }

      const response = await axios.post("/add-transaction", form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setShowSuccess(true);
        setForm({
          date: "",
          type: "income",
          amount: "",
          category: "",
          paymentMethod: "",
          status: "Completed",
          dueDate: "",
          notes: ""
        });
      } else {
        alert("Failed to save transaction: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || "Server error";
        alert("Failed to save transaction: " + errorMessage);
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Failed to save transaction. Please try again.");
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
            value={form.date} 
            onChange={handleChange} 
            required 
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Type Dropdown with "income" placeholder */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Type</label>
          <div className="relative">
            <select 
              name="type" 
              value={form.type} 
              onChange={handleChange}
              className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-0 appearance-none select-none user-select-none"
              style={{ 
                userSelect: 'none', 
                WebkitUserSelect: 'none', 
                MozUserSelect: 'none', 
                msUserSelect: 'none',
                outline: 'none',
                boxShadow: 'none'
              }}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <img src={dropdownArrow} alt="dropdown" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Amount</label>
          <input 
            type="number" 
            name="amount" 
            value={form.amount} 
            onChange={handleChange} 
            required 
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Category Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Category</label>
          <input 
            type="text" 
            name="category" 
            value={form.category} 
            onChange={handleChange} 
            required 
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Payment Method Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Payment Method</label>
          <input 
            type="text" 
            name="paymentMethod" 
            value={form.paymentMethod} 
            onChange={handleChange} 
            required 
            className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Status Dropdown with "Completed" placeholder */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Status</label>
          <div className="relative">
            <select 
              name="status" 
              value={form.status} 
              onChange={handleChange}
              className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-0 appearance-none select-none user-select-none"
              style={{ 
                userSelect: 'none', 
                WebkitUserSelect: 'none', 
                MozUserSelect: 'none', 
                msUserSelect: 'none',
                outline: 'none',
                boxShadow: 'none'
              }}
            >
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
            <img src={dropdownArrow} alt="dropdown" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
          </div>
        </div>

        {/* Due Date Input (conditional) */}
        {form.status === "Pending" && (
          <div className="space-y-2">
            <label className="text-black text-sm font-medium">Due Date</label>
            <input 
              type="date" 
              name="dueDate" 
              value={form.dueDate} 
              onChange={handleChange} 
              className="w-full p-3 bg-white text-black rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        )}

        {/* Notes Input */}
        <div className="space-y-2">
          <label className="text-black text-sm font-medium">Notes</label>
          <input 
            type="text" 
            name="notes" 
            value={form.notes} 
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

export default TransactionForm;
