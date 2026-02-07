import { getEpisode, getEpisodes } from "@/lib/data";
import { formatDate, formatDuration } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import TranscriptToggle from "@/components/TranscriptToggle";

interface EpisodePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const episodes = getEpisodes();
  return episodes.map((ep) => ({ id: ep.id }));
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { id } = await params;
  const episode = getEpisode(id);
  if (!episode) notFound();

  const analysis = episode.analysis;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/episodes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to episodes
      </Link>

      {/* Thumbnail */}
      {episode.thumbnail_url && (
        <div className="mb-6 overflow-hidden rounded-xl">
          <img
            src={episode.thumbnail_url}
            alt={episode.title}
            className="w-full"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
          <span>{formatDate(episode.publish_date)}</span>
          <span>·</span>
          <span>{formatDuration(episode.duration_seconds)}</span>
          {analysis?.guest_name && (
            <>
              <span>·</span>
              <span className="font-medium text-[var(--color-foreground)]">
                {analysis.guest_name}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold leading-tight text-[var(--color-foreground)] sm:text-3xl">
          {episode.title}
        </h1>
        {analysis?.guest_role && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {analysis.guest_role}
          </p>
        )}

        <a
          href={episode.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          Watch on YouTube
        </a>
      </div>

      {/* Summary */}
      {analysis?.summary && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Summary
          </h2>
          <p className="leading-relaxed text-[var(--color-foreground)]">
            {analysis.summary}
          </p>
        </section>
      )}

      {/* Key Takeaways */}
      {analysis?.key_takeaways && analysis.key_takeaways.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Key Takeaways
          </h2>
          <ul className="space-y-2">
            {analysis.key_takeaways.map((t, i) => (
              <li
                key={i}
                className="flex gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-[10px] font-bold text-[var(--color-accent)]">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Use Cases */}
      {analysis?.use_cases && analysis.use_cases.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Use Cases & Workflows
          </h2>
          <div className="space-y-3">
            {analysis.use_cases.map((uc, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {uc.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {uc.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {uc.tools?.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
                    >
                      {tool}
                    </span>
                  ))}
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
                    {uc.category}
                  </span>
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
                    {uc.difficulty}
                  </span>
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
                    {uc.audience}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tools */}
      {analysis?.tools_mentioned && analysis.tools_mentioned.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Tools Mentioned
          </h2>
          <div className="flex flex-wrap gap-2">
            {analysis.tools_mentioned.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-sm text-[var(--color-foreground)]"
              >
                {tool}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Notable Quotes */}
      {analysis?.notable_quotes && analysis.notable_quotes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Notable Quotes
          </h2>
          <div className="space-y-3">
            {analysis.notable_quotes.map((q, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-[var(--color-accent)] pl-4 text-sm italic text-[var(--color-muted)]"
              >
                &ldquo;{q}&rdquo;
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Transcript */}
      {episode.transcript && (
        <TranscriptToggle transcript={episode.transcript} />
      )}
    </div>
  );
}
