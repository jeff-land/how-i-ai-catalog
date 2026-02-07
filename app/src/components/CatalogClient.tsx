"use client";

import { useState, useMemo } from "react";
import { Episode, UseCaseFlat } from "@/lib/types";
import EpisodeCard from "./EpisodeCard";
import SearchBar from "./SearchBar";
import TagFilter from "./TagFilter";
import RolePicker from "./RolePicker";
import Stats from "./Stats";

interface CatalogClientProps {
  episodes: Episode[];
  useCases: UseCaseFlat[];
  allTools: string[];
  allCategories: string[];
  allAudiences: string[];
}

export default function CatalogClient({
  episodes,
  useCases,
  allTools,
  allCategories,
  allAudiences,
}: CatalogClientProps) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return episodes.filter((ep) => {
      // Text search
      if (q) {
        const searchable = [
          ep.title,
          ep.analysis?.guest_name,
          ep.analysis?.guest_role,
          ep.analysis?.summary,
          ...(ep.analysis?.tools_mentioned || []),
          ...(ep.analysis?.use_cases?.map((uc) => uc.title) || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(q)) return false;
      }

      // Role / audience filter
      if (selectedRole) {
        const epAudiences =
          ep.analysis?.use_cases?.map((uc) => uc.audience) || [];
        // Match if any use case targets this role OR targets "everyone"
        if (
          !epAudiences.includes(selectedRole) &&
          !epAudiences.includes("everyone")
        )
          return false;
      }

      // Tool filter
      if (selectedTools.length > 0) {
        const epTools = ep.analysis?.tools_mentioned || [];
        if (!selectedTools.some((t) => epTools.includes(t))) return false;
      }

      // Category filter
      if (selectedCategories.length > 0) {
        const epCategories =
          ep.analysis?.use_cases?.map((uc) => uc.category) || [];
        if (!selectedCategories.some((c) => epCategories.includes(c)))
          return false;
      }

      return true;
    });
  }, [episodes, search, selectedRole, selectedTools, selectedCategories]);

  // Limit tools shown in filter to top 15 most common
  const topTools = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ep of episodes) {
      for (const t of ep.analysis?.tools_mentioned || []) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([t]) => t);
  }, [episodes]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 space-y-6 lg:w-64">
        <RolePicker
          roles={allAudiences.filter((a) => a !== "everyone")}
          selected={selectedRole}
          onChange={setSelectedRole}
        />

        <Stats episodes={episodes} useCases={useCases} />

        <TagFilter
          label="Filter by Tool"
          tags={topTools}
          selected={selectedTools}
          onChange={setSelectedTools}
        />

        <TagFilter
          label="Filter by Category"
          tags={allCategories}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 space-y-6">
        <SearchBar value={search} onChange={setSearch} />

        <p className="text-sm text-[var(--color-muted)]">
          {filtered.length} of {episodes.length} episodes
          {selectedRole && ` for ${selectedRole.replace("-", " ")}`}
          {search && ` matching "${search}"`}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <p className="text-[var(--color-muted)]">
              No episodes match your filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedRole(null);
                setSelectedTools([]);
                setSelectedCategories([]);
              }}
              className="mt-3 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ep) => (
              <EpisodeCard key={ep.id} episode={ep} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
