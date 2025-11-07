import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "ghost";
  loading?: boolean;
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-green-600 text-white hover:bg-green-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "border border-gray-300 hover:bg-gray-50",
};

const ButtonComponent: React.FC<Props> = ({
  variant = "ghost",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={`px-3 py-1 rounded disabled:opacity-50 ${variants[variant]} ${className}`}
  >
    {loading ? <span className="mr-2 inline-block animate-spin">⏳</span> : null}
    {children}
  </button>
);
export default ButtonComponent;
