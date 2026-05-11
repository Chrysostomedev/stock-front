import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
  className?: string;
}

export default function Badge({ children, variant = "primary", className = "" }: BadgeProps) {
  const variants = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    danger: "bg-red-500/10 text-red-600 border-red-500/20",
    outline: "bg-transparent text-zinc-600 border-zinc-200 dark:border-zinc-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border tracking-wider uppercase ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
