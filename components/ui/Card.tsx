import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = "",
  onClick,
  hoverable = false,
}: CardProps) {
  const baseClasses =
    "bg-card text-card-foreground p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all";
  const hoverClasses = hoverable
    ? "hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 cursor-pointer active:scale-[0.99]"
    : "";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}
