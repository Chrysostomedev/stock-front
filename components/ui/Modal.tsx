import React from "react";
import { X } from "lucide-react";
import Card from "./Card";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full ${sizes[size]} animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-2xl border-none overflow-hidden bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
            <h3 className="text-lg font-black text-foreground tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
}
