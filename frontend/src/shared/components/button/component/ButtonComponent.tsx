"use client";
import { base, ButtonProps, variants } from "@shared-types/ui/button";
import React from "react";

export const Button = ({
  variant = "ghost",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) => {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? <span className="mr-2 inline-block animate-spin">⏳</span> : null}
      {children}
    </button>
  );
};

export default Button;
