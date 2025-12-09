import React, { useState } from "react";
import axios from "../../api/axios";
import Dropzone from "./Dropzone";
import FileInfoBar from "./FileInfoBar";
import ConfirmPopup from "../common/ConfirmPopup";
import SuccessPopup from "../common/SuccessPopup";

const SubmitBtn = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="mx-auto mt-6 block w-[300px] h-[50px] rounded-[16px] bg-[#FFFF00] 
               text-black text-lg font-semibold disabled:opacity-60 hover:bg-yellow-300 transition-colors"
  >
    Submit File
  </button>
);

export default function FileUploadBox({ type }) {
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const onFileAccepted = (f) => {
    setFile(f);
    setErrors([]);
  };

  const onError = (msgs) => {
    setErrors(Array.isArray(msgs) ? msgs : [String(msgs)]);
    setFile(null);
  };

  const doUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    const endpointMap = {
      transactions: "/upload",
      balanceSheet: "/balances/upload",
      budget: "/budgets/upload",
    };

    try {
      const fd = new FormData();
      fd.append("file", file);

      const token = localStorage.getItem("token");
      const res = await axios.post(endpointMap[type], fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!res?.data?.success) {
        onError([
          res?.data?.message || "Invalid file format. Please check your data and try again.",
        ]);
        return;
      }

      setFile(null);
      setErrors([]);
      setShowSuccess(true);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Unknown error.";
      onError(["Upload failed. Please try again.", msg]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    setShowConfirm(true);
  };

  return (
    <div className="w-full max-w-[1080px] mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-center">Upload {type.charAt(0).toUpperCase() + type.slice(1)} File</h3>
      
      {/* Drop area */}
      <Dropzone onFileAccepted={onFileAccepted} onError={onError} />

      {/* File info + Submit only when file exists */}
      {file && (
        <>
          <FileInfoBar file={file} onRemove={() => setFile(null)} reduced />
          <SubmitBtn onClick={handleSubmit} disabled={!file || isUploading} />
        </>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-8 text-center space-y-2">
          {errors.map((msg, i) => (
            <p key={i} className="text-red-400 text-lg">
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isUploading && (
        <div className="mt-4 text-center">
          <p className="text-yellow-400">Uploading file...</p>
        </div>
      )}

      {/* Confirm before submit */}
      <ConfirmPopup
        open={showConfirm}
        title="Form submission"
        message="Please confirm that you want to save this data."
        confirmText="Save"
        cancelText="Cancel"
        onCancel={() => setShowConfirm(false)}
        onConfirm={async () => {
          setShowConfirm(false);
          await doUpload();
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
