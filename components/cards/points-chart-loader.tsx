"use client";

import dynamic from "next/dynamic";

const PointsChart = dynamic(
  () => import("@/components/cards/points-chart").then((mod) => mod.PointsChart),
  {
    ssr: false,
    loading: () => <div className="h-72 rounded-[8px] bg-white/5" />,
  },
);

export function PointsChartLoader({
  data,
}: {
  data: Array<{ label: string; total: number; delta: number }>;
}) {
  return <PointsChart data={data} />;
}
