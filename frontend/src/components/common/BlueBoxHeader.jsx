// src/components/common/BlueBoxHeader.jsx
export default function BlueBoxHeader({ heading, subtext }) {
  return (
    <div className="bg-[#16166B] rounded-xl p-6 mb-8 text-white shadow flex flex-col items-start">
      <h2 className="text-2xl font-bold mb-2">{heading}</h2>
      <p className="text-base opacity-80">{subtext}</p>
    </div>
  );
}
