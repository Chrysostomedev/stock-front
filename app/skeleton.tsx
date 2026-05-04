import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "card" | "line" | "circle";
  count?: number;
}

export default function Skeleton({ className = "", variant = "line", count = 1 }: SkeletonProps) {
  const variantClasses = {
    line: "h-4 w-full rounded",
    card: "h-40 w-full rounded-2xl",
    circle: "h-12 w-12 rounded-full",
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 ${variantClasses[variant]} ${className}`}
        />
      ))}
    </>
  );
}
