"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Open state and width for the assistant panel, shared between the header button,
 * the keyboard shortcut and the panel itself.
 *
 * The width is also written to a CSS variable on the document, which is how the page
 * makes room instead of being covered: the panel is not a modal, and someone reading
 * a comparison while asking about it needs to see both.
 */

type PanelState = {
  open: boolean;
  width: number;
  toggle: () => void;
  close: () => void;
  setWidth: (width: number) => void;
};

const PanelContext = createContext<PanelState | null>(null);

const WIDTH_KEY = "wherewise:ai-panel-width";
export const MIN_WIDTH = 320;
export const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 420;

export function AiPanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [width, setWidthState] = useState(DEFAULT_WIDTH);

  // Restore the chosen width after mount: it cannot be read during SSR.
  useEffect(() => {
    const stored = Number(window.localStorage.getItem(WIDTH_KEY));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of browser-only state
    if (Number.isFinite(stored) && stored >= MIN_WIDTH) setWidthState(Math.min(stored, MAX_WIDTH));
  }, []);

  const setWidth = useCallback((next: number) => {
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next));
    setWidthState(clamped);
    try {
      window.localStorage.setItem(WIDTH_KEY, String(clamped));
    } catch {
      // Private mode: the width simply resets next time.
    }
  }, []);

  /*
    The page is shifted with a variable rather than a wrapper element, so no layout
    in the app has to know the panel exists. Only applied from `lg` in CSS — on a
    phone there is no room to shift into and the panel covers instead.
  */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--ai-panel-width", open ? `${width}px` : "0px");
    return () => {
      root.style.removeProperty("--ai-panel-width");
    };
  }, [open, width]);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // Ctrl/Cmd + I, the shortcut Copilot uses, plus Escape to leave.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <PanelContext.Provider value={{ open, width, toggle, close, setWidth }}>
      {children}
    </PanelContext.Provider>
  );
}

export function useAiPanel(): PanelState {
  const context = useContext(PanelContext);
  if (!context) throw new Error("useAiPanel must be used inside AiPanelProvider");
  return context;
}
