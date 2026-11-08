/** Date de relevé lisible (« 8 nov. ») ; pour une liste, la plus ancienne (le prix le moins récent fait foi). */
export const dateReleve = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
export const plusAncienne = (dates: Array<string | undefined>) => {
  const ok = dates.filter((d): d is string => Boolean(d) && !Number.isNaN(Date.parse(d!))).sort();
  return ok[0] ? dateReleve(ok[0]) : null;
};
