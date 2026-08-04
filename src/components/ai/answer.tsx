"use client";

import Link from "next/link";
import { Streamdown } from "streamdown";
import { ArrowUpRight } from "lucide-react";

/**
 * An assistant answer, rendered as markdown while it streams.
 *
 * Streamdown rather than a plain `<p>` for one reason that matters: the assistant is
 * told to cite the page a figure came from, and a citation that arrives as raw
 * `[Méthodologie](/fr/methodology#donnees-manquantes)` is not a citation — nobody
 * follows it. `parseIncompleteMarkdown` also means a half-written link does not flash
 * as broken syntax mid-stream.
 *
 * Links are split by destination, which is the whole point of the wiki-link work:
 *
 *   - a path into our own site becomes a Next link and stays in the tab, so following
 *     a citation does not lose the conversation;
 *   - anything external opens in a new tab with `noopener`, and says so with an icon.
 *
 * Anything that is not http(s) or a site path is rendered as plain text. The text
 * comes from a model, and `javascript:` in a citation is exactly the case where being
 * strict costs nothing.
 */
export function Answer({ text }: { text: string }) {
  return (
    <Streamdown
      parseIncompleteMarkdown
      className="text-sm leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
      components={{
        a: ({ href, children }) => {
          const target = typeof href === "string" ? href : "";

          if (target.startsWith("/")) {
            return (
              <Link href={target} className="text-primary underline underline-offset-2">
                {children}
              </Link>
            );
          }
          if (/^https?:\/\//.test(target)) {
            return (
              <a
                href={target}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {children}
                <ArrowUpRight className="ml-0.5 inline size-3 align-[-0.1em]" aria-hidden />
              </a>
            );
          }
          return <span>{children}</span>;
        },
      }}
    >
      {text}
    </Streamdown>
  );
}
