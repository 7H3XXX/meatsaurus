# Meatsaurus

Bilingual (FR/EN) reference tool for the meat production vocabulary — market, breed, slaughtering, culinary preparation, etc. Built on top of AgroPortal's **MEAT-T** ontology (SKOS thesaurus derived from the *Dictionnaire de la viande*, Académie de la viande, France). Audience: meat-industry professionals and students, not ontology engineers.

See **[PLAN.md](./PLAN.md)** for the full build plan: data model, API endpoint reference, user flows, information architecture, UI system, tech spec, and roadmap. Read it before starting implementation work — the data model there (SKOS concepts, schemes, broader/narrower, mappings, submissions) drives the app's structure and should not be redesigned ad hoc.

## Stack

- Next.js (App Router) + React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix base, `radix-nova` style, Lucide icons — see `components.json`)
- Package manager: pnpm
- Data source: AgroPortal REST API (`https://data.agroportal.eu`, OntoPortal/BioPortal conventions). API key in `.env.local` as `API_KEY` (see `.env.example`) — validated at boot in `src/lib/env.ts`, never exposed to the client.
- `zod` for runtime validation of upstream responses.
- No client-side data-fetching library (TanStack Query, etc.) — the two interactive client surfaces (search-as-you-type, lazy tree expansion) call Server Actions directly. Revisit only if more client-fetched surfaces show up; don't add it preemptively.
- No REST API layer — deliberately removed (see below). Server Components call the service layer directly; Client Components call Server Actions. There is no public `/api/*` for this app to expose.

## Data layer (implemented)

`src/lib/agroportal/` (client, schemas, normalize, service, errors) is the only thing that talks to AgroPortal. No route handlers — Server Components (`page.tsx` files) call `getFacets`/`getTerm`/`getChildren` from `service.ts` directly; the two Client Components that need server data call Server Actions in `src/lib/actions.ts` (`searchAction`, `getChildrenAction`), which wrap the same service functions with a try/catch that degrades to an empty result rather than surfacing an error for these non-critical UX affordances.

Key finding from live testing (not in AgroPortal's own docs): the multilingual switch is the query param **`lang=fr`** — not `display_language`, not `Accept-Language`, not SKOS-XL (MEAT-T doesn't use it). See PLAN.md §3 for the full writeup.

**Resilience**: AgroPortal gets markedly slower under its own concurrency (measured live: ~5s per call alone, ~10s when `getTerm()`'s 4 parallel calls run together) — `agroFetch` retries once on timeout/network failure, and `getTerm()` uses `Promise.allSettled` so a slow `parents`/`children`/`mappings` call degrades that section to empty instead of taking down the whole page (`detail` still fails loudly — there's no term page without it).

**Search**: AgroPortal's own `/search` does exact stemmed-token matching only — no prefix, no typo tolerance (confirmed live: `"bre"` and misspelled `"cuting"` both return zero results). Real fuzzy matching requires holding the corpus in memory (MEAT-T is small — 1,504 concepts) — `service.ts` builds a Fuse.js index from a **lean** schema (id/label/synonym only; `definition` is dropped at parse time, not just unused, since it's most of the payload weight), cached per-language as a memoized in-flight promise (concurrent cold requests share one build instead of each triggering their own ~6MB fetch), pre-warmed at server startup (`src/instrumentation.ts`). If the bulk fetch ever fails, search falls back to AgroPortal's native endpoint rather than breaking, and a failed build's cache entry expires in 5 minutes (not the normal 24h) so it retries reasonably soon without hammering a struggling upstream.

## Frontend (implemented)

Routes (App Router, all read `?lang=en|fr` from the URL, default `en`):

- `/` — search-first landing + facet grid
- `/browse` — the 12 facets as cards
- `/browse/[facet]` — a facet's tree (lazy-expanding via `/api/terms`), breadcrumb back to Browse
- `/term/[slug]` — full term detail: definition, synonyms, obsolete badge, broader/narrower, cross-ontology mapping badges (link out to AgroPortal's UI for the target ontology)

`[facet]`/`[slug]` are short slugs (e.g. `C853`), not raw IRIs — `src/lib/agroportal/slug.ts` strips/restores the shared `http://opendata.inrae.fr/ThViande/` prefix that every MEAT-T concept IRI uses, confirmed live. Falls back to full URI-encoding for anything that doesn't match (defensive, not expected to trigger for MEAT-T's own concepts).

