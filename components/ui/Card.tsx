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
    "bg-card text-card-foreground p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300";
  const hoverClasses = hoverable
    ? "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 dark:hover:border-primary/40 cursor-pointer active:scale-[0.98]"
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
