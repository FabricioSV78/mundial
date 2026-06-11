"use client";

import { motion } from "framer-motion";
import { Map, ShieldCheck, Trophy, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/card";

const icons = {
  predictions: ShieldCheck,
  fantasy: Users,
  map: Map,
  ranking: Trophy,
};

export function FeatureGrid({
  features,
}: {
  features: { title: string; copy: string; icon: keyof typeof icons }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: index * 0.08 }}
        >
          <GlassCard className="h-full">
            {(() => {
              const Icon = icons[feature.icon];
              return <Icon className="mb-5 size-9 text-amber-200" />;
            })()}
            <h3 className="text-lg font-black">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/62">{feature.copy}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
