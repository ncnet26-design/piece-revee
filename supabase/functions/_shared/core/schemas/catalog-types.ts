import type { z } from "zod";
import type { CategorySchema } from "./study.ts";
export type Category = z.infer<typeof CategorySchema>;
