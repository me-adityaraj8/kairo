"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Character, CompleteResult, Difficulty, Quest } from "@/lib/types";
import { riseIn, stagger } from "@/lib/motion";
import Ambient from "@/components/game/Ambient";
import GameNav from "@/components/game/GameNav";
import CharacterStage from "@/components/game/CharacterStage";
import HudBar from "@/components/game/HudBar";
import AttributeOrbs from "@/components/game/AttributeOrbs";
import QuestCard from "@/components/game/QuestCard";
import NewQuestModal from "@/components/game/NewQuestModal";
import LevelUpSequence, { LevelUpPayload } from "@/components/game/LevelUpSequence";
import RewardFlight, { Flight } from "@/components/game/RewardFlight";
import GameButton from "@/components/game/GameButton";
import Toast from "@/components/game/Toast";
import Shimmer from "@/components/game/Shimmer";

export default function Dashboard() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpPayload | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());
  const [flights, setFlights] = useState<Flight[]>([]);
  const [attrFlash, setAttrFlash] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const newQuestButtonRef = useRef<HTMLButtonElement>(null);
  const goldAnchor = useRef<HTMLDivElement>(null);
  const xpAnchor = useRef<HTMLDivElement>(null);
  const flightId = useRef(0);

  const load = useCallback(async () => {
    const [charRes, questRes] = await Promise.all([fetch("/api/character"), fetch("/api/quests")]);
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

  function launchFlight(origin: DOMRect, xp: number, gold: number) {
    const goldBox = goldAnchor.current?.getBoundingClientRect();
    const xpBox = xpAnchor.current?.getBoundingClientRect();
    if (!goldBox || !xpBox) return;

    const id = ++flightId.current;
    setFlights((prev) => [
      ...prev,
      {
        id,
        from: { x: origin.left + origin.width / 2, y: origin.top + origin.height / 2 },
        toGold: { x: goldBox.left + goldBox.width / 2, y: goldBox.top + goldBox.height / 2 },
        toXp: { x: xpBox.left + xpBox.width / 2, y: xpBox.top + xpBox.height / 2 },
        xp,
        gold,
      },
    ]);
  }

  async function completeQuest(quest: Quest, origin: DOMRect | null) {
    if (inFlight.has(quest.id)) return;
    setInFlight((prev) => new Set(prev).add(quest.id));

    const prevQuests = quests;
    const prevCharacter = character;

    setQuests((prev) => (prev ? prev.map((q) => (q.id === quest.id ? { ...q, done: true } : q)) : prev));

    try {
      const res = await fetch(`/api/quests/${quest.id}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("complete failed");

      const result: CompleteResult = await res.json();

      if (origin) launchFlight(origin, result.xpGained, result.goldGained);

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

      setAttrFlash(result.attribute.id);
      setTimeout(() => setAttrFlash(null), 900);

      setAnnouncement(
        `Gained ${result.xpGained} XP and ${result.goldGained} gold. ${result.attribute.name} is now level ${result.attribute.level}.`
      );

      if (result.leveledUp) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1000);
        setTimeout(
          () =>
            setLevelUp({
              level: result.user.level,
              attributeName: result.attribute.name,
              attributeLevel: result.attribute.level,
              gold: result.goldGained,
            }),
          650
        );
      }
    } catch {
      setQuests(prevQuests);
      setCharacter(prevCharacter);
      setToast("Connection lost — quest not saved");
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
    <>
      <Ambient />
      <GameNav />

      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-28">
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>

        <h1 className="sr-only">Kairo quest log</h1>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
          {/* character + hud */}
          <motion.section
            aria-label="Character"
            initial="hidden"
            animate="show"
            variants={stagger(0.08)}
            className="min-w-0"
          >
            {!character ? (
              <div className="flex flex-col gap-4">
                <Shimmer className="h-72" />
                <Shimmer className="h-40" />
              </div>
            ) : (
              <>
                <motion.div variants={riseIn} className="panel overflow-hidden">
                  <CharacterStage
                    displayName={character.user.displayName}
                    level={character.user.level}
                    owned={character.owned}
                    celebrate={celebrate}
                  />
                  <div className="border-t border-white/8 p-4">
                    <HudBar
                      level={character.user.level}
                      xp={character.user.xp}
                      xpToNext={character.user.xpToNext}
                      gold={character.user.gold}
                      streak={character.user.streak}
                      goldAnchorRef={goldAnchor}
                      xpAnchorRef={xpAnchor}
                    />
                  </div>
                </motion.div>

                <motion.div variants={riseIn} className="mt-4">
                  <h2 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">
                    Attributes
                  </h2>
                  <AttributeOrbs attributes={character.attributes} flashId={attrFlash} />
                </motion.div>
              </>
            )}
          </motion.section>

          {/* quests */}
          <section aria-label="Quest log" className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg text-text">Quests</h2>
              <GameButton ref={newQuestButtonRef} variant="gold" onClick={() => setModalOpen(true)}>
                + New Quest
              </GameButton>
            </div>

            {!quests ? (
              <div className="flex flex-col gap-3">
                <Shimmer className="h-28" />
                <Shimmer className="h-28" />
                <Shimmer className="h-28" />
              </div>
            ) : quests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="panel flex flex-col items-center gap-3 px-6 py-12 text-center"
              >
                <span aria-hidden="true" className="animate-float text-5xl">
                  🗺️
                </span>
                <p className="font-display text-base text-text">No quests yet</p>
                <p className="max-w-xs text-sm text-dim">
                  Post your first quest and start earning XP for the things you were going to do anyway.
                </p>
                <GameButton variant="gold" onClick={() => setModalOpen(true)} className="mt-1">
                  Post Your First Quest
                </GameButton>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">
                    Active · {active.length}
                  </p>
                  {active.length === 0 ? (
                    <div className="panel-flat px-4 py-6 text-center text-sm text-dim">
                      All quests cleared. Post another.
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      <AnimatePresence mode="popLayout">
                        {active.map((quest) => (
                          <QuestCard
                            key={quest.id}
                            quest={quest}
                            busy={inFlight.has(quest.id)}
                            onComplete={() => {
                              const el = document.getElementById(`quest-${quest.id}`);
                              completeQuest(quest, el?.getBoundingClientRect() ?? null);
                            }}
                            onDelete={() => deleteQuest(quest)}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>

                {completed.length > 0 && (
                  <div>
                    <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">
                      Completed · {completed.length}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {completed.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          busy={false}
                          onComplete={() => {}}
                          onDelete={() => deleteQuest(quest)}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
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

      <RewardFlight
        flights={flights}
        onDone={(id) => setFlights((prev) => prev.filter((f) => f.id !== id))}
      />
      <LevelUpSequence payload={levelUp} onDismiss={() => setLevelUp(null)} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
