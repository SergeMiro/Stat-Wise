import { ExternalLink } from "lucide-react";
import type { SourceRef } from "@/domain/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function SourceDisclosure({ title, sources }: { title: string; sources: SourceRef[] }) {
  if (sources.length === 0) return null;
  return (
    <Accordion>
      <AccordionItem>
        <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline">
          {title} ({sources.length})
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            {sources.map((s) => (
              <li key={s.code} className="text-xs">
                <a
                  href={s.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
                >
                  {s.label}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
                <div className="text-muted-foreground">
                  {s.geographicLevel} · {s.sourceVersion}
                </div>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
