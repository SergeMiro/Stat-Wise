"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Sparkles, Wrench, X } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MAX_WIDTH, MIN_WIDTH, useAiPanel } from "./ai-panel-provider";

/**
 * The assistant, down the right-hand side.
 *
 * Not a modal. It sits beside the page and the page makes room for it from `lg` up,
 * because the questions people ask here are about what is on screen — "why is the
 * Lyon rent higher than the range says" only makes sense next to the result.
 *
 * Below `lg` there is nothing to make room for, so it covers the page instead, with
 * a backdrop that closes it.
 */
export function AiPanel({
  locale,
  dict,
  configured,
  skills,
  canPersist,
}: {
  locale: Locale;
  dict: Dictionary;
  /** False when no gateway key exists: the panel explains rather than fails. */
  configured: boolean;
  /** Skills this visitor's role may use, resolved on the server. */
  skills: { id: string; label: string; defaultOn: boolean }[];
  /** Signed in, so the thread has somewhere to live. */
  canPersist: boolean;
}) {
  const t = dict.ai;
  const { open, width, close, setWidth } = useAiPanel();
  const [active, setActive] = useState<string[]>(() =>
    skills.filter((s) => s.defaultOn).map((s) => s.id),
  );
  const [input, setInput] = useState("");
  const [showSkills, setShowSkills] = useState(false);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      // Skills and locale ride along with every message; the server filters them.
      body: () => ({ skills: active, locale }),
    }),
  });

  /*
    Restore the thread the first time the panel opens, and save it whenever a stream
    finishes. Only for a signed-in person: for a guest there is nowhere to put a
    conversation that is theirs, so it lives and dies with the tab.

    The save is fire-and-forget on purpose. Losing a thread is a small harm; blocking
    the panel behind a failing write, or showing an error about bookkeeping the person
    never asked for, is a larger one.
  */
  const restored = useRef(false);
  useEffect(() => {
    if (!open || restored.current || !canPersist) return;
    restored.current = true;
    fetch("/api/ai/thread")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { messages?: { role: string; parts: unknown[] }[] } | null) => {
        if (!body?.messages?.length) return;
        setMessages(
          body.messages.map((m, i) => ({
            id: `restored-${i}`,
            role: m.role as "user" | "assistant",
            parts: m.parts,
          })) as never,
        );
      })
      .catch(() => undefined);
  }, [open, canPersist, setMessages]);

  useEffect(() => {
    if (!canPersist || status !== "ready" || messages.length === 0) return;
    fetch("/api/ai/thread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, parts: m.parts })),
      }),
    }).catch(() => undefined);
  }, [canPersist, status, messages]);

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  /* Drag the left edge. Pointer events so a stylus and a finger work as a mouse does. */
  const onDragStart = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      const move = (e: PointerEvent) => setWidth(startWidth + (startX - e.clientX));
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [width, setWidth],
  );

  if (!open) return null;

  return (
    <>
      {/* Only below lg, where the panel covers rather than sits beside. */}
      <button
        type="button"
        aria-label={dict.common.close}
        onClick={close}
        className="bg-foreground/20 fixed inset-0 z-40 lg:hidden"
      />

      <aside
        aria-label={t.title}
        className="bg-card fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l shadow-xl lg:w-auto"
        style={{ ["--w" as string]: `${width}px`, width: undefined }}
      >
        {/* Width comes from the variable at lg; full-bleed below it. */}
        <div className="flex h-full w-full flex-col lg:w-[var(--w)]">
          <div
            onPointerDown={onDragStart}
            className="hover:bg-primary/40 absolute inset-y-0 left-0 hidden w-1 cursor-col-resize lg:block"
            role="separator"
            aria-orientation="vertical"
            aria-label={t.resize}
            aria-valuenow={width}
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
          />

          <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <p className="font-heading inline-flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="text-brand-cyan-ink size-4" aria-hidden />
              {t.title}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t.skills}
                aria-pressed={showSkills}
                onClick={() => setShowSkills((v) => !v)}
              >
                <Wrench />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={dict.common.close} onClick={close}>
                <X />
              </Button>
            </div>
          </header>

          {showSkills ? (
            <div className="bg-muted/40 border-b px-4 py-3">
              <p className="text-muted-foreground font-mono text-[11px] uppercase">{t.skills}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const on = active.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setActive((current) =>
                          on ? current.filter((x) => x !== skill.id) : [...current, skill.id],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        on
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {skill.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-muted-foreground mt-2 text-[11px]">{t.skillsHint}</p>
            </div>
          ) : null}

          <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4">
            {!configured ? (
              <p className="text-muted-foreground text-sm">{t.notConfigured}</p>
            ) : messages.length === 0 ? (
              <div>
                <p className="text-muted-foreground text-sm">{t.empty}</p>
                <ul className="mt-3 space-y-2">
                  {t.examples.map((example) => (
                    <li key={example}>
                      <button
                        type="button"
                        onClick={() => sendMessage({ text: example })}
                        className="hover:border-primary/40 hover:text-foreground text-muted-foreground w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors"
                      >
                        {example}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ol className="space-y-4">
                {messages.map((message) => (
                  <li key={message.id}>
                    <p className="text-muted-foreground font-mono text-[10px] uppercase">
                      {message.role === "user" ? t.you : t.assistant}
                    </p>
                    <div className="mt-1 space-y-2 text-sm leading-relaxed">
                      {message.parts.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <p key={index} className="whitespace-pre-wrap">
                              {part.text}
                            </p>
                          );
                        }
                        /*
                          Tool calls are shown, not hidden. The product's claim is
                          that a figure can be traced; an answer that silently ran a
                          simulation would break that in the one place people are
                          most likely to trust it blindly.
                        */
                        if (part.type.startsWith("tool-")) {
                          return (
                            <p
                              key={index}
                              className="text-muted-foreground bg-muted/50 rounded-md px-2 py-1 font-mono text-[11px]"
                            >
                              {part.type.replace(/^tool-/, "")}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </li>
                ))}
                {status === "submitted" || status === "streaming" ? (
                  <li className="text-muted-foreground text-sm">{t.thinking}</li>
                ) : null}
              </ol>
            )}

            {error ? (
              <p className="text-confidence-low mt-3 text-sm" role="alert">
                {t.error}
              </p>
            ) : null}
          </div>

          <form
            className="flex items-end gap-2 border-t px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              const text = input.trim();
              if (!text || !configured) return;
              sendMessage({ text });
              setInput("");
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, Shift+Enter breaks the line, as everywhere else.
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={2}
              disabled={!configured}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-11 flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
            />
            <Button
              type="submit"
              size="icon"
              aria-label={t.send}
              disabled={!configured || status !== "ready" || !input.trim()}
            >
              <ArrowUp />
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
