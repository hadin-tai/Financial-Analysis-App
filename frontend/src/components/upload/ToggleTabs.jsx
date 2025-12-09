import React from "react";

const base =
  "px-8 h-[50px] rounded-[30px] text-lg font-semibold transition-all border border-black/30";
const active =
  "bg-[#FFFF00] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]";
const inactive =
  "bg-white text-black hover:bg-neutral-100";

export default function ToggleTabs({ tabs, activeKey, onChange }) {
  return (
    <div className="flex flex-wrap gap-28 items-center justify-center">
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          className={`${base} ${activeKey === t.key ? active : inactive}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
