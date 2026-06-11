"use client";

import { signIn } from "next-auth/react";
import { UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthPanel({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [favoriteCountry, setFavoriteCountry] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function register() {
    setLoading(true);
    setMessage("Creando cuenta...");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, username, favoriteCountry }),
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo registrar.");
      setLoading(false);
      return;
    }

    setMessage("Cuenta creada. Iniciando sesion...");
    await login();
  }

  async function login() {
    setLoading(true);
    setMessage("Entrando a la cancha...");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      window.location.href = callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
      return;
    }

    setMessage("Credenciales incorrectas o usuario no registrado.");
  }

  async function submit() {
    if (mode === "register") {
      await register();
      return;
    }

    await login();
  }

  return (
    <GlassCard className="sport-card">
      <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-emerald-300 text-slate-950">
        <UserRound className="size-9" />
      </div>
      <div className="mb-4 grid grid-cols-2 rounded-full bg-white/8 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-4 py-2 text-sm font-black ${mode === "login" ? "bg-amber-300 text-slate-950" : "text-white/65"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-full px-4 py-2 text-sm font-black ${mode === "register" ? "bg-amber-300 text-slate-950" : "text-white/65"}`}
        >
          Registro
        </button>
      </div>
      <div className="grid gap-3">
        {mode === "register" ? (
          <>
            <Input placeholder="Nombre de usuario" value={username} onChange={(event) => setUsername(event.target.value)} />
            <Input placeholder="Pais favorito" value={favoriteCountry} onChange={(event) => setFavoriteCountry(event.target.value)} />
          </>
        ) : null}
        <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button onClick={submit} disabled={loading || !email || !password}>
          {loading ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Entrar"}
        </Button>
        {message ? <p className="text-sm font-semibold text-emerald-100">{message}</p> : null}
      </div>
    </GlassCard>
  );
}
