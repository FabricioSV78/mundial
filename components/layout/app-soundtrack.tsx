"use client";

import { Music, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_START_EVENT = "mundial-battle:intro-start";
const SOUNDTRACK_TIME_KEY = "mundial-battle:soundtrack-time";
const SOUNDTRACK_MUTED_KEY = "mundial-battle:soundtrack-muted";
const SOUNDTRACK_ENABLED_KEY = "mundial-battle:soundtrack-enabled";
const AUTOPLAY_RETRY_DELAYS = [0, 250, 900, 1800];
const AUTOPLAY_UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart", "click"];

type SoundtrackState = "idle" | "playing" | "paused" | "blocked";

type PlaySoundtrackOptions = {
  forceUnmuted?: boolean;
  restartFromStart?: boolean;
};

export function announceIntroStarted() {
  window.dispatchEvent(new Event(INTRO_START_EVENT));
}

export function AppSoundtrack() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<SoundtrackState>("idle");
  const [muted, setMuted] = useState(false);

  const restoreAudioState = useCallback((options: PlaySoundtrackOptions = {}) => {
    const audio = audioRef.current;

    if (!audio) {
      return false;
    }

    const storedTime = Number.parseFloat(window.localStorage.getItem(SOUNDTRACK_TIME_KEY) ?? "");
    const storedMuted = !options.forceUnmuted && window.localStorage.getItem(SOUNDTRACK_MUTED_KEY) === "1";
    const nextTime = options.restartFromStart ? 0 : storedTime;

    if (options.restartFromStart) {
      window.localStorage.setItem(SOUNDTRACK_TIME_KEY, "0");
    }

    if (Number.isFinite(nextTime) && nextTime >= 0 && Math.abs(audio.currentTime - nextTime) > 0.5) {
      try {
        audio.currentTime = nextTime;
      } catch {
        // Some browsers delay seeking until metadata is available; the next mount will retry.
      }
    }

    if (options.forceUnmuted) {
      window.localStorage.setItem(SOUNDTRACK_MUTED_KEY, "0");
    }

    audio.muted = storedMuted;
    setMuted(storedMuted);

    return storedMuted;
  }, []);

  const persistAudioState = useCallback(() => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(audio.currentTime)) {
      return;
    }

    window.localStorage.setItem(SOUNDTRACK_TIME_KEY, String(audio.currentTime));
    window.localStorage.setItem(SOUNDTRACK_MUTED_KEY, audio.muted ? "1" : "0");
  }, []);

  const playSoundtrack = useCallback(async (options: PlaySoundtrackOptions = {}) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      const restoredMuted = restoreAudioState(options);
      audio.volume = 0.68;

      if (restoredMuted) {
        audio.pause();
        setState("paused");
        return;
      }

      await audio.play();
      window.localStorage.setItem(SOUNDTRACK_ENABLED_KEY, "1");
      setState("playing");
    } catch {
      setState("blocked");
    }
  }, [restoreAudioState]);

  useEffect(() => {
    function handleIntroStart() {
      void playSoundtrack({ forceUnmuted: true, restartFromStart: true });
    }

    window.addEventListener(INTRO_START_EVENT, handleIntroStart);

    return () => {
      window.removeEventListener(INTRO_START_EVENT, handleIntroStart);
    };
  }, [playSoundtrack]);

  useEffect(() => {
    const timers = AUTOPLAY_RETRY_DELAYS.map((delay) =>
      window.setTimeout(() => {
        void playSoundtrack();
      }, delay),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [playSoundtrack]);

  useEffect(() => {
    function handleUserActivation() {
      AUTOPLAY_UNLOCK_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivation, true);
      });

      void playSoundtrack();
    }

    AUTOPLAY_UNLOCK_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivation, true);
    });

    return () => {
      AUTOPLAY_UNLOCK_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivation, true);
      });
    };
  }, [playSoundtrack]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    restoreAudioState();

    if (audio.muted) {
      audio.pause();
      setState("paused");
    }

    function handleTimeUpdate() {
      persistAudioState();
    }

    function handleLoadedMetadata() {
      restoreAudioState();
      const currentAudio = audioRef.current;

      if (currentAudio?.muted) {
        currentAudio.pause();
        setState("paused");
      }
    }

    function handleBeforeUnload() {
      persistAudioState();
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("pause", handleTimeUpdate);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      persistAudioState();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("pause", handleTimeUpdate);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [persistAudioState, restoreAudioState]);

  function toggleSound() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (state !== "playing" || muted) {
      audio.muted = false;
      window.localStorage.setItem(SOUNDTRACK_MUTED_KEY, "0");
      setMuted(false);
      void playSoundtrack({ forceUnmuted: true });
      return;
    }

    audio.muted = true;
    audio.pause();
    persistAudioState();
    window.localStorage.setItem(SOUNDTRACK_MUTED_KEY, "1");
    setMuted(true);
    setState("paused");
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/imagenesMundial/musica.mp3"
        preload="auto"
        loop
        autoPlay
        onCanPlay={() => void playSoundtrack()}
        onPlay={() => setState("playing")}
      />
      {state !== "idle" ? (
        <button type="button" className="app-soundtrack-toggle" onClick={toggleSound}>
          {state === "blocked" ? <Music className="size-4" /> : muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          {state === "blocked" ? "Activar musica" : muted ? "Activar sonido" : "Silenciar"}
        </button>
      ) : null}
    </>
  );
}
