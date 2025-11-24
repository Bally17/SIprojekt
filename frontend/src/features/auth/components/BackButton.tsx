"use client";

import Icon from "@icons/index";
import Link from "next/link";

type BackButtonProps = {
  className?: string;
  label?: string;
};

export default function BackButton({
  className = "",
  label = "Úvodná stránka",
}: Readonly<BackButtonProps>) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2 rounded-lg border border-primary-100 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-900 shadow-soft transition-all hover:-translate-x-0.5 hover:border-primary-200 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${className}`.trim()}
    >
      <Icon
        name="arrow-left"
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
        aria-hidden
      />
      <span className="tracking-tight">{label}</span>
    </Link>
  );
}
