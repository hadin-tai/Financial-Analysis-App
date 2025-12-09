import React, { useEffect } from "react";

/**
 * Reusable confirm modal (Figma: dark-blue card + Cancel / Confirm)
 */
export default function ConfirmPopup({
  open,
  title = "Submit Data?",
  message = "Please confirm you want to submit this data.",
  confirmText = "Save",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  // Handle focus management when popup opens
  useEffect(() => {
    if (open) {
      // Add modal-open class to body
      document.body.classList.add('modal-open');
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        // Blur any currently focused element
        if (document.activeElement) {
          document.activeElement.blur();
        }
        // Clear any text selection
        document.getSelection()?.removeAllRanges();
        
        // Force remove focus from all select elements with more aggressive approach
        const selectElements = document.querySelectorAll('select');
        selectElements.forEach(select => {
          select.blur();
          select.style.outline = 'none';
          select.style.boxShadow = 'none';
          select.style.borderColor = 'transparent';
          select.style.backgroundColor = 'white';
          select.style.color = 'black';
          select.style.pointerEvents = 'none';
          select.style.border = 'none';
          
          // Force remove any focus-related classes
          select.classList.remove('focus', 'focus:ring-2', 'focus:ring-yellow-400');
          
          // Also remove any inline styles that might be causing issues
          select.removeAttribute('style');
          select.style.outline = 'none';
          select.style.boxShadow = 'none';
          select.style.borderColor = 'transparent';
          select.style.backgroundColor = 'white';
          select.style.color = 'black';
          select.style.pointerEvents = 'none';
        });
        
        // Also handle any input elements that might be focused
        const inputElements = document.querySelectorAll('input');
        inputElements.forEach(input => {
          if (input !== document.activeElement) {
            input.blur();
          }
        });
      }, 0);
    } else {
      // Remove modal-open class when popup closes
      document.body.classList.remove('modal-open');
      
      // Re-enable pointer events on select elements
      const selectElements = document.querySelectorAll('select');
      selectElements.forEach(select => {
        select.style.pointerEvents = 'auto';
      });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-[520px] max-w-[92vw] rounded-2xl bg-[#0F1563] p-8 text-white shadow-xl">
        <h3 className="text-2xl font-bold text-center mb-3">{title}</h3>
        <p className="text-white/90 text-center mb-8">{message}</p>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 px-6 rounded-full border border-white text-white"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 px-8 rounded-full bg-[#FFFF00] text-black font-semibold"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
