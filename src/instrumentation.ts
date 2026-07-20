export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { warmSearchIndexes } = await import("@/lib/agroportal/service");
  void warmSearchIndexes();
}
