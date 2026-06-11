"use client";

import { useEffect, useRef, useState } from "react";
import { Medal, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";
import { canonicalTeamName } from "@/lib/tournament/officialGroups2026";
import type { KnockoutSlot } from "@/lib/tournament/tournamentEngine";
import { cn } from "@/lib/utils";

type QualifiedTeam = {
  teamName: string;
  groupName: string;
  rank: number;
  qualification?: string;
};

type BracketMatch = {
  id: string;
  matchNo: number;
  round: string;
  home: string;
  away: string;
  locked?: boolean;
  tone?: "gold" | "green" | "blue" | "slate";
};

type BracketSide = {
  r32: BracketMatch[];
  r16: BracketMatch[];
  qf: BracketMatch[];
  sf: BracketMatch[];
};

type BracketTree = {
  left: BracketSide;
  right: BracketSide;
  final: BracketMatch;
  thirdPlace: BracketMatch;
};

const boardWidth = 1500;
const boardHeight = 1120;
const cardWidth = 150;
const cardHeight = 92;
const finalWidth = 180;
const finalHeight = 96;

const xPositions = {
  left: { r32: 24, r16: 220, qf: 390, sf: 540 },
  right: { sf: 810, qf: 960, r16: 1130, r32: 1326 },
  final: 660,
};

const yPositions = {
  r32: [105, 225, 345, 465, 655, 775, 895, 1015],
  r16: [165, 405, 715, 955],
  qf: [285, 835],
  sf: [560],
  final: 438,
  thirdPlace: 702,
};

const countryMeta = [
  { name: "Mexico", code: "MEX", flagCode: "mx" },
  { name: "South Africa", code: "RSA", flagCode: "za" },
  { name: "South Korea", code: "KOR", flagCode: "kr" },
  { name: "Czechia", code: "CZE", flagCode: "cz" },
  { name: "Canada", code: "CAN", flagCode: "ca" },
  { name: "Bosnia and Herzegovina", code: "BIH", flagCode: "ba" },
  { name: "Qatar", code: "QAT", flagCode: "qa" },
  { name: "Switzerland", code: "SUI", flagCode: "ch" },
  { name: "Brazil", code: "BRA", flagCode: "br" },
  { name: "Morocco", code: "MAR", flagCode: "ma" },
  { name: "Haiti", code: "HAI", flagCode: "ht" },
  { name: "Scotland", code: "SCO", flagCode: "gb-sct" },
  { name: "United States", code: "USA", flagCode: "us" },
  { name: "Paraguay", code: "PAR", flagCode: "py" },
  { name: "Australia", code: "AUS", flagCode: "au" },
  { name: "Turkey", code: "TUR", flagCode: "tr" },
  { name: "Germany", code: "GER", flagCode: "de" },
  { name: "Curaçao", code: "CUW", flagCode: "cw" },
  { name: "Côte d’Ivoire", code: "CIV", flagCode: "ci" },
  { name: "Ecuador", code: "ECU", flagCode: "ec" },
  { name: "Netherlands", code: "NED", flagCode: "nl" },
  { name: "Japan", code: "JPN", flagCode: "jp" },
  { name: "Sweden", code: "SWE", flagCode: "se" },
  { name: "Tunisia", code: "TUN", flagCode: "tn" },
  { name: "Belgium", code: "BEL", flagCode: "be" },
  { name: "Egypt", code: "EGY", flagCode: "eg" },
  { name: "Iran", code: "IRN", flagCode: "ir" },
  { name: "New Zealand", code: "NZL", flagCode: "nz" },
  { name: "Spain", code: "ESP", flagCode: "es" },
  { name: "Cape Verde", code: "CPV", flagCode: "cv" },
  { name: "Saudi Arabia", code: "KSA", flagCode: "sa" },
  { name: "Uruguay", code: "URU", flagCode: "uy" },
  { name: "France", code: "FRA", flagCode: "fr" },
  { name: "Senegal", code: "SEN", flagCode: "sn" },
  { name: "Iraq", code: "IRQ", flagCode: "iq" },
  { name: "Norway", code: "NOR", flagCode: "no" },
  { name: "Argentina", code: "ARG", flagCode: "ar" },
  { name: "Algeria", code: "ALG", flagCode: "dz" },
  { name: "Austria", code: "AUT", flagCode: "at" },
  { name: "Jordan", code: "JOR", flagCode: "jo" },
  { name: "Portugal", code: "POR", flagCode: "pt" },
  { name: "Democratic Republic of the Congo", code: "COD", flagCode: "cd" },
  { name: "Uzbekistan", code: "UZB", flagCode: "uz" },
  { name: "Colombia", code: "COL", flagCode: "co" },
  { name: "England", code: "ENG", flagCode: "gb-eng" },
  { name: "Croatia", code: "CRO", flagCode: "hr" },
  { name: "Ghana", code: "GHA", flagCode: "gh" },
  { name: "Panama", code: "PAN", flagCode: "pa" },
];

const teamMetaByCanonicalName = new Map(
  countryMeta.map((team) => [canonicalTeamName(team.name), { code: team.code, flagCode: team.flagCode }]),
);

function makeWinnerRound(source: BracketMatch[], startMatchNo: number, round: string, tone: BracketMatch["tone"]) {
  return Array.from({ length: source.length / 2 }, (_, index) => {
    return {
      id: `m${startMatchNo + index}`,
      matchNo: startMatchNo + index,
      round,
      home: "Pendiente",
      away: "Pendiente",
      locked: true,
      tone,
    };
  });
}

function buildBracket(slots: KnockoutSlot[]): BracketTree {
  const roundOf32Slots = slots.filter((slot) => slot.round === "Round of 32");
  const r32 = Array.from({ length: 16 }, (_, index) => {
    const slot = roundOf32Slots[index];

    return {
      id: slot?.id ?? `r32-${index + 1}`,
      matchNo: 73 + index,
      round: "Dieciseisavos",
      home: slot?.home ?? `Slot ${index * 2 + 1}`,
      away: slot?.away ?? `Slot ${index * 2 + 2}`,
      locked: slot?.locked,
      tone: "green" as const,
    };
  });

  const r16 = makeWinnerRound(r32, 89, "Octavos", "blue");
  const qf = makeWinnerRound(r16, 97, "Cuartos", "slate");
  const sf = makeWinnerRound(qf, 101, "Semifinal", "gold");

  return {
    left: {
      r32: r32.slice(0, 8),
      r16: r16.slice(0, 4),
      qf: qf.slice(0, 2),
      sf: sf.slice(0, 1),
    },
    right: {
      r32: r32.slice(8, 16),
      r16: r16.slice(4, 8),
      qf: qf.slice(2, 4),
      sf: sf.slice(1, 2),
    },
    final: {
      id: "m104",
      matchNo: 104,
      round: "Final",
      home: "Pendiente",
      away: "Pendiente",
      locked: true,
      tone: "gold",
    },
    thirdPlace: {
      id: "m103",
      matchNo: 103,
      round: "3er puesto",
      home: "Pendiente",
      away: "Pendiente",
      locked: true,
      tone: "slate",
    },
  };
}

function participantMeta(name: string) {
  const canonical = canonicalTeamName(name);
  const teamMeta = teamMetaByCanonicalName.get(canonical);

  if (teamMeta) {
    return {
      flagUrl: `https://flagcdn.com/w80/${teamMeta.flagCode}.png`,
      label: teamMeta.code,
      pending: false,
    };
  }

  return {
    flagUrl: null,
    label: "Pendiente",
    pending: true,
  };
}

function ParticipantRow({ name }: { name: string }) {
  const meta = participantMeta(name);
  const flagStyle = meta.flagUrl ? { backgroundImage: `url(${meta.flagUrl})` } : undefined;

  return (
    <div className="flex min-w-0 items-center gap-2" title={meta.pending ? "Por definir" : meta.label}>
      <span
        aria-label={meta.pending ? "Participante pendiente" : `Equipo ${meta.label}`}
        className={cn(
          "grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-white bg-cover bg-center text-lg font-black text-slate-950 shadow-lg shadow-black/30",
          meta.pending && "border-amber-200/70 bg-slate-950 text-base text-amber-100",
        )}
        style={flagStyle}
      >
        {meta.pending ? "?" : null}
      </span>
      <span
        className={cn(
          "min-w-[3.25ch] text-[13px] font-black leading-tight tracking-[0.08em] text-white",
          meta.pending && "text-[11px] tracking-normal text-amber-100/90",
        )}
      >
        {meta.label}
      </span>
    </div>
  );
}

function MatchNode({
  match,
  x,
  y,
  featured,
}: {
  match: BracketMatch;
  x: number;
  y: number;
  featured?: boolean;
}) {
  const width = featured ? finalWidth : cardWidth;
  const height = featured ? finalHeight : cardHeight;

  return (
    <article
      className={cn(
        "absolute z-10 rounded-[14px] border border-white/15 bg-slate-950/86 p-2.5 shadow-2xl shadow-black/45 backdrop-blur-md",
        match.tone === "gold" && "border-amber-200/45 bg-amber-300/12",
        match.tone === "green" && "border-emerald-200/25",
        match.tone === "blue" && "border-sky-200/25",
        featured && "bg-slate-950/92 p-4",
      )}
      style={{ left: x, top: y - height / 2, width, minHeight: height }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-white/48">
          {match.round}
        </span>
        {match.locked ? <span className="size-2 rounded-full bg-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.8)]" /> : null}
      </div>
      <div className="space-y-2">
        <ParticipantRow name={match.home} />
        <div className="h-px bg-white/10" />
        <ParticipantRow name={match.away} />
      </div>
    </article>
  );
}

function connectPair(
  side: "left" | "right",
  prevX: number,
  nextX: number,
  prevY1: number,
  prevY2: number,
  nextY: number,
) {
  if (side === "left") {
    const prevEdge = prevX + cardWidth;
    const nextEdge = nextX;
    const midX = (prevEdge + nextEdge) / 2;

    return `M ${prevEdge} ${prevY1} H ${midX} V ${prevY2} H ${prevEdge} M ${midX} ${nextY} H ${nextEdge}`;
  }

  const prevEdge = prevX;
  const nextEdge = nextX + cardWidth;
  const midX = (prevEdge + nextEdge) / 2;

  return `M ${prevEdge} ${prevY1} H ${midX} V ${prevY2} H ${prevEdge} M ${midX} ${nextY} H ${nextEdge}`;
}

function ConnectorLines() {
  const paths: Array<{ d: string; dashed?: boolean }> = [];

  for (const side of ["left", "right"] as const) {
    const xs = xPositions[side];
    const r32 = yPositions.r32;
    const r16 = yPositions.r16;
    const qf = yPositions.qf;
    const sf = yPositions.sf;

    for (let index = 0; index < 4; index += 1) {
      paths.push({ d: connectPair(side, xs.r32, xs.r16, r32[index * 2], r32[index * 2 + 1], r16[index]) });
    }

    for (let index = 0; index < 2; index += 1) {
      paths.push({ d: connectPair(side, xs.r16, xs.qf, r16[index * 2], r16[index * 2 + 1], qf[index]) });
    }

    paths.push({ d: connectPair(side, xs.qf, xs.sf, qf[0], qf[1], sf[0]) });
  }

  const leftSfEdge = xPositions.left.sf + cardWidth;
  const rightSfEdge = xPositions.right.sf;
  const finalLeft = xPositions.final;
  const finalRight = xPositions.final + finalWidth;
  const finalY = yPositions.final;
  const thirdY = yPositions.thirdPlace;
  const sfY = yPositions.sf[0];
  const leftFinalMid = (leftSfEdge + finalLeft) / 2;
  const rightFinalMid = (rightSfEdge + finalRight) / 2;

  paths.push({ d: `M ${leftSfEdge} ${sfY} H ${leftFinalMid} V ${finalY} H ${finalLeft}` });
  paths.push({ d: `M ${rightSfEdge} ${sfY} H ${rightFinalMid} V ${finalY} H ${finalRight}` });
  paths.push({ d: `M ${leftSfEdge} ${sfY + 42} H ${leftFinalMid} V ${thirdY} H ${finalLeft}`, dashed: true });
  paths.push({ d: `M ${rightSfEdge} ${sfY + 42} H ${rightFinalMid} V ${thirdY} H ${finalRight}`, dashed: true });

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 z-0 h-full w-full text-white/72"
      preserveAspectRatio="none"
      viewBox={`0 0 ${boardWidth} ${boardHeight}`}
    >
      <defs>
        <linearGradient id="bracketLine" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
          <stop offset="50%" stopColor="rgba(250,204,21,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.34)" />
        </linearGradient>
      </defs>
      {paths.map((path, index) => (
        <path
          key={`${path.d}-${index}`}
          d={path.d}
          fill="none"
          stroke="url(#bracketLine)"
          strokeDasharray={path.dashed ? "8 10" : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      ))}
    </svg>
  );
}

function RoundLabel({ x, children }: { x: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute top-5 z-10 text-center text-[10px] font-black uppercase tracking-[0.16em] text-white/54"
      style={{ left: x, width: cardWidth }}
    >
      {children}
    </div>
  );
}

function renderRound(
  matches: BracketMatch[],
  x: number,
  yValues: number[],
) {
  return matches.map((match, index) => (
    <MatchNode key={match.id} match={match} x={x} y={yValues[index]} />
  ));
}

export function WorldCupBracket({
  slots,
  qualified,
  hasApiGroups,
}: {
  slots: KnockoutSlot[];
  qualified: QualifiedTeam[];
  hasApiGroups: boolean;
}) {
  const bracket = buildBracket(slots);
  const frameRef = useRef<HTMLDivElement>(null);
  const [boardScale, setBoardScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return;
    }

    const updateScale = () => {
      setBoardScale(Math.min(1, frame.clientWidth / boardWidth));
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-8 w-full min-w-0 space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <GlassCard className="border-emerald-300/20 bg-emerald-400/10">
          <Badge tone="green">Formato 2026</Badge>
          <p className="mt-3 text-2xl font-black">32 clasificados</p>
          <p className="mt-1 text-sm text-white/58">Primeros, segundos y 8 mejores terceros.</p>
        </GlassCard>
        <GlassCard className="border-sky-300/20 bg-sky-400/10">
          <Badge tone="blue">Datos</Badge>
          <p className="mt-3 text-2xl font-black">{qualified.length} confirmados</p>
          <p className="mt-1 text-sm text-white/58">
            {qualified.length > 0
              ? "Clasificados definidos por las tablas de grupos."
              : hasApiGroups
                ? "Aun no hay clasificados confirmados."
                : "Mostrando puestos por definir."}
          </p>
        </GlassCard>
        <GlassCard className="border-amber-300/20 bg-amber-300/10">
          <Badge tone="gold">Camino</Badge>
          <p className="mt-3 text-2xl font-black">5 rondas</p>
          <p className="mt-1 text-sm text-white/58">De dieciseisavos a la final y tercer puesto.</p>
        </GlassCard>
      </div>

      <GlassCard className="border-white/10 bg-white/[0.06] p-4">
        <div className="grid gap-3 text-center text-sm text-white/70 md:grid-cols-3 md:items-center">
          <div className="flex justify-center">
            <span className="font-black text-white">Tarjeta = partido.</span>
          </div>
          <div className="flex justify-center">
            <span className="font-black text-white">Bandera + sigla = clasificado.</span>
          </div>
          <div className="flex justify-center">
            <span className="font-black text-white">? = pendiente.</span>
          </div>
        </div>
      </GlassCard>

      <div
        ref={frameRef}
        className="w-full max-w-[1500px] overflow-hidden pb-3"
        style={{ height: boardHeight * boardScale + 12 }}
      >
        <div
          className="world-cup-bracket-board relative overflow-hidden rounded-[28px] border border-white/12 shadow-2xl shadow-black/40"
          style={{
            width: boardWidth,
            height: boardHeight,
            transform: `scale(${boardScale})`,
            transformOrigin: "top left",
          }}
        >
          <ConnectorLines />

          <RoundLabel x={xPositions.left.r32}>Dieciseisavos</RoundLabel>
          <RoundLabel x={xPositions.left.r16}>Octavos</RoundLabel>
          <RoundLabel x={xPositions.left.qf}>Cuartos</RoundLabel>
          <RoundLabel x={xPositions.left.sf}>Semis</RoundLabel>
          <RoundLabel x={xPositions.right.sf}>Semis</RoundLabel>
          <RoundLabel x={xPositions.right.qf}>Cuartos</RoundLabel>
          <RoundLabel x={xPositions.right.r16}>Octavos</RoundLabel>
          <RoundLabel x={xPositions.right.r32}>Dieciseisavos</RoundLabel>

          {renderRound(bracket.left.r32, xPositions.left.r32, yPositions.r32)}
          {renderRound(bracket.left.r16, xPositions.left.r16, yPositions.r16)}
          {renderRound(bracket.left.qf, xPositions.left.qf, yPositions.qf)}
          {renderRound(bracket.left.sf, xPositions.left.sf, yPositions.sf)}

          {renderRound(bracket.right.r32, xPositions.right.r32, yPositions.r32)}
          {renderRound(bracket.right.r16, xPositions.right.r16, yPositions.r16)}
          {renderRound(bracket.right.qf, xPositions.right.qf, yPositions.qf)}
          {renderRound(bracket.right.sf, xPositions.right.sf, yPositions.sf)}

          <MatchNode
            featured
            match={bracket.final}
            x={xPositions.final}
            y={yPositions.final}
          />
          <MatchNode
            featured
            match={bracket.thirdPlace}
            x={xPositions.final}
            y={yPositions.thirdPlace}
          />

          <div className="absolute left-[642px] top-[536px] z-[4] grid w-[216px] place-items-center text-center">
            <div className="relative grid size-32 place-items-center rounded-full border border-amber-200/30 bg-slate-950/76 shadow-[0_0_90px_rgba(250,204,21,0.2)] backdrop-blur">
              <Sparkles className="absolute left-5 top-5 size-4 text-emerald-200" />
              <Trophy className="size-16 text-amber-200 drop-shadow-[0_0_22px_rgba(250,204,21,0.45)]" />
              <Medal className="absolute bottom-5 right-5 size-4 text-sky-200" />
            </div>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.24em] text-amber-100">Camino final</p>
            <div className="mt-3 flex overflow-hidden rounded-full border border-white/15">
              <span className="h-2 w-10 bg-emerald-400" />
              <span className="h-2 w-10 bg-sky-400" />
              <span className="h-2 w-10 bg-rose-400" />
              <span className="h-2 w-10 bg-amber-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
