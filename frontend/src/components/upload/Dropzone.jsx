import React, { useRef, useState } from "react";
import plusIcon from "../../assets/upload/plus.svg?url";

const ACCEPTED_EXT = [".csv", ".xlsx", ".xls", ".json"];
const ACCEPTED_MIME = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/json"
];

export default function Dropzone({ onFileAccepted, onError }) {
  const inputRef = useRef(null);
  const [isHover, setIsHover] = useState(false);

  const validate = (file) => {
    const name = file?.name?.toLowerCase() || "";
    const byExt = ACCEPTED_EXT.some(ext => name.endsWith(ext));
    const byMime = ACCEPTED_MIME.includes(file.type);
    return byExt || byMime;
  };

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file) return;

    if (!validate(file)) {
      onError?.([
        "Invalid file type. Please upload only CSV, Excel, or JSON."
      ]);
      return;
    }
    onError?.([]); // clear
    onFileAccepted?.(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsHover(false);
    handleFiles(e.dataTransfer.files);
  };

  const onBrowse = (e) => handleFiles(e.target.files);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsHover(true); }}
        onDragLeave={() => setIsHover(false)}
        onDrop={onDrop}
        onClick={handleClick}
        className={`mx-auto mt-8 rounded-[32px] border border-black/30 bg-[#F2F2F2]
                    w-full min-h-[200px] flex flex-col items-center justify-center 
                    text-center px-10 cursor-pointer ${isHover ? "ring-2 ring-[#FFFF00]" : ""}`}
      >
        {/* Plus icon without circle background */}
        <div className="w-16 h-16 flex items-center justify-center mb-6">
          <img src={plusIcon} alt="Plus" className="w-8 h-8" />
        </div>

        <p className="text-2xl">
          Drag &amp; Drop or click anywhere to choose files from computer.
        </p>
        <p className="text-lg mt-4 text-neutral-700">CSV, Excel, JSON only</p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT.join(",")}
          className="hidden"
          onChange={onBrowse}
        />
      </div>
    </div>
  );
}
