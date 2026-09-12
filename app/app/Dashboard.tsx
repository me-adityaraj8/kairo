"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import PixelPanel from "@/components/PixelPanel";
import PixelButton from "@/components/PixelButton";
import XPBar from "@/components/XPBar";
import DifficultyChip from "@/components/DifficultyChip";
import GoldCounter from "@/components/GoldCounter";
import Skeleton from "@/components/Skeleton";
import Toast from "@/components/Toast";
import LevelUpOverlay from "@/components/LevelUpOverlay";
import NewQuestModal from "@/components/NewQuestModal";
import { Character, CompleteResult, Difficulty, Quest } from "@/lib/types";

export default function Dashboard() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());

  const newQuestButtonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    const [charRes, questRes] = await Promise.all([
      fetch("/api/character"),
      fetch("/api/quests"),
    ]);
    if (charRes.status === 401 || questRes.status === 401) {
      window.location.href = "/login?from=/app";
      return;
    }
    setCharacter(await charRes.json());
    setQuests((await questRes.json()).quests);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createQuest(input: { title: string; attributeId: string; difficulty: Difficulty }) {
    const res = await fetch("/api/quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("create failed");
    const { quest } = await res.json();
    setQuests((prev) => (prev ? [quest, ...prev] : [quest]));
    setAnnouncement(`Quest posted: ${quest.title}`);
  }

  async function completeQuest(quest: Quest) {
    if (inFlight.has(quest.id)) return;
    setInFlight((prev) => new Set(prev).add(quest.id));

    const prevQuests = quests;
    const prevCharacter = character;

    setQuests((prev) =>
      prev ? prev.map((q) => (q.id === quest.id ? { ...q, done: true } : q)) : prev
    );

    try {
      const res = await fetch(`/api/quests/${quest.id}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("complete failed");

      const result: CompleteResult = await res.json();

      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              user: { ...prev.user, ...result.user, streak: result.streak },
              attributes: prev.attributes.map((a) =>
                a.id === result.attribute.id ? result.attribute : a
              ),
            }
          : prev
      );

      setAnnouncement(
        `Gained ${result.xpGained} XP and ${result.goldGained} gold. ${result.attribute.name} is now level ${result.attribute.level}.`
      );

      if (result.leveledUp) setLevelUp(result.user.level);
    } catch {
      setQuests(prevQuests);
      setCharacter(prevCharacter);
      setToast("Connection lost - quest not saved");
    } finally {
      setInFlight((prev) => {
        const next = new Set(prev);
        next.delete(quest.id);
        return next;
      });
    }
  }

  async function deleteQuest(quest: Quest) {
    const prevQuests = quests;
    setQuests((prev) => (prev ? prev.filter((q) => q.id !== quest.id) : prev));

    const res = await fetch(`/api/quests/${quest.id}`, { method: "DELETE" });
    if (!res.ok) {
      setQuests(prevQuests);
      setToast("Could not abandon that quest");
      return;
    }
    setAnnouncement(`Quest abandoned: ${quest.title}`);
  }

  const active = quests?.filter((q) => !q.done) ?? [];
  const completed = quests?.filter((q) => q.done) ?? [];

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-pixel text-sm text-gold sm:text-base">Life RPG</h1>
        <nav className="flex items-center gap-3">
          <Link href="/app/shop" className="font-pixel text-[10px] text-muted underline hover:text-text">
            Tavern Shop
          </Link>
          <PixelButton variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign Out
          </PixelButton>
        </nav>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section aria-label="Character" className="flex flex-col gap-4">
          {!character ? (
            <>
              <Skeleton className="h-40" />
              <Skeleton className="h-52" />
            </>
          ) : (
            <>
              <PixelPanel title="Adventurer">
                <p className="font-mono text-sm text-text">{character.user.displayName}</p>
                <p className="mt-1 font-pixel text-[10px] text-muted">
                  Level {character.user.level}
                </p>
                <div className="mt-3">
                  <XPBar
                    value={character.user.xp}
                    max={character.user.xpToNext}
                    label={`Experience: ${character.user.xp} of ${character.user.xpToNext}`}
                  />
                  <p className="mt-1 font-mono text-xs text-muted">
                    {character.user.xp} / {character.user.xpToNext} XP
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">
                    Gold <GoldCounter value={character.user.gold} />
                  </span>
                  <span className="font-mono text-xs text-muted">
                    Streak{" "}
                    <span className="font-pixel text-xs text-danger">
                      {character.user.streak}
                    </span>
                  </span>
                </div>
                {character.owned.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t-[3px] border-border pt-3">
                    {character.owned.map((item) => (
                      <span key={item.slug} title={item.slug} className="text-lg">
                        {item.payload}
                      </span>
                    ))}
                  </div>
                )}
              </PixelPanel>

              <PixelPanel title="Attributes">
                <ul className="flex flex-col gap-3">
                  {character.attributes.map((a) => (
                    <li key={a.id}>
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-xs text-text">{a.name}</span>
                        <span className="font-pixel text-[10px] text-gold">Lv {a.level}</span>
                      </div>
                      <div className="mt-1">
                        <XPBar
                          value={a.xp}
                          max={a.xpToNext}
                          color="var(--gold)"
                          label={`${a.name}: ${a.xp} of ${a.xpToNext} XP`}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </PixelPanel>
            </>
          )}
        </section>

        <section aria-label="Quest log" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-xs text-text">Quest Log</h2>
            <PixelButton ref={newQuestButtonRef} onClick={() => setModalOpen(true)}>
              Post New Quest
            </PixelButton>
          </div>

          {!quests ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : quests.length === 0 ? (
            <PixelPanel>
              <p className="text-center font-mono text-sm text-muted">
                Your quest log is empty. Post your first.
              </p>
            </PixelPanel>
          ) : (
            <>
              <PixelPanel title={`Active (${active.length})`}>
                {active.length === 0 ? (
                  <p className="font-mono text-xs text-muted">No active quests.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {active.map((quest) => (
                      <li
                        key={quest.id}
                        className="flex flex-wrap items-center gap-3 border-[3px] border-border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-sm text-text">{quest.title}</p>
                          <p className="mt-1 font-mono text-xs text-muted">{quest.attributeName}</p>
                        </div>
                        <DifficultyChip difficulty={quest.difficulty} />
                        <PixelButton
                          onClick={() => completeQuest(quest)}
                          disabled={inFlight.has(quest.id)}
                        >
                          {inFlight.has(quest.id) ? "..." : "Complete"}
                        </PixelButton>
                        <PixelButton
                          variant="danger"
                          aria-label={`Abandon quest: ${quest.title}`}
                          onClick={() => deleteQuest(quest)}
                        >
                          X
                        </PixelButton>
                      </li>
                    ))}
                  </ul>
                )}
              </PixelPanel>

              {completed.length > 0 && (
                <PixelPanel title={`Completed (${completed.length})`}>
                  <ul className="flex flex-col gap-2">
                    {completed.map((quest) => (
                      <li
                        key={quest.id}
                        className="flex items-center gap-3 border-[3px] border-border p-3 opacity-50"
                      >
                        <span className="min-w-0 flex-1 truncate font-mono text-sm line-through">
                          {quest.title}
                        </span>
                        <DifficultyChip difficulty={quest.difficulty} />
                        <PixelButton
                          variant="danger"
                          aria-label={`Remove quest: ${quest.title}`}
                          onClick={() => deleteQuest(quest)}
                        >
                          X
                        </PixelButton>
                      </li>
                    ))}
                  </ul>
                </PixelPanel>
              )}
            </>
          )}
        </section>
      </div>

      {modalOpen && character && (
        <NewQuestModal
          attributes={character.attributes}
          onCreate={createQuest}
          onClose={() => {
            setModalOpen(false);
            newQuestButtonRef.current?.focus();
          }}
        />
      )}

      <LevelUpOverlay level={levelUp} onDismiss={() => setLevelUp(null)} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