Key components: `site-header.tsx` (search + language toggle, sticky, each wrapped in its own `<Suspense>` since both read `useSearchParams()` — required for `/_not-found` and any other page without its own dynamic data to statically prerender, see below), `search-box.tsx` (debounced via `setTimeout` + a `latestQueryRef` guard against an older, slower request's response landing after a newer one — `startTransition` drives the pending state, not a manual boolean), `concept-tree.tsx` (ARIA `tree`/`treeitem`/`group` roles, lazy-fetches children per node on first expand via `getChildrenAction` — full arrow-key roving-focus nav is a known gap, not yet implemented), `facet-grid.tsx`, `term-relation-list.tsx`, `mapping-list.tsx`.

States handled: loading (route-specific `loading.tsx` per segment — home/browse/facet/term each get a `Skeleton`-based placeholder matching their real layout, not a generic spinner), error (`app/error.tsx`, catches thrown `AgroPortalError`), not-found (`app/not-found.tsx`, triggered on upstream 404), missing-translation (dashed-border notice on term pages when `definition` is absent for the selected language).

## Production readiness (implemented)

- **Metadata**: `metadataBase`, OpenGraph/Twitter tags in `layout.tsx`; per-page title/description via `generateMetadata` on facet and term pages; `src/lib/metadata.ts` centralizes `siteUrl` (reads `NEXT_PUBLIC_SITE_URL`, falls back to `localhost:3000`) and `langAlternates()` (hreflang — `lang` is a query param, not a route segment, so Next can't infer translations from the URL structure; each language variant self-canonicalizes rather than collapsing to one).
- **`robots.ts`** / **`sitemap.ts`**: sitemap lists home, `/browse`, and the 12 facet pages (one cheap `/classes/roots` call) — deliberately **not** all ~1,500 term pages, which would mean holding the full catalog just to enumerate URLs; crawlers reach term pages fine via the links every facet tree and term page already carries.
- **`icon.tsx`**: branded favicon via `next/og` `ImageResponse` (replaced the default Next.js scaffold icon).
- **`next.config.ts`**: baseline security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), `poweredByHeader: false`.
- Verified with a real `pnpm build` + `pnpm start` (not just `pnpm dev`) — this caught a real bug dev mode hides: `useSearchParams()` in the header (rendered by every page via the root layout) needs its own `<Suspense>` boundary or static prerendering of pages with no dynamic data of their own (like Next's generated `/_not-found`) fails at build time.

## Design direction

- Primary color: clinical green. Neutrals carry a faint green bias, not pure grey.
- Sans-serif only; monospace reserved for concept notations/IRIs.
- Aesthetic: rigorous, clinical, minimalist — not a decorated SaaS dashboard. Favor hairline borders over drop shadows, flat semantic badges over color-coded cards.
- Follow the `ui-craft` **minimal** preset (craft 8 · motion 3 · density 2), not the dense-dashboard preset — this is a lookup/reference tool, read a few screens at a time.
- Semantic color (amber = untranslated, red = obsolete, blue = cross-ontology mapping) is distinct from the green accent — never reuse the accent for status.

## Status

Phase 0 (discovery), the data layer (Server Actions, no REST API), Phase 1 (core frontend), and production-readiness (SEO/metadata, sitemap, robots, security headers, favicon) are done — see above. `.ui-craft/brief.md` and the token spine in `globals.css` are established. `npx tsc --noEmit`, `npx eslint src --max-warnings=0`, and a full `pnpm build` + `pnpm start` all pass clean.

Not yet built (Phase 2+, see PLAN.md §4/§10): Watch/notifications, changelog, term comparison, export, recently-viewed/bookmarks, command palette. Also not done: full arrow-key ARIA treeview keyboard nav (currently Tab-operable but not full roving-tabindex), an `ui-craft:a11y-auditor`/`design-reviewer` verification pass, and visual QA against real content (only tested against the `breed`/`race` term end-to-end).
