"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Character, CompleteResult, Difficulty, Quest } from "@/lib/types";
import { riseIn, stagger } from "@/lib/motion";
import { ServerEvent, feedItem, toFeed } from "@/lib/cascade";
import { Mood } from "@/lib/companion";
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
import WorldBackground from "@/components/game/WorldBackground";
import AudioControls from "@/components/game/AudioControls";
import Companion, { CompanionState } from "@/components/game/Companion";
import ComboMeter from "@/components/game/ComboMeter";
import ChallengePanel, { Challenge } from "@/components/game/ChallengePanel";
import ChestCeremony, { ChestReward } from "@/components/game/ChestCeremony";
import EventFeed, { GameEvent } from "@/components/game/EventFeed";
import FocusMode from "@/components/game/FocusMode";
import SettingsPanel from "@/components/game/SettingsPanel";
import { ShortcutHelp, useShortcuts } from "@/components/game/Shortcuts";
import { useAudio } from "@/components/game/AudioProvider";
import { useCursor } from "@/components/game/CursorLayer";
import { useSettings } from "@/components/game/SettingsProvider";

type PendingChest = { id: string; rarity: string; source: string; label: string; tint: string };

export default function Dashboard() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [companion, setCompanion] = useState<CompanionState | null>(null);
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [chests, setChests] = useState<PendingChest[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpPayload | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());
  const [flights, setFlights] = useState<Flight[]>([]);
  const [attrFlash, setAttrFlash] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [reaction, setReaction] = useState<Mood | null>(null);
  const [openingChest, setOpeningChest] = useState(false);
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [chestOpen, setChestOpen] = useState<PendingChest | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const newQuestButtonRef = useRef<HTMLButtonElement>(null);
  const goldAnchor = useRef<HTMLDivElement>(null);
  const xpAnchor = useRef<HTMLDivElement>(null);
  const flightId = useRef(0);
  const { play } = useAudio();
  const { burst } = useCursor();
  const { settings } = useSettings();

  useShortcuts({
    newQuest: () => setModalOpen(true),
    focus: () => setFocusOpen(true),
    chest: () => {
      if (chests.length) {
        setChestReward(null);
        setChestOpen(chests[0]);
      }
    },
    settings: () => setSettingsOpen(true),
    help: () => setHelpOpen((v) => !v),
  });

  const pushEvents = useCallback((incoming: GameEvent[]) => {
    if (!incoming.length) return;
    setEvents((prev) => [...prev, ...incoming]);
    incoming.forEach((e) => {
      setTimeout(() => setEvents((prev) => prev.filter((p) => p.id !== e.id)), 4200);
    });
  }, []);

  const react = useCallback((mood: Mood, ms = 2200) => {
    setReaction(mood);
    setTimeout(() => setReaction(null), ms);
  }, []);

  /** One request for the whole dashboard. */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      if (res.status === 401) {
        window.location.href = "/login?from=/app";
        return;
      }
      if (!res.ok) {
        setToast("Could not reach the realm");
        return;
      }

      const d = await res.json();
      if (!d?.user) {
        setToast("Could not load your character");
        return;
      }

      setCharacter({ user: d.user, attributes: d.attributes, owned: d.owned });
      setQuests(d.quests ?? []);
      setCompanion(d.companion ?? null);
      setChallenges(d.challenges ?? []);
      setChests(d.chests ?? []);
    } catch {
      setToast("Connection lost");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // arriving from the nav on another page: ?focus=1 opens the timer
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("focus") === "1") {
      setFocusOpen(true);
      window.history.replaceState({}, "", "/app");
    }
  }, []);

  /** Refresh the derived panels after a cascade, without touching quest state. */
  const refreshSideState = useCallback(() => {
    fetch("/api/state")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.user) return;
        setChallenges(d.challenges ?? []);
        setChests(d.chests ?? []);
        setCompanion(d.companion ?? null);
        setCharacter((prev) => (prev ? { ...prev, owned: d.owned ?? prev.owned } : prev));
      })
      .catch(() => {});
  }, []);

  async function createQuest(input: { title: string; attributeId: string; difficulty: Difficulty }) {
    const res = await fetch("/api/quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("create failed");
    const { quest } = await res.json();
    setQuests((prev) => (prev ? [quest, ...prev] : [quest]));
    react("EXCITED", 2000);
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

      const result: CompleteResult & {
        combo: { count: number; multiplier: number };
        events: ServerEvent[];
        pendingChests: number;
        companion: { stage: string; bond: number } | null;
      } = await res.json();

      if (origin) launchFlight(origin, result.xpGained, result.goldGained);

      play("questComplete");
      setTimeout(() => play("coin"), 260);

      // energy burst at the quest that was just completed
      burst(
        result.combo.multiplier >= 2 ? "gold" : "xp",
        origin ? { x: origin.left + origin.width / 2, y: origin.top + origin.height / 2 } : undefined
      );

      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                ...result.user,
                streak: result.streak,
                combo: result.combo,
              },
              attributes: prev.attributes.map((a) =>
                a.id === result.attribute.id ? result.attribute : a
              ),
            }
          : prev
      );

      setAttrFlash(result.attribute.id);
      setTimeout(() => setAttrFlash(null), 900);

      pushEvents([
        feedItem("✨", `+${result.xpGained} XP`, "#4ce6cf"),
        feedItem("🪙", `+${result.goldGained} gold`, "#ffc542"),
        ...toFeed(result.events),
      ]);

      if (result.combo.multiplier >= 2) {
        react("EXCITED");
        play("combo");
      } else {
        react("HAPPY", 1800);
      }

      if (result.events.some((e) => e.type === "ACHIEVEMENT")) play("achievement");
      if (result.events.some((e) => e.type === "COMPANION_EVOLVED")) react("STARSTRUCK", 3000);

      setAnnouncement(
        `Gained ${result.xpGained} XP and ${result.goldGained} gold. ${result.attribute.name} is now level ${result.attribute.level}.`
      );

      if (result.leveledUp) {
        setCelebrate(true);
        react("CELEBRATING", 3200);
        setTimeout(() => setCelebrate(false), 1000);
        setTimeout(() => play("levelup"), 620);
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

      refreshSideState();
    } catch {
      setQuests(prevQuests);
      setCharacter(prevCharacter);
      play("error");
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

  async function openChest() {
    if (!chestOpen) return;
    setOpeningChest(true);
    try {
      const res = await fetch(`/api/chests/${chestOpen.id}/open`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error ?? "Could not open the chest");
        setChestOpen(null);
        return;
      }
      play("reveal");
      setChestReward(data);
      burst(data.item?.rarity === "LEGENDARY" ? "gold" : "violet", {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      react(data.item?.rarity === "LEGENDARY" ? "STARSTRUCK" : "CELEBRATING", 3000);
      setCharacter((prev) =>
        prev ? { ...prev, user: { ...prev.user, gold: data.totalGold } } : prev
      );
      pushEvents([feedItem("🎁", data.item ? `Received ${data.item.name}` : `+${data.gold} gold`, chestOpen.tint)]);
      refreshSideState();
    } catch {
      play("error");
      setToast("Connection lost — chest not opened");
      setChestOpen(null);
    } finally {
      setOpeningChest(false);
    }
  }

  async function interactCompanion() {
    play("toggle");
    react("HAPPY", 1600);
    const res = await fetch("/api/companion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interact: true }),
    }).catch(() => null);
    if (res?.ok) setCompanion((await res.json()).companion);
  }

  const active = quests?.filter((q) => !q.done) ?? [];
  const completed = quests?.filter((q) => q.done) ?? [];
  const combo = character?.user?.combo ?? { count: 0, multiplier: 1 };

  return (
    <>
      <WorldBackground />
      <Ambient />
      <GameNav onFocus={() => setFocusOpen(true)} />

      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-28">
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-lg text-gold text-glow-gold">Kairo</h1>
          <div className="flex items-center gap-2.5">
            <ComboMeter count={combo.count} multiplier={combo.multiplier} />
            {chests.length > 0 && (
              <button
                onClick={() => {
                  setChestReward(null);
                  setChestOpen(chests[0]);
                  play("chestOpen");
                }}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-gold/40 bg-gold/12 text-base backdrop-blur transition-colors hover:bg-gold/20"
                aria-label={`${chests.length} unopened chest${chests.length > 1 ? "s" : ""}`}
              >
                <span aria-hidden="true">🎁</span>
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                  {chests.length}
                </span>
              </button>
            )}
            <button
              onClick={() => {
                setSettingsOpen(true);
                play("open");
              }}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-base backdrop-blur transition-colors hover:bg-white/[0.12]"
              aria-label="Open settings"
            >
              <span aria-hidden="true">⚙️</span>
            </button>
            <AudioControls />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
          <motion.section
            aria-label="Character"
            initial="hidden"
            animate="show"
            variants={stagger(0.08)}
            className="flex min-w-0 flex-col gap-4"
          >
            {!character ? (
              <>
                <Shimmer className="h-72" />
                <Shimmer className="h-40" />
              </>
            ) : (
              <>
                <motion.div variants={riseIn} className="panel overflow-hidden">
                  <CharacterStage
                    displayName={character.user.displayName}
                    level={character.user.level}
                    owned={character.owned}
                    celebrate={celebrate}
                    species={companion?.species}
                    mood={reaction ?? companion?.mood}
                    onInteract={companion ? interactCompanion : undefined}
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

                {companion && (
                  <motion.div variants={riseIn} className="panel p-4">
                    <Companion
                      state={companion}
                      reaction={reaction}
                      chaos={settings.chaos !== "off"}
                      onInteract={interactCompanion}
                    />
                  </motion.div>
                )}

                <motion.div variants={riseIn}>
                  <h2 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">
                    Attributes
                  </h2>
                  <AttributeOrbs attributes={character.attributes} flashId={attrFlash} />
                </motion.div>

                <motion.div variants={riseIn}>
                  <ChallengePanel challenges={challenges} />
                </motion.div>
              </>
            )}
          </motion.section>

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

      <FocusMode
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        onStarted={() => react("FOCUSED", 4000)}
        onFinished={(result) => {
          play("levelup");
          react("CELEBRATING", 3000);
          setCharacter((prev) =>
            prev ? { ...prev, user: { ...prev.user, ...result.user } } : prev
          );
          pushEvents([
            feedItem("🧘", `Focus complete · ${result.minutes}m`, "#4ce6cf"),
            feedItem("✨", `+${result.xpGained} XP`, "#4ce6cf"),
            ...toFeed(result.events as ServerEvent[]),
          ]);
          refreshSideState();
          setFocusOpen(false);
        }}
      />

      <ChestCeremony
        pending={chestOpen}
        reward={chestReward}
        busy={openingChest}
        onOpen={openChest}
        onClose={() => {
          setChestOpen(null);
          setChestReward(null);
          load();
        }}
      />

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {helpOpen && <ShortcutHelp onClose={() => setHelpOpen(false)} />}

      <EventFeed events={events} />
      <RewardFlight
        flights={flights}
        onDone={(id) => setFlights((prev) => prev.filter((f) => f.id !== id))}
      />
      <LevelUpSequence payload={levelUp} onDismiss={() => setLevelUp(null)} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
