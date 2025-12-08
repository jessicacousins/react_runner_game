import React from "react";
import Game from "./Game.jsx";
import "./index.css";

export default function App() {
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
              Guide your little fish through a glowing underwater lane, scoop up
              tokens, and chase your best score. Your progress is saved locally
              in this browser.
            </p>
          </div>

          <Game />

          <footer className="shell-footer">
            <p>
              <span className="kbd">Space</span> /{" "}
              <span className="kbd">↑</span> to swim up.{" "}
              <span className="kbd">↓</span> to glide down. Click{" "}
              <span className="accent">Reset</span> to start fresh.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
