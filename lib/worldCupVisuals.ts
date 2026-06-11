import type { StaticImageData } from "next/image";
import trophyVisual from "@/imagenesMundial/copa del mundo mejorada.jpg";
import stadiumVisual from "@/imagenesMundial/estadio epico.jpg";
import playersVisual from "@/imagenesMundial/jugadores.jpg";
import posterVisual from "@/imagenesMundial/post.jpg";

export const worldCupVisuals = {
  trophy: {
    src: trophyVisual,
    alt: "Trofeo de la Copa Mundial 2026 con banderas de Mexico, Canada y Estados Unidos.",
    focus: "object-center",
  },
  stadium: {
    src: stadiumVisual,
    alt: "Estadio mundialista iluminado con banderas internacionales.",
    focus: "object-center",
  },
  players: {
    src: playersVisual,
    alt: "Jugadores y aficion mundialista rodeando el trofeo.",
    focus: "object-center",
  },
  poster: {
    src: posterVisual,
    alt: "Poster mundialista con futbolistas internacionales.",
    focus: "object-center",
  },
} satisfies Record<string, { src: StaticImageData; alt: string; focus: string }>;

export type WorldCupVisualKey = keyof typeof worldCupVisuals;
