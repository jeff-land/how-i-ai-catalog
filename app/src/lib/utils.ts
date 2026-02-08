/**
 * Shared utility functions that work in both server and client contexts.
 * No Node.js-only imports (fs, path) allowed here.
 */

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Handle YYYYMMDD format
  if (dateStr.length === 8 && !dateStr.includes("-")) {
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    return new Date(`${y}-${m}-${d}`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function youtubeUrlWithTimestamp(
  episodeUrl: string | null,
  episodeId: string,
  timestampSeconds: number | null
): string | null {
  if (timestampSeconds == null) return null;
  const base = episodeUrl || `https://www.youtube.com/watch?v=${episodeId}`;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}t=${Math.floor(timestampSeconds)}`;
}
