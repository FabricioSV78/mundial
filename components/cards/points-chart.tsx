"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PointsChart({
  data,
}: {
  data: Array<{ label: string; total: number; delta: number }>;
}) {
  if (!data.length) {
    return (
      <div className="grid h-72 place-items-center rounded-[8px] border border-white/10 bg-white/[0.04] text-center">
        <div>
          <p className="text-lg font-black text-white">Aun sin historial</p>
          <p className="mt-2 text-sm font-semibold text-white/55">
            Tus puntos apareceran aqui cuando empiecen a sumar pronosticos o fantasy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="points" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#facc15" stopOpacity={0.65} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" />
          <YAxis stroke="rgba(255,255,255,0.45)" />
          <Tooltip
            labelFormatter={(label) => `Fecha: ${label}`}
            contentStyle={{
              background: "#020617",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 8,
              color: "#fff",
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#facc15"
            strokeWidth={3}
            fill="url(#points)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
