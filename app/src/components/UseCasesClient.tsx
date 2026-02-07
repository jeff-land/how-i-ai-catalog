"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { UseCaseFlat } from "@/lib/types";
import SearchBar from "./SearchBar";
import TagFilter from "./TagFilter";
import RolePicker from "./RolePicker";

interface UseCasesClientProps {
  useCases: UseCaseFlat[];
  allCategories: string[];
  allDifficulties: string[];
  allAudiences: string[];
}

export default function UseCasesClient({
  useCases,
  allCategories,
  allDifficulties,
  allAudiences,
}: UseCasesClientProps) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return useCases.filter((uc) => {
      if (q) {
        const searchable = [
          uc.title,
          uc.description,
          uc.guest_name,
          uc.episode_title,
          ...uc.tools,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(uc.category)
      )
        return false;
      if (
        selectedDifficulties.length > 0 &&
        !selectedDifficulties.includes(uc.difficulty)
      )
        return false;

      // Role filter — match the selected role or "everyone"
      if (selectedRole) {
        if (uc.audience !== selectedRole && uc.audience !== "everyone")
          return false;
      }

      return true;
    });
  }, [useCases, search, selectedRole, selectedCategories, selectedDifficulties]);

  return (
    <div className="space-y-6">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search use cases, tools, guests..."
      />

      {/* Role picker */}
      <RolePicker
        roles={allAudiences.filter((a) => a !== "everyone")}
        selected={selectedRole}
        onChange={setSelectedRole}
      />

      {/* Filters row */}
      <div className="flex flex-wrap gap-6">
        <TagFilter
          label="Category"
          tags={allCategories}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
        <TagFilter
          label="Difficulty"
          tags={allDifficulties}
          selected={selectedDifficulties}
          onChange={setSelectedDifficulties}
        />
      </div>

      <p className="text-sm text-[var(--color-muted)]">
        {filtered.length} of {useCases.length} use cases
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-muted)]">No use cases match your filters.</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedRole(null);
              setSelectedCategories([]);
              setSelectedDifficulties([]);
            }}
            className="mt-3 text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((uc, i) => (
            <div
              key={`${uc.episode_id}-${i}`}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-foreground)]">
                    {uc.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {uc.description}
                  </p>
                </div>
                <Link
                  href={`/episodes/${uc.episode_id}`}
                  className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-light)]"
                >
                  View episode
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Guest */}
                {uc.guest_name && (
                  <span className="text-xs text-[var(--color-muted)]">
                    {uc.guest_name}
                  </span>
                )}

                {/* Tools */}
                {uc.tools?.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
                  >
                    {tool}
                  </span>
                ))}

                {/* Meta tags */}
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
      )}
    </div>
  );
}
