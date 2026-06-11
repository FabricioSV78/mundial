import { TrophyGlowCard } from "@/components/cards/trophy-glow-card";

export function TrophyCard({
  icon,
  title,
  value,
  copy,
}: {
  icon: "trophy" | "goal" | "calendarClock" | "gauge";
  title: string;
  value: string;
  copy: string;
}) {
  return <TrophyGlowCard icon={icon} title={title} value={value} copy={copy} />;
}
