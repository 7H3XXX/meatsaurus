import { z } from "zod";

/**
 * Deliberately narrow: we only validate the fields this app actually reads.
 * AgroPortal's raw class objects carry a lot more metadata (cui, semanticType,
 * created, modified, memberOf, links, @context, ...) that we don't use and
 * don't want to be broken by if the upstream adds or renames it.
 */
export const rawClassSchema = z.object({
  "@id": z.string(),
  prefLabel: z.string().nullable(),
  synonym: z.array(z.string()).default([]),
  definition: z.array(z.string()).default([]),
  obsolete: z.boolean().default(false),
  matchType: z.string().optional(),
});
export type RawClass = z.infer<typeof rawClassSchema>;

/**
 * `/classes/roots` and `/classes/{id}/parents` both return a bare JSON array
 * — confirmed live, including the empty case (`[]`, not `{collection: []}`).
 * Every other list endpoint (`/classes`, `/classes/{id}/children`, `/search`)
 * uses the paginated envelope below. Mixing these up is exactly what broke
 * every facet page: a root concept's empty `/parents` response (`[]`) failed
 * to parse against the paginated schema.
 */
export const rawClassArraySchema = z.array(rawClassSchema);

export const rawPaginatedClassesSchema = z.object({
  totalCount: z.number().optional(),
  collection: z.array(rawClassSchema),
});

/**
 * The fuzzy search index only ever matches on label/synonym — it never needs
 * `definition`, which is most of the payload weight (full multi-paragraph
 * text per concept). Parsing the bulk ~1500-concept listing through this
 * schema instead of `rawClassSchema` means definitions are dropped as soon
 * as they're parsed rather than held in memory: `.parse()` on a zod object
 * schema strips any input field the schema doesn't declare.
 */
export const rawSearchIndexEntrySchema = z.object({
  "@id": z.string(),
  prefLabel: z.string().nullable(),
  synonym: z.array(z.string()).default([]),
});
export type RawSearchIndexEntry = z.infer<typeof rawSearchIndexEntrySchema>;

export const rawSearchIndexResponseSchema = z.object({
  collection: z.array(rawSearchIndexEntrySchema),
});

const rawMappingClassRefSchema = z.object({
  "@id": z.string(),
  links: z.object({ ontology: z.string().optional() }).optional(),
});

const rawMappingSchema = z.object({
  classes: z.array(rawMappingClassRefSchema),
});
export type RawMapping = z.infer<typeof rawMappingSchema>;

export const rawMappingsResponseSchema = z.array(rawMappingSchema);
