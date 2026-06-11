export const WORLD_CUP_2026_SLUG = "fifa-world-cup-2026";
export const WORLD_CUP_2026_NAME = "FIFA World Cup 2026";

export type OfficialGroupTeam = {
  name: string;
  isPlaceholder?: boolean;
  placeholderType?: string;
};

export type OfficialGroup = {
  name: string;
  teams: OfficialGroupTeam[];
};

export const officialGroups2026: OfficialGroup[] = [
  {
    name: "A",
    teams: [
      { name: "Mexico" },
      { name: "South Africa" },
      { name: "South Korea" },
      { name: "Czechia" },
    ],
  },
  {
    name: "B",
    teams: [
      { name: "Canada" },
      { name: "Bosnia and Herzegovina" },
      { name: "Qatar" },
      { name: "Switzerland" },
    ],
  },
  {
    name: "C",
    teams: [
      { name: "Brazil" },
      { name: "Morocco" },
      { name: "Haiti" },
      { name: "Scotland" },
    ],
  },
  {
    name: "D",
    teams: [
      { name: "United States" },
      { name: "Paraguay" },
      { name: "Australia" },
      { name: "Turkey" },
    ],
  },
  {
    name: "E",
    teams: [
      { name: "Germany" },
      { name: "Curaçao" },
      { name: "Côte d’Ivoire" },
      { name: "Ecuador" },
    ],
  },
  {
    name: "F",
    teams: [
      { name: "Netherlands" },
      { name: "Japan" },
      { name: "Sweden" },
      { name: "Tunisia" },
    ],
  },
  {
    name: "G",
    teams: [
      { name: "Belgium" },
      { name: "Egypt" },
      { name: "Iran" },
      { name: "New Zealand" },
    ],
  },
  {
    name: "H",
    teams: [
      { name: "Spain" },
      { name: "Cape Verde" },
      { name: "Saudi Arabia" },
      { name: "Uruguay" },
    ],
  },
  {
    name: "I",
    teams: [
      { name: "France" },
      { name: "Senegal" },
      { name: "Iraq" },
      { name: "Norway" },
    ],
  },
  {
    name: "J",
    teams: [
      { name: "Argentina" },
      { name: "Algeria" },
      { name: "Austria" },
      { name: "Jordan" },
    ],
  },
  {
    name: "K",
    teams: [
      { name: "Portugal" },
      { name: "Democratic Republic of the Congo" },
      { name: "Uzbekistan" },
      { name: "Colombia" },
    ],
  },
  {
    name: "L",
    teams: [
      { name: "England" },
      { name: "Croatia" },
      { name: "Ghana" },
      { name: "Panama" },
    ],
  },
];

const aliases = new Map<string, string>([
  ["usa", "United States"],
  ["united states", "United States"],
  ["south korea", "South Korea"],
  ["korea republic", "South Korea"],
  ["ivory coast", "Côte d’Ivoire"],
  ["cote d'ivoire", "Côte d’Ivoire"],
  ["côte d'ivoire", "Côte d’Ivoire"],
  ["côte d’ivoire", "Côte d’Ivoire"],
  ["curacao", "Curaçao"],
  ["chequia", "Czechia"],
  ["czech republic", "Czechia"],
  ["bosnia", "Bosnia and Herzegovina"],
  ["bosnia-herzegovina", "Bosnia and Herzegovina"],
  ["bosnia & herzegovina", "Bosnia and Herzegovina"],
  ["bosnia y herzegovina", "Bosnia and Herzegovina"],
  ["turkiye", "Turkey"],
  ["turquía", "Turkey"],
  ["turquia", "Turkey"],
  ["suecia", "Sweden"],
  ["túnez", "Tunisia"],
  ["tunez", "Tunisia"],
  ["irak", "Iraq"],
  ["republica democratica del congo", "Democratic Republic of the Congo"],
  ["república democrática del congo", "Democratic Republic of the Congo"],
  ["democratic republic of congo", "Democratic Republic of the Congo"],
  ["dr congo", "Democratic Republic of the Congo"],
  ["congo dr", "Democratic Republic of the Congo"],
]);

export function canonicalTeamName(name: string) {
  const normalized = name.trim().toLowerCase();
  return aliases.get(normalized) ?? name.trim();
}

export function groupForTeamName(name: string) {
  const canonical = canonicalTeamName(name);

  return officialGroups2026.find((group) =>
    group.teams.some((team) => canonicalTeamName(team.name) === canonical),
  );
}
