import { Link } from "react-router-dom";

export default function Button({ text, to, variant }) {
  const baseClasses =
    "px-6 py-2 rounded-full font-semibold text-center transition duration-200";
  const variants = {
    yellow: "bg-yellow-400 text-black hover:bg-yellow-300",
    dark: "bg-[#1a1a5e] text-white hover:bg-[#0f0f3a]",
  };

  return (
    <Link to={to} className={`${baseClasses} ${variants[variant]}`}>
      {text}
    </Link>
  );
}
