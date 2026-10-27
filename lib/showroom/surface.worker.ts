/// <reference lib="webworker" />
import { generateSurface } from "./generate";

/** Travailleur d'arrière-plan : calcule les surfaces du showroom sans jamais figer la page. */
const ctx = self as unknown as DedicatedWorkerGlobalScope;
ctx.onmessage = async (e: MessageEvent<{ id: number; ref: string; size: number }>) => {
  const { id, ref, size } = e.data;
  try {
    const s = await generateSurface(ref, size);
    if (!s) { ctx.postMessage({ id, s: null }); return; }
    ctx.postMessage({ id, s }, [s.color.buffer, s.height.buffer, s.rough.buffer]);
  } catch (err) {
    ctx.postMessage({ id, error: String(err) });
  }
};
