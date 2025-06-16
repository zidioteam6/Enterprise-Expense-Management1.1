import React from "react";

export const Button = ({ children, onClick, className = "", variant = "default", type = "button" }) => {
  const baseStyle = "px-4 py-2 rounded font-medium";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-200",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
