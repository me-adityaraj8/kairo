/**
 * The six companions a player can choose from at signup.
 *
 * Each is drawn as layered SVG (components/game/Creature.tsx) rather than an
 * image, so the parts can be animated independently — ears twitch, eyes blink,
 * the body squashes and stretches. Adding a seventh is a palette here plus a
 * geometry case there.
 */

export type SpeciesId = "fox" | "owl" | "dragon" | "cat" | "rabbit" | "deer";

export type Palette = {
  /** main coat */
  coat: string;
  /** shadowed side of the coat */
  coatDeep: string;
  /** belly, muzzle, inner ears */
  belly: string;
  /** horns, paws, markings */
  accent: string;
  /** rim light and aura */
  glow: string;
};

export type Species = {
  id: SpeciesId;
  name: string;
  title: string;
  blurb: string;
  palette: Palette;
};

export const SPECIES: Species[] = [
  {
    id: "fox",
    name: "Pip",
    title: "The Guardian",
    blurb: "Warm, watchful, always a step ahead",
    palette: {
      coat: "#f2843c",
      coatDeep: "#c25a1f",
      belly: "#fdf1e3",
      accent: "#8a3c12",
      glow: "#ffb02e",
    },
  },
  {
    id: "owl",
    name: "Lumi",
    title: "The Sage",
    blurb: "Quiet, precise, sees the whole board",
    palette: {
      coat: "#9fb6e8",
      coatDeep: "#5f77ad",
      belly: "#f2f6ff",
      accent: "#3a4a73",
      glow: "#4c9ffe",
    },
  },
  {
    id: "dragon",
    name: "Zyro",
    title: "The Explorer",
    blurb: "Restless, bold, allergic to sitting still",
    palette: {
      coat: "#4fc98a",
      coatDeep: "#2a8a5c",
      belly: "#e9fbf1",
      accent: "#17603d",
      glow: "#4ce6cf",
    },
  },
  {
    id: "cat",
    name: "Nox",
    title: "The Wanderer",
    blurb: "Aloof until it matters, then all in",
    palette: {
      coat: "#4b4363",
      coatDeep: "#2c2740",
      belly: "#cfc6e6",
      accent: "#1a1626",
      glow: "#b15cff",
    },
  },
  {
    id: "rabbit",
    name: "Mochi",
    title: "The Healer",
    blurb: "Gentle, patient, impossible to discourage",
    palette: {
      coat: "#f6eef2",
      coatDeep: "#d6c2cd",
      belly: "#fffdfe",
      accent: "#c98aa6",
      glow: "#ff9ec4",
    },
  },
  {
    id: "deer",
    name: "Eira",
    title: "The Keeper",
    blurb: "Steady, rooted, remembers everything",
    palette: {
      coat: "#c98a5a",
      coatDeep: "#96603a",
      belly: "#f7e7d6",
      accent: "#6b4326",
      glow: "#ffd469",
    },
  },
];

export const DEFAULT_SPECIES: SpeciesId = "fox";

const BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

/** Falls back to the default rather than throwing, so an unknown id in the
 *  database (an old row, a hand-edit) still renders something. */
export function speciesOf(id: string | null | undefined): Species {
  return BY_ID.get((id ?? "") as SpeciesId) ?? BY_ID.get(DEFAULT_SPECIES)!;
}

export const isSpeciesId = (v: unknown): v is SpeciesId =>
  typeof v === "string" && BY_ID.has(v as SpeciesId);
