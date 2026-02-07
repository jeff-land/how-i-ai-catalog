import { Episode, UseCaseFlat } from "@/lib/types";

interface StatsProps {
  episodes: Episode[];
  useCases: UseCaseFlat[];
}

export default function Stats({ episodes, useCases }: StatsProps) {
  // Count tools across all episodes
  const toolCounts: Record<string, number> = {};
  for (const ep of episodes) {
    if (ep.analysis?.tools_mentioned) {
      for (const t of ep.analysis.tools_mentioned) {
        toolCounts[t] = (toolCounts[t] || 0) + 1;
      }
    }
  }
  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Count categories
  const catCounts: Record<string, number> = {};
  for (const uc of useCases) {
    if (uc.category) {
      catCounts[uc.category] = (catCounts[uc.category] || 0) + 1;
    }
  }
  const topCategories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Summary numbers */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">
            {episodes.length}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Episodes</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">
            {useCases.length}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Use Cases</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">
            {Object.keys(toolCounts).length}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Tools</p>
        </div>
      </div>

      {/* Top Tools */}
      {topTools.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Most Mentioned Tools
          </h3>
          <div className="space-y-1.5">
            {topTools.map(([tool, count]) => (
              <div key={tool} className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-foreground)]">
                  {tool}
                </span>
                <span className="text-xs text-[var(--color-muted)]">
                  {count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {topCategories.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Use Case Categories
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {topCategories.map(([cat, count]) => (
              <span
                key={cat}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-muted)]"
              >
                {cat}{" "}
                <span className="font-semibold text-[var(--color-foreground)]">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
