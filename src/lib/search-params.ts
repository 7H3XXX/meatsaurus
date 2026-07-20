import type { Lang } from "./agroportal/types";

/** `lang` is carried in the URL (shareable, back-button correct) rather than a cookie. */
export function parseLang(value: string | undefined): Lang {
  return value === "fr" ? "fr" : "en";
}
