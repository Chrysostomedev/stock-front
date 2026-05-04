import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function Loader({ size = "md", text }: LoaderProps) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div
        className={`${sizeClasses[size]} border-zinc-200 border-t-emerald-500 rounded-full animate-spin`}
        role="status"
      />
      {text && (
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {text}
        </span>
      )}
    </div>
  );
}
