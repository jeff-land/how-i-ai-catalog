/**
 * Server-only data loading functions.
 * These use Node.js fs/path and must only be called from Server Components.
 */
import "server-only";

import { Episode, UseCaseFlat } from "./types";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");

export function getEpisodes(): Episode[] {
  const filePath = path.join(DATA_DIR, "episodes-analyzed.json");
  if (!fs.existsSync(filePath)) {
    // Fall back to raw episodes if analysis hasn't been run yet
    const rawPath = path.join(DATA_DIR, "episodes.json");
    if (!fs.existsSync(rawPath)) return [];
    const raw = fs.readFileSync(rawPath, "utf-8");
    return JSON.parse(raw);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function getEpisode(id: string): Episode | null {
  const episodes = getEpisodes();
  return episodes.find((e) => e.id === id) || null;
}

export function getUseCases(): UseCaseFlat[] {
  const filePath = path.join(DATA_DIR, "use-cases.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function getAllTools(episodes: Episode[]): string[] {
  const tools = new Set<string>();
  for (const ep of episodes) {
    if (ep.analysis?.tools_mentioned) {
      for (const t of ep.analysis.tools_mentioned) {
        tools.add(t);
      }
    }
  }
  return Array.from(tools).sort();
}

export function getAllCategories(useCases: UseCaseFlat[]): string[] {
  const cats = new Set<string>();
  for (const uc of useCases) {
    if (uc.category) cats.add(uc.category);
  }
  return Array.from(cats).sort();
}

export function getAllAudiences(useCases: UseCaseFlat[]): string[] {
  const audiences = new Set<string>();
  for (const uc of useCases) {
    if (uc.audience) audiences.add(uc.audience);
  }
  return Array.from(audiences).sort();
}
