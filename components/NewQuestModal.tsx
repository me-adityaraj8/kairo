"use client";

import { useEffect, useRef, useState } from "react";
import PixelButton from "./PixelButton";
import PixelInput from "./PixelInput";
import { CharacterAttribute, Difficulty } from "@/lib/types";

const DIFFICULTIES: Difficulty[] = ["EASY", "NORMAL", "HARD", "EPIC"];

export default function NewQuestModal({
  attributes,
  onClose,
  onCreate,
}: {
  attributes: CharacterAttribute[];
  onClose: () => void;
  onCreate: (input: { title: string; attributeId: string; difficulty: Difficulty }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [attributeId, setAttributeId] = useState(attributes[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Every quest needs a name");
      return;
    }
    setPending(true);
    try {
      await onCreate({ title: title.trim(), attributeId, difficulty });
      onClose();
    } catch {
      setError("Could not post the quest");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/80 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-quest-title"
        className="w-full max-w-md border-[3px] border-border bg-panel"
      >
        <div className="border-b-[3px] border-border px-4 py-3">
          <h2 id="new-quest-title" className="font-pixel text-[10px] uppercase tracking-wider text-gold">
            Post New Quest
          </h2>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4" noValidate>
          <PixelInput
            ref={firstFieldRef}
            label="Quest title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            error={error}
            maxLength={120}
            placeholder="Slay the inbox dragon"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="quest-attribute" className="font-mono text-xs text-muted">
              Attribute
            </label>
            <select
              id="quest-attribute"
              value={attributeId}
              onChange={(e) => setAttributeId(e.target.value)}
              className="border-[3px] border-border bg-bg px-3 py-2 font-mono text-sm text-text"
            >
              {attributes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="quest-difficulty" className="font-mono text-xs text-muted">
              Difficulty
            </label>
            <select
              id="quest-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="border-[3px] border-border bg-bg px-3 py-2 font-mono text-sm text-text"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <PixelButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" disabled={pending || !title.trim()}>
              {pending ? "Posting..." : "Post"}
            </PixelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
