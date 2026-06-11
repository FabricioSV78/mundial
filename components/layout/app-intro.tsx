"use client";

import { SkipForward } from "lucide-react";
import { type SyntheticEvent, useEffect, useState } from "react";
import { announceIntroStarted } from "@/components/layout/app-soundtrack";

const INTRO_SESSION_KEY = "mundial-battle:intro-seen";
const INTRO_EXIT_LEAD_SECONDS = 1.85;
const INTRO_BLACKOUT_MS = 540;
const INTRO_EXIT_MS = 1900;

type IntroExitPhase = "idle" | "blackout" | "reveal";

export function AppIntro() {
  const [visible, setVisible] = useState(false);
  const [exitPhase, setExitPhase] = useState<IntroExitPhase>("idle");

  useEffect(() => {
    if (window.sessionStorage.getItem(INTRO_SESSION_KEY)) {
      return;
    }

    const frame = window.requestAnimationFrame(() => setVisible(true));

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (exitPhase !== "blackout") {
      return;
    }

    const revealTimer = window.setTimeout(() => {
      setExitPhase("reveal");
    }, INTRO_BLACKOUT_MS);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, INTRO_EXIT_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
    };
  }, [exitPhase]);

  function closeIntro() {
    if (exitPhase !== "idle") {
      return;
    }

    window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    setExitPhase("blackout");
  }

  function handleVideoProgress(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    if (video.duration - video.currentTime <= INTRO_EXIT_LEAD_SECONDS) {
      closeIntro();
    }
  }

  if (!visible) {
    return null;
  }

  const introClassName = [
    "app-intro",
    exitPhase !== "idle" ? "app-intro--closing" : "",
    exitPhase === "reveal" ? "app-intro--reveal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={introClassName} aria-label="Intro Mundial Battle">
      <video
        className="app-intro__video"
        src="/imagenesMundial/INTRO.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onPlay={announceIntroStarted}
        onTimeUpdate={handleVideoProgress}
        onEnded={closeIntro}
      />
      <div className="app-intro__shade" />
      <div className="app-intro__sweep" />
      <div className="app-intro__grain" />
      <div className="app-intro__content">
        <p className="app-intro__eyebrow">Mundial Battle</p>
        <h1 className="app-intro__title">2026</h1>
        <p className="app-intro__copy">La batalla empieza ahora</p>
      </div>
      <button type="button" className="app-intro__skip" onClick={closeIntro}>
        <SkipForward className="size-4" />
        Saltar
      </button>
    </div>
  );
}
