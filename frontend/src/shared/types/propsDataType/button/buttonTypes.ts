type ButtonVariant = "primary" | "danger" | "ghost" | "success" | "soft";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

export const base =
  "px-3 py-2 rounded text-sm disabled:opacity-50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

export const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary-900 text-white hover:bg-primary-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "border border-gray-300 hover:bg-gray-50",
  success: "bg-green-600 text-white hover:bg-green-700 border border-green-600/20",
  soft: "bg-white text-ink-900 shadow-soft hover:shadow-md",
};
