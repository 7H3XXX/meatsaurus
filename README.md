# Meatsaurus

A fast, bilingual (FR/EN) lookup tool for meat-production vocabulary — search a term, read its definition, see how it connects to others. Built on AgroPortal's **MEAT-T** thesaurus, a SKOS ontology derived from the *Dictionnaire de la viande* (Académie de la viande, France).

Audience: meat-industry professionals and students — not ontology engineers. See [`.ui-craft/brief.md`](./.ui-craft/brief.md) for the design brief and [`PLAN.md`](./PLAN.md) for the full build plan (data model, API reference, architecture, roadmap).

## Features

- **Search** — fuzzy, typo-tolerant lookup across all ~1,500 MEAT-T concepts. AgroPortal's own search only does exact stemmed-token matching (a real prefix like `"bre"` or a typo like `"cuting"` returns nothing), so this app builds its own in-memory fuzzy index instead.
- **Browse** — the thesaurus's 12 top-level domains (market, breed, slaughtering, culinary preparation, ...) as facet entry points, each with a lazy-expanding hierarchy tree.
- **Term detail** — bilingual definition, synonyms, broader/narrower relations, and cross-ontology mappings (linked out to AgroPortal for the target ontology).
- **FR/EN language toggle**, carried in the URL (`?lang=`) so every page is shareable and bookmarkable in either language.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Radix base)
- [Zod](https://zod.dev) for runtime validation of upstream API responses
- [Fuse.js](https://www.fusejs.io) for the fuzzy search index
- Package manager: **pnpm**

There is no REST API layer of our own. Server Components call the data layer (`src/lib/agroportal/service.ts`) directly; the two Client Components that need server data (search-as-you-type, lazy tree expansion) call Server Actions (`src/lib/actions.ts`) instead.

## Getting started

1. **Get an AgroPortal API key** — free, via an account at [agroportal.eu](https://agroportal.eu).
2. Copy the env template and add your key:
   ```bash
   cp .env.example .env.local
   # edit .env.local and set API_KEY=<your key>
   ```
3. Install dependencies and start the dev server:
   ```bash
   pnpm install
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |

## Project structure

```
src/
  app/                # Routes (App Router) — home, /browse, /browse/[facet], /term/[slug]
  components/         # Search box, concept tree, facet grid, term relation/mapping lists
  components/ui/      # shadcn/ui primitives
  lib/agroportal/      # Data layer — AgroPortal client, zod schemas, normalization, service functions
  lib/actions.ts       # Server Actions for the 2 client-interactive surfaces
  instrumentation.ts   # Pre-warms the search index at server startup
```

See [`CLAUDE.md`](./CLAUDE.md) for the detailed architecture writeup (why there's no REST API, how search works, resilience against a slow upstream, production-readiness notes) and [`PLAN.md`](./PLAN.md) for the original build plan and roadmap.

## Notes on the upstream API

AgroPortal's REST API (`data.agroportal.eu`) has a few undocumented quirks this project works around — worth knowing before extending it:

- The multilingual switch is the query param **`lang=fr`**, not `display_language` or `Accept-Language`.
- `/classes/roots` and `/classes/{id}/parents` return a bare JSON array; every other list endpoint (`/classes`, `/classes/{id}/children`, `/search`) uses a paginated `{ collection: [...] }` envelope. Mixing these up crashes the parser.
- Native `/search` only does exact stemmed-token matching — no prefix or fuzzy support — hence the in-house Fuse.js index over a lean (label/synonym-only) copy of the catalog.
- The backend gets noticeably slower under its own concurrency, which is why `getTerm()` degrades gracefully (via `Promise.allSettled`) rather than failing outright when a secondary call is slow.

## Deployment

Set `NEXT_PUBLIC_SITE_URL` in production (used for metadata, canonical/hreflang links, and the sitemap) alongside `API_KEY`. `robots.txt` and `sitemap.xml` are generated automatically.
