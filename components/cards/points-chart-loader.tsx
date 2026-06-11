"use client";

import { PointsChart } from "@/components/cards/points-chart";

export function PointsChartLoader({
  data,
}: {
  data: Array<{ label: string; total: number; delta: number }>;
}) {
  return <PointsChart data={data} />;
}
