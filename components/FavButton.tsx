"use client";
import { favorites, useFavorites } from "@/lib/favorites";
import { IconHeart } from "./icons";

export function FavButton({ id, name, variant = "heart" }: { id: string; name: string; variant?: "heart" | "button" }) {
  const favs = useFavorites();
  const on = favs.includes(id);
  if (variant === "button") {
    return <button type="button" className={`btn btn-sm ${on ? "btn-dark" : ""}`} aria-pressed={on} onClick={() => favorites.toggle(id)}>{on ? "Dans le moodboard" : "Ajouter au moodboard"}</button>;
  }
  return (
    <button type="button" className="heart" aria-pressed={on} aria-label={on ? `Retirer ${name} du moodboard` : `Ajouter ${name} au moodboard`} onClick={() => favorites.toggle(id)}>
      <IconHeart />
    </button>
  );
}
