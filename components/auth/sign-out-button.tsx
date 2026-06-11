"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <Button onClick={handleSignOut} disabled={loading} variant="secondary" className="gap-2">
      <LogOut className="size-4" />
      {loading ? "Saliendo..." : "Cerrar sesion"}
    </Button>
  );
}
