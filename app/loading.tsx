import React from "react";
import Loader from "./loader";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-sm">
      <Loader size="lg" text="Chargement en cours..." />
    </div>
  );
}
