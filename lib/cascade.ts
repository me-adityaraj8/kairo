import type { GameEvent } from "@/components/game/EventFeed";

export type ServerEvent =
  | { type: "CHALLENGE"; key: string; title: string; gold: number }
  | { type: "ACHIEVEMENT"; key: string; title: string; icon: string; rarity: string }
  | { type: "CHEST"; rarity: string; source: string }
  | { type: "COMPANION_EVOLVED"; stage: string };

const TINTS: Record<string, string> = {
  COMMON: "#93a4bd",
  RARE: "#4c9ffe",
  EPIC: "#b15cff",
  LEGENDARY: "#ffb02e",
};

let nextId = 1;

/** Turns server cascade events into feed toasts. */
export function toFeed(events: ServerEvent[]): GameEvent[] {
  return events.map((e) => {
    switch (e.type) {
      case "ACHIEVEMENT":
        return {
          id: nextId++,
          icon: e.icon,
          text: `Achievement: ${e.title}`,
          tint: TINTS[e.rarity] ?? "#ffc542",
        };
      case "CHALLENGE":
        return { id: nextId++, icon: "✅", text: `${e.title} · +${e.gold} gold`, tint: "#4ce6cf" };
      case "CHEST":
        return {
          id: nextId++,
          icon: "🎁",
          text: `${e.rarity[0]}${e.rarity.slice(1).toLowerCase()} chest earned`,
          tint: TINTS[e.rarity] ?? "#ffc542",
        };
      case "COMPANION_EVOLVED":
        return { id: nextId++, icon: "🐾", text: `Companion evolved to ${e.stage}`, tint: "#b15cff" };
    }
  });
}

export const feedItem = (icon: string, text: string, tint: string): GameEvent => ({
  id: nextId++,
  icon,
  text,
  tint,
});
