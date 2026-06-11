"use client";

import { Clock, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getTimeUntil } from "@/lib/utils";

export function CountdownBadge({ date, locked }: { date: string; locked?: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Badge tone={locked ? "red" : "gold"}>
      {locked ? <Lock className="size-3" /> : <Clock className="size-3" />}
      {locked ? "Bloqueado" : `Cierra en ${getTimeUntil(date, now)}`}
    </Badge>
  );
}
