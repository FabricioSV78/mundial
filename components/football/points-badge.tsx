import { Badge } from "@/components/ui/badge";

export function PointsBadge({ points }: { points: number }) {
  return <Badge tone="green">+{points} pts</Badge>;
}
