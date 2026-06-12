"use client";

import { Lock, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem("admin-sync-token") ?? "";
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [checkingStoredToken, setCheckingStoredToken] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const checkedStoredTokenRef = useRef(false);

  const verify = useCallback(async (candidateToken = token) => {
    setError("");
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { authorization: `Bearer ${candidateToken}` },
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };

      if (data.ok) {
        window.sessionStorage.setItem("admin-sync-token", candidateToken);
        setVerified(true);
        setCheckingStoredToken(false);
        return;
      }

      if (response.status === 429) {
        setError(data.message ?? "Demasiados intentos admin. Espera un momento.");
      } else {
        window.sessionStorage.removeItem("admin-sync-token");
        setError(data.message ?? "Token admin invalido.");
      }
    } catch {
      setError("No se pudo verificar el token admin. Intenta de nuevo.");
    } finally {
      setCheckingStoredToken(false);
    }
  }, [token]);

  useEffect(() => {
    if (checkedStoredTokenRef.current) {
      return;
    }

    const storedToken = getStoredAdminToken();

    if (!storedToken) {
      return;
    }

    checkedStoredTokenRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      setToken(storedToken);
      setCheckingStoredToken(true);
      void verify(storedToken);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [verify]);

  async function handleAdminSignOut() {
    setSigningOut(true);
    window.sessionStorage.removeItem("admin-sync-token");
    await signOut({ callbackUrl: "/" });
  }

  if (verified) {
    return (
      <>
        <div className="relative z-20 mx-auto flex max-w-7xl justify-end px-4 pt-4">
          <Button onClick={handleAdminSignOut} disabled={signingOut} variant="secondary" className="gap-2">
            <LogOut className="size-4" />
            {signingOut ? "Cerrando..." : "Cerrar sesion admin"}
          </Button>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <GlassCard>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-amber-300 text-slate-950">
            <Lock className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black">Acceso admin</h1>
            <p className="text-sm text-white/60">Ingresa `ADMIN_SYNC_TOKEN` para continuar.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="ADMIN_SYNC_TOKEN"
          />
          <Button onClick={() => void verify()} disabled={!token || checkingStoredToken}>
            {checkingStoredToken ? "Verificando..." : "Entrar"}
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm font-semibold text-red-200">{error}</p> : null}
      </GlassCard>
    </div>
  );
}
