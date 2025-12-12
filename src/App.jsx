import React, { useState } from "react";
import Game from "./Game.jsx";
import "./index.css";

const CHARACTERS = [
  {
    id: "neon-comet",
    name: "Neon Comet",
    subtitle: "Bright & bold",
  },
  {
    id: "star-tetra",
    name: "Star Tetra",
    subtitle: "Cool & quick",
  },
  {
    id: "ghost-koi",
    name: "Ghost Koi",
    subtitle: "Calm & lucky",
  },
];

export default function App() {
  const [selectedCharacter, setSelectedCharacter] = useState("neon-comet");

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
              Guide your swimmer through a glowing underwater lane, scoop up
              tokens, and dodge jellyfish and sharks. Your best score is saved
              locally in this browser.
            </p>
          </div>

          {/* Character picker */}
          <div className="character-row">
            <span className="character-label">Choose your swimmer</span>
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

          <Game key={selectedCharacter} character={selectedCharacter} />

          {/* <footer className="shell-footer">
            <p>
              <span className="kbd">Space</span> /{" "}
              <span className="kbd">↑</span> to swim up.{" "}
              <span className="kbd">↓</span> to glide down. Avoid glowing
              jellyfish and sharks &mdash; colliding with one costs{" "}
              <span className="accent">5 points</span>. Click{" "}
              <span className="accent">Reset</span> to start fresh.
            </p>
          </footer> */}
          <footer className="shell-footer">
            <p>
              <span className="kbd">Space</span> /{" "}
              <span className="kbd">↑</span> to swim up.{" "}
              <span className="kbd">↓</span> to glide down. On touch devices,
              tap the top or bottom half of the game area to move. Avoid glowing
              jellyfish and sharks &mdash; colliding with one costs{" "}
              <span className="accent">5 points</span>. Click{" "}
              <span className="accent">Reset</span> to start fresh.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
