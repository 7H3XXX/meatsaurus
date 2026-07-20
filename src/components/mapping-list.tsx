import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MappingRef } from "@/lib/agroportal/types";

export function MappingList({ mappings, title }: { mappings: MappingRef[]; title: string }) {
  if (mappings.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {mappings.map((mapping) => (
          <li key={mapping.id}>
            <a
              href={`https://agroportal.eu/ontologies/${mapping.ontology}?p=classes&conceptid=${encodeURIComponent(mapping.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Badge
                variant="outline"
                className="gap-1 border-status-info/40 bg-status-info-subtle text-status-info hover:border-status-info"
              >
                {mapping.ontology}
                <ExternalLink className="size-3" aria-hidden />
              </Badge>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
