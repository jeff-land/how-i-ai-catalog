import Link from "next/link";
import { Episode } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/utils";

interface EpisodeCardProps {
  episode: Episode;
}

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const analysis = episode.analysis;
  const useCaseCount = analysis?.use_cases?.length || 0;

  return (
    <Link
      href={`/episodes/${episode.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:border-[var(--color-accent)] hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {episode.thumbnail_url ? (
          <img
            src={episode.thumbnail_url}
            alt={episode.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-muted)]">
            No thumbnail
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(episode.duration_seconds)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs text-[var(--color-muted)]">
          {formatDate(episode.publish_date)}
          {analysis?.guest_name && ` · ${analysis.guest_name}`}
        </p>
        <h3 className="mb-2 text-sm font-semibold leading-snug text-[var(--color-foreground)] line-clamp-2 group-hover:text-[var(--color-accent)]">
          {episode.title}
        </h3>

        {analysis?.summary && (
          <p className="mb-3 text-xs leading-relaxed text-[var(--color-muted)] line-clamp-2">
            {analysis.summary}
          </p>
        )}

        {/* Tags */}
        <div className="mt-auto flex flex-wrap gap-1">
          {useCaseCount > 0 && (
            <span className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
              {useCaseCount} use case{useCaseCount !== 1 ? "s" : ""}
            </span>
          )}
          {analysis?.tools_mentioned?.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]"
            >
              {tool}
            </span>
          ))}
          {(analysis?.tools_mentioned?.length || 0) > 3 && (
            <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
              +{(analysis?.tools_mentioned?.length || 0) - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
