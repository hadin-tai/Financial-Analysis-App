import React, { useEffect } from "react";

/**
 * Yellow success toast (Figma: “Entered Successfully”)
 * Auto hides after `durationMs`.
 */
export default function SuccessPopup({
  open,
  messageTitle = "Entered Successfully",
  messageBody = "Your data has been saved successfully.",
  durationMs = 1500,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto rounded-2xl bg-[#FFFF00] text-black shadow-xl px-8 py-6 max-w-[620px]">
        <div className="flex items-start gap-3">
          {/* Check icon */}
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" fill="currentColor"/>
          </svg>
          <div>
            <div className="text-2xl font-bold mb-1">{messageTitle}</div>
            <div className="text-base">{messageBody}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
