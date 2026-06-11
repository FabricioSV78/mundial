"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PREDICTION_SYNC_STORAGE_KEY } from "@/lib/predictionSync";

export function PredictionRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== PREDICTION_SYNC_STORAGE_KEY || !event.newValue) {
        return;
      }

      router.refresh();
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [router]);

  return null;
}
