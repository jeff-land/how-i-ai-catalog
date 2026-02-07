"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { UseCaseFlat } from "@/lib/types";
import SearchBar from "./SearchBar";
import RolePicker from "./RolePicker";

const CATEGORY_LABELS: Record<string, string> = {
  coding: "Software Development",
  writing: "Writing & Documents",
  design: "Design & Prototyping",
  automation: "Workflow Automation",
  "data-analysis": "Data & Analytics",
  productivity: "Productivity & Efficiency",
  hiring: "Hiring & Recruiting",
  marketing: "Marketing & Growth",
  research: "Research & Discovery",
  "customer-support": "Customer Support",
  sales: "Sales & Revenue",
  operations: "Operations & Process",
  strategy: "Strategy & Planning",
  finance: "Finance & Accounting",
  learning: "Learning & Development",
  communication: "Communication & Meetings",
  "project-management": "Project Management",
  "product-management": "Product Management",
  "content-creation": "Content Creation",
  personal: "Personal & Side Projects",
  leadership: "Leadership",
  networking: "Networking",
  other: "Other",
};

function formatCategory(cat: string): string {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " ");
}

interface HomeClientProps {
  useCases: UseCaseFlat[];
  allAudiences: string[];
  totalEpisodes: number;
  totalTools: number;
}

export default function HomeClient({
  useCases,
  allAudiences,
  totalEpisodes,
  totalTools,
}: HomeClientProps) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [surpriseUseCase, setSurpriseUseCase] = useState<UseCaseFlat | null>(null);

  // Filter use cases
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return useCases.filter((uc) => {
      // Role filter
      if (selectedRole) {
        if (uc.audience !== selectedRole && uc.audience !== "everyone") return false;
      }
      // Text search
      if (q) {
        const searchable = [
          uc.title,
          uc.one_liner,
          uc.description,
          uc.guest_name,
          uc.episode_title,
          ...uc.tools,
          uc.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [useCases, search, selectedRole]);

  // Group by category, sorted by count
  const grouped = useMemo(() => {
    const groups: Record<string, UseCaseFlat[]> = {};
    for (const uc of filtered) {
      const cat = uc.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(uc);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // Total category count
  const totalCategories = useMemo(() => {
    const cats = new Set(useCases.map((uc) => uc.category));
    return cats.size;
  }, [useCases]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleSurpriseMe = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : useCases;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setSurpriseUseCase(random);
  }, [filtered, useCases]);

  const CARDS_PER_CATEGORY = 6;

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
          What will you build with AI?
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-[var(--color-muted)]">
          {useCases.length} real use cases from {totalEpisodes} episodes of How I AI.
          Browse by role, search by keyword, or let us surprise you.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-center">
        <div>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{useCases.length}</p>
          <p className="text-xs text-[var(--color-muted)]">Use Cases</p>
        </div>
        <div className="h-8 w-px bg-[var(--color-border)]" />
        <div>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{totalEpisodes}</p>
          <p className="text-xs text-[var(--color-muted)]">Episodes</p>
        </div>
        <div className="h-8 w-px bg-[var(--color-border)]" />
        <div>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{totalCategories}</p>
          <p className="text-xs text-[var(--color-muted)]">Categories</p>
        </div>
        <div className="h-8 w-px bg-[var(--color-border)]" />
        <div>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{totalTools}+</p>
          <p className="text-xs text-[var(--color-muted)]">Tools</p>
        </div>
      </div>

      {/* Role picker */}
      <div className="text-center">
        <p className="mb-3 text-sm font-medium text-[var(--color-muted)]">
          What kind of work do you do?
        </p>
        <RolePicker
          roles={allAudiences.filter((a) => a !== "everyone")}
          selected={selectedRole}
          onChange={setSelectedRole}
          variant="hero"
        />
        {selectedRole && (
          <button
            onClick={() => setSelectedRole(null)}
            className="mt-3 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            Show all roles
          </button>
        )}
      </div>

      {/* Search + Surprise me */}
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search use cases, tools, guests..."
          />
        </div>
        <button
          onClick={handleSurpriseMe}
          className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-sm"
        >
          Surprise me
        </button>
      </div>

      {/* Surprise me result */}
      {surpriseUseCase && (
        <div className="mx-auto max-w-2xl">
          <div className="relative rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5">
            <button
              onClick={() => setSurpriseUseCase(null)}
              className="absolute right-3 top-3 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-accent)]">
              Random pick
            </p>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {surpriseUseCase.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {surpriseUseCase.one_liner || surpriseUseCase.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {surpriseUseCase.tools?.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
                >
                  {tool}
                </span>
              ))}
              <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
                {formatCategory(surpriseUseCase.category)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={`/episodes/${surpriseUseCase.episode_id}`}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                View episode
              </Link>
              <button
                onClick={handleSurpriseMe}
                className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-accent)]"
              >
                Try another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status line */}
      <div className="text-center text-sm text-[var(--color-muted)]">
        {filtered.length === useCases.length
          ? `Showing all ${useCases.length} use cases across ${grouped.length} categories`
          : `${filtered.length} use cases across ${grouped.length} categories`}
        {selectedRole && (
          <span> for <span className="font-medium text-[var(--color-foreground)]">{selectedRole.replace(/-/g, " ")}</span></span>
        )}
        {search && (
          <span> matching &ldquo;<span className="font-medium text-[var(--color-foreground)]">{search}</span>&rdquo;</span>
        )}
      </div>

      {/* Category sections */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-muted)]">
            No use cases match your filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedRole(null);
            }}
            className="mt-3 text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([category, categoryUseCases]) => {
            const isExpanded = expandedCategories.has(category);
            const visibleCount = isExpanded ? categoryUseCases.length : CARDS_PER_CATEGORY;
            const visible = categoryUseCases.slice(0, visibleCount);
            const hasMore = categoryUseCases.length > CARDS_PER_CATEGORY;

            return (
              <section key={category}>
                {/* Category header */}
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                    {formatCategory(category)}
                  </h2>
                  <span className="text-sm text-[var(--color-muted)]">
                    {categoryUseCases.length} use case{categoryUseCases.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Use case cards grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((uc, i) => (
                    <UseCaseCard key={`${uc.episode_id}-${i}`} useCase={uc} />
                  ))}
                </div>

                {/* Show more / less */}
                {hasMore && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="text-sm font-medium text-[var(--color-accent)] hover:underline"
                    >
                      {isExpanded
                        ? "Show fewer"
                        : `Show all ${categoryUseCases.length} use cases`}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UseCaseCard({ useCase }: { useCase: UseCaseFlat }) {
  return (
    <Link
      href={`/episodes/${useCase.episode_id}`}
      className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent)] hover:shadow-md"
    >
      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] line-clamp-2">
        {useCase.title}
      </h3>

      {/* One-liner or description */}
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)] line-clamp-2">
        {useCase.one_liner || useCase.description}
      </p>

      {/* Tools */}
      <div className="mt-auto flex flex-wrap gap-1 pt-3">
        {useCase.tools?.slice(0, 3).map((tool) => (
          <span
            key={tool}
            className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
          >
            {tool}
          </span>
        ))}
        {(useCase.tools?.length || 0) > 3 && (
          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
            +{(useCase.tools?.length || 0) - 3}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
        {useCase.guest_name && (
          <span className="truncate">{useCase.guest_name}</span>
        )}
        {useCase.guest_name && <span>·</span>}
        <span className="capitalize">{useCase.difficulty}</span>
      </div>
    </Link>
  );
}
