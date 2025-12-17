import React, { useState, useEffect } from "react";
import Game from "./Game.jsx";
import "./index.css";

const CHARACTERS = [
  {
    id: "neon-comet",
    name: "Neon Comet",
    subtitle: "Combo hunter",
  },
  {
    id: "star-tetra",
    name: "Star Tetra",
    subtitle: "Shielded first hit",
  },
  {
    id: "ghost-koi",
    name: "Ghost Koi",
    subtitle: "Gentle hazards",
  },
];

const DIFFICULTIES = [
  {
    id: "calm",
    label: "Calm Reef",
    subtitle: "Fewer hazards, slower pace",
  },
  {
    id: "current",
    label: "Open Current",
    subtitle: "Balanced default",
  },
  {
    id: "storm",
    label: "Storm Trench",
    subtitle: "Fast & busy",
  },
];

const MISSIONS = [
  {
    id: "collect20",
    label: "Collect 20 tokens",
    subtitle: "Token Collector",
  },
  {
    id: "survive45",
    label: "Survive 45 seconds",
    subtitle: "Deep Breath",
  },
  {
    id: "noHazard",
    label: "Avoid all hazards",
    subtitle: "Flawless Run",
  },
];

export default function App() {
  const [selectedCharacter, setSelectedCharacter] = useState("neon-comet");
  const [difficulty, setDifficulty] = useState(() => {
    if (typeof window === "undefined") return "current";
    const stored = window.localStorage.getItem("undersea_runner_difficulty");
    return stored === "calm" || stored === "storm" ? stored : "current";
  });

  const [safeMode, setSafeMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("undersea_runner_safeMode") === "true";
  });

  const [mission, setMission] = useState(() => {
    if (typeof window === "undefined") return "collect20";
    const stored = window.localStorage.getItem("undersea_runner_mission");
    return MISSIONS.some((m) => m.id === stored) ? stored : "collect20";
  });

  // keep localStorage in sync when user changes choices
  useEffect(() => {
    window.localStorage.setItem("undersea_runner_difficulty", difficulty);
  }, [difficulty]);

  useEffect(() => {
    window.localStorage.setItem(
      "undersea_runner_safeMode",
      safeMode ? "true" : "false"
    );
  }, [safeMode]);

  useEffect(() => {
    window.localStorage.setItem("undersea_runner_mission", mission);
  }, [mission]);

  const handleToggleSafeMode = () => {
    setSafeMode((prev) => !prev);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand-mark">
          <span className="brand-dot" />
          <span className="brand-text">Undersea Runner</span>
        </div>
        <div className="accent-pill">FISH Edition</div>
      </header>

      <main className="app-main">
        <section className="shell-panel">
          <div className="shell-header">
            <h1>Swim Through the Deep</h1>
            <p>
              Guide your fish through a glowing underwater lane, pick up
              tokens, and dodge jellyfish and sharks. Your best scores are saved
              locally in this browser for both regular and Safe Reef modes.
            </p>
          </div>

          {/* Character picker */}
          <div className="character-row">
            <span className="character-label">Choose your fish</span>
            <div className="character-options">
              {CHARACTERS.map((ch) => (
                <button
                  key={ch.id}
                  className={
                    "character-chip" +
                    (selectedCharacter === ch.id ? " is-active" : "")
                  }
                  onClick={() => setSelectedCharacter(ch.id)}
                >
                  <span className={`character-swatch ${ch.id}`} />
                  <span className="character-chip-text">
                    <span className="character-chip-name">{ch.name}</span>
                    <span className="character-chip-sub">{ch.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty picker */}
          <div className="mode-row">
            <span className="mode-label">Tides difficulty</span>
            <div className="mode-options">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={
                    "mode-chip" + (difficulty === d.id ? " is-active" : "")
                  }
                  onClick={() => setDifficulty(d.id)}
                >
                  <span className="mode-chip-main">{d.label}</span>
                  <span className="mode-chip-sub">{d.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mission picker */}
          <div className="mission-row">
            <span className="mission-label">Reef mission</span>
            <div className="mission-options">
              {MISSIONS.map((m) => (
                <button
                  key={m.id}
                  className={
                    "mission-chip" + (mission === m.id ? " is-active" : "")
                  }
                  onClick={() => setMission(m.id)}
                >
                  <span className="mission-chip-main">{m.label}</span>
                  <span className="mission-chip-sub">{m.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          <Game
            key={`${selectedCharacter}|${difficulty}|${safeMode}|${mission}`}
            character={selectedCharacter}
            difficulty={difficulty}
            safeMode={safeMode}
            mission={mission}
          />

          <footer className="shell-footer">
            <p>
              <span className="kbd">Space</span> /{" "}
              <span className="kbd">↑</span> to swim up.{" "}
              <span className="kbd">↓</span> to glide down. On touch devices,
              tap the top or bottom half of the game area to move. In regular
              mode, hazards subtract points; in{" "}
              <span className="accent">Safe Reef</span> mode, hazards are visual
              only.
            </p>
            <button
              type="button"
              className={"safe-toggle" + (safeMode ? " is-active" : "")}
              onClick={handleToggleSafeMode}
            >
              <span className="safe-toggle-dot" />
              Safe Reef Mode
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}
