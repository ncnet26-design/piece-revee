import { z } from "zod";
import { CategorySchema } from "./study.ts";

/** Entrées des outils de Camille, revalidées côté serveur avant exécution. */
export const ToolInputs = {
  rechercher_catalogue: z.object({
    requete: z.string().min(2).max(200),
    categorie: CategorySchema.optional(),
    prix_max_euros: z.number().int().positive().max(100_000).optional(),
    occasion: z.boolean().optional(),
  }).strict(),
  rechercher_bibliotheque: z.object({
    requete: z.string().min(2).max(200),
    type: z.enum(["matiere", "accord", "meuble", "lieu", "plante", "guide", "connaissance"]).optional(),
  }).strict(),
  lire_projet: z.object({ projet_id: z.string().uuid().optional() }).strict(),
  lire_maison: z.object({}).strict(),
  ajouter_moodboard: z.object({ element_id: z.string().min(2).max(80) }).strict(),
  lancer_rendu: z.object({ projet_id: z.string().uuid(), consigne: z.string().min(3).max(500), confirme_par_utilisateur: z.literal(true) }).strict(),
  trouver_artisan: z.object({ metier: z.string().min(2).max(60), departement: z.string().regex(/^(\d{2}|2A|2B|97\d)$/) }).strict(),
} as const;
export type ToolName = keyof typeof ToolInputs;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});
export const ChatRequestSchema = z.object({
  threadId: z.string().uuid().nullable(),
  message: z.string().trim().min(1).max(4000),
  imagePath: z.string().max(300).nullable(),
  context: z.object({ projectId: z.string().uuid().nullable(), step: z.string().max(80).nullable() }),
});
