"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type BackButtonProps = {
  className?: string;
  label?: string;
};

export default function BackButton({ className = "", label = "Úvodná stránka" }: BackButtonProps) {
  const baseClasses =
    "inline-flex items-center gap-2 text-base text-primary-900 hover:text-primary-800 transition-colors underline";

  return (
    <Link href="/" className={`${baseClasses} ${className}`.trim()}>
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
