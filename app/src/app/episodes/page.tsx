import { getEpisodes, getUseCases, getAllTools, getAllCategories, getAllAudiences } from "@/lib/data";
import CatalogClient from "@/components/CatalogClient";

export default function EpisodesPage() {
  const episodes = getEpisodes();
  const useCases = getUseCases();
  const allTools = getAllTools(episodes);
  const allCategories = getAllCategories(useCases);
  const allAudiences = getAllAudiences(useCases);

  // Sort episodes newest first
  const sorted = [...episodes].sort((a, b) =>
    (b.publish_date || "").localeCompare(a.publish_date || "")
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
          Episodes
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Every episode analyzed for AI use cases, tools, and workflows.
        </p>
      </div>

      <CatalogClient
        episodes={sorted}
        useCases={useCases}
        allTools={allTools}
        allCategories={allCategories}
        allAudiences={allAudiences}
      />
    </div>
  );
}
