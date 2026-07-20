# Design brief — Meatsaurus

## Product purpose
A fast, bilingual (FR/EN) lookup tool for meat-production vocabulary — search a term, read its definition, see how it connects to others. Built on AgroPortal's MEAT-T thesaurus, but not built to look or feel like it.

## Primary user
Meat-industry professionals and students who need a precise definition mid-task — not ontology engineers.

## Principles
- **Feels like a dictionary, not a database.** AgroPortal's own browser exposes its machinery — tabs, RDF format pickers, metadata panels. This tool hides all of it; a user should never need to know what "SKOS" or "ontology" means.
- **The data model dictates the information architecture, not the visual complexity.** Facets, hierarchy, and mappings decide what *pages* exist — not how busy any single page looks.
- **Clinical over decorative.** Restrained; dense where it matters (the definition itself), quiet everywhere else. Semantic color (untranslated, obsolete, mapping) is never the accent color.
- **Bilingual is a first-class state.** Every screen degrades gracefully when one language is missing — never hides the gap.
- **Fast path to an answer.** Search-first; minimal clicks from question to definition.

## Success metric
Roughly two interactions (type → click) to a correct, correctly-languaged definition, with at least one related term visible from there without leaving the page.

## Out of scope
- Editing, proposing, or annotating the ontology
- User accounts/auth beyond an email for update notifications
- Curation/admin tooling
- Replicating AgroPortal's ontology-browser UI (tabs, RDF serialization pickers, dense metadata panels) — that experience is exactly what this exists to replace
