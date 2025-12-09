import React, { useState } from "react";
import ToggleTabs from "./ToggleTabs";
import Dropzone from "./Dropzone";
import FileInfoBar from "./FileInfoBar";
import ConfirmPopup from "../common/ConfirmPopup";
import SuccessPopup from "../common/SuccessPopup";
import axios from "../../api/axios";

const SubmitBtn = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="mx-auto mt-6 block w-[300px] h-[50px] rounded-[16px] bg-[#FFFF00] 
               text-black text-lg font-semibold disabled:opacity-60"
  >
    Submit&nbsp;File
  </button>
);

const TABS = [
  { key: "transactions", label: "Transactions" },
  { key: "balancesheet", label: "Balance Sheet" },
  { key: "budget", label: "Budget" },
];

export default function UploadSection() {
  const [active, setActive] = useState("transactions");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  const onFileAccepted = (f) => {
    setFile(f);
    setErrors([]);
  };

  const onError = (msgs) => {
    setErrors(Array.isArray(msgs) ? msgs : [String(msgs)]);
    setFile(null);
  };

  // API endpoints for each tab
  const ENDPOINTS = {
    transactions: "/upload",
    balancesheet: "/balances/upload",
    budget: "/budgets/upload",
  };

  const doFileUpload = async (selectedFile, tabKey) => {
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const url = ENDPOINTS[tabKey];
      const token = localStorage.getItem("token");

      const res = await axios.post(url, fd, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "multipart/form-data",
        },
      });

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Upload failed");
      }

      setErrors([]);
      setFile(null);
      setShowSuccess(true); // success popup
    } catch (e) {
      onError([
        "Upload failed. Please try again.",
        e?.response?.data?.message || e?.message || "Unknown error.",
      ]);
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    setPendingSubmit(() => () => doFileUpload(file, active));
    setShowConfirm(true);
  };

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 md:px-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-16 items-center justify-center">
        <ToggleTabs
          tabs={TABS}
          activeKey={active}
          onChange={(k) => {
            setActive(k);
            setFile(null);
            setErrors([]);
          }}
        />
      </div>

      {/* Drop area */}
      <div className="w-full max-w-[1080px] mx-auto px-4 md:px-6">
        <Dropzone onFileAccepted={onFileAccepted} onError={onError} />
      </div>

      {/* File info + Submit only when file exists */}
      {file && (
        <>
          <div className="w-full max-w-[1080px] mx-auto px-4 md:px-6">
            <FileInfoBar file={file} onRemove={() => setFile(null)} reduced />
          </div>
          <SubmitBtn onClick={handleSubmit} disabled={!file} />
        </>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-8 text-center space-y-2">
          {errors.map((msg, i) => (
            <p key={i} className="text-red-600 text-xl md:text-xl">
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Confirm before submit */}
      <ConfirmPopup
        open={showConfirm}
        title="Form submission"
        message="Please confirm that you want to save this data."
        confirmText="Save"
        cancelText="Cancel"
        onCancel={() => {
          setShowConfirm(false);
          setPendingSubmit(null);
        }}
        onConfirm={async () => {
          setShowConfirm(false);
          const fn = pendingSubmit;
          setPendingSubmit(null);
          if (typeof fn === "function") await fn();
        }}
      />

      {/* Success toast */}
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
