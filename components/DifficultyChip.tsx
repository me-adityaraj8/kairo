import { Difficulty } from "@/lib/types";

const styles: Record<Difficulty, string> = {
  EASY: "border-muted text-muted",
  NORMAL: "border-xp text-xp",
  HARD: "border-gold text-gold",
  EPIC: "border-danger text-danger",
};

export default function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`border-2 px-2 py-1 font-pixel text-[8px] uppercase tracking-wider ${styles[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}
