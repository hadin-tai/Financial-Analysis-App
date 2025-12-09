import React from "react";
import plusIcon from "../../assets/upload/plus.svg?url";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  
  const kb = bytes / 1024;
  const mb = bytes / (1024 * 1024);
  const gb = bytes / (1024 * 1024 * 1024);
  
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  } else if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  } else {
    return `${kb.toFixed(1)} KB`;
  }
}

export default function FileInfoBar({ file, onRemove }) {
  if (!file) return null;

  return (
    <div className="w-full mt-6">
      <div className="w-full h-[50px] rounded-[16px] bg-[#EFEFEF] border border-black/30 flex items-center px-4 justify-between">
        <span className="truncate pr-3 text-lg">{file.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg">{formatSize(file.size)}</span>
          <button
            type="button"
            aria-label="Remove file"
            onClick={onRemove}
            className="w-8 h-8 flex items-center justify-center rounded-full transition"
          >
            <img 
              src={plusIcon} 
              alt="Remove" 
              className="w-5 h-5 rotate-45" 
            />
          </button>
        </div>
      </div>
    </div>
  );
}
