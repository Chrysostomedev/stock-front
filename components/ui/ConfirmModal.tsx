import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  variant = "danger",
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4 text-center items-center">
        <div className={`p-4 rounded-full ${variant === "danger" ? "bg-red-50 text-red-600" : "bg-primary/10 text-primary"}`}>
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
        <div className="flex gap-3 w-full mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant={variant === "danger" ? "danger" : "primary"} 
            className="flex-1" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
